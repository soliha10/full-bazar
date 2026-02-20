const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// Category-specific images (refined fallback)
const PRODUCT_IMAGES = {
    Smartphones: [
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80',
        'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
        'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80',
    ],
    Groceries: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800&q=80',
        'https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80',
    ],
    Laptops: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        'https://images.unsplash.com/photo-1517336712691-4c9932a3168d?w=800&q=80',
    ],
    'TV & Audio': [
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
        'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=800&q=80',
    ],
    Tablets: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    ],
    Appliances: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
    ],
    Accessories: [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
        'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80',
    ]
};

function getProductImage(category, title, id) {
    const list = PRODUCT_IMAGES[category] || PRODUCT_IMAGES.Smartphones;
    const lowerTitle = title.toLowerCase();
    
    if (category === 'Smartphones') {
        if (lowerTitle.includes('iphone')) return PRODUCT_IMAGES.Smartphones[4];
        if (lowerTitle.includes('samsung')) return PRODUCT_IMAGES.Smartphones[0];
        if (lowerTitle.includes('redmi') || lowerTitle.includes('xiaomi')) return PRODUCT_IMAGES.Smartphones[1];
    } else if (category === 'Laptops') {
        if (lowerTitle.includes('macbook')) return PRODUCT_IMAGES.Laptops[1];
    }

    // Consistent hashing
    const idHash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = idHash % list.length;
    return list[index];
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let DATA_DIR = path.resolve(__dirname, '../../data');

// Fallback for Vercel if root-level data is expected
if (!fs.existsSync(DATA_DIR)) {
    DATA_DIR = path.join(process.cwd(), 'data');
}

// Helper function to read and parse CSV
const readCsv = (filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(DATA_DIR, filename);
    const results = [];
    let headers = null;
    
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return resolve([]); 
    }

    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: false, 
        trim: true,
        relax_column_count: true,
        skip_empty_lines: true,
        quote: '"',
        escape: '"'
      }))
      .on('data', (row) => {
        if (!headers) {
          headers = row.map(h => h.toLowerCase().trim());
          return;
        }

        let obj = {};
        if (row.length > headers.length) {
          const extraCount = row.length - headers.length;
          const mergedValue = row.slice(0, extraCount + 1).join(', ').trim();
          obj[headers[0]] = mergedValue;
          for (let i = 1; i < headers.length; i++) {
            obj[headers[i]] = row[i + extraCount];
          }
        } else {
          headers.forEach((h, i) => {
            obj[h] = (row[i] || '').trim();
          });
        }
        results.push(obj);
      })
      .on('error', (err) => {
          console.error(`Error parsing ${filename}:`, err);
          resolve([]); // Resolve with empty on error to keep going
      })
      .on('end', () => resolve(results));
  });
};

