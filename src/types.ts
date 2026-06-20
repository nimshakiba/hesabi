export interface Person {
  id: string;
  name: string;
  phone: string;
  type: 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson' | 'Other'; // نوع حساب: مشتری، تامین‌کننده، سهام‌دار، کارمند، فروشنده، سایر
  roles?: ('Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson')[]; // نقش‌های متعدد شخص
  balance: number; // مثبت: بدهکار (debtor)، منفی: بستانکار (creditor)، صفر: تسویه
  national_code?: string; // کد ملی / شناسه ملی
  economic_code?: string; // کد اقتصادی
  address?: string; // آدرس
  email?: string; // پست الکترونیک
  notes?: string; // یادداشت‌ها و توضیحات تکمیلی
  postal_code?: string; // کد پستی
  landline?: string; // تلفن ثابت
  share_percentage?: number; // درصد سهم مغازه (مخصوص سهام‌داران)
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  notes?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  barcode: string; // بارکد محصول (کارخانه)
  title: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  unit: string; // عدد، بسته، کیلوگرم، متر و غیره
  warehouse_stocks?: Record<string, number>; // { [warehouseId]: quantity }
  warehouse_positions?: Record<string, string>; // { [warehouseId]: position/shelf location }
  // فیلدهای انبارداری هوشمند عمیق
  brand?: string; // برند کالا
  description?: string; // توضیحات تکمیلی محصول
  sku?: string; // شناسه واحد نگهداری کالا (SKU)
  min_stock?: number; // نقطه سفارش (حداقل آلارم موجودی)
  max_stock?: number; // سقف ظرفیت فیزیکی انبار
  dimensions?: string; // ابعاد، سایز یا مشخصات وزنی
  barcode_store?: string; // بارکد اختصاصی فروشگاه (مغازه)
  image?: string; // لینک یا تصویر اصلی محصول (Base64)
  gallery?: string[]; // آلبوم گالری تصاویر پیوست تکمیلی کالا
  category_id?: string; // انتساب به آدرس دسته‌بندی درختی
}

export interface Service {
  id: string;
  title: string;
  price: number;
  // فیلدهای پیشرفته خدمات دستمزد و پیک
  description?: string; // توضیحات کامل نحوه ارائه خدمت
  duration_mins?: number; // تخمین مدت زمان انجام کار (به دقیقه)
  image?: string; // تصویر شاخص خدمت
  gallery?: string[]; // پیوست‌ها یا اسناد مستندات خدمات گالری
  category_id?: string; // انتساب به دسته‌بندی درختی خدمات
}

export interface Category {
  id: string;
  name: string;
  parentId?: string; // آدرس درختچه برای سلسله مراتب تو در تو
  type: 'product' | 'service' | 'both'; // نوع تعلق: کالا، خدمت یا همگی
  description?: string; // توضیحات اجمالی
  isImportant?: boolean; // نشانه‌گذاری دستی به عنوان دسته‌بندی پرفروش و مهم
  salesCount?: number; // تعداد دفعات فروش محصولات دسته
  icon?: string; // آیکون فونت (نام آیکون لوسید)
  iconPng?: string; // تصویر PNG (یا بیس۶۴ یا لینک)
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string; // لینک تصویر لوگو
}

export interface Invoice {
  id: string;
  invoice_number: string;
  person_id: string; // شناسه شخص (یا مشتری عمومی)
  type: 'Sale' | 'Quick Sale' | 'Purchase'; // فروش، فروش سریع، خرید
  total_amount: number; // جمع کل کالاها
  discount: number; // مبلغ تخفیف
  final_amount: number; // مبلغ نهایی (کل منهای تخفیف)
  payment_status: 'Paid' | 'Unpaid' | 'Partial'; // پرداخت شده، پرداخت نشده، نقدی/نسیه
  payment_method: 'Cash' | 'POS' | 'Mixed'; // نقدی، کارتخوان، ترکیبی
  created_at: string; // تاریخ ثبت فاکتور
  user_name?: string; // نام کاربر صادر‌کننده فاکتور (فروشنده)
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string; // شناسه محصول یا خدمت
  item_type: 'Product' | 'Service';
  quantity: number;
  price: number; // قیمت واحد در زمان فاکتور
  total: number; // تعداد ضربدر قیمت واحد
}

export interface StockLog {
  id: string;
  product_id: string;
  product_title: string;
  previous_qty: number;
  new_qty: number;
  change_qty: number; // تغییر (مثلا ۵ + یا ۲-)
  reason: string; // دلیل تغییر (تعدیل دستی، فاکتور، فروش سریع و غیره)
  created_at: string;
  user_name?: string; // کاربر یا اپراتور ثبت‌کننده
  warehouse_id?: string; // شناسه انبار مرجع
  warehouse_name?: string; // نام انبار مرجع
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Salesperson' | 'Accountant';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string;
  personId?: string;
}

export interface UserActionLog {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  actionType: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

