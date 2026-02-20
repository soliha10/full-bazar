const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

const getAllProducts = async () => {
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
            const isSmartphone = (/\b(iphone|samsung|redmi|xiaomi|oppo|vivo|realme|honor|smartfon|pixel|huawei)\b/i.test(lowerTitle));
            const isNotSmartphone = (/\b(televizor|noutbuk|laptop|planshet|tablet|konditsioner|pylesos|changyutgich|holodilnik|sovutgich|kir yuvish|gaz plita|kabel|chehol|case|zaryad|charger|adapter)\b/i.test(lowerTitle));

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
                    name: displayName,
                    category: 'Smartphones',
                    rating: parseFloat(rating),
                    reviews: reviews,
                    image: imageUrl,
                    images: imageUrl ? [imageUrl] : [],
                    inStock: true,
                    markets: []
                });
            }

            const group = productGroups.get(norm);
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

    return Array.from(productGroups.values()).map(p => {
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
};

app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || '').toLowerCase();
    const skip = (page - 1) * limit;

    const allProducts = await getAllProducts();
    let filtered = allProducts;
    if (search) filtered = allProducts.filter(p => p.name.toLowerCase().includes(search));

    res.json({
      products: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page, limit,
      hasMore: skip + limit < filtered.length
    });
  } catch (error) {
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
