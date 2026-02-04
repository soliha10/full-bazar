
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
        const parsed = JSON.parse(data);
        console.log(`Received ${parsed.length} products.`);
        if (parsed.length > 0) {
            console.log('Sample product:', JSON.stringify(parsed[0], null, 2));
        }
    } catch (e) {
        console.log('Response body:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
