const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== المسار =====
const basePath = process.env.VERCEL ? '/var/task' : __dirname;

// ===== الملفات الثابتة =====
app.use(express.static(basePath));
app.use('/css', express.static(path.join(basePath, 'css')));
app.use('/js', express.static(path.join(basePath, 'js')));
app.use('/images', express.static(path.join(basePath, 'images')));

// ===== Routes بسيطة (من غير database) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(basePath, 'index.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(basePath, 'shop.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(basePath, 'admin.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(basePath, 'cart.html'));
});

// ===== API Test =====
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ===== Error Handling آمن =====
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).sendFile(path.join(basePath, '404.html'));
});

// ===== Export =====
module.exports = app;

// ===== Run locally =====
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}
