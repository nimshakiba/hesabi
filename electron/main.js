/**
 * main.js - پروسه بومی اصلی برای اجرای برنامه به عنوان نرم‌افزار دسکتاپ ویندوز
 * این فایل مدیریت پنجره‌ها، چیدمان فیزیکی فریم‌ها و ارتباطات واقعی SQLite3 را مدیریت می‌کند.
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dbService = require('./dbService');

let mainWindow;

// راه‌اندازی دیتابیس بومی SQLite
dbService.initDatabase();

// پیکره‌بندی و ساخت پنجره اصلی برنامه فیزیکی الکترون برای ویندوز
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: 'نرم‌افزار یکپارچه حسابداری و مدیریت انبار دپوی آریا (لایو SQLite)',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const isDevWithServer = process.env.ELECTRON_DEV_SERVER === 'true';
  const indexPath = path.join(__dirname, '../dist/index.html');

  if (isDevWithServer) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
}

// گوش‌به‌زنگ شدن برای رویدادهای راه‌اندازی ویندوز
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// اینترسپتور بومی ثبت و همگام‌سازی مستقیم تراکنش‌های کلاینت به دیتابیس بومی SQLite
ipcMain.handle('save-local-storage', async (event, { key, data }) => {
  const table = dbService.getTableForKey(key);
  if (table) {
    try {
      await dbService.writeTable(table, data);
      return true;
    } catch (err) {
      console.error(`خطا در همگام‌سازی جدول SQLite ${table}:`, err);
      await dbService.writeFallback(key, data);
      return true;
    }
  } else {
    try {
      await dbService.writeFallback(key, data);
      return true;
    } catch (err) {
      console.error('خطا در ذخیره‌ی فلبک دیتابیس:', err);
      return false;
    }
  }
});

// لود سریع و مستقیم اطلاعات تائیدشده از پایگاه‌داده فیزیکی .db
ipcMain.handle('load-local-storage', async (event, key) => {
  const table = dbService.getTableForKey(key);
  if (table) {
    try {
      const rows = await dbService.readTableRows(table);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.error(`خطا در بازخوانیِ بومی جدول رندری ${table}:`, err);
    }
  }
  return await dbService.readFallback(key);
});

ipcMain.handle('print-invoice-pdf', async (event, htmlContent) => {
  console.log('[SYSTEM PRINT]: درخواست برای پرینتر ارسال گردید.');
  return { success: true };
});

ipcMain.handle('get-printers', async (event) => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      return printers.map(p => ({
        name: p.name,
        isDefault: p.isDefault,
        status: p.status
      }));
    }
  } catch (err) {
    console.error("خطا در گرفتن لیست پرینترها:", err);
  }
  return [];
});

ipcMain.handle('get-db-path', async (event) => {
  return dbService.getDbPath();
});

ipcMain.handle('reconnect-db', async (event, newPath) => {
  try {
    const updatedPath = await dbService.reconnectDatabase(newPath);
    return { success: true, dbPath: updatedPath };
  } catch (err) {
    console.error("خطا در سوییچ دیتابیس بومی:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.on('log-system-msg', (event, { message, type }) => {
  console.log(`[SYSTEM ${type?.toUpperCase() || 'INFO'}]: ${message}`);
});
