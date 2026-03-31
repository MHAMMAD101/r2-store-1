// هذا ملف بسيط للتأكد أن API شغال
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  }));
});

module.exports = server;
