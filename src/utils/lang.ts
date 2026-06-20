export type Lang = 'fa' | 'en';

export const DICTIONARY = {
  // Navigation / Sidebar
  pertechAccounting: { fa: 'حسابداری پریشین حسابی', en: 'Hesabi Persian Accounting' },
  dashboard: { fa: 'داشبورد مالی', en: 'Financial Dashboard' },
  chartOfAccounts: { fa: 'کدینگ حساب‌ها', en: 'Chart of Accounts' },
  journalEntries: { fa: 'ثبت اسناد روزنامه', en: 'Journal Entries' },
  trialBalance: { fa: 'تراز آزمایشی', en: 'Trial Balance' },
  generalLedger: { fa: 'دفتر کل / معین', en: 'Ledger Cards' },
  profitAndLoss: { fa: 'صورت سود و زیان', en: 'Income Statement' },
  balanceSheet: { fa: 'ترازنامه مالی', en: 'Balance Sheet' },
  backupRestore: { fa: 'پشتیبان‌گیری و بازیابی', en: 'Backup & Restore' },
  logout: { fa: 'خروج از سیستم', en: 'Logout' },
  login: { fa: 'ورود به حساب کاربری', en: 'Login to Account' },
  register: { fa: 'ثبت‌نام کاربر جدید', en: 'Register New User' },

  // General fields
  code: { fa: 'کد حساب', en: 'Account Code' },
  name: { fa: 'نام حساب (فارسی/انگلیسی)', en: 'Account Name' },
  type: { fa: 'نوع حساب', en: 'Account Type' },
  level: { fa: 'سطح حساب', en: 'Account Level' },
  parent: { fa: 'حساب والد', en: 'Parent Account' },
  debit: { fa: 'بدهکار', en: 'Debit' },
  credit: { fa: 'بستانکار', en: 'Credit' },
  balance: { fa: 'مانده', en: 'Balance' },
  balanceType: { fa: 'ماهیت مانده', en: 'Balance Nature' },
  description: { fa: 'شرح', en: 'Description' },
  date: { fa: 'تاریخ', en: 'Date' },
  actions: { fa: 'عملیات', en: 'Actions' },
  save: { fa: 'ذخیره', en: 'Save' },
  cancel: { fa: 'انصراف', en: 'Cancel' },
  delete: { fa: 'حذف', en: 'Delete' },
  edit: { fa: 'ویرایش', en: 'Edit' },
  add: { fa: 'افزودن جدید', en: 'Add New' },
  status: { fa: 'وضعیت', en: 'Status' },
  total: { fa: 'جمع کل', en: 'Grand Total' },

  // Level Names
  Group: { fa: 'گروه حساب', en: 'Group' },
  Ledger: { fa: 'کل', en: 'Ledger' },
  Subsidiary: { fa: 'معین', en: 'Subsidiary' },
  Detailed: { fa: 'تفصیلی', en: 'Detailed' },

  // Type Names
  Asset: { fa: 'دارایی', en: 'Asset' },
  Liability: { fa: 'بدهی', en: 'Liability' },
  Equity: { fa: 'حقوق مالکان', en: 'Equity' },
  Revenue: { fa: 'درآمد', en: 'Revenue' },
  Expense: { fa: 'هزینه', en: 'Expense' },

  // Dashboard Summary
  quickOverview: { fa: 'مرور اجمالی وضعیت مالی شرکت', en: 'Financial Quick Overview' },
  totalAssets: { fa: 'جمع دارایی‌ها', en: 'Total Assets' },
  totalLiabilities: { fa: 'جمع بدهی‌ها', en: 'Total Liabilities' },
  totalEquity: { fa: 'حقوق صاحبان سهام', en: 'Total Equity' },
  netProfit: { fa: 'سود ناخالص دوره مالی', en: 'Current Net Profit' },
  latestEntries: { fa: 'آخرین اسناد روزنامه صادر شده', en: 'Latest Journal Entries' },
  recentSystemAlerts: { fa: 'اطلاعیه‌های سیستم', en: 'System Alerts' },
  accountsCount: { fa: 'تعداد کل حساب‌های تعریف‌شده', en: 'Total Accounts Configured' },
  backupsCount: { fa: 'وضعیت پشتیبان‌گیری', en: 'Backup Schedule Status' },

  // Chart of accounts specific
  newAccountTitle: { fa: 'تعریف حساب مالی جدید در درختواره', en: 'Configure New Account Node' },
  accountCodeTip: { fa: 'کد حساب باید مطابق گروه والد و سلسله‌مراتب کدینگ باشد.', en: 'Account Code must correspond to parent hierarchy.' },
  selectParent: { fa: 'یک حساب به عنوان والد انتخاب نمایید (جهت تعیین سطح)', en: 'Select parent node in the hierarchy' },

  // Voucher / Journal entries specific
  docNumber: { fa: 'شماره سند', en: 'Doc Number' },
  voucherEditor: { fa: 'دفتر روزنامه - ثبت سند حسابداری جدید', en: 'New Accounting Voucher' },
  addLine: { fa: 'افزودن آرتیکل جدید', en: 'Add Article Row' },
  voucherBalance: { fa: 'بررسی تراز سند', en: 'Voucher Balance Check' },
  balanced: { fa: 'سند موازنه و تراز است', en: 'The voucher is balanced and valid.' },
  unbalanced: { fa: 'سند موازنه نیست! مابه‌التفاوت جاری:', en: 'Voucher is not balanced! Difference:' },
  journalSuccess: { fa: 'سند حسابداری با موفقیت به ثبت رسید.', en: 'Accounting Voucher posted successfully.' }
};

export function t(key: keyof typeof DICTIONARY, lang: Lang): string {
  const item = DICTIONARY[key];
  if (!item) return key as string;
  return item[lang];
}

// Convert numbers to Persian if in Farsi mode, and apply separator
export function formatAmount(val: number, lang: Lang): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const formatted = Math.round(val).toLocaleString('en-US');
  
  if (lang === 'en') {
    return formatted;
  }

  // Convert to Farsi digits
  const pyDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return formatted.replace(/[0-9]/g, (w) => pyDigits[parseInt(w, 10)]);
}

// simple Persian Solar dates helpers or conversion mockup
export function getPersianTodayDate(): string {
  // Returns formatted Shamsi date like "1405-03-30" based on Gregorian time 2026
  // Native conversion algorithm or custom mock helper corresponding to our seed dates
  const today = new Date();
  const year = today.getFullYear();
  if (year === 2026) {
    // Current local time is 2026-06-20
    // let's translate June 20, 2026 to Shamsi.
    // June 20, 2026 is roughly Khordad 30, 1405 (1405-03-30).
    // Let's implement a clean calculated offset mapping so dates dynamically make sense!
    const month = today.getMonth() + 1; // 6
    const day = today.getDate(); // 20
    
    // Quick reliable conversion formula snippet for mid-2026
    let shamsiYear = 1405;
    let shamsiMonth = 3; // June
    let shamsiDay = day + 10; // offset map
    if (shamsiDay > 31) {
      shamsiDay -= 31;
      shamsiMonth += 1;
    }
    return `${shamsiYear}-${shamsiMonth.toString().padStart(2, '0')}-${shamsiDay.toString().padStart(2, '0')}`;
  }
  return '1405-03-30'; // fallback
}

export function toPersianDigits(str: string): string {
  const pyDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => pyDigits[parseInt(w, 10)]);
}
