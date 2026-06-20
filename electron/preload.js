/**
 * preload.js - پل ارتباطی امن الکترون برای ارتباط با سیستم عامل ویندوز
 * این اسکریپت دسترسی به سیستم‌فایل و پایگاه داده بومی را در محیط محصور فراهم می‌کند.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbAPI', {
  // متد بررسی اجرا در بستر دسکتاپ ویندوز
  isElectron: () => true,

  // ذخیره‌سازی ممتد داده در دیسک محلی ویندوز
  saveStorage: (key, data) => ipcRenderer.invoke('save-local-storage', { key, data }),
  loadStorage: (key) => ipcRenderer.invoke('load-local-storage', key),
  
  // فراخوانی رویدادهای سیستمی و مدیریت سخت‌افزار
  printInvoice: (htmlContent) => ipcRenderer.invoke('print-invoice-pdf', htmlContent),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  reconnectDb: (newPath) => ipcRenderer.invoke('reconnect-db', newPath),
  
  // ثبت سوابق خطاها و لاگ‌های ویندوز
  logSystem: (message, type) => ipcRenderer.send('log-system-msg', { message, type }),
});
