const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// Category-specific images from Unsplash
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
    ]
};

function getProductImage(category, title, id) {
    const list = PRODUCT_IMAGES[category] || PRODUCT_IMAGES.Smartphones;
    
    // Try to be smart about choosing the image based on title keywords
    const lowerTitle = title.toLowerCase();
    if (category === 'Smartphones') {
        if (lowerTitle.includes('iphone')) return PRODUCT_IMAGES.Smartphones[4]; // iPhone
    }

    // Consistent hashing for others
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
        skip_empty_lines: true
      }))
      .on('data', (row) => {
        if (!headers) {
          headers = row;
          return;
        }

        let obj = {};
        if (row.length > headers.length) {
          const extraCount = row.length - headers.length;
          // Merge the first (extraCount + 1) elements into the first header column (usually title)
          const mergedValue = row.slice(0, extraCount + 1).join(', ');
          obj[headers[0]] = mergedValue;
          // Map the rest of the columns
          for (let i = 1; i < headers.length; i++) {
            obj[headers[i]] = row[i + extraCount];
          }
        } else {
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
        }
        results.push(obj);
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve(results));
  });
};

// Helper function to get all products
const getAllProducts = async () => {
    console.log(`Searching for CSV files in: ${DATA_DIR}`);
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`DATA_DIR does not exist: ${DATA_DIR}`);
        return [];
    }
    
    // Include all CSV files, but maybe prioritize some or skip specific ones if needed
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    console.log(`Found ${files.length} CSV files: ${files.join(', ')}`);
    const productGroups = new Map();

    for (const file of files) {
        const products = await readCsv(file);
        console.log(`Read ${products.length} products from ${file}`);
        
        // Infer source from filename (e.g., 'uzum' from 'uzum-products.csv')
        let filenameSource = file.split('-')[0].split('_')[0];
        if (filenameSource === 'smartphones') filenameSource = 'market';

        products.forEach((p, index) => {
            const title = p.title || p.product_name || p.name || 'Product';
            if (!title || title === 'Product') return;

            // Determine the actual market/store
            const marketSource = p.store || p.market || p.source || filenameSource;
            const sourceKey = marketSource.toLowerCase();

            let productUrl = p.url || p.link || p.product_url || '#';
            if (sourceKey === 'uzum' && productUrl.startsWith('/')) {
                productUrl = `https://uzum.uz${productUrl}`;
            }

            // Better category detection
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
            } else if (lowerTitle.includes('televizor') || lowerTitle.includes('tv') || lowerUrl.includes('televizor') || lowerUrl.includes('televizory')) {
                detectedCategory = 'TV & Audio';
            } else if (lowerTitle.includes('planshet') || lowerTitle.includes('tablet') || lowerTitle.includes('pad') || lowerUrl.includes('planshet') || lowerUrl.includes('tablet')) {
                detectedCategory = 'Tablets';
            } else if (
                lowerTitle.includes('multivarka') || lowerUrl.includes('multivarka') || lowerUrl.includes('mul-tivarka') ||
                lowerTitle.includes('konditsioner') || lowerTitle.includes('conditioner') || lowerUrl.includes('konditsioner') ||
                lowerTitle.includes('pylesos') || lowerTitle.includes('changyutgich') || lowerTitle.includes('vacuum') || lowerUrl.includes('pylesos') ||
                lowerTitle.includes('sovutgich') || lowerTitle.includes('holodilnik') || lowerTitle.includes('refrigerator') || lowerUrl.includes('holodilnik') ||
                lowerTitle.includes('kir yuvish') || lowerTitle.includes('stiralnaya') || lowerUrl.includes('stiralna') ||
                lowerTitle.includes('gaz plita') || lowerTitle.includes('gazova') || lowerUrl.includes('plita') ||
                lowerTitle.includes('mikrovoln') || lowerUrl.includes('mikrovoln')
            ) {
                detectedCategory = 'Appliances';
            } else if (lowerTitle.includes('smartfon') || lowerTitle.includes('iphone') || lowerTitle.includes('phone')) {
                detectedCategory = 'Smartphones';
            }

            // Normalize title for grouping: keep more info to avoid over-merging
            let normalizedTitle = title.toLowerCase()
                .replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (normalizedTitle.length < 3) {
                normalizedTitle = `${detectedCategory.toLowerCase()}-${normalizedTitle}`;
            }

            // Clean display name
            let displayName = title.replace(/^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+([сc]\s+ии\b)?/i, '')
                .replace(/^\s*\/\s*/, '')
                .trim();
            
            let rawPrice = p.actual_price || p.price || '0';
            const priceStr = String(rawPrice).toLowerCase();
            if (priceStr.includes('/oyiga') || priceStr.includes(' x ') || priceStr.includes('oyiga')) {
              rawPrice = p.old_price || '0';
            }
            
            const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

            if (price < 10000 && !lowerFile.includes('grocery') && detectedCategory !== 'Groceries') {
                return; // Filter out accessories/empty prices
            }

            const categoryKey = detectedCategory.toLowerCase() === 'tv & audio' ? 'TV & Audio' : detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1).toLowerCase();

            // Ensure display name is descriptive for appliances
            if (categoryKey === 'Appliances') {
                if (lowerUrl.includes('multivarka') && !displayName.toLowerCase().includes('multivarka')) {
                    displayName = `Multivarka ${displayName}`;
                } else if (lowerUrl.includes('pylesos') && !displayName.toLowerCase().includes('pylesos') && !displayName.toLowerCase().includes('vacuum')) {
                    displayName = `Pylesos ${displayName}`;
                } else if (lowerUrl.includes('konditsioner') && !displayName.toLowerCase().includes('konditsioner')) {
                    displayName = `Konditsioner ${displayName}`;
                } else if (lowerUrl.includes('holodilnik') && !displayName.toLowerCase().includes('holodilnik') && !displayName.toLowerCase().includes('refrigerator')) {
                    displayName = `Sovutgich ${displayName}`;
                } else if (lowerUrl.includes('stiralna') && !displayName.toLowerCase().includes('kir yuvish')) {
                    displayName = `Kir yuvish mashinasi ${displayName}`;
                }
            }

            if (!productGroups.has(normalizedTitle)) {
                // Create a simple hash for stable ID
                const stableId = Buffer.from(normalizedTitle).toString('base64').replace(/=/g, '').substr(0, 16);
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

    // Convert Map to array and sort for consistent pagination
    const result = Array.from(productGroups.values()).map(p => {
        const bestMarket = p.markets.reduce((best, current) => 
            (current.price > 0 && current.price < best.price) ? current : best, p.markets[0]);
        
        return {
            ...p,
            price: bestMarket ? bestMarket.price : 0,
            url: bestMarket ? bestMarket.url : '#',
            source: bestMarket ? bestMarket.source : 'Unknown',
        };
    });

    // Stable sort by name and price
    return result.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        const priceDiff = a.price - b.price;
        if (priceDiff !== 0) return priceDiff;
        return String(a.id).localeCompare(String(b.id));
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
