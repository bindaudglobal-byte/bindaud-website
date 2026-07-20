const http = require('http');
const handler = require('./api/index');

(async () => {
  const server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = 'http://127.0.0.1:' + port;

  const payload = {
    name: 'Live Verification Product',
    description: 'Created during deployment verification',
    price: 59,
    salePrice: 39,
    category: 'Essentials',
    sizes: ['M'],
    colors: ['Black'],
    stock: 12,
    featured: true,
    bestSeller: true,
    collectionName: 'Verification',
    isActive: true,
  };

  const createRes = await fetch(base + '/api/admin/products', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer admin-token-2026',
    },
    body: JSON.stringify(payload),
  });

  console.log('CREATE_STATUS', createRes.status);
  console.log(await createRes.text());

  const listRes = await fetch(base + '/api/products');
  console.log('LIST_STATUS', listRes.status);
  console.log(await listRes.text());

  server.close();
})();
