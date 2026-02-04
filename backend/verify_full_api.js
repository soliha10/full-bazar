
const http = require('http');

const get = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
};

(async () => {
    try {
        console.log('Testing /api/products...');
        const listRes = await get('/api/products');
        console.log(`List Status: ${listRes.status}`);
        console.log(`Count: ${listRes.data.length}`);
        
        if (listRes.data.length > 0) {
            const firstId = listRes.data[0].id;
            console.log(`Testing /api/products/${firstId}...`);
            const detailRes = await get(`/api/products/${firstId}`);
            console.log(`Detail Status: ${detailRes.status}`);
            console.log(`ID Match: ${detailRes.data.id === firstId}`);
            console.log('Detail Data Sample:', JSON.stringify(detailRes.data, null, 2));
        } else {
            console.log('No products to test detail endpoint.');
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
})();
