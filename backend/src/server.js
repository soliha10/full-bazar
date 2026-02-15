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
    
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return resolve([]); 
    }

    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: true, 
        trim: true,
        relax_column_count: true,
        skip_empty_lines: true,
        skip_records_with_error: true
      }))
      .on('data', (data) => results.push(data))
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
    const files = fs.readdirSync(DATA_DIR).filter(file => file.includes('smartphones') && file.endsWith('.csv'));
    console.log(`Found ${files.length} smartphone CSV files: ${files.join(', ')}`);
    const productGroups = new Map();

    for (const file of files) {
        const products = await readCsv(file);
        console.log(`Read ${products.length} products from ${file}`);
        const source = file.split('-')[0];
        // Since we filtered for smartphone files, we can safely set the category to smartphones
        let category = 'Smartphones';

        products.forEach((p, index) => {
            const title = p.title || p.product_name || 'Product';
            
            let detectCategory = category;
            
            // Normalize the title for matching
            const normalizedTitle = title.toLowerCase()
                .replace(/^smartfon\s+/i, '')
                .replace(/\bvivo\b/gi, 'vivo')
                .replace(/\bredmi\b/gi, 'redmi')
                .replace(/\bsamsung\b/gi, 'samsung')
                .replace(/\boppo\b/gi, 'oppo')
                .replace(/\bhonor\b/gi, 'honor')
                .replace(/\bxiaomi\b/gi, 'xiaomi')
                .replace(/\d+\s*\/\s*\d+\s*(gb|tb)/gi, '')
                .replace(/\d+\s*(gb|tb)\s*(ram|rom)?/gi, '')
                .replace(/\d+gb\s*\+\s*\d+gb/gi, '')
                .replace(/\d+\s*mah/gi, '')
                .replace(/\d+\s*ma\/soat/gi, '')
                .replace(/\d+\s*w\b/gi, '')
                .replace(/\d+\s*v\b/gi, '')
                .replace(/\d+\s*hz/gi, '')
                .replace(/amoled/gi, '')
                .replace(/oled/gi, '')
                .replace(/lcd/gi, '')
                .replace(/displey/gi, '')
                .replace(/ekran/gi, '')
                .replace(/ip\d+/gi, '')
                .replace(/\(.*?\)/g, '')
                .replace(/\b(black|white|red|green|blue|gold|silver|purple|orange|pink|gray|grey|midnight|starlight|sierra|alpine|graphite|phantom|mystic|cosmic|aurora|nebula|agate|gleaming|starry|mist|jetblack)\b/gi, '')
                .replace(/\b(qora|oq|qizil|yashil|ko'k|sabzirang|pushti|kulrang)\b/gi, '')
                .replace(/\bxotira\b/gi, '')
                .replace(/\bbatareya\b/gi, '')
                .replace(/[,\-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            
            let rawPrice = p.actual_price || p.price || '0';
            
            // Critical fix: If rawPrice is a string containing installment indicators, try to find the real price
            const priceStr = String(rawPrice).toLowerCase();
            if (priceStr.includes('/oyiga') || priceStr.includes(' x ') || priceStr.includes('oyiga')) {
              // If actual_price was mistakenly the installment, but old_price exists, use old_price as a fallback
              rawPrice = p.old_price || '0';
            }
            
            const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

            // Skip if price is too low to be a real product (e.g. less than 50,000 so'm)
            // or if it's likely an installment payment we couldn't filter out
            if (price < 50000 && !file.includes('grocery')) {
                return;
            }

            if (!productGroups.has(normalizedTitle)) {
                const detectCategoryFormatted = detectCategory.charAt(0).toUpperCase() + detectCategory.slice(1).toLowerCase();
                productGroups.set(normalizedTitle, {
                    id: `${source}-${index}`,
                    name: title,
                    category: detectCategoryFormatted,
                    image: getProductImage(detectCategoryFormatted, title, `${source}-${index}`),
                    markets: []
                });
            }

            let productUrl = p.url || p.link || '#';
            if (source === 'uzum' && productUrl.startsWith('/')) {
                productUrl = `https://uzum.uz${productUrl}`;
            }

            const group = productGroups.get(normalizedTitle);
            group.markets.push({
                source: source === 'wildberries' ? 'Wildberries' : source.charAt(0).toUpperCase() + source.slice(1),
                price: price,
                url: productUrl
            });
        });
    }

    // Convert groups back to array and finalize price
    return Array.from(productGroups.values()).map(p => {
        // Find best price
        const bestMarket = p.markets.reduce((best, current) => 
            (current.price > 0 && current.price < best.price) ? current : best, p.markets[0]);
        
        return {
            ...p,
            price: bestMarket.price,
            url: bestMarket.url,
            source: bestMarket.source,
            category: p.category // Add category to response
        };
    });
};

app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || '').toLowerCase();
    const skip = (page - 1) * limit;

    let allProducts = await getAllProducts();

    if (search) {
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.category.toLowerCase().includes(search)
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
