const db = require('./database');

console.log('\n╔══════════════════════════════════════╗');
console.log('║   🔧 جاري إنشاء جداول قاعدة البيانات ║');
console.log('╚══════════════════════════════════════╝\n');

const tables = [
  // 1. المتاجر
  `CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subdomain TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    owner_discord_id TEXT,
    owner_email TEXT NOT NULL,
    owner_password TEXT NOT NULL,
    plan TEXT DEFAULT 'pro',
    status TEXT DEFAULT 'active',
    subscription_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  
  // 2. الاشتراكات
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT DEFAULT 'active',
    start_date DATETIME,
    end_date DATETIME,
    last_payment DATETIME,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 3. المنتجات
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    image_url TEXT,
    stock INTEGER DEFAULT 999,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 4. الطلبات
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 5. عناصر الطلب
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`,
  
  // 6. جلسات تسجيل الدخول
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 7. طلبات الدفع
  `CREATE TABLE IF NOT EXISTS payment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    store_id INTEGER,
    type TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  )`,
  
  // 8. ✅ تخصيصات المتجر (جديد)
  `CREATE TABLE IF NOT EXISTS store_customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    secondary_color TEXT DEFAULT '#8b5cf6',
    footer_text TEXT,
    custom_domain TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 9. ✅ صفحات المتجر (جديد)
  `CREATE TABLE IF NOT EXISTS store_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    page_name TEXT,
    page_content TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`,
  
  // 10. ✅ تذاكر الدعم (جديد)
  `CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    category TEXT,
    subject TEXT,
    description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    closed_by TEXT
  )`,
  
  // 11. ✅ رسائل التذاكر (جديد)
  `CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_staff INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

let completed = 0;
const totalTables = tables.length;

tables.forEach((sql, index) => {
  db.run(sql, (err) => {
    if (err) {
      console.error(`❌ جدول ${index + 1}:`, err.message);
    } else {
      console.log(`✅ جدول ${index + 1}/${totalTables} تم إنشاؤه`);
    }
    
    completed++;
    
    if (completed === totalTables) {
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║   ✅ تم إنشاء جميع الجداول بنجاح!    ║');
      console.log('╚══════════════════════════════════════╝\n');
      db.close();
      process.exit(0);
    }
  });
});