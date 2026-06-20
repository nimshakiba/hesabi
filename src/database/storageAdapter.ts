/**
 * StorageAdapter Interface
 * Defines standard synchronous storage operations.
 * Allows switching from LocalStorage to files or SQLite easily in the future.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

declare global {
  interface Window {
    dbAPI?: {
      isElectron: () => boolean;
      saveStorage: (key: string, data: any) => Promise<boolean>;
      loadStorage: (key: string) => Promise<any>;
      printInvoice?: (html: string) => Promise<any>;
      getPrinters?: () => Promise<any[]>;
      getDbPath?: () => Promise<string>;
      reconnectDb?: (newPath: string) => Promise<{ success: boolean; dbPath: string; error?: string }>;
      logSystem?: (msg: string, type: string) => void;
    };
    isDbReady?: boolean;
  }
}

// کمک برای تشخیص کلیدهای حسابداری جهت ممانعت از ذخیره‌سازی مصلحت‌آمیز مرورگر
function isAccountKey(key: string): boolean {
  return key.startsWith('shop_accounting_') || key.startsWith('shop_');
}

/**
 * HybridStorageAdapter
 * بدنه یکپارچه ذخیره‌سازی حافظه‌ای و متصل فیزیکی SQLite
 * با ایزوله‌سازی کامل فوت‌پرینت لوکال‌استوریج مرورگر برای اطلاعات حساس حسابداری
 */
export class HybridStorageAdapter implements StorageAdapter {
  private cache: Record<string, string> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      window.isDbReady = false;
    }

    const keys = [
      'shop_accounting_persons',
      'shop_accounting_products',
      'shop_accounting_services',
      'shop_accounting_invoices',
      'shop_accounting_invoice_items',
      'shop_accounting_stock_logs',
      'shop_accounting_categories',
      'shop_accounting_payments',
      'shop_accounting_expenses',
      'shop_accounting_stock_movements',
      'shop_accounting_service_orders',
      'shop_accounting_users',
      'shop_accounting_warehouses'
    ];

    // لود داده‌های اولیه غیرحساس از لوکال‌استوریج
    for (const key of keys) {
      if (!isAccountKey(key)) {
        const localVal = localStorage.getItem(key);
        if (localVal) {
          this.cache[key] = localVal;
        }
      }
    }

    // لود ناهمگام و آب‌رسانی مستقیم از فایل اصلی SQLite ویندوز فیزیکی
    if (typeof window !== 'undefined' && window.dbAPI) {
      window.dbAPI.logSystem?.('رابط فیزیکی SQLite دسکتاپ بر روی بستر الکترون متصل شد.', 'info');
      
      Promise.all(
        keys.map(key => 
          window.dbAPI!.loadStorage(key)
            .then(diskData => ({ key, diskData }))
            .catch(() => ({ key, diskData: null }))
        )
      ).then(results => {
        let hasChanges = false;
        for (const { key, diskData } of results) {
          if (diskData !== null) {
            const serialized = typeof diskData === 'string' ? diskData : JSON.stringify(diskData);
            if (this.cache[key] !== serialized) {
              this.cache[key] = serialized;
              hasChanges = true;
            }
          }
        }
        window.isDbReady = true;
        window.dispatchEvent(new Event('shop_db_loaded'));
        if (hasChanges) {
          window.dispatchEvent(new Event('cofeclick_settings_updated'));
        }
      });
    } else if (typeof window !== 'undefined') {
      // حالت مرورگر - بازیابی مستقیم بستر لایه لوکال وب از SQLite3 واقعی سرور ویت روی پورت ۳۰۰۰
      Promise.all(
        keys.map(key => 
          fetch(`./api/db/load?key=${key}`)
            .then(res => res.json())
            .then(resData => ({ key, diskData: resData.data }))
            .catch(() => ({ key, diskData: null }))
        )
      ).then(results => {
        let hasChanges = false;
        for (const { key, diskData } of results) {
          if (diskData !== null) {
            const serialized = typeof diskData === 'string' ? diskData : JSON.stringify(diskData);
            if (this.cache[key] !== serialized) {
              this.cache[key] = serialized;
              hasChanges = true;
            }
          }
        }
        window.isDbReady = true;
        window.dispatchEvent(new Event('shop_db_loaded'));
        if (hasChanges) {
          window.dispatchEvent(new Event('cofeclick_settings_updated'));
        }
      });
    }
  }

  getItem(key: string): string | null {
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }
    if (isAccountKey(key)) {
      return null; // مسدود کردن کل لوکال استوریج برای هماهنگی بالا
    }
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.cache[key] = value;
    if (!isAccountKey(key)) {
      localStorage.setItem(key, value);
    }

    if (typeof window !== 'undefined') {
      let parsed: any = null;
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        parsed = value;
      }

      // ۱. ارسال تراکنش زنده و ممتد به هسته الکترون
      if (window.dbAPI) {
        window.dbAPI.saveStorage(key, parsed).catch(err => {
          console.error('خطا در نوشتن روی دسکتاپ:', err);
        });
      } else {
        // ۲. ارسال امن از وب‌سرور ویت به ریشه دیتابیس shop.db روی سیستم‌عامل
        fetch('./api/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, data: parsed })
        }).catch(err => {
          console.error('خطا در وب‌کوئری:', err);
        });
      }
    }
  }

  removeItem(key: string): void {
    delete this.cache[key];
    if (!isAccountKey(key)) {
      localStorage.removeItem(key);
    }

    if (typeof window !== 'undefined') {
      if (window.dbAPI) {
        window.dbAPI.saveStorage(key, null).catch(err => {
          console.error('خطا در ثبت حذف در الکترون:', err);
        });
      } else {
        fetch('./api/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, data: null })
        }).catch(err => {
          console.error('خطا در ثبت حذف وب:', err);
        });
      }
    }
  }
}

/**
 * LocalStorageAdapter
 * پیاده‌سازی کلاسیک مرورگر کلاینت
 */
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
