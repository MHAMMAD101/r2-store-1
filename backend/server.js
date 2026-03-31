const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== تحديد المسار الصحيح =====
const basePath = process.env.VERCEL 
  ? '/var/task/frontend' 
  : path.join(__dirname, '../frontend');

// ===== خدمة الملفات الثابتة (مهم جداً!) =====
app.use(express.static(basePath));

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(basePath, 'index.html'));
});

// الصفحات الأخرى
app.get('/shop', (req, res) => {
  res.sendFile(path.join(basePath, 'shop.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(basePath, 'admin.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(basePath, 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(basePath, 'checkout.html'));
});

// ===== API Test =====
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ===== Error Handling =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).sendFile(path.join(basePath, '404.html'));
});

// ===== Export for Vercel =====
module.exports = app;

// ===== Run locally only =====
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
