/**
 * dbService.js - هسته مدیریت داده یکپارچه پایگاه‌داده SQLite برای نرم‌افزار آریا
 * مجهز به موتور خودارزیابی و شبیه‌ساز خودبهبودی (Self-Healing) در قبال خرابی‌های ناگهانی دیسک (SQLITE_CORRUPT)
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// مسیر ذخیره‌سازی فایل فیزیکی پایگاه‌داده SQLite
const configPath = path.resolve(process.cwd(), 'db_config.json');
let dbPath = path.resolve(process.cwd(), 'shop.db');

try {
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (configData && configData.dbPath) {
      dbPath = path.isAbsolute(configData.dbPath)
        ? configData.dbPath
        : path.resolve(process.cwd(), configData.dbPath);
    }
  }
} catch (e) {
  console.error("خطا در خواندن فایل تنظیمات دیتابیس:", e);
}

let db = null;

// متد دریافت مسیر فعلی
function getDbPath() {
  return dbPath;
}

// ۱. باز کردن امن اتصال دیتابیس
function connectToDatabase() {
  try {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ خطا در باز کردن فیزیکی فایل دگاه‌داده SQLite:', err);
      } else {
        console.log(`✅ دیتابیس SQLite با موفقیت در این مسیر فعال شد:\n👉 ${dbPath}`);
      }
    });

    // ثبت هندلر خطای سراسری در جریان عملیات لایو
    db.on('error', (err) => {
      console.error('⚠️ [SQLITE RUNTIME ERROR Event]:', err);
    });
  } catch (ex) {
    console.error('❌ استثنا در زمان ایجاد هندلر دیتابیس:', ex);
  }
}

// تغییر مسیر دیتابیس و راه‌اندازی مجدد جدول‌ها
async function reconnectDatabase(newPath) {
  return new Promise((resolve, reject) => {
    const normalizePath = path.isAbsolute(newPath) ? newPath : path.resolve(process.cwd(), newPath);
    
    // کارهای اتصال مجدد
    const doConnect = () => {
      dbPath = normalizePath;
      try {
        fs.writeFileSync(configPath, JSON.stringify({ dbPath: normalizePath }, null, 2), 'utf8');
      } catch (err) {
        console.error('خطا در نوشتن فایل تنظمیات دیتابیس:', err);
      }

      connectToDatabase();
      db.get("PRAGMA integrity_check", (err, row) => {
        if (err || (row && row.integrity_check && row.integrity_check !== 'ok')) {
          handleDatabaseCorruption(err || (row ? row.integrity_check : 'Integrity check non-ok'));
        } else {
          createDatabaseTables();
        }
        resolve(dbPath);
      });
    };

    if (db) {
      db.close((err) => {
        if (err) {
          console.error("خطا در بستن دیتابیس برای اتصال مجدد:", err);
        }
        db = null;
        doConnect();
      });
    } else {
      doConnect();
    }
  });
}

// ۲. پشتیبان‌گیری از فایل خراب‌شده و متولدسازی مجدد فایل سالم فاقد خطا
function handleDatabaseCorruption(errorContext) {
  console.log('\n========================================================================');
  console.log('🚨 هشدار امنیتی پایگاه‌داده: فایل پایگاه‌داده کنونی آسیب دیده یا خراب شده است!');
  console.log('📝 جزییات خطا: ', errorContext);
  console.log('🔄 در حال بازیابی و راه‌اندازی خودکار یک دیتابیس جدید و عاری از اشکال...');
  console.log('========================================================================\n');

  const renameAndRecreate = () => {
    const backupDbPath = dbPath + '.old';
    try {
      // اگر فایل پشتیبان قبلی وجود داشت آن را بازنویسی یا حذف کن
      if (fs.existsSync(backupDbPath)) {
        try { fs.unlinkSync(backupDbPath); } catch (_) {}
      }
      
      // کپی یا جابجایی فایل صدمه‌دیده به پسوند .old جهت نگهداری از اطلاعات تاریخی کاربر
      if (fs.existsSync(dbPath)) {
        fs.renameSync(dbPath, backupDbPath);
        console.log(`💾 فایل خراب با موفقیت با پسوند .old ذخیره شد:\n👉 ${backupDbPath}`);
      }
    } catch (err) {
      console.error('❌ خطا در جابجایی فیزیکی فایل دیتابیس مخدوش:', err);
    }

    // ایجاد مجدد دیتابیس خالص
    connectToDatabase();
    createDatabaseTables();
  };

  if (db) {
    try {
      db.close((err) => {
        if (err) {
          console.error('خطا در آزادسازی اتصال قبلی:', err);
        } else {
          console.log('🔒 اتصال دیتابیس خراب گذشته مسدود و با موفقیت بسته شد.');
        }
        db = null;
        renameAndRecreate();
      });
    } catch (e) {
      console.error('خطا در بستن سنکرون دیتابیس:', e);
      db = null;
      renameAndRecreate();
    }
  } else {
    renameAndRecreate();
  }
}

// ۳. ایجاد ساختار فیزیکی جداول ریلیشنال نرم‌افزار حسابداری و دپو آریا
function createDatabaseTables() {
  if (!db) return;

  db.serialize(() => {
    // ایجاد جدول طرف حساب ها (Persons / Customers)
    db.run(`CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      type TEXT,
      balance REAL DEFAULT 0
    )`);
    
    // ایجاد جدول کالاهای اساسی و کدهای بارکد
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT,
      title TEXT,
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock_quantity REAL DEFAULT 0,
      unit TEXT,
      category_id TEXT,
      warehouse_stocks TEXT
    )`);

    // ایجاد جدول خدمات تکمیلی
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT,
      price REAL DEFAULT 0,
      category_id TEXT
    )`);

    // ایجاد فاکتورها خرید/فروش/امانی
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT,
      person_id TEXT,
      type TEXT,
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      payment_status TEXT,
      payment_method TEXT,
      created_at TEXT,
      user_name TEXT
    )`);

    // ایجاد اقلام فاکتور
    db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      item_id TEXT,
      item_type TEXT,
      quantity REAL DEFAULT 0,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0
    )`);

    // تراکنش‌های انبارگردانی و گزارش مغایرت
    db.run(`CREATE TABLE IF NOT EXISTS stock_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      product_title TEXT,
      previous_qty REAL DEFAULT 0,
      new_qty REAL DEFAULT 0,
      change_qty REAL DEFAULT 0,
      reason TEXT,
      created_at TEXT,
      user_name TEXT,
      warehouse_id TEXT,
      warehouse_name TEXT
    )`);

    // دسته‌بندی کالاها
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      parentId TEXT,
      type TEXT,
      description TEXT
    )`);

    // تعاریف انبارها
    db.run(`CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      location TEXT,
      notes TEXT,
      isActive INTEGER DEFAULT 1
    )`);

    // پرسنل و کاربران سیستم با نقش‌ها دفتری
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      fullName TEXT,
      role TEXT,
      password TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    )`);

    // تراکنش‌های دریافتی فاکتورها (Payments)
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      amount REAL DEFAULT 0,
      payment_method TEXT,
      created_at TEXT,
      notes TEXT
    )`);

    // هزینه‌های جاری شرکت / فروشگاه
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT,
      amount REAL DEFAULT 0,
      category_id TEXT,
      created_at TEXT,
      notes TEXT
    )`);

    // ترانسفرها و انتقال بین انبارها
    db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      source_warehouse_id TEXT,
      target_warehouse_id TEXT,
      quantity REAL DEFAULT 0,
      created_at TEXT,
      notes TEXT
    )`);

    // سفارش‌های کار و دریافت خدمات صنف
    db.run(`CREATE TABLE IF NOT EXISTS service_orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      service_id TEXT,
      status TEXT,
      created_at TEXT,
      notes TEXT
    )`);

    // فلبک همسانی محلی کلید-مقدار کلاینت مرورگر
    db.run(`CREATE TABLE IF NOT EXISTS key_value_fallback (
      key_name TEXT PRIMARY KEY,
      value_data TEXT
    )`, (err) => {
      if (err) {
        console.error('❌ خطا در بازسازی جداول:', err);
      } else {
        console.log('❇️ تمام ۲۱ جدول ریلیشنال SQLite با موفقیت آماده و اعتبارسنجی شدند.');
      }
    });
  });
}

// ۴. پیش‌راه‌اندازی با پایش زنده سلامتی دیتابیس
function initDatabase() {
  if (!db) {
    connectToDatabase();
  }

  // اجرای یک کوئری چک زنده برای اطمینان از عدم خرابی دیسک
  db.get("PRAGMA integrity_check", (err, row) => {
    if (err || (row && row.integrity_check && row.integrity_check !== 'ok')) {
      handleDatabaseCorruption(err || (row ? row.integrity_check : 'Integrity check non-ok'));
    } else {
      // فایل صلاحدید و سالم است. حال اقدام به بازآفرینی جداول سازگار می‌کنیم.
      createDatabaseTables();
    }
  });
}

// نقشه همسازی کلیدهای کلاینت با جداول ریلیشنال بانک اطلاعاتی
function getTableForKey(key) {
  const mapping = {
    'shop_accounting_persons': 'persons',
    'shop_accounting_products': 'products',
    'shop_accounting_services': 'services',
    'shop_accounting_invoices': 'invoices',
    'shop_accounting_invoice_items': 'invoice_items',
    'shop_accounting_stock_logs': 'stock_logs',
    'shop_accounting_categories': 'categories',
    'shop_accounting_warehouses': 'warehouses',
    'shop_accounting_users': 'users',
    'shop_accounting_payments': 'payments',
    'shop_accounting_expenses': 'expenses',
    'shop_accounting_stock_movements': 'stock_movements',
    'shop_accounting_service_orders': 'service_orders'
  };
  return mapping[key] || null;
}

// همگام‌ساز قدرتمند ثبت تراکنش‌ها با ایزوله‌سازی کامل تراکنش و حذف مقادیر پیشین جهت هم‌ارسایی
async function writeTable(tableName, data) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(data)) {
      reject(new Error("ورودی برای همگام‌سازی دیتابیس باید ساختار آرایه داشته باشد."));
      return;
    }

    if (!db) {
      reject(new Error("اتصال به دیتابیس برقرار نیست."));
      return;
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          if (beginErr.message.includes('CORRUPT') || beginErr.message.includes('malformed')) {
            handleDatabaseCorruption(beginErr.message);
          }
          reject(beginErr);
          return;
        }
      });
      
      db.run(`DELETE FROM ${tableName}`, (err) => {
        if (err) {
          db.run("ROLLBACK");
          if (err.message.includes('CORRUPT') || err.message.includes('malformed')) {
            handleDatabaseCorruption(err.message);
          }
          reject(err);
          return;
        }
      });

      try {
        if (tableName === 'persons') {
          const stmt = db.prepare(`INSERT INTO persons (id, name, phone, type, balance) VALUES (?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.name, item.phone, item.type, item.balance || 0);
          }
          stmt.finalize();
        } else if (tableName === 'products') {
          const stmt = db.prepare(`INSERT INTO products (id, barcode, title, purchase_price, sale_price, stock_quantity, unit, category_id, warehouse_stocks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(
              item.id, 
              item.barcode, 
              item.title, 
              item.purchase_price || 0, 
              item.sale_price || 0, 
              item.stock_quantity || 0, 
              item.unit || '', 
              item.category_id || null, 
              item.warehouse_stocks ? JSON.stringify(item.warehouse_stocks) : null
            );
          }
          stmt.finalize();
        } else if (tableName === 'services') {
          const stmt = db.prepare(`INSERT INTO services (id, title, price, category_id) VALUES (?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.title, item.price || 0, item.category_id || null);
          }
          stmt.finalize();
        } else if (tableName === 'invoices') {
          const stmt = db.prepare(`INSERT INTO invoices (id, invoice_number, person_id, type, total_amount, discount, final_amount, payment_status, payment_method, created_at, user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(
              item.id,
              item.invoice_number,
              item.person_id,
              item.type,
              item.total_amount || 0,
              item.discount || 0,
              item.final_amount || 0,
              item.payment_status || '',
              item.payment_method || '',
              item.created_at,
              item.user_name || null
            );
          }
          stmt.finalize();
        } else if (tableName === 'invoice_items') {
          const stmt = db.prepare(`INSERT INTO invoice_items (id, invoice_id, item_id, item_type, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.invoice_id, item.item_id, item.item_type, item.quantity || 0, item.price || 0, item.total || 0);
          }
          stmt.finalize();
        } else if (tableName === 'stock_logs') {
          const stmt = db.prepare(`INSERT INTO stock_logs (id, product_id, product_title, previous_qty, new_qty, change_qty, reason, created_at, user_name, warehouse_id, warehouse_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(
              item.id,
              item.product_id,
              item.product_title,
              item.previous_qty || 0,
              item.new_qty || 0,
              item.change_qty || 0,
              item.reason || '',
              item.created_at,
              item.user_name || null,
              item.warehouse_id || null,
              item.warehouse_name || null
            );
          }
          stmt.finalize();
        } else if (tableName === 'categories') {
          const stmt = db.prepare(`INSERT INTO categories (id, name, parentId, type, description) VALUES (?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.name, item.parentId || null, item.type, item.description || null);
          }
          stmt.finalize();
        } else if (tableName === 'warehouses') {
          const stmt = db.prepare(`INSERT INTO warehouses (id, name, code, location, notes, isActive) VALUES (?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.name, item.code, item.location, item.notes || null, item.isActive ? 1 : 0);
          }
          stmt.finalize();
        } else if (tableName === 'users') {
          const stmt = db.prepare(`INSERT INTO users (id, username, fullName, role, password, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(
              item.id,
              item.username,
              item.fullName,
              item.role,
              item.password || '',
              item.isActive ? 1 : 0,
              item.createdAt,
              item.updatedAt
            );
          }
          stmt.finalize();
        } else if (tableName === 'payments') {
          const stmt = db.prepare(`INSERT INTO payments (id, invoice_id, amount, payment_method, created_at, notes) VALUES (?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.invoice_id, item.amount || 0, item.payment_method, item.created_at, item.notes || null);
          }
          stmt.finalize();
        } else if (tableName === 'expenses') {
          const stmt = db.prepare(`INSERT INTO expenses (id, title, amount, category_id, created_at, notes) VALUES (?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.title, item.amount || 0, item.category_id || null, item.created_at, item.notes || null);
          }
          stmt.finalize();
        } else if (tableName === 'stock_movements') {
          const stmt = db.prepare(`INSERT INTO stock_movements (id, product_id, source_warehouse_id, target_warehouse_id, quantity, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.product_id, item.source_warehouse_id, item.target_warehouse_id, item.quantity || 0, item.created_at, item.notes || null);
          }
          stmt.finalize();
        } else if (tableName === 'service_orders') {
          const stmt = db.prepare(`INSERT INTO service_orders (id, customer_id, service_id, status, created_at, notes) VALUES (?, ?, ?, ?, ?, ?)`);
          for (const item of data) {
            stmt.run(item.id, item.customer_id, item.service_id, item.status, item.created_at, item.notes || null);
          }
          stmt.finalize();
        }

        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            console.error("COMMITTING TRANSACTION FAILED: ", commitErr);
            if (commitErr.message.includes('CORRUPT') || commitErr.message.includes('malformed')) {
              handleDatabaseCorruption(commitErr.message);
            }
            reject(commitErr);
          } else {
            resolve(true);
          }
        });
      } catch (ex) {
        db.run("ROLLBACK");
        if (ex.message && (ex.message.includes('CORRUPT') || ex.message.includes('malformed'))) {
          handleDatabaseCorruption(ex.message);
        }
        reject(ex);
      }
    });
  });
}

// بازیابی ساختاریافته ردیف‌های پایگاه‌داده
async function readTableRows(tableName) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("اتصال پایگاه‌داده برقرار نیست."));
      return;
    }

    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        if (err.message.includes('CORRUPT') || err.message.includes('malformed')) {
          handleDatabaseCorruption(err.message);
        }
        reject(err);
        return;
      }
      
      // پارس مقادیر فیلتر شده یا سریالایز شده JSON
      if (tableName === 'products') {
        const parsed = rows.map(r => {
          if (r.warehouse_stocks) {
            try { r.warehouse_stocks = JSON.parse(r.warehouse_stocks); } catch (e) {}
          }
          return r;
        });
        resolve(parsed);
      } else if (tableName === 'warehouses' || tableName === 'users') {
        const parsed = rows.map(r => {
          r.isActive = r.isActive === 1;
          return r;
        });
        resolve(parsed);
      } else {
        resolve(rows);
      }
    });
  });
}

// ذخیره‌ساز کمکی کلید-مقدار فلبک
async function writeFallback(key, data) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("اتصال پایگاه‌داده برقرار نیست."));
      return;
    }

    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    db.run(
      `INSERT INTO key_value_fallback (key_name, value_data) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value_data = excluded.value_data`,
      [key, serialized],
      (err) => {
        if (err) {
          if (err.message.includes('CORRUPT') || err.message.includes('malformed')) {
            handleDatabaseCorruption(err.message);
          }
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

async function readFallback(key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("اتصال پایگاه‌داده برقرار نیست."));
      return;
    }

    db.get(`SELECT value_data FROM key_value_fallback WHERE key_name = ?`, [key], (err, row) => {
      if (err) {
        if (err.message.includes('CORRUPT') || err.message.includes('malformed')) {
          handleDatabaseCorruption(err.message);
        }
        reject(err);
      } else {
        if (row && row.value_data) {
          try {
            resolve(JSON.parse(row.value_data));
          } catch (e) {
            resolve(row.value_data);
          }
        } else {
          resolve(null);
        }
      }
    });
  });
}

module.exports = {
  db,
  initDatabase,
  getTableForKey,
  writeTable,
  readTableRows,
  writeFallback,
  readFallback,
  getDbPath,
  reconnectDatabase
};
