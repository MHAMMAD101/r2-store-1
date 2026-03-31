const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 Server is running on Vercel!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working perfectly!' 
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

// Export for Vercel Serverless
module.exports = app;

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Export for Vercel
module.exports = app;
