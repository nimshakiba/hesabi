import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';
import * as Models from './models';
import { Person, Product, Service, Invoice, InvoiceItem, StockLog, Warehouse, Category } from '../types';

// Storage keys
export const STORAGE_KEYS = {
  PERSONS: 'shop_accounting_persons',
  PRODUCTS: 'shop_accounting_products',
  SERVICES: 'shop_accounting_services',
  INVOICES: 'shop_accounting_invoices',
  INVOICE_ITEMS: 'shop_accounting_invoice_items',
  STOCK_LOGS: 'shop_accounting_stock_logs',
  CATEGORIES: 'shop_accounting_categories',
  PAYMENTS: 'shop_accounting_payments',
  EXPENSES: 'shop_accounting_expenses',
  STOCK_MOVEMENTS: 'shop_accounting_stock_movements',
  SERVICE_ORDERS: 'shop_accounting_service_orders',
  USERS: 'shop_accounting_users',
  WAREHOUSES: 'shop_accounting_warehouses',
};

// Initial Seed Data to preserve user's application defaults
const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: 'wh_central', name: 'انبار مرکزی (سوله دپوی قطران)', code: 'WH-01', location: 'خاوران، خیابان قطران، پلاک ۱۲', notes: 'دپوی انبارداری کل قطعات و کالاهای فیزیکی بزرگ توزیع و پخش فروشگاه آریا', isActive: true },
  { id: 'wh_store', name: 'انبار مغازه (ویترین عرضه)', code: 'WH-02', location: 'طبقه همکف فروشگاه، قفسه‌های پشتی', notes: 'کالاهای آماده تحویل سریع با قابلیت کسر مستقیم از صنف پوز صنف آریا', isActive: true }
];

