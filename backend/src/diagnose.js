
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// Manually set DATA_DIR based on previous knowledge
let DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    DATA_DIR = path.join(process.cwd(), 'data');
    console.log('Using fallback DATA_DIR:', DATA_DIR);
} else {
    console.log('Using resolved DATA_DIR:', DATA_DIR);
}

const PRODUCT_IMAGES = {
    Smartphones: [
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    ],
    Groceries: [],
    Laptops: [],
    'TV & Audio': []
};

function getProductImage(category, title, id) {
    const list = PRODUCT_IMAGES[category] || PRODUCT_IMAGES.Smartphones;
    // Mock implementation to avoid complex logic issues, assume it works or fails similarly
    return list[0]; 
}

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

const getAllProducts = async () => {
    console.log(`Searching for CSV files in: ${DATA_DIR}`);
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`DATA_DIR does not exist: ${DATA_DIR}`);
        return [];
    }
    
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    console.log(`Found ${files.length} CSV files: ${files.join(', ')}`);
    const productGroups = new Map();

    for (const file of files) {
        try {
            const products = await readCsv(file);
            console.log(`Read ${products.length} products from ${file}`);
            
            let filenameSource = file.split('-')[0].split('_')[0];
            if (filenameSource === 'smartphones') filenameSource = 'market';

            products.forEach((p, index) => {
                const title = p.title || p.product_name || p.name || 'Product';
                if (!title || title === 'Product') return;

                // Determine the actual market/store
                const marketSource = p.store || p.market || p.source || filenameSource;
                const sourceKey = marketSource.toLowerCase();

                let productUrl = p.url || p.link || p.product_url || '#';
                
                // Better category detection logic from server.js
                let detectedCategory = 'Smartphones';
                const lowerTitle = title.toLowerCase();
                const lowerUrl = productUrl.toLowerCase();
                const lowerFile = file.toLowerCase();

                if (p.category) {
                    detectedCategory = p.category;
                } else if (lowerFile.includes('grocery')) {
                    detectedCategory = 'Groceries';
                }
                // ... skipping some logic for brevity as we just want to catch the error ...
                // Actually I should copy the relevant parts that might crash
                 else if (lowerTitle.includes('smartfon') || lowerTitle.includes('iphone') || lowerTitle.includes('phone')) {
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
                const displayName = title; // skipped regex for brevity
                
                let rawPrice = p.actual_price || p.price || '0';
                const price = parseFloat(String(rawPrice).replace(/\s/g, '').replace(/[^\d.]/g, '')) || 0;

                const categoryKey = detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1).toLowerCase();

                if (!productGroups.has(normalizedTitle)) {
                    // Create a simple hash for stable ID
                    const stableId = Buffer.from(normalizedTitle).toString('base64').replace(/=/g, '').substr(0, 16);
                   
                    productGroups.set(normalizedTitle, {
                        id: `prod-${stableId}`,
                        name: displayName,
                        category: categoryKey,
                        price: price 
                    });
                }
            });
        } catch (err) {
            console.error(`Error processing file ${file}:`, err);
            throw err;
        }
    }
    return productGroups;
};

getAllProducts()
    .then(() => console.log('Successfully processed all products'))
    .catch(err => {
        console.error('Fatal error in getAllProducts:', err);
        process.exit(1);
    });
