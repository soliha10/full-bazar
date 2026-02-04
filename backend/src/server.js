const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '../../data');

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
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    const productGroups = new Map();

    for (const file of files) {
        const products = await readCsv(file);
        const source = file.split('-')[0];
        const category = file.split('-')[1]?.replace('.csv', '') || 'general';

        products.forEach((p, index) => {
            const title = p.title || p.product_name || 'Product';
            
            // Improved normalization for better cross-marketplace matching
            const normalizedTitle = title.toLowerCase()
                // Remove common prefixes
                .replace(/^smartfon\s+/i, '')
                // Normalize brand names
                .replace(/\bvivo\b/gi, 'vivo')
                .replace(/\bredmi\b/gi, 'redmi')
                .replace(/\bsamsung\b/gi, 'samsung')
                .replace(/\boppo\b/gi, 'oppo')
                .replace(/\bhonor\b/gi, 'honor')
                .replace(/\bxiaomi\b/gi, 'xiaomi')
                // Remove storage specs (GB, TB, RAM variations)
                .replace(/\d+\s*\/\s*\d+\s*(gb|tb)/gi, '')
                .replace(/\d+\s*(gb|tb)\s*(ram|rom)?/gi, '')
                .replace(/\d+gb\s*\+\s*\d+gb/gi, '')
                // Remove battery specs
                .replace(/\d+\s*mah/gi, '')
                .replace(/\d+\s*ma\/soat/gi, '')
                // Remove charging/power specs
                .replace(/\d+\s*w\b/gi, '')
                .replace(/\d+\s*v\b/gi, '')
                // Remove display specs
                .replace(/\d+\s*hz/gi, '')
                .replace(/amoled/gi, '')
                .replace(/oled/gi, '')
                .replace(/lcd/gi, '')
                .replace(/displey/gi, '')
                .replace(/ekran/gi, '')
                // Remove IP ratings
                .replace(/ip\d+/gi, '')
                // Remove colors and parentheses content
                .replace(/\(.*?\)/g, '')
                .replace(/\b(black|white|red|green|blue|gold|silver|purple|orange|pink|gray|grey|midnight|starlight|sierra|alpine|graphite|phantom|mystic|cosmic|aurora|nebula|agate|gleaming|starry|mist|jetblack)\b/gi, '')
                .replace(/\b(qora|oq|qizil|yashil|ko'k|sabzirang|pushti|kulrang)\b/gi, '')
                // Remove extra descriptive words
                .replace(/\bxotira\b/gi, '')
                .replace(/\bbatareya\b/gi, '')
                // Clean up spaces and special characters
                .replace(/[,\-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            
            const rawPrice = p.actual_price || p.price || '0';
            const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

            // Skip if price is too low (likely a parsing error, e.g., storage specs like "128/256GB" -> 128256)
            // Minimum realistic price for smartphones is 500,000 UZS
            if (price < 500000) {
                return;
            }

            if (!productGroups.has(normalizedTitle)) {
                productGroups.set(normalizedTitle, {
                    id: `${source}-${index}`,
                    name: title,
                    category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
                    markets: []
                });
            }

            const group = productGroups.get(normalizedTitle);
            group.markets.push({
                source: source.charAt(0).toUpperCase() + source.slice(1),
                price: price,
                url: p.url || '#'
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
            source: bestMarket.source
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