// Helper function to get all products
const getAllProducts = async () => {
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`DATA_DIR does not exist: ${DATA_DIR}`);
        return [];
    }
    
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    const productGroups = new Map();

    for (const file of files) {
        const products = await readCsv(file);
        
        // Infer source from filename
        let filenameSource = file.replace(/_products\.csv$/, '').replace(/-/g, '_').split('_')[0];
        if (filenameSource === 'smartphones') filenameSource = 'market';

        products.forEach((p) => {
            const title = p.title || p.product_name || p.name || 'Product';
            if (!title || title === 'Product') return;

            const marketSource = p.store || p.market || p.source || filenameSource;
            const sourceKey = marketSource.toLowerCase();

            let productUrl = p.url || p.link || p.product_url || '#';
            if (sourceKey === 'uzum' && productUrl.startsWith('/')) {
                productUrl = `https://uzum.uz${productUrl}`;
            }

            // Category detection
            let detectedCategory = 'Smartphones';
            const lowerTitle = title.toLowerCase();
            const lowerUrl = productUrl.toLowerCase();
            const lowerFile = file.toLowerCase();

            if (p.category) {
                detectedCategory = p.category;
            } else if (lowerFile.includes('grocery')) {
                detectedCategory = 'Groceries';
            } else if (lowerTitle.includes('noutbuk') || lowerTitle.includes('laptop') || lowerUrl.includes('noutbuk') || lowerUrl.includes('laptop')) {
                detectedCategory = 'Laptops';
            } else if (lowerTitle.includes('televizor') || /\btv\b/i.test(lowerTitle) || lowerUrl.includes('televizor') || lowerUrl.includes('televizory')) {
                detectedCategory = 'TV & Audio';
            } else if (lowerTitle.includes('planshet') || lowerTitle.includes('tablet') || lowerTitle.includes('pad') || lowerUrl.includes('planshet') || lowerUrl.includes('tablet')) {
                detectedCategory = 'Tablets';
            } else if (/\b(soat|watch|smartwatch)\b/i.test(lowerTitle)) {
                detectedCategory = 'Smartwatches';
            } else if (/\b(quloqchin|earbuds|airpods|headphone|buds)\b/i.test(lowerTitle)) {
                detectedCategory = 'Audio';
            } else if (/\b(kabel|cable|chehol|case|g'ilof|adapter|zaryad|charger)\b/i.test(lowerTitle)) {
                detectedCategory = 'Accessories';
            } else if (
                lowerTitle.includes('multivarka') || lowerTitle.includes('konditsioner') || 
                lowerTitle.includes('pylesos') || lowerTitle.includes('changyutgich') ||
                lowerTitle.includes('sovutgich') || lowerTitle.includes('holodilnik') ||
                lowerTitle.includes('kir yuvish') || lowerTitle.includes('mashinasi') ||
                lowerTitle.includes('gaz plita') || lowerTitle.includes('mikrovoln')
            ) {
                detectedCategory = 'Appliances';
            }

            // Normalization for grouping
            let normalizedTitle = title.toLowerCase()
                .replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni)\b/gi, '')
                .replace(/\b(smartfoni|smartfon|smarton|telefon|phone|pct|rasmiy mahsulot|sovg'aga|sovg'a|oq sim kartasi|sim karta)\b.*$/gi, '')
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Remove punctuation
                .replace(/\s+/g, ' ')
                .trim();
            
            // Further normalization for colors/variants to group them if they are basically the same product
            // but we want to keep them separate if they have different memory capacities
            // The above regex keeps memory (e.g. 128GB) if it's there.

            if (normalizedTitle.length < 3) {
                normalizedTitle = `${detectedCategory.toLowerCase()}-${normalizedTitle}`;
            }

            // Clean display name
            let displayName = title
                .replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+([сc]\s+ии\b)?/i, '')
                .replace(/\s+smartfoni.*$/i, '')
                .replace(/\s+PCT.*$/i, '')
                .replace(/\s+\+.*$/g, '')
                .replace(/^\s*\/\s*/, '')
                .trim();
            
            let rawPrice = p.actual_price || p.price || '0';
            const priceStr = String(rawPrice).toLowerCase();
            if (priceStr.includes('/oyiga') || priceStr.includes(' x ') || priceStr.includes('oyiga')) {
              rawPrice = p.old_price || '0';
            }
            
            const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

            // Filter out junk
            if (price < 5000 && !lowerFile.includes('grocery') && detectedCategory !== 'Groceries') {
                return; 
            }

            const categoryKey = detectedCategory === 'TV & Audio' ? 'TV & Audio' : detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1).toLowerCase();

            if (!productGroups.has(normalizedTitle)) {
                const stableId = Buffer.from(normalizedTitle).toString('base64').replace(/[^a-zA-Z0-0]/g, '').substr(0, 16);
                const rating = parseFloat(p.rating) || (Math.random() * (5 - 4) + 4).toFixed(1);
                const reviews = parseInt(p.review_count || p.reviews) || Math.floor(Math.random() * 50) + 5;

                productGroups.set(normalizedTitle, {
                    id: `prod-${stableId}`,
                    name: displayName,
                    category: categoryKey,
                    rating: parseFloat(rating),
                    reviews: reviews,
                    image: p.image_url || getProductImage(categoryKey, displayName, stableId),
                    inStock: true,
                    markets: []
                });
            }

            const group = productGroups.get(normalizedTitle);
            const existingMarket = group.markets.find(m => m.source.toLowerCase() === sourceKey);
            
            if (!existingMarket || (price > 0 && price < existingMarket.price)) {
                if (existingMarket) {
                    existingMarket.price = price;
                    existingMarket.url = productUrl;
                } else {
                    group.markets.push({
                        source: sourceKey === 'wildberries' ? 'Wildberries' : sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1),
                        price: price,
                        url: productUrl
                    });
                }
            }
        });
    }

    const result = Array.from(productGroups.values()).map(p => {
        const bestMarket = p.markets.reduce((best, current) => 
            (current.price > 0 && current.price < (best ? best.price : Infinity)) ? current : best, null);
        
        return {
            ...p,
            price: bestMarket ? bestMarket.price : 0,
            url: bestMarket ? bestMarket.url : '#',
            source: bestMarket ? bestMarket.source : 'Unknown',
        };
    });

    return result.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return (a.price - b.price) || String(a.id).localeCompare(String(b.id));
    });
};


app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || '').toLowerCase();
    const category = (req.query.category || '').toLowerCase();
    const skip = (page - 1) * limit;

    let allProducts = await getAllProducts();

    if (search) {
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.category.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'all') {
      allProducts = allProducts.filter(p => 
        p.category.toLowerCase() === category
      );
    }

    const paginatedProducts = allProducts.slice(skip, skip + limit);
    
    res.json({
      products: paginatedProducts,
      total: allProducts.length,
      page,
      limit,
      hasMore: skip + limit < allProducts.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await getAllProducts();
        const product = products.find(p => String(p.id) === req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
