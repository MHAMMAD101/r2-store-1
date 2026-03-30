const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'r2store.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
  } else {
    console.log('✅ متصل بقاعدة البيانات SQLite');
  }
});

module.exports = db;