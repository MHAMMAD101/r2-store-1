const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Get the base directory (works on Vercel and locally)
const basePath = process.env.VERCEL 
  ? '/var/task/frontend' 
  : path.join(__dirname, '../frontend');

// Serve static files
app.use(express.static(basePath));

// Test routes
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

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(basePath, 'checkout.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(basePath, 'product.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(basePath, 'profile.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(basePath, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(basePath, 'contact.html'));
});

// API routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API working!',
    basePath: basePath
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export for Vercel
module.exports = app;
