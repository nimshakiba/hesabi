import { Person, Product, Service, Invoice, InvoiceItem, StockLog, Warehouse, Category } from '../types';
import { databaseService } from '../database/databaseService';

// CLASS ROUTING TO STANDARD DATABASE SERVICE
export class OfflineDatabase {
  static getSqlLogs(): string[] {
    return databaseService.getSqlLogs();
  }

  static clearSqlLogs() {
    databaseService.clearSqlLogs();
  }

  static init() {
    databaseService.init();
  }

  // --- Persons CRUD ---
  static getPersons(): Person[] {
    return databaseService.getPersons();
  }

  static savePerson(person: Omit<Person, 'id'> & { id?: string }): Person {
    return databaseService.savePerson(person);
  }

  static deletePerson(id: string): boolean {
    return databaseService.deletePerson(id);
  }

  // --- Products CRUD ---
  static getProducts(): Product[] {
    return databaseService.getProducts();
  }

  static saveProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    return databaseService.saveProduct(product);
  }

  static deleteProduct(id: string): boolean {
    return databaseService.deleteProduct(id);
  }

  static bulkUpdatePrices(percentage: number, roundToNearest: number = 1000): void {
    databaseService.bulkUpdatePrices(percentage, roundToNearest);
  }

  // --- Services CRUD ---
  static getServices(): Service[] {
    return databaseService.getServices();
  }

  static saveService(service: Omit<Service, 'id'> & { id?: string }): Service {
    return databaseService.saveService(service);
  }

  static deleteService(id: string): boolean {
    return databaseService.deleteService(id);
  }

  // --- Invoices Engine ---
  static getInvoices(): Invoice[] {
    return databaseService.getInvoices();
  }

  static getInvoiceItemsByInvoiceId(invoiceId: string): InvoiceItem[] {
    return databaseService.getInvoiceItemsByInvoiceId(invoiceId);
  }

  static getStockLogs(): StockLog[] {
    return databaseService.getStockLogs();
  }

  static createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total'>[]
  ): Invoice {
    return databaseService.createInvoice(invoiceData, items);
  }

  static deleteInvoice(id: string): void {
    databaseService.deleteInvoice(id);
  }

  // --- Backup ---
  static exportDatabaseState(): string {
    return databaseService.exportDatabaseState();
  }

  static importDatabaseState(jsonState: string): boolean {
    return databaseService.importDatabaseState(jsonState);
  }

  // --- Users ---
  static getUsers() {
    return databaseService.getUsers();
  }

  static saveUser(user: any) {
    return databaseService.saveUser(user);
  }

  static deleteUser(id: string) {
    return databaseService.deleteUser(id);
  }

  static getUserLogs() {
    return databaseService.getUserLogs();
  }

  static logUserAction(actionType: string, description: string, oldValue?: string, newValue?: string, targetUserId?: string) {
    databaseService.logUserAction(actionType, description, oldValue, newValue, targetUserId);
  }

  // --- Warehouses CRUD ---
  static getWarehouses(): Warehouse[] {
    return databaseService.getWarehouses();
  }

  static saveWarehouse(warehouse: Omit<Warehouse, 'id'> & { id?: string }): Warehouse {
    return databaseService.saveWarehouse(warehouse);
  }

  static deleteWarehouse(id: string): boolean {
    return databaseService.deleteWarehouse(id);
  }

  static addStockLog(
    productId: string,
    productTitle: string,
    prev: number,
    next: number,
    reason: string,
    warehouseId?: string,
    warehouseName?: string,
    operatorName?: string
  ) {
    databaseService.addStockLog(productId, productTitle, prev, next, reason, warehouseId, warehouseName, operatorName);
  }

  // --- Category CRUD operations ---
  static getCategories(): Category[] {
    return databaseService.getCategories();
  }

  static saveCategory(category: Omit<Category, 'id'> & { id?: string }): Category {
    return databaseService.saveCategory(category);
  }

  static deleteCategory(id: string): boolean {
    return databaseService.deleteCategory(id);
  }
}

// ELECTRON IPC BOILERPLATE
export const ELECTRON_IPC_BOILERPLATE = {
  preloadCode: `
/**
 * preload.js - قرارگیری در پوشه پری‌لود بومی الکترون
 * تعریف پل ارتباطی ایمن (Context Isolation)
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbAPI', {
  // فراخوانی امن کوئری‌های آفلاین به پروسه اصلی
  query: (sql, params = []) => ipcRenderer.invoke('execute-db-query', { sql, params }),
  saveProduct: (product) => ipcRenderer.invoke('save-product', product),
  savePerson: (person) => ipcRenderer.invoke('save-person', person),
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  createInvoice: (invoice, items) => ipcRenderer.invoke('create-invoice', { invoice, items }),
  exportBackup: () => ipcRenderer.invoke('export-backup'),
});
`,
  mainProcessCode: `
/**
 * main.js / index.js - لوپ اصلی پروژه الکترون
 * راه‌اندازی و اتصال به SQLite واقعی با ایمنی کامل تراکنش‌ها
 */
const { app, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  const dbPath = app.isPackaged 
    ? path.join(app.getPath('userData'), 'shop_accounting.db')
    : './shop_accounting.db';
    
  db = new Database(dbPath);
  
  // راه‌اندازی فشرده جداول
  db.exec(\`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      type TEXT,
      balance INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT UNIQUE,
      title TEXT,
      purchase_price INTEGER,
      sale_price INTEGER,
      stock_quantity INTEGER DEFAULT 0,
      unit TEXT
    );
  \`);
  console.log("sqlite3 database is connected safety: " + dbPath);
}

// ثبت رویدادها IPC در پروسه اصلی
app.whenReady().then(() => {
  initDatabase();
  
  // شبیه‌ساز اجرای ایمن کوئری
  ipcMain.handle('execute-db-query', async (event, { sql, params }) => {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(params);
      } else {
        return stmt.run(params);
      }
    } catch (err) {
      console.error(err);
      return { error: err.message };
    }
  });
  
  // کنترل تراکنش ثبت فاکتور (Transaction Isolation)
  ipcMain.handle('create-invoice', async (event, { invoice, items }) => {
    const transaction = db.transaction(() => {
      // عملیات کسر انبار و به‌روزرسانی تراکم بدهکاری و بستانکاری
      const insertInv = db.prepare('INSERT INTO invoices ...');
      const insertItem = db.prepare('INSERT INTO invoice_items ...');
      const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
      const updateBalance = db.prepare('UPDATE persons SET balance = balance + ? WHERE id = ?');
      
      // اجرای استیتمنت‌ها تحت تراکنش واحد
    });
    return transaction();
  });
});
`
};
