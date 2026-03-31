require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== نظام Subdomains =====
app.use((req, res, next) => {
  const host = req.headers.host;
  const parts = host.split('.');
  
  if (parts.length > 2 && parts[0] !== 'www') {
    req.subdomain = parts[0];
  } else {
    req.subdomain = null;
  }
  
  next();
});

// ===== Routes =====

// الصفحة الرئيسية
app.get('/', (req, res) => {
  if (req.subdomain) {
    return showStore(req, res);
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== عرض متجر العميل =====
function showStore(req, res) {
  const subdomain = req.subdomain;
  
  db.get(
    `SELECT s.*, sc.logo_url, sc.banner_url, sc.primary_color, sc.secondary_color, sc.footer_text
     FROM stores s
     LEFT JOIN store_customizations sc ON s.id = sc.store_id
     WHERE s.subdomain = ? AND s.status = 'active'`,
    [subdomain],
    (err, store) => {
      if (err || !store) {
        return res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
      }
      
      db.all(
        'SELECT * FROM products WHERE store_id = ? AND is_active = 1',
        [store.id],
        (err, products) => {
          const html = generateStorePage(store, products);
          res.send(html);
        }
      );
    }
  );
}

// ===== توليد صفحة المتجر الاحترافية =====
function generateStorePage(store, products) {
  const primaryColor = store.primary_color || '#6366f1';
  const secondaryColor = store.secondary_color || '#8b5cf6';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${store.store_name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Tajawal', sans-serif;
      background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
      color: #fff;
      min-height: 100vh;
    }
    .header {
      background: rgba(15, 15, 30, 0.95);
      backdrop-filter: blur(10px);
      padding: 15px 0;
      position: fixed;
      width: 100%;
      top: 0;
      z-index: 1000;
      border-bottom: 2px solid ${primaryColor};
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid ${primaryColor};
    }
    .store-title {
      font-size: 1.5em;
      font-weight: 800;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-buttons {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-family: 'Tajawal', sans-serif;
      font-weight: 600;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #fff;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px ${primaryColor}40;
    }
    .cart-icon {
      position: relative;
      font-size: 1.3em;
      cursor: pointer;
    }
    .cart-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: #fff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7em;
      font-weight: bold;
    }
    .hero {
      margin-top: 80px;
      padding: 60px 20px;
      text-align: center;
      background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
    }
    .hero-logo {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      margin-bottom: 20px;
      border: 5px solid ${primaryColor};
      box-shadow: 0 0 40px ${primaryColor}50;
    }
    .hero h1 {
      font-size: 3em;
      margin-bottom: 15px;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 1.2em;
      color: #888;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 40px;
      flex-wrap: wrap;
    }
    .stat-item {
      text-align: center;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 15px;
      border: 2px solid ${primaryColor}30;
      min-width: 120px;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: 800;
      color: ${primaryColor};
      display: block;
    }
    .stat-label {
      color: #888;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .section-title {
      text-align: center;
      margin-bottom: 40px;
    }
    .section-title h2 {
      font-size: 2.5em;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 60px;
    }
    .product-card {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 15px;
      overflow: hidden;
      border: 2px solid ${primaryColor}30;
      transition: all 0.3s;
    }
    .product-card:hover {
      transform: translateY(-10px);
      border-color: ${primaryColor};
      box-shadow: 0 15px 40px ${primaryColor}30;
    }
    .product-image {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-bottom: 3px solid ${primaryColor}30;
    }
    .product-info {
      padding: 20px;
    }
    .product-title {
      font-size: 1.3em;
      font-weight: 700;
      margin-bottom: 10px;
      color: #fff;
    }
    .product-description {
      color: #888;
      margin-bottom: 15px;
      line-height: 1.6;
    }
    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
    .product-price {
      font-size: 1.8em;
      font-weight: 800;
      color: #10b981;
    }
    .btn-add-cart {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      transition: all 0.3s;
    }
    .btn-add-cart:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 20px ${primaryColor}40;
    }
    .footer {
      background: rgba(15, 15, 30, 0.95);
      padding: 30px 20px;
      text-align: center;
      border-top: 3px solid ${primaryColor};
      margin-top: 50px;
    }
    .footer p {
      color: #888;
    }
    .no-products {
      text-align: center;
      padding: 80px 20px;
      color: #888;
    }
    .no-products i {
      font-size: 5em;
      margin-bottom: 20px;
      color: ${primaryColor}30;
    }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2em; }
      .stats { gap: 20px; }
      .products-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-container">
      <div class="logo-section">
        ${store.logo_url ? `<img src="${store.logo_url}" alt="Logo" class="logo">` : '<div class="logo" style="background:' + primaryColor + ';display:flex;align-items:center;justify-content:center;font-weight:bold;">' + store.store_name.charAt(0) + '</div>'}
        <div class="store-title">${store.store_name}</div>
      </div>
      <div class="nav-buttons">
        <div class="cart-icon">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count">0</span>
        </div>
        <a href="/admin" class="btn btn-secondary">
          <i class="fas fa-cog"></i> لوحة التحكم
        </a>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="hero-content">
      ${store.logo_url ? `<img src="${store.logo_url}" alt="Logo" class="hero-logo">` : ''}
      <h1>${store.store_name}</h1>
      <p>${store.footer_text || 'أفضل المنتجات الرقمية باحترافية وجودة عالية'}</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">${products.length}</span>
          <div class="stat-label">منتج</div>
        </div>
        <div class="stat-item">
          <span class="stat-number">0</span>
          <div class="stat-label">طلب</div>
        </div>
        <div class="stat-item">
          <span class="stat-number">0</span>
          <div class="stat-label">عميل</div>
        </div>
      </div>
    </div>
  </section>

  <div class="container">
    <div class="section-title">
      <h2><i class="fas fa-store"></i> المنتجات</h2>
      <p>استكشف منتجاتنا المميزة</p>
    </div>
    
    ${products.length > 0 ? `
      <div class="products-grid">
        ${products.map(product => `
          <div class="product-card">
            <img src="${product.image_url || 'https://via.placeholder.com/400x300/6366f1/ffffff?text=' + encodeURIComponent(product.title)}" 
                 alt="${product.title}" class="product-image">
            <div class="product-info">
              <h3 class="product-title">${product.title}</h3>
              <p class="product-description">${product.description || 'لا يوجد وصف'}</p>
              <div class="product-footer">
                <div class="product-price">${product.price} ريال</div>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                  <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="no-products">
        <i class="fas fa-box-open"></i>
        <h2>لا توجد منتجات حالياً</h2>
        <p>سيعود صاحب المتجر لإضافة المنتجات قريباً</p>
      </div>
    `}
  </div>

  <footer class="footer">
    <p>${store.footer_text || `© 2025 ${store.store_name} - جميع الحقوق محفوظة`}</p>
  </footer>

  <script>
    let cartCount = 0;
    
    function addToCart(productId) {
      cartCount++;
      document.querySelector('.cart-count').textContent = cartCount;
      
      // Animation
      const cartIcon = document.querySelector('.cart-icon');
      cartIcon.style.transform = 'scale(1.3)';
      setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
      }, 200);
      
      alert('✅ تم إضافة المنتج للسلة!');
    }
  </script>
</body>
</html>
  `;
}

// ===== لوحة تحكم المتجر =====
app.get('/admin', (req, res) => {
  if (!req.subdomain) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// ===== API: تسجيل دخول صاحب المتجر =====
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const subdomain = req.subdomain;
  
  if (!subdomain) {
    return res.status(400).json({ error: 'Subdomain required' });
  }
  
  db.get(
    'SELECT * FROM stores WHERE subdomain = ? AND owner_email = ?',
    [subdomain, email],
    async (err, store) => {
      if (err || !store) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }
      
      const validPassword = await bcrypt.compare(password, store.owner_password);
      if (!validPassword) {
        return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      db.run(
        'INSERT INTO sessions (store_id, token, expires_at) VALUES (?, ?, ?)',
        [store.id, token, expiresAt]
      );
      
      res.json({
        success: true,
        token: token,
        store: {
          id: store.id,
          name: store.store_name,
          subdomain: store.subdomain,
          plan: store.plan
        }
      });
    }
  );
});

// ===== API: جلب منتجات المتجر =====
app.get('/api/products', (req, res) => {
  const subdomain = req.subdomain;
  
  if (!subdomain) {
    return res.status(400).json({ error: 'Subdomain required' });
  }
  
  db.get('SELECT id FROM stores WHERE subdomain = ?', [subdomain], (err, store) => {
    if (!store) {
      return res.status(404).json({ error: 'المتجر غير موجود' });
    }
    
    db.all(
      'SELECT * FROM products WHERE store_id = ? AND is_active = 1',
      [store.id],
      (err, products) => {
        res.json(products);
      }
    );
  });
});

// ===== API: إضافة منتج =====
app.post('/api/products', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { title, description, price, image_url, stock } = req.body;
  
  db.get('SELECT store_id FROM sessions WHERE token = ? AND expires_at > ?', 
    [token, new Date()], 
    (err, session) => {
      if (!session) {
        return res.status(401).json({ error: 'غير مصرح' });
      }
      
      db.run(
        `INSERT INTO products (store_id, title, description, price, image_url, stock)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [session.store_id, title, description, price, image_url, stock || 999],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'فشل في إضافة المنتج' });
          }
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  );
});

// ===== تصدير التطبيق لـ Vercel =====
module.exports = app;

// ===== تشغيل السيرفر محلياً فقط (مش على Vercel) =====
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║   🌐 R2 Store Server Running         ║`);
    console.log(`╚══════════════════════════════════════╝\n`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🏪 Example: http://mhammad.localhost:${PORT}`);
    console.log(`🔧 Admin: http://mhammad.localhost:${PORT}/admin\n`);
  });
}

module.exports = app;
