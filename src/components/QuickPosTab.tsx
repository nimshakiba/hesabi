import React, { useState, useEffect, useRef } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Service, InvoiceItem } from '../types';
import { SettingsService, formatPrice } from '../utils/settings';
import { 
  Barcode, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  CreditCard, 
  Banknote,
  Grid,
  ShoppingBag,
  Printer,
  ChevronLeft
} from 'lucide-react';

interface CartItem {
  id: string; // unique cart row id
  item_id: string; // references Product or Service ID
  title: string;
  type: 'Product' | 'Service';
  price: number;
  quantity: number;
  unit: string;
}

export default function QuickPosTab() {
  const activeUser = (() => {
    try {
      const raw = localStorage.getItem('shop_accounting_active_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { id: 'user_admin', username: 'admin', fullName: 'مدیر سیستم', role: 'Admin' };
  })();

  const canSell = activeUser.role === 'Admin' || activeUser.role === 'Salesperson';

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // فیلدهای جستجوی سریع کالا
  const [barcodeInput, setBarcodeInput] = useState('');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  
  // تنظیمات پرداخت سریع
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'POS' | 'Mixed'>('POS');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  
  // چاپ نهایی قبض فروش سریع
  const [lastInvoiceReceipt, setLastInvoiceReceipt] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [barcodeAlert, setBarcodeAlert] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
    // فوکوس مجدد روی بارکدخوان جهت ارتقای سرعت پاسخ‌گویی صندوق‌دار
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 150);
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setServices(OfflineDatabase.getServices());
  };

  // افزایش سریع کالا به سبد خرید بر اساس اسکن بارکد
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    const matchedProduct = products.find(p => p.barcode === barcode);
    if (matchedProduct) {
      if (matchedProduct.stock_quantity <= 0) {
        alert(`کالای «${matchedProduct.title}» فاقد موجودی در انبار می‌باشد!`);
      }
      addToCartFromProduct(matchedProduct);
      setBarcodeInput('');
      setBarcodeAlert(false);
    } else {
      setBarcodeAlert(true);
      setTimeout(() => setBarcodeAlert(false), 3000);
    }
  };

  // اضافه کردن کالا به سبد
  const addToCartFromProduct = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.item_id === product.id && item.type === 'Product');
      if (idx >= 0) {
        const nextQty = prev[idx].quantity + 1;
        // بررسی کفایت موجودی انبار
        if (nextQty > product.stock_quantity) {
          alert(`امکان اضافه کردن مجدد وجود ندارد. موجودی نهایی انبار کالا ${product.stock_quantity} عدد می‌باشد.`);
          return prev;
        }
        const updated = [...prev];
        updated[idx].quantity = nextQty;
        return updated;
      } else {
        return [...prev, {
          id: `cart_${Date.now()}_${product.id}`,
          item_id: product.id,
          title: product.title,
          type: 'Product',
          price: product.sale_price,
          quantity: 1,
          unit: product.unit
        }];
      }
    });
  };

  // اضافه کردن سرویس خدمات به سبد
  const addToCartFromService = (service: Service) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.item_id === service.id && item.type === 'Service');
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          id: `cart_${Date.now()}_${service.id}`,
          item_id: service.id,
          title: service.title,
          type: 'Service',
          price: service.price,
          quantity: 1,
          unit: 'سرویس'
        }];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          
          // چک کردن سقف انبار برای کالاها
          if (item.type === 'Product') {
            const originalProduct = products.find(p => p.id === item.item_id);
            if (originalProduct && newQty > originalProduct.stock_quantity) {
              alert(`موجودی کالا بیش از سقف انبار است (${originalProduct.stock_quantity} ${originalProduct.unit})`);
              return item;
            }
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // محاسبات مالی سبد خرده فروشی
  const totalBeforeDiscount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotalToPay = Math.max(0, totalBeforeDiscount - discountAmount);
  // محاسبه الباقی پول مشتری
  const changeReturnAmount = Math.max(0, amountReceived - finalTotalToPay);

  // اتمام فرآیند خرید سریع صندوق (تسویه نقدی/کارتخوان عمومی)
  const handleCheckoutPOS = () => {
    if (!canSell) {
      alert('خطای امنیتی: تنها فروشنده مجاز به ثبت تراکنش می‌باشد.');
      return;
    }
    if (cart.length === 0) return;

    const invoiceItemsPayload = cart.map(item => ({
      item_id: item.item_id,
      item_type: item.type,
      quantity: item.quantity,
      price: item.price
    }));

    // مشتری پیش‌فرض فروش سریع (general_customer)
    const newInv = OfflineDatabase.createInvoice({
      person_id: 'general_customer',
      type: 'Quick Sale',
      total_amount: totalBeforeDiscount,
      discount: discountAmount,
      final_amount: finalTotalToPay,
      payment_status: 'Paid',
      payment_method: paymentMethod
    }, invoiceItemsPayload);

    // آماده‌سازی برای نمایش فاکتور چاپ سریع
    setLastInvoiceReceipt({
      invoice: newInv,
      items: cart
    });
    
    // پاک کردن سبد و ریست مقادیر پرداختی
    setCart([]);
    setDiscountAmount(0);
    setAmountReceived(0);
    setShowReceiptModal(true);
    refreshData();
    
    // فوکوس مجدد بر بارکدخوان
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // فیلتر کردن کالاهای سریع در شبکه انتخاب دست اول
  const searchFilteredProducts = products.filter(p => p.title.includes(posSearchQuery) || p.barcode.includes(posSearchQuery));

  const formatToman = (val: number) => {
    return formatPrice(val);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative" id="quick-pos-container">
      
      {!canSell && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="pos-security-lock-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-xl text-red-500 animate-pulse">
              🛡️
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">عدم دسترسی ثبت فروشگاه (مخصوص فروشندگان)</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              تنها پرسنل و کاربران دارای نقش <span className="text-emerald-600 font-extrabold">«فروشنده / صندوق‌دار»</span> یا <span className="text-indigo-600 font-extrabold">«مدیر سیستم»</span> مجاز به دسترسی به صندوق و انجام ثبت فروش سریع هستند.
            </p>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1.5 leading-relaxed font-sans text-right">
              <strong className="text-red-600 block">چرا این محدودیت اعمال شده است؟</strong>
              حسابداری مستقل و تراز مالی صندوق به شدت به شناسه فروشنده فعال متکی است. دسترسی حسابدار یا کاربران متفرقه در این صفحه غیرفعال شده است تا از خطاهای سهوی جلوگیری شود.
            </div>
            <p className="text-[10px] text-slate-400">نکته تستی: می‌توانید از کشوی «ورود با نقش» در هدر بالا، نقش خود را فوراً به صندوق‌دار تغییر دهید.</p>
          </div>
        </div>
      )}

      {/* بخش سمت راست: گرید کالای صندوق‌دار جهت زدن سریع دکمه‌ها */}
      <div className="w-full lg:w-[50%] border-l border-slate-200/80 bg-slate-50 flex flex-col h-full overflow-hidden p-4" id="pos-items-explorer">
        {/* هدر: موتور بارکد اسکنر زنده */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-3 flex flex-col sm:flex-row items-center gap-3" id="pos-barcode-bar">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Barcode className="w-4.5 h-4.5 text-emerald-500 absolute right-3 top-2.5 animate-pulse" />
              <input
                id="pos-barcode-scanner"
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="اسکن زنده بارکد کالا توسط اسکنر (یا نوشتن دستی بارکد)..."
                className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-left"
              />
            </div>
            <button
              id="barcode-submit-btn"
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold font-sans transition"
            >
              افزودن
            </button>
          </form>
          
          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              id="pos-fast-search-grid"
              type="text"
              value={posSearchQuery}
              onChange={e => setPosSearchQuery(e.target.value)}
              placeholder="جستجوی متنی کالا..."
              className="w-full text-xs pr-7 pl-2.5 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {barcodeAlert && (
          <div className="mb-3 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl border border-red-200/50 text-[11px] font-bold text-center animate-bounce" id="barcode-error-alert">
             بارکد اسکن شده در سیستم یافت نشد! اطلاعات کالا را ابتدا تعریف کنید.
          </div>
        )}

        {/* شبکه کالاها برای ضربه زدن سریع (Quick Action Terminal) */}
        <div className="flex-1 overflow-y-auto" id="terminal-catalogs">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-800 font-medium">
            <span className="flex items-center gap-1.5 font-bold">
              <Grid className="w-4 h-4 text-emerald-500" />
               شبکه دسترسی سریع صندوق‌دار
            </span>
            <span className="text-[10px] text-slate-400">کلیک بر روی هر کالا = افزودن به سبد</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" id="fast-items-pos-grid">
            {searchFilteredProducts.map(p => {
              const isOutOfStock = p.stock_quantity <= 0;
              return (
                <button
                  key={p.id}
                  id={`quick-tap-${p.id}`}
                  onClick={() => !isOutOfStock && addToCartFromProduct(p)}
                  disabled={isOutOfStock}
                  className={`p-3 text-right rounded-xl border transition-all duration-200 flex flex-col justify-between h-24 ${
                    isOutOfStock
                      ? 'bg-red-50/10 border-red-100 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-97 cursor-pointer'
                  }`}
                >
                  <div className="w-full">
                    <span className="font-bold text-[11px] text-slate-800 line-clamp-2 leading-tight">{p.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono block mt-1">{p.barcode || 'عام'}</span>
                  </div>
                  
                  <div className="w-full flex justify-between items-center mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[9.5px] font-bold text-emerald-600 font-mono">{formatToman(p.sale_price)}</span>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded ${
                      isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isOutOfStock ? 'ناموجود' : `${p.stock_quantity} ${p.unit}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* خدمات در دسترس سریع */}
          {services.length > 0 && (
            <div className="mt-5" id="fast-services-group">
              <span className="text-[11.5px] font-bold text-slate-500 mb-2 block">خدمات و هزینه‌های بسته‌بندی/تحویل</span>
              <div className="grid grid-cols-2 border-t border-slate-200/50 pt-2 gap-2" id="fast-services-grid">
                {services.map(s => {
                  return (
                    <button
                      key={s.id}
                      id={`quick-srv-${s.id}`}
                      onClick={() => addToCartFromService(s)}
                      className="p-3 text-right bg-indigo-50/20 border border-indigo-100 rounded-xl hover:border-indigo-400 flex flex-col justify-between h-20 transition active:scale-97 cursor-pointer"
                    >
                      <span className="font-bold text-[11px] text-indigo-900">{s.title}</span>
                      <span className="text-[10px] font-bold text-indigo-700 font-mono mt-2">{formatToman(s.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* بخش سمت چپ: سبد خرید و فاکتور ساز نهایی */}
      <div className="w-full lg:w-[50%] bg-white flex flex-col h-full overflow-hidden" id="pos-basket-billing">
        {/* آیتم‌های کارت */}
        <div className="flex-1 overflow-y-auto p-4 border-b border-slate-100" id="cart-items-holder">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3" id="basket-badge-bar">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
               سبد خرید صندوق فروش
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md font-mono">
              تعداد اقلام: {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="h-[75%] flex flex-col justify-center items-center text-slate-400">
              <Barcode className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
              <p className="text-xs font-semibold">سبد صندوق خالی است</p>
              <p className="text-[10px] text-slate-400 mt-1">از اسکن بارکد کالا یا شبکه دسترسی سریع شروع نمایید</p>
            </div>
          ) : (
            <div className="space-y-1.5" id="cart-rows-container">
              {cart.map(item => {
                return (
                  <div
                    key={item.id}
                    id={`cart-row-${item.id}`}
                    className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/40 flex justify-between items-center transition"
                  >
                    <div className="flex-1 pr-1">
                      <h5 className="font-bold text-xs text-slate-800 leading-snug">{item.title}</h5>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        واحد: {formatToman(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {/* دکمه‌های کنترل تعداد */}
                      <div className="flex items-center bg-white border border-slate-200/80 rounded-lg p-0.5 overflow-hidden">
                        <button
                          id={`qty-plus-${item.id}`}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 px-1.5 hover:bg-slate-50 text-slate-600 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-slate-800">{item.quantity}</span>
                        <button
                          id={`qty-minus-${item.id}`}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 px-1.5 hover:bg-slate-50 text-slate-600 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-left w-24">
                        <span className="text-xs font-bold font-mono text-slate-800 block">
                          {formatToman(item.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        id={`cart-del-${item.id}`}
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.8 h-3.8" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* خلاصه حساب، تخفیف، انتخاب نوع تسویه و باقی‌مانده نقدی */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100" id="checkout-calculations-pos">
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">تخفیف دستی روی جمع کل فاکتور:</span>
              <input
                id="pos-discount"
                type="number"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-left"
                placeholder="تخفیف (به تومان)"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">مبلغ دریافتی جهت محاسبه باقی‌مانده:</span>
              <input
                id="pos-amount-received"
                type="number"
                value={amountReceived || ''}
                onChange={e => setAmountReceived(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-left text-emerald-600 font-bold"
                placeholder="دریافتی از مشتری"
              />
            </div>
          </div>

          {/* تب متد پرداخت */}
          <div className="mb-4">
            <span className="text-[10px] text-slate-400 block mb-1">درگاه دریافت مالی:</span>
            <div className="flex gap-2" id="pos-payment-toggles">
              <button
                id="pay-pos-mode"
                type="button"
                onClick={() => setPaymentMethod('POS')}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'POS'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                پوز کارتخوان
              </button>
              <button
                id="pay-cash-mode"
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                وجه نقد (صندوق)
              </button>
            </div>
          </div>

          {/* رسید برآورد تراز خرده */}
          <div className="space-y-1.5 py-3 border-t border-slate-200 text-xs mb-3 font-medium">
            <div className="flex justify-between items-center text-slate-500">
              <span>خلاصه فاکتور:</span>
              <span className="font-mono">{formatToman(totalBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>تخفیف کسر شده:</span>
              <span className="text-red-500 font-mono font-bold">-{formatToman(discountAmount)}</span>
            </div>
            {amountReceived > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>تغییر باقیمانده بازگشت به مشتری:</span>
                <span className="text-indigo-600 font-mono font-bold">{formatToman(changeReturnAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-800 text-sm font-bold pt-1">
              <span>مبلغ پرداختی نهایی فاکتور سریع:</span>
              <span className="text-emerald-600 text-lg font-mono font-extrabold">{formatToman(finalTotalToPay)}</span>
            </div>
          </div>

          <button
            id="pos-submit-invoice"
            type="button"
            disabled={cart.length === 0}
            onClick={handleCheckoutPOS}
            className="w-full text-xs font-bold py-3 px-4 rounded-xl shadow-md text-white transition-all bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
             ثبت و تسویه نهایی فاکتور سریع
          </button>
        </div>
      </div>

      {/* مودال نمایش رسید مشتری پس از فروش موفق */}
      {showReceiptModal && lastInvoiceReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" id="receipt-modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-xl" id="printable-paper-view">
            {/* سربرگ کاغذ حرارتی فاکتور */}
            <div className="bg-slate-50 border-b border-dashed border-slate-200 p-5 text-center relative flex flex-col items-center justify-center" id="receipt-paper-header">
              {SettingsService.get().storeLogo && (
                <img src={SettingsService.get().storeLogo} alt="Store Logo" className="w-10 h-10 object-contain mb-2 bg-white p-0.5 border border-slate-200 rounded-lg" />
              )}
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">فروش سریع موفق</span>
              <h2 className="font-bold text-xs text-slate-800 mt-2">{SettingsService.get().storeName || 'رسید چاپی صندوق فروشگاه آریا'}</h2>
              <p className="text-[9px] text-slate-400 mt-1">تراکنش ۱۰۰٪ آفلاین - شبیه‌ساز پرینتر بستر حرارتی</p>
              
              <div className="absolute left-3 top-3">
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-900 text-xs"
                >
                  بستن (X)
                </button>
              </div>
            </div>

            {/* بدنه فاکتور */}
            <div className="p-5 space-y-4 text-xs font-mono select-text" id="receipt-paper-body">
              <div className="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-100">
                <span>شماره فاکتور: {lastInvoiceReceipt.invoice.invoice_number}</span>
                <span>تاریخ: {new Date(lastInvoiceReceipt.invoice.created_at).toLocaleTimeString('fa-IR')}</span>
              </div>

              {/* آیتم‌ها */}
              <div className="space-y-2 border-b border-dashed border-slate-200 pb-3" id="receipt-paper-items">
                {lastInvoiceReceipt.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[10.5px]">
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className="text-[9px] text-slate-400 block">{item.quantity} عدد × {formatToman(item.price)}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatToman(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* محاسبات */}
              <div className="space-y-1.5 text-[11px] pb-2 border-b border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">جمع ناخالص کالا:</span>
                  <span>{formatToman(lastInvoiceReceipt.invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-red-500 font-bold">
                  <span>تخفیف فاکتور:</span>
                  <span>-{formatToman(lastInvoiceReceipt.invoice.discount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-50 font-extrabold text-sm text-slate-900">
                  <span>مبلغ دریافت شده:</span>
                  <span>{formatToman(lastInvoiceReceipt.invoice.final_amount)}</span>
                </div>
              </div>

              {/* تشکر */}
              <div className="text-center space-y-1 text-slate-400 text-[10px]">
                <p>درگاه دریافت وجه: {lastInvoiceReceipt.invoice.payment_method === 'POS' ? 'کارتخوان صادر شده' : 'نقدی صندوقدار'}</p>
                <p className="font-sans">با تشکر از اعتماد و خرید شما</p>
              </div>

              {/* شبیه‌ساز بارکدخوان پایین رسید */}
              <div className="bg-slate-100 py-1.5 rounded-lg flex flex-col items-center justify-center gap-1">
                <Barcode className="w-24 h-6 text-slate-700" />
                <span className="text-[8px] text-slate-400">{lastInvoiceReceipt.invoice.id}</span>
              </div>
            </div>

            {/* دکمه چاپ فاکتور */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 no-print">
              <button
                id="print-fake-receipt"
                onClick={() => {
                  const appSettings = SettingsService.get();
                  const printerText = appSettings.defaultPrinter ? `چاپگر ${appSettings.defaultPrinter}` : 'چاپگر پیش‌فرض سیستم';
                  alert(`سند فروش سریع فاکتور #${lastInvoiceReceipt.invoice.invoice_number} با موفقیت صادر گردید.\nتصویر این فیش به فیش‌پرینتر حرارتی ۸۰ میلی‌متری متصل به ${printerText} ارسال گردید.`);
                  window.print();
                }}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-700"
              >
                <Printer className="w-3.5 h-3.5" />
                چاپ برگه (Thermal 80mm)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
