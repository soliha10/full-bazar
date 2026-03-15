const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let productCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

let DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    DATA_DIR = path.resolve(__dirname, '../data');
}

const readCsv = (filename) => {
  return new Promise((resolve) => {
    const filePath = path.join(DATA_DIR, filename);
    const results = [];
    if (!fs.existsSync(filePath)) return resolve([]);

    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: header => header.map(h => h.toLowerCase().replace(/["']/g, '').trim()), 
        trim: true,
        relax_column_count: true,
        skip_empty_lines: true,
        quote: '"',
        escape: '"'
      }))
      .on('data', (data) => results.push(data))
      .on('error', () => resolve([]))
      .on('end', () => resolve(results));
  });
};

const getAllProducts = async (forceRefresh = false) => {
    if (productCache && !forceRefresh && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
        return productCache;
    }
    
    console.log('[Backend] Cache miss/stale. Re-indexing CSVs...');
    if (!fs.existsSync(DATA_DIR)) return [];
    
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    const productGroups = new Map();

    for (const file of files) {
        const products = await readCsv(file);
        const filenameSource = file.replace(/_products\.csv$/, '').replace(/-/g, '_').split('_')[0];

        products.forEach((p) => {
            const title = p.title || p.product_name || p.name;
            if (!title) return;

            const lowerTitle = title.toLowerCase();
            // Smartphone keywords only
            const isSmartphone = (/(iphone|samsung|redmi|xiaomi|oppo|vivo|realme|honor|smartfon|pixel|huawei|смартфон|телефон|telefon|spark|tecno|camon|poco|itel|infinix)/i.test(lowerTitle));
            const isNotSmartphone = (/(televizor|noutbuk|laptop|planshet|tablet|konditsioner|pylesos|changyutgich|holodilnik|sovutgich|kir yuvish|gaz plita|kabel|chehol|case|zaryad|charger|adapter|планшет|чехол|кабель|заряд|наушник|quloqchin)/i.test(lowerTitle));

            if (!isSmartphone || isNotSmartphone) return;

            const marketSource = p.store || p.market || p.source || filenameSource;
            const sourceKey = marketSource.toLowerCase();
            const productUrl = (p.product_url || p.url || p.link || '#').trim().replace(/\n/g, '');
            const imageUrl = (p.image_url || p.image || p.img || '').trim().replace(/\n/g, '');

            // Clean title for grouping - be less aggressive, only remove generic words
            let norm = lowerTitle
                .replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni|телефон)\s+/gi, '')
                .replace(/\b(smartfoni|smartfon|smarton|telefon|phone|pct|rasmiy mahsulot|sovg'aga|sovg'a|oq sim kartasi|sim karta)\b/gi, '')
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            // If the title is still very long, we might want to keep the important parts (model, storage)
            // But let's trust the cleaned norm for now if it has enough info
            if (norm.length < 3) norm = lowerTitle.trim();

            let displayName = title
                .replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+/i, '')
                .replace(/\b(smartfoni|smartfon|smarton|telefon|phone|pct)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            let rawPrice = p.actual_price || p.price || '0';
            const priceStr = String(rawPrice).toLowerCase();
            if (priceStr.includes('oyiga') || priceStr.includes(' x ')) {
              rawPrice = p.old_price || p.price || '0';
            }
            
            const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;
            if (price < 100000) return; 

            if (!productGroups.has(norm)) {
                // Use a more robust ID based on the full cleaned norm
                const stableId = Buffer.from(norm).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, 24);
                const rating = parseFloat(p.rating) || (Math.random() * (5 - 4.2) + 4.2).toFixed(1);
                const reviews = parseInt(p.review_count || p.reviews) || Math.floor(Math.random() * 50) + 10;

                productGroups.set(norm, {
                    id: `prod-${stableId}`,
                    name: displayName, // This is the displayed cleaned title
                    title: title,     // Original title from CSV
                    category: 'Phones',
                    rating: parseFloat(rating),
                    reviews: reviews,
                    image: imageUrl,
                    images: imageUrl ? [imageUrl] : [],
                    inStock: true,
                    markets: [],
                    keywords: title.toLowerCase()
                });
            }

            const group = productGroups.get(norm);
            if (!group.keywords.includes(title.toLowerCase())) {
                group.keywords += " " + title.toLowerCase();
            }
            // Update title if this one is better (e.g. longer)
            if (title.length > group.title.length) {
                group.title = title;
            }
            const marketIndex = group.markets.findIndex(m => m.source.toLowerCase() === sourceKey);
            
            // Collect all unique images for the group
            if (imageUrl && !group.images.includes(imageUrl)) {
                group.images.push(imageUrl);
            }
            if (imageUrl && (!group.image || group.image === '')) {
                group.image = imageUrl;
            }

            const marketData = {
                source: sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1),
                price: price,
                url: productUrl
            };

            if (marketIndex === -1) {
                group.markets.push(marketData);
            } else if (price > 0 && price < group.markets[marketIndex].price) {
                group.markets[marketIndex] = marketData;
            }
        });
    }

    const finalProducts = Array.from(productGroups.values()).map(p => {
        const sortedMarkets = [...p.markets].sort((a, b) => a.price - b.price);
        const best = sortedMarkets[0];
        return {
            ...p,
            markets: sortedMarkets,
            price: best ? best.price : 0,
            url: best ? best.url : '#',
            source: best ? best.source : 'Unknown',
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    productCache = finalProducts;
    lastCacheUpdate = Date.now();
    return finalProducts;
};

app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const rawSearch = (req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const allProducts = await getAllProducts();
    let filtered = allProducts;

    if (rawSearch) {
      const searchLower = rawSearch.toLowerCase();
      // Split the query into individual tokens so multi-word queries work better
      const tokens = searchLower.split(/\s+/).filter(Boolean);

      // Score each product and keep only those that match ALL tokens
      const scored = allProducts.reduce((acc, p) => {
        const haystack = [
          p.name?.toLowerCase() ?? '',
          p.title?.toLowerCase() ?? '',
          p.category?.toLowerCase() ?? '',
          p.keywords?.toLowerCase() ?? '',
        ].join(' ');

        // Every token must appear somewhere in the haystack
        const allMatch = tokens.every(token => haystack.includes(token));
        if (!allMatch) return acc;

        // Relevance score: reward exact phrase > all-token match > partial
        let score = 0;
        if (haystack.includes(searchLower)) score += 100; // exact phrase
        if (p.name?.toLowerCase().includes(searchLower)) score += 50; // phrase in name
        tokens.forEach(token => {
          if (p.name?.toLowerCase().includes(token)) score += 10;
          if (p.title?.toLowerCase().includes(token)) score += 5;
          if (p.keywords?.toLowerCase().includes(token)) score += 2;
        });

        acc.push({ product: p, score });
        return acc;
      }, []);

      // Sort by relevance descending
      scored.sort((a, b) => b.score - a.score);
      filtered = scored.map(s => s.product);
    }

    console.log(`[API] Search: "${rawSearch}" | Results: ${filtered.length} | Page: ${page}`);

    res.json({
      products: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
      hasMore: skip + limit < filtered.length,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await getAllProducts();
        const product = products.find(p => String(p.id) === req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ error: 'Not Found' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Aggregator server running on port ${PORT}`);
});

module.exports = app;
