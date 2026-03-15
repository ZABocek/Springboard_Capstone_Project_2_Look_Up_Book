const http = require('http');

const port = Number(process.env.TEST_SERVER_PORT || 5051);

console.log('Creating test server...');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/test') {
    console.log('Test endpoint called');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'OK' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found' }));
});

server.listen(port, () => {
  console.log(`Test server running on port ${port}`);

  const req = http.request(
    {
      hostname: 'localhost',
      port,
      path: '/test',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Self-test status: ${res.statusCode}`);
        console.log(`Self-test body: ${data}`);
        server.close(() => {
          console.log('Test server closed');
        });
      });
    }
  );

  req.on('error', (err) => {
    console.error('Self-test request failed:', err.message);
    server.close(() => process.exit(1));
  });

  req.write(JSON.stringify({ ping: true }));
  req.end();
});