const DEFAULT_USERS: Models.User[] = [
  { id: 'user_admin', username: 'admin', fullName: 'مدیر سیستم', role: 'Admin', password: 'admin', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_sales', username: 'sales', fullName: 'صندوق‌دار فروشگاه', role: 'Salesperson', password: 'sales', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_PERSONS: Person[] = [
  { id: 'general_customer', name: 'مشتری عمومی (فروش سریع)', phone: '0', type: 'Customer', balance: 0 },
];

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_SERVICES: Service[] = [];

const DEFAULT_INVOICES: Invoice[] = [];

const DEFAULT_INVOICE_ITEMS: InvoiceItem[] = [];

const DEFAULT_STOCK_LOGS: StockLog[] = [];

export class DatabaseService {
  private adapter: StorageAdapter;
  private sqlLogs: string[] = [];

  constructor(adapter: StorageAdapter = new HybridStorageAdapter()) {
    this.adapter = adapter;
  }

  getSqlLogs(): string[] {
    return [...this.sqlLogs];
  }

  clearSqlLogs() {
    this.sqlLogs = [];
  }

  private logSql(statement: string) {
    this.sqlLogs.unshift(`[${new Date().toLocaleTimeString('fa-IR')}] => ${statement}`);
    if (this.sqlLogs.length > 50) {
      this.sqlLogs.pop();
    }
  }

  // Load and Save generic helpers leveraging StorageAdapter
  private loadDataFromStorage<T>(key: string): T[] {
    const raw = this.adapter.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private saveDataToStorage<T>(key: string, data: T[]) {
    this.adapter.setItem(key, JSON.stringify(data));
  }

  init() {
    if (!this.adapter.getItem(STORAGE_KEYS.PERSONS)) {
      this.saveDataToStorage(STORAGE_KEYS.PERSONS, DEFAULT_PERSONS);
      this.logSql("CREATE TABLE IF NOT EXISTS persons (id TEXT PRIMARY KEY, name TEXT, phone TEXT, type TEXT, balance INTEGER);");
      this.logSql("INSERT INTO persons VALUES ... (Seeded default customer/supplier ledger accounts)");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      this.logSql("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, barcode TEXT, title TEXT, purchase_price INTEGER, sale_price INTEGER, stock_quantity INTEGER, unit TEXT);");
      this.logSql("INSERT INTO products VALUES ... (Seeded typical Iranian retail products)");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.SERVICES)) {
      this.saveDataToStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
      this.logSql("CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, title TEXT, price INTEGER);");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.INVOICES)) {
      this.saveDataToStorage(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      this.logSql("CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, invoice_number TEXT, person_id TEXT, type TEXT, total_amount INTEGER, discount INTEGER, final_amount INTEGER, payment_status TEXT, payment_method TEXT, created_at TEXT);");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.INVOICE_ITEMS)) {
      this.saveDataToStorage(STORAGE_KEYS.INVOICE_ITEMS, DEFAULT_INVOICE_ITEMS);
      this.logSql("CREATE TABLE IF NOT EXISTS invoice_items (id TEXT PRIMARY KEY, invoice_id TEXT, item_id TEXT, item_type TEXT, quantity INTEGER, price INTEGER, total INTEGER);");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.STOCK_LOGS)) {
      this.saveDataToStorage(STORAGE_KEYS.STOCK_LOGS, DEFAULT_STOCK_LOGS);
      this.logSql("CREATE TABLE IF NOT EXISTS stock_logs (id TEXT PRIMARY KEY, product_id TEXT, product_title TEXT, previous_qty INTEGER, new_qty INTEGER, change_qty INTEGER, reason TEXT, created_at TEXT);");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.WAREHOUSES)) {
      this.saveDataToStorage(STORAGE_KEYS.WAREHOUSES, DEFAULT_WAREHOUSES);
      this.logSql("CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT, code TEXT, location TEXT, notes TEXT, isActive INTEGER);");
      this.logSql("INSERT INTO warehouses VALUES ... (Seeded Default Central and Storefront Warehouses)");
    }
    if (!this.adapter.getItem(STORAGE_KEYS.USERS)) {
      this.saveDataToStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
      this.logSql("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, fullName TEXT, role TEXT, isActive INTEGER, createdAt TEXT, updatedAt TEXT);");
      this.logSql("INSERT INTO users VALUES ... (Seeded Default System Accounts)");
    }
  }

  // --- PERSONS OPERATIONS (Customers / Suppliers) ---
  getPersons(): Person[] {
    const list = this.loadDataFromStorage<Person>(STORAGE_KEYS.PERSONS);
    this.logSql("SELECT * FROM persons ORDER BY name ASC;");
    return list;
  }

  savePerson(person: Omit<Person, 'id'> & { id?: string }): Person {
    const list = this.getPersons();
    const id = person.id || `person_${Date.now()}`;
    const newPerson: Person = { ...person, id, balance: person.balance || 0 };

    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      const oldVal = list[idx];
      list[idx] = newPerson;
      this.logSql(`UPDATE persons SET name='${person.name}', phone='${person.phone}', type='${person.type}', balance=${person.balance} WHERE id='${id}';`);
      this.logUserAction(
        'PERSON_UPDATE',
        `ویرایش اطلاعات شخص: ${person.name}`,
        `نام: ${oldVal.name} | تلفن: ${oldVal.phone} | تراز: ${oldVal.balance}`,
        `نام: ${person.name} | تلفن: ${person.phone} | تراز: ${person.balance}`
      );
    } else {
      list.push(newPerson);
      this.logSql(`INSERT INTO persons (id, name, phone, type, balance) VALUES ('${id}', '${person.name}', '${person.phone}', '${person.type}', ${person.balance});`);
      this.logUserAction(
        'PERSON_CREATE',
        `تعریف شخص جدید: ${person.name}`,
        '',
        `نام: ${person.name} | تلفن: ${person.phone} | تراز اول: ${person.balance || 0} | نقش: ${person.type}`
      );
    }
    this.saveDataToStorage(STORAGE_KEYS.PERSONS, list);
    return newPerson;
  }

  deletePerson(id: string): boolean {
    if (id === 'general_customer') return false;
    const list = this.getPersons();
    const found = list.find(p => p.id === id);
    const filtered = list.filter(p => p.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.PERSONS, filtered);
    this.logSql(`DELETE FROM persons WHERE id='${id}';`);
    if (found) {
      this.logUserAction(
        'PERSON_DELETE',
        `حذف شخص از دفتر کل: ${found.name}`,
        `نام: ${found.name} | تلفن: ${found.phone} | آخرین بدهی/طلب: ${found.balance}`,
        ''
      );
    }
    return true;
  }

  // --- PRODUCTS OPERATIONS ---
  getProducts(): Product[] {
    const list = this.loadDataFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
    let updated = false;
    const migrated = list.map(p => {
      if (!p.warehouse_stocks) {
        p.warehouse_stocks = { wh_central: p.stock_quantity || 0 };
        updated = true;
      }
      return p;
    });
    if (updated) {
      this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, migrated);
    }
    this.logSql("SELECT * FROM products ORDER BY title ASC;");
    return migrated;
  }

  saveProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    const list = this.getProducts();
    const id = product.id || `prod_${Date.now()}`;
    const newProduct: Product = { ...product, id };

    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      const oldVal = list[idx];
      list[idx] = newProduct;
      this.logSql(`UPDATE products SET barcode='${product.barcode}', title='${product.title}', purchase_price=${product.purchase_price}, sale_price=${product.sale_price}, stock_quantity=${product.stock_quantity}, unit='${product.unit}' WHERE id='${id}';`);
      
      if (oldVal.stock_quantity !== product.stock_quantity) {
        this.addStockLog(id, oldVal.title, oldVal.stock_quantity, product.stock_quantity, 'ویرایش مستقیم کالا و اصلاح انبار');
      }

      // Log user action
      this.logUserAction(
        'PRODUCT_UPDATE',
        `ویرایش کالا: ${product.title}`,
        `قیمت خرید: ${oldVal.purchase_price} | قیمت فروش: ${oldVal.sale_price} | موجودی: ${oldVal.stock_quantity}`,
        `قیمت خرید: ${product.purchase_price} | قیمت فروش: ${product.sale_price} | موجودی: ${product.stock_quantity}`
      );
    } else {
      list.push(newProduct);
      this.logSql(`INSERT INTO products (id, barcode, title, purchase_price, sale_price, stock_quantity, unit) VALUES ('${id}', '${product.barcode}', '${product.title}', ${product.purchase_price}, ${product.sale_price}, ${product.stock_quantity}, '${product.unit}');`);
      this.addStockLog(id, product.title, 0, product.stock_quantity, 'اضافه شدن اولیه کالا به نرم‌افزار');

      // Log user action
      this.logUserAction(
        'PRODUCT_CREATE',
        `تعریف کالای جدید: ${product.title}`,
        '',
        `قیمت فروش: ${product.sale_price} | بارکد: ${product.barcode}`
      );
    }
    this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  }

  deleteProduct(id: string): boolean {
    const list = this.getProducts();
    const found = list.find(p => p.id === id);
    const filtered = list.filter(p => p.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    this.logSql(`DELETE FROM products WHERE id='${id}';`);
    if (found) {
      this.logUserAction(
        'PRODUCT_DELETE',
        `حذف کالا: ${found.title}`,
        `شناسه: ${id} | قیمت فروش: ${found.sale_price}`,
        ''
      );
    }
    return true;
  }

  bulkUpdatePrices(percentage: number, roundToNearest: number = 1000): void {
    const list = this.getProducts();
    list.forEach(p => {
      const OldSale = p.sale_price;
      const computed = p.sale_price * (1 + percentage / 100);
      const rounded = Math.round(computed / roundToNearest) * roundToNearest;
      p.sale_price = rounded;
    });
    this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, list);
    this.logSql(`UPDATE products SET sale_price = ROUND((sale_price * ${1 + percentage / 100}) / ${roundToNearest}) * ${roundToNearest};`);
  }

  // --- SERVICES OPERATIONS ---
  getServices(): Service[] {
    const list = this.loadDataFromStorage<Service>(STORAGE_KEYS.SERVICES);
    this.logSql("SELECT * FROM services ORDER BY title ASC;");
    return list;
  }

  saveService(service: Omit<Service, 'id'> & { id?: string }): Service {
    const list = this.getServices();
    const id = service.id || `srv_${Date.now()}`;
    const newService: Service = { ...service, id };

    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = newService;
      this.logSql(`UPDATE services SET title='${service.title}', price=${service.price} WHERE id='${id}';`);
    } else {
      list.push(newService);
      this.logSql(`INSERT INTO services (id, title, price) VALUES ('${id}', '${service.title}', ${service.price});`);
    }
    this.saveDataToStorage(STORAGE_KEYS.SERVICES, list);
    return newService;
  }

  deleteService(id: string): boolean {
    const list = this.getServices();
    const filtered = list.filter(s => s.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.SERVICES, filtered);
    this.logSql(`DELETE FROM services WHERE id='${id}';`);
    return true;
  }

  // --- INVOICES OPERATIONS ---
  getInvoices(): Invoice[] {
    const list = this.loadDataFromStorage<Invoice>(STORAGE_KEYS.INVOICES);
    this.logSql("SELECT * FROM invoices ORDER BY created_at DESC;");
    return list;
  }

  getInvoiceItemsByInvoiceId(invoiceId: string): InvoiceItem[] {
    const list = this.loadDataFromStorage<InvoiceItem>(STORAGE_KEYS.INVOICE_ITEMS);
    this.logSql(`SELECT * FROM invoice_items WHERE invoice_id='${invoiceId}';`);
    return list.filter(item => item.invoice_id === invoiceId);
  }

  getStockLogs(): StockLog[] {
    const list = this.loadDataFromStorage<StockLog>(STORAGE_KEYS.STOCK_LOGS);
    this.logSql("SELECT * FROM stock_logs ORDER BY created_at DESC;");
    return list;
  }

  createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total'>[]
  ): Invoice {
    this.logSql("BEGIN TRANSACTION;");

    const invoices = this.getInvoices();
    const storedItems = this.loadDataFromStorage<InvoiceItem>(STORAGE_KEYS.INVOICE_ITEMS);
    const products = this.getProducts();
    const persons = this.getPersons();

    let invoice_number = '';
    try {
      const rawSettings = localStorage.getItem('cofeclick_app_settings_v1');
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings && settings.invoicePrefix) {
          const prefix = settings.invoicePrefix;
          const nextNum = Number(settings.invoiceNextNumber) || 1001;
          invoice_number = `${prefix}${nextNum}`;
          // Auto increment in settings & save back
          settings.invoiceNextNumber = nextNum + 1;
          localStorage.setItem('cofeclick_app_settings_v1', JSON.stringify(settings));
        }
      }
    } catch (e) {}

    if (!invoice_number) {
      const year = 1405;
      const count = invoices.length + 1;
      invoice_number = `${year}${String(count).padStart(3, '0')}`;
    }
    
    const invoiceId = `inv_${Date.now()}`;

    // Auto operator detection
    let finalOperator = 'مدیر سیستم';
    try {
      const activeUserRaw = localStorage.getItem('shop_accounting_active_user');
      if (activeUserRaw) {
        const userObj = JSON.parse(activeUserRaw);
        if (userObj && userObj.fullName) {
          finalOperator = userObj.fullName;
        }
      }
    } catch (e) {}

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      invoice_number,
      created_at: new Date().toISOString(),
      user_name: finalOperator
    };

    const savedInvoiceItems: InvoiceItem[] = [];
    items.forEach((item, index) => {
      const itemId = `item_${Date.now()}_${index}`;
      const total = item.quantity * item.price;
      const fullItem: InvoiceItem = {
        ...item,
        id: itemId,
        invoice_id: invoiceId,
        total
      };
      savedInvoiceItems.push(fullItem);
      storedItems.push(fullItem);

      if (item.item_type === 'Product') {
        const prodIdx = products.findIndex(p => p.id === item.item_id);
        if (prodIdx >= 0) {
          const prod = products[prodIdx];
          const prevQty = prod.stock_quantity;
          
          let newQty = prevQty;
          let reasonText = '';
          if (invoiceData.type === 'Sale' || invoiceData.type === 'Quick Sale') {
            newQty = prevQty - item.quantity;
            reasonText = `خروج از انبار بابت فاکتور فروش ${invoice_number}`;
          } else if (invoiceData.type === 'Purchase') {
            newQty = prevQty + item.quantity;
            reasonText = `ورود به انبار بابت فاکتور خرید ${invoice_number}`;
          }

          prod.stock_quantity = newQty;
          this.addStockLog(prod.id, prod.title, prevQty, newQty, reasonText);
          this.logSql(`UPDATE products SET stock_quantity = ${newQty} WHERE id = '${prod.id}';`);
        }
      }
    });

    if (invoiceData.person_id !== 'general_customer') {
      const persIdx = persons.findIndex(p => p.id === invoiceData.person_id);
      if (persIdx >= 0) {
        const person = persons[persIdx];
        
        let diff = 0;
        if (invoiceData.type === 'Sale') {
          diff = invoiceData.final_amount;
          if (invoiceData.payment_status === 'Paid') {
            diff = 0;
          } else if (invoiceData.payment_status === 'Partial') {
            diff = invoiceData.final_amount * 0.4;
          }
        } else if (invoiceData.type === 'Purchase') {
          diff = -invoiceData.final_amount;
          if (invoiceData.payment_status === 'Paid') {
            diff = 0;
          }
        }

        person.balance += diff;
        this.logSql(`UPDATE persons SET balance = balance + (${diff}) WHERE id = '${person.id}';`);
      }
    }

    invoices.push(newInvoice);
    this.saveDataToStorage(STORAGE_KEYS.INVOICES, invoices);
    this.saveDataToStorage(STORAGE_KEYS.INVOICE_ITEMS, storedItems);
    this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, products);
    this.saveDataToStorage(STORAGE_KEYS.PERSONS, persons);

    this.logSql(`INSERT INTO invoices VALUES ('${invoiceId}', '${invoice_number}', '${invoiceData.person_id}', '${invoiceData.type}', ${invoiceData.total_amount}, ${invoiceData.discount}, ${invoiceData.final_amount}, '${invoiceData.payment_status}', '${invoiceData.payment_method}', datetime('now'));`);
    this.logSql("COMMIT;");
    
    this.logUserAction(
      'INVOICE_CREATE',
      `ثبت فاکتور ${newInvoice.type === 'Sale' ? 'فروش رسمی' : newInvoice.type === 'Quick Sale' ? 'فروش سریع' : 'خرید کالا'} شماره ${invoice_number} به مبلغ کل ${newInvoice.final_amount.toLocaleString('fa-IR')} تومان`,
      '',
      `شماره فاکتور: ${invoice_number} | نوع: ${newInvoice.type} | مبلغ: ${newInvoice.final_amount} | روش تسویه: ${newInvoice.payment_method}`
    );

    return newInvoice;
  }

  // Delete/Cancel/Void invoice directly supported by service
  deleteInvoice(id: string): void {
    const invoices = this.getInvoices();
    const found = invoices.find(inv => inv.id === id);
    const filtered = invoices.filter(inv => inv.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.INVOICES, filtered);
    this.logSql(`DELETE FROM invoices WHERE id='${id}';`);
    if (found) {
      this.logUserAction(
        'INVOICE_DELETE',
        `حذف و ابطال فاکتور شماره ${found.invoice_number} به مبلغ کل ${found.final_amount.toLocaleString('fa-IR')} تومان`,
        `شماره فاکتور: ${found.invoice_number} | نوع: ${found.type} | مبلغ کل: ${found.final_amount}`,
         ''
      );
    }
  }

  addStockLog(
    productId: string,
    productTitle: string,
    prev: number,
    next: number,
    reason: string,
    warehouseId?: string,
    warehouseName?: string,
    operatorName?: string
  ) {
    const list = this.loadDataFromStorage<StockLog>(STORAGE_KEYS.STOCK_LOGS);
    
    // Auto auditor detection
    let finalOperator = operatorName || 'مدیر سیستم';
    if (!operatorName) {
      try {
        const activeUserRaw = localStorage.getItem('shop_accounting_active_user');
        if (activeUserRaw) {
          const userObj = JSON.parse(activeUserRaw);
          if (userObj && userObj.fullName) {
            finalOperator = userObj.fullName;
          }
        }
      } catch (e) {
        console.error("Error reading active auditor", e);
      }
    }

    // Auto warehouse detection
    let finalWhId = warehouseId || 'wh_central';
    let finalWhName = warehouseName || 'انبار مرکزی (سوله دپوی قطران)';
    if (!warehouseId) {
      try {
        const contextRaw = localStorage.getItem('shop_accounting_current_warehouse_context');
        if (contextRaw) {
          const whObj = JSON.parse(contextRaw);
          if (whObj && whObj.id) {
            finalWhId = whObj.id;
            finalWhName = whObj.name;
          }
        }
      } catch (e) {}
    }

    const newLog: StockLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      product_id: productId,
      product_title: productTitle,
      previous_qty: prev,
      new_qty: next,
      change_qty: next - prev,
      reason,
      created_at: new Date().toISOString(),
      user_name: finalOperator,
      warehouse_id: finalWhId,
      warehouse_name: finalWhName
    };
    list.push(newLog);
    this.saveDataToStorage(STORAGE_KEYS.STOCK_LOGS, list);
    this.logSql(`INSERT INTO stock_logs (id, product_id, product_title, previous_qty, new_qty, change_qty, reason, created_at, user_name, warehouse_id) VALUES ('${newLog.id}', '${productId}', '${productTitle}', ${prev}, ${next}, ${next - prev}, '${reason}', datetime('now'), '${finalOperator}', '${finalWhId}');`);
  }

  // Backup import/export operations
  exportDatabaseState(): string {
    const state = {
      persons: this.loadDataFromStorage(STORAGE_KEYS.PERSONS),
      products: this.loadDataFromStorage(STORAGE_KEYS.PRODUCTS),
      services: this.loadDataFromStorage(STORAGE_KEYS.SERVICES),
      invoices: this.loadDataFromStorage(STORAGE_KEYS.INVOICES),
      invoice_items: this.loadDataFromStorage(STORAGE_KEYS.INVOICE_ITEMS),
      stock_logs: this.loadDataFromStorage(STORAGE_KEYS.STOCK_LOGS),
    };
    return JSON.stringify(state, null, 2);
  }

  importDatabaseState(jsonState: string): boolean {
    try {
      const state = JSON.parse(jsonState);
      if (state.persons) this.saveDataToStorage(STORAGE_KEYS.PERSONS, state.persons);
      if (state.products) this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, state.products);
      if (state.services) this.saveDataToStorage(STORAGE_KEYS.SERVICES, state.services);
      if (state.invoices) this.saveDataToStorage(STORAGE_KEYS.INVOICES, state.invoices);
      if (state.invoice_items) this.saveDataToStorage(STORAGE_KEYS.INVOICE_ITEMS, state.invoice_items);
      if (state.stock_logs) this.saveDataToStorage(STORAGE_KEYS.STOCK_LOGS, state.stock_logs);
      
      this.logSql("RESTORE ENTIRE DATABASE FROM JSON;");
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // --- COMPATIBLE METHODS IMPLEMENTATION FOR NEW MODEL INTERFACES ONLY ---
  // If we ever want to do direct CRUD on Category, Payment, Expense etc:
  getPayments(): Models.Payment[] {
    return this.loadDataFromStorage<Models.Payment>(STORAGE_KEYS.PAYMENTS);
  }

  savePayment(payment: Models.Payment): Models.Payment {
    const payments = this.getPayments();
    const idx = payments.findIndex(p => p.id === payment.id);
    if (idx >= 0) payments[idx] = payment;
    else payments.push(payment);
    this.saveDataToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return payment;
  }

  getExpenses(): Models.Expense[] {
    return this.loadDataFromStorage<Models.Expense>(STORAGE_KEYS.EXPENSES);
  }

  saveExpense(expense: Models.Expense): Models.Expense {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) expenses[idx] = expense;
    else expenses.push(expense);
    this.saveDataToStorage(STORAGE_KEYS.EXPENSES, expenses);
    return expense;
  }
  
  getStockMovements(): Models.StockMovement[] {
    return this.loadDataFromStorage<Models.StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS);
  }

  getServiceOrders(): Models.ServiceOrder[] {
    return this.loadDataFromStorage<Models.ServiceOrder>(STORAGE_KEYS.SERVICE_ORDERS);
  }

  saveServiceOrder(order: Models.ServiceOrder): Models.ServiceOrder {
    const orders = this.getServiceOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = order;
    else orders.push(order);
    this.saveDataToStorage(STORAGE_KEYS.SERVICE_ORDERS, orders);
    return order;
  }

  getUsers(): Models.User[] {
    const list = this.loadDataFromStorage<Models.User>(STORAGE_KEYS.USERS);
    this.logSql("SELECT * FROM users ORDER BY username ASC;");
    return list;
  }

  // --- WAREHOUSES CRUD OPERATIONS ---
  getWarehouses(): Warehouse[] {
    const list = this.loadDataFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES);
    if (!list || list.length === 0) {
      this.saveDataToStorage(STORAGE_KEYS.WAREHOUSES, DEFAULT_WAREHOUSES);
      return DEFAULT_WAREHOUSES;
    }
    this.logSql("SELECT * FROM warehouses ORDER BY name ASC;");
    return list;
  }

  saveWarehouse(warehouse: Omit<Warehouse, 'id'> & { id?: string }): Warehouse {
    const list = this.getWarehouses();
    const id = warehouse.id || `wh_${Date.now()}`;
    const newWarehouse: Warehouse = { ...warehouse, id };

    const idx = list.findIndex(w => w.id === id);
    if (idx >= 0) {
      list[idx] = newWarehouse;
      this.logSql(`UPDATE warehouses SET name='${warehouse.name}', code='${warehouse.code}', location='${warehouse.location}', notes='${warehouse.notes || ''}', isActive=${warehouse.isActive ? 1 : 0} WHERE id='${id}';`);
    } else {
      list.push(newWarehouse);
      this.logSql(`INSERT INTO warehouses (id, name, code, location, notes, isActive) VALUES ('${id}', '${warehouse.name}', '${warehouse.code}', '${warehouse.location}', '${warehouse.notes || ''}', ${warehouse.isActive ? 1 : 0});`);
    }
    this.saveDataToStorage(STORAGE_KEYS.WAREHOUSES, list);
    return newWarehouse;
  }

  deleteWarehouse(id: string): boolean {
    if (id === 'wh_central' || id === 'wh_store') return false;
    const list = this.getWarehouses();
    const filtered = list.filter(w => w.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.WAREHOUSES, filtered);
    this.logSql(`DELETE FROM warehouses WHERE id='${id}';`);
    return true;
  }

  // --- CATEGORIES OPERATIONS (Tree-Structured) ---
  getCategories(): Category[] {
    const list = this.loadDataFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
    if (!list || list.length === 0) {
      const defaults: Category[] = [
        { id: 'cat_food', name: 'مواد غذایی و سوپر مارکتی', type: 'product', description: 'انواع مواد خوراکی، لبنی و سوپرمارکتی مغازه' },
        { id: 'cat_rice', name: 'برنج و غلات دپو شده', parentId: 'cat_food', type: 'product', description: 'انواع برنج محلی هاشمی، وارداتی و حبوبات معین' },
        { id: 'cat_oil', name: 'روغن و مایعات خوراکی', parentId: 'cat_food', type: 'product', description: 'روغن‌های سرخ‌کردنی و پخت و پز گیاهی کاله لادن' },
        { id: 'cat_services', name: 'خدمات فنی و پشتیبانی فیزیکی', type: 'service', description: 'سرویس‌ها، دستمزد تعمیر، راه اندازی مجدد یا خدمات پیک سفارشی' }
      ];
      this.saveDataToStorage(STORAGE_KEYS.CATEGORIES, defaults);
      return defaults;
    }
    this.logSql("SELECT * FROM categories ORDER BY name ASC;");
    return list;
  }

  saveCategory(category: Omit<Category, 'id'> & { id?: string }): Category {
    const list = this.getCategories();
    const id = category.id || `cat_${Date.now()}`;
    const newCategory: Category = { ...category, id };

    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = newCategory;
      this.logSql(`UPDATE categories SET name='${category.name}', parentId='${category.parentId || ''}', type='${category.type}', description='${category.description || ''}' WHERE id='${id}';`);
    } else {
      list.push(newCategory);
      this.logSql(`INSERT INTO categories (id, name, parentId, type, description) VALUES ('${id}', '${category.name}', '${category.parentId || ''}', '${category.type}', '${category.description || ''}');`);
    }
    this.saveDataToStorage(STORAGE_KEYS.CATEGORIES, list);
    return newCategory;
  }

  deleteCategory(id: string): boolean {
    const list = this.getCategories();
    
    // Unparent direct children
    const updated = list.map(c => {
      if (c.parentId === id) {
        return { ...c, parentId: undefined };
      }
      return c;
    });

    const filtered = updated.filter(c => c.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.CATEGORIES, filtered);
    this.logSql(`DELETE FROM categories WHERE id='${id}';`);

    // Reset assigned categories in products
    const products = this.getProducts();
    let pChanged = false;
    products.forEach(p => {
      if (p.category_id === id) {
        delete p.category_id;
        pChanged = true;
      }
    });
    if (pChanged) {
      this.saveDataToStorage(STORAGE_KEYS.PRODUCTS, products);
    }

    // Reset assigned categories in services
    const services = this.getServices();
    let sChanged = false;
    services.forEach(s => {
      if (s.category_id === id) {
        delete s.category_id;
        sChanged = true;
      }
    });
    if (sChanged) {
      this.saveDataToStorage(STORAGE_KEYS.SERVICES, services);
    }

    return true;
  }

  saveUser(user: Models.User): Models.User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    const updatedUser = {
      ...user,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      const oldVal = users[idx];
      users[idx] = updatedUser;
      this.logSql(`UPDATE users SET username='${user.username}', fullName='${user.fullName}', role='${user.role}', isActive=${user.isActive ? 1 : 0}, updatedAt='${updatedUser.updatedAt}' WHERE id='${user.id}';`);
      
      this.logUserAction(
        'USER_UPDATE',
        `بروزرسانی مشخصات کاربر: ${user.fullName} (@${user.username})`,
        `نام کاربری: ${oldVal.username} | نام کامل: ${oldVal.fullName} | رمز: ${oldVal.password || '(بدون رمز)'} | نقش: ${oldVal.role} | فعال: ${oldVal.isActive}`,
        `نام کاربری: ${user.username} | نام کامل: ${user.fullName} | رمز: ${user.password || '(بدون رمز)'} | نقش: ${user.role} | فعال: ${user.isActive}`,
        user.id
      );
    } else {
      users.push(updatedUser);
      this.logSql(`INSERT INTO users (id, username, fullName, role, isActive, createdAt, updatedAt) VALUES ('${user.id}', '${user.username}', '${user.fullName}', '${user.role}', ${user.isActive ? 1 : 0}, '${updatedUser.createdAt}', '${updatedUser.updatedAt}');`);
      
      this.logUserAction(
        'USER_CREATE',
        `تعریف کاربر جدید سیستم: ${user.fullName} (@${user.username})`,
        '',
        `نام کاربری: ${user.username} | نقش: ${user.role} | رمز عبور: ${user.password || '(بدون رمز)'}`,
        user.id
      );
    }
    this.saveDataToStorage(STORAGE_KEYS.USERS, users);
    return updatedUser;
  }

  deleteUser(id: string): boolean {
    if (id === 'user_admin') return false; // Prevent deleting default administration account
    const list = this.getUsers();
    const found = list.find(u => u.id === id);
    const filtered = list.filter(u => u.id !== id);
    this.saveDataToStorage(STORAGE_KEYS.USERS, filtered);
    this.logSql(`DELETE FROM users WHERE id='${id}';`);
    if (found) {
      this.logUserAction(
        'USER_DELETE',
        `حذف کاربر از سیستم: ${found.fullName} (@${found.username})`,
        `شناسه: ${id} | نقش: ${found.role}`,
        ''
      );
    }
    return true;
  }

  getActiveUser(): { id: string; username: string; fullName: string; role: string } {
    try {
      const raw = localStorage.getItem('shop_accounting_active_user');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return { id: 'user_admin', username: 'admin', fullName: 'مدیر سیستم', role: 'Admin' };
  }

  getUserLogs(): any[] {
    return this.loadDataFromStorage<any>('shop_accounting_user_logs') || [];
  }

  logUserAction(actionType: string, description: string, oldValue?: string, newValue?: string, targetUserId?: string): void {
    const active = this.getActiveUser();
    const logs = this.getUserLogs();
    
    // Limit to last 150 log entries to keep things performant inside local storage
    const cleanLogs = logs.slice(-150);

    const targetUser = targetUserId ? (this.getUsers().find(u => u.id === targetUserId)) : null;

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: targetUserId || active.id,
      username: targetUser ? targetUser.username : active.username,
      userFullName: targetUser ? targetUser.fullName : active.fullName,
      actionType,
      description,
      oldValue: oldValue || '',
      newValue: newValue || '',
      createdAt: new Date().toISOString()
    };
    cleanLogs.push(newLog);
    this.saveDataToStorage('shop_accounting_user_logs', cleanLogs);
  }
}

// Single service instance for full app
export const databaseService = new DatabaseService();
