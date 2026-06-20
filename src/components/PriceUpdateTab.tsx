import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/settings';
import { OfflineDatabase } from '../db/offlineDb';
import { Product } from '../types';
import { 
  TrendingUp, 
  Search, 
  Check, 
  RefreshCw, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Coins, 
  SlidersHorizontal,
  Layers,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function PriceUpdateTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'out' | 'low'>('all');
  const [marginFilter, setMarginFilter] = useState<'all' | 'negative' | 'positive'>('all');

  // Inline edits cache: { [productId]: { purchase_price?: number, sale_price?: number } }
  const [editedPrices, setEditedPrices] = useState<Record<string, { purchase_price: number; sale_price: number }>>({});

  // Bulk Operations variables
  const [targetField, setTargetField] = useState<'sale_price' | 'purchase_price'>('sale_price');
  const [opType, setOpType] = useState<'increase' | 'decrease' | 'set_from_opposite'>('increase');
  const [calcMethod, setCalcMethod] = useState<'percent' | 'flat'>('percent');
  const [modifierValue, setModifierValue] = useState<number>(10);
  const [roundingNearest, setRoundingNearest] = useState<number>(1000); // 0, 500, 1000, 5000, 10000

  // Opposite source configuration (only if opType is set_from_opposite)
  // E.g. Sale Price = Purchase Price + (15% or 5,000 Toman)
  const [oppositeBase, setOppositeBase] = useState<'purchase_price' | 'sale_price'>('purchase_price');

  // Interactive feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = () => {
    const list = OfflineDatabase.getProducts();
    setProducts(list);
    setEditedPrices({});
    setSelectedProductIds([]);
  };

  // Toman custom helper
  const formatToman = (val: number) => {
    return formatPrice(val);
  };

  // Profit Margin calculation
  const getMargin = (purchase: number, sale: number) => {
    if (sale <= 0) return 0;
    return Math.round(((sale - purchase) / sale) * 100);
  };

  // Multi-select actions
  const toggleSelectAll = (visibleProducts: Product[]) => {
    const visibleIds = visibleProducts.map(p => p.id);
    const areAllSelected = visibleIds.every(id => selectedProductIds.includes(id));
    
    if (areAllSelected) {
      // Unselect only those currently visible
      setSelectedProductIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedProductIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handlers for keyboard/manual inline modifications
  const handleInlineChange = (productId: string, field: 'purchase_price' | 'sale_price', value: string) => {
    const num = Number(value.replace(/[^0-9]/g, '')) || 0;
    const baseProduct = products.find(p => p.id === productId);
    if (!baseProduct) return;

    setEditedPrices(prev => {
      const current = prev[productId] || { 
        purchase_price: baseProduct.purchase_price, 
        sale_price: baseProduct.sale_price 
      };
      
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: num
        }
      };
    });
  };

  // Restore individual product inline change
  const handleResetRow = (productId: string) => {
    setEditedPrices(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Safe individual product price save
  const handleSaveRow = (productId: string) => {
    const baseProduct = products.find(p => p.id === productId);
    const edits = editedPrices[productId];
    if (!baseProduct || !edits) return;

    const updated: Product = {
      ...baseProduct,
      purchase_price: edits.purchase_price,
      sale_price: edits.sale_price
    };

    OfflineDatabase.saveProduct(updated);
    
    // Update local products list
    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
    setEditedPrices(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });

    showFeedback('قیمت محصول به صورت تکی با موفقیت ویرایش شد.');
  };

  const showFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4500);
  };

  // Filters query logic
  const filteredProducts = products.filter(p => {
    // Search query match
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery);
    
    // Stock quantity filter
    let matchesStock = true;
    if (stockFilter === 'instock') matchesStock = p.stock_quantity > 0;
    else if (stockFilter === 'out') matchesStock = p.stock_quantity <= 0;
    else if (stockFilter === 'low') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 10;

    // Margin evaluation
    let matchesMargin = true;
    const currentPurchase = editedPrices[p.id]?.purchase_price !== undefined ? editedPrices[p.id].purchase_price : p.purchase_price;
    const currentSale = editedPrices[p.id]?.sale_price !== undefined ? editedPrices[p.id].sale_price : p.sale_price;
    const currentMargin = getMargin(currentPurchase, currentSale);

    if (marginFilter === 'negative') matchesMargin = currentMargin < 0;
    else if (marginFilter === 'positive') matchesMargin = currentMargin >= 0;

    return matchesSearch && matchesStock && matchesMargin;
  });

  // MASS BULK PRICE UPDATER
  const executeMassPriceAction = (scope: 'selected' | 'filtered' | 'all') => {
    // 1. Identify which products are target keys
    let targets: Product[] = [];
    if (scope === 'all') {
      targets = products;
    } else if (scope === 'filtered') {
      targets = filteredProducts;
    } else if (scope === 'selected') {
      targets = products.filter(p => selectedProductIds.includes(p.id));
    }

    if (targets.length === 0) {
      alert('هیچ کالایی برای بروزرسانی قیمت گروهی یافت نشد.');
      return;
    }

    const confirmMsg = `آیا مایلید قیمت ${targets.length} کالا را طبق استراتژی انتخاب شده بروزرسانی کنید؟`;
    if (!confirm(confirmMsg)) return;

    // Step by step transformation
    targets.forEach(product => {
      let currentVal = targetField === 'sale_price' ? product.sale_price : product.purchase_price;
      let computedNewVal = currentVal;

      if (opType === 'increase' || opType === 'decrease') {
        const factor = opType === 'increase' ? 1 : -1;
        if (calcMethod === 'percent') {
          computedNewVal = currentVal + (currentVal * (modifierValue / 100) * factor);
        } else {
          computedNewVal = currentVal + (modifierValue * factor);
        }
      } else if (opType === 'set_from_opposite') {
        // e.g. set sale_price relative to purchase_price
        const oppositeVal = targetField === 'sale_price' ? product.purchase_price : product.sale_price;
        if (calcMethod === 'percent') {
          // multiplier addition
          computedNewVal = oppositeVal + (oppositeVal * (modifierValue / 100));
        } else {
          computedNewVal = oppositeVal + modifierValue;
        }
      }

      // Rounding mechanism
      if (roundingNearest > 0) {
        computedNewVal = Math.round(computedNewVal / roundingNearest) * roundingNearest;
      }

      // Ensure never negative
      if (computedNewVal < 0) computedNewVal = 0;

      // Save using saveProduct
      const updatedProduct: Product = {
        ...product,
        [targetField]: computedNewVal
      };

      OfflineDatabase.saveProduct(updatedProduct);
    });

    // Final cleanups and fresh reload
    refreshProducts();
    showFeedback(`تعداد ${targets.length} محصول با موفقیت بصورت سراسری بروزرسانی شدند.`);
  };

  // Direct massive submission of individual changes
  const saveAllDirtyRows = () => {
    const dirtyIds = Object.keys(editedPrices);
    if (dirtyIds.length === 0) return;

    dirtyIds.forEach(id => {
      const baseProduct = products.find(p => p.id === id);
      const edits = editedPrices[id];
      if (baseProduct && edits) {
        OfflineDatabase.saveProduct({
          ...baseProduct,
          purchase_price: edits.purchase_price,
          sale_price: edits.sale_price
        });
      }
    });

    refreshProducts();
    showFeedback(`کلیه تصحیحات دستی ردیف‌ها با موفقیت ثبت نهایی گردید.`);
  };

  // Statistic summaries
  const totalProductsCount = products.length;
  const averageSalePrice = products.length > 0 ? Math.round(products.reduce((acc, curr) => acc + curr.sale_price, 0) / products.length) : 0;
  const averagePurchasePrice = products.length > 0 ? Math.round(products.reduce((acc, curr) => acc + curr.purchase_price, 0) / products.length) : 0;
  const negativeMarginProductsCount = products.filter(p => getMargin(p.purchase_price, p.sale_price) < 0).length;

  return (
    <div className="p-6 flex flex-col gap-6 h-[calc(100vh-64px)] overflow-y-auto" id="price-update-tab-root" dir="rtl">
      
      {/* هدر فوق پیشرفته و جامع ماژول */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/50" id="advanced-price-module-header">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <TrendingUp className="w-6 h-6" />
              </span>
              <h1 className="text-xl font-black tracking-tight text-white">سامانه هوشمند بروزرسانی قیمت و ارزش‌افزوده کالا</h1>
            </div>
            <p className="text-xs text-slate-300">اصلاح گروهی و کالبدشکافی زنده نرخ فروش کالاها بر مبنای حاشیه سود و بهای خرید ارزی-ریالی</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button
              id="refresh-prices-btn"
              onClick={refreshProducts}
              className="px-3.5 py-2 hover:bg-slate-800/80 bg-slate-800/40 text-slate-300 hover:text-white border border-slate-700/60 transition-all rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازخوانی مجدد</span>
            </button>
            {Object.keys(editedPrices).length > 0 && (
              <button
                id="save-all-dirty-prices"
                onClick={saveAllDirtyRows}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg rounded-xl text-xs flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Save className="w-4 h-4" />
                <span>ثبت کلیه تغییرات دستی ({Object.keys(editedPrices).length} کالا)</span>
              </button>
            )}
          </div>
        </div>

        {/* سه باکس وضعیت تفکیکی اطلاعات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6" id="price-stats-bento">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">کل کالاهای ثبت شده</span>
              <strong className="text-lg font-black text-white">{totalProductsCount.toLocaleString('fa-IR')} کالا</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-700/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">میانگین قیمت فروش کالا</span>
              <strong className="text-lg font-black text-emerald-400">{formatToman(averageSalePrice)}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-700/30 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">میانگین بهای خرید</span>
              <strong className="text-lg font-black text-indigo-300">{formatToman(averagePurchasePrice)}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-700/30 text-indigo-300">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">کالاهای با حاشیه سود منفی</span>
              <strong className={`text-lg font-black ${negativeMarginProductsCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {negativeMarginProductsCount.toLocaleString('fa-IR')} ردیف
              </strong>
            </div>
            <div className={`p-2 rounded-lg bg-slate-700/30 ${negativeMarginProductsCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm" id="price-action-toast">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* بخش عملیات محاسباتی گروهی فشرده و بهینه (Bulk Pricing Operations Wizard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="bulk-update-wizard-panel">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-800">پنل هماهنگ‌ساز و بروزرسانی هوشمند دسته‌جمعی قیمتها</h2>
        </div>
        
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <div className="lg:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* انتخاب فیلد هدف */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold block">مورد جهت بروزرسانی:</label>
              <select
                id="select-target-field"
                value={targetField}
                onChange={(e: any) => setTargetField(e.target.value)}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="sale_price">قیمت فروش (قیمت نهایی مصرف‌کننده)</option>
                <option value="purchase_price">قیمت خرید (قیمت برای مغازه)</option>
              </select>
            </div>

            {/* شیوه تغییر */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold block">مکانیزم قیمت‌گذاری:</label>
              <select
                id="select-op-type"
                value={opType}
                onChange={(e: any) => setOpType(e.target.value)}
                className="w-full text-xs font-mono rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="increase">افزایش قیمت (گران کردن)</option>
                <option value="decrease">کاهش قیمت (تخفیف کلی)</option>
                <option value="set_from_opposite">تراز بر مبنای حاشیه سود (فرمول متمم)</option>
              </select>
            </div>

            {/* سنجه محاسباتی */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold block">واحد محاسباتی تغییر:</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  id="calc-method-percent-btn"
                  onClick={() => setCalcMethod('percent')}
                  className={`py-1 text-[10px] font-bold rounded-md transition-all ${calcMethod === 'percent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  درصدی (٪)
                </button>
                <button
                  type="button"
                  id="calc-method-flat-btn"
                  onClick={() => setCalcMethod('flat')}
                  className={`py-1 text-[10px] font-bold rounded-md transition-all ${calcMethod === 'flat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ثابت (تومان)
                </button>
              </div>
            </div>

            {/* مقدار اعمالی و گرد کردن در یک ردیف مجتمع */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold block">
                  {calcMethod === 'percent' ? 'درصد یا سود (٪)' : 'مبلغ تغییر (تومان)'}:
                </label>
                <input
                  type="number"
                  id="modifier-value-input"
                  value={modifierValue}
                  onChange={(e) => setModifierValue(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-center font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold block">گرد کردن ارقام به:</label>
                <select
                  id="select-rounding-nearest"
                  value={roundingNearest}
                  onChange={(e) => setRoundingNearest(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                >
                  <option value={0}>بدون گرد کردن</option>
                  <option value={500}>به ۵۰۰ تومان</option>
                  <option value={1000}>به ۱,۰۰۰ تومان</option>
                  <option value={5000}>به ۵,۰۰۰ تومان</option>
                  <option value={10000}>به ۱۰,۰۰۰ تومان</option>
                </select>
              </div>
            </div>

          </div>

          <div className="lg:col-span-2 flex flex-col justify-end gap-1.5">
            {/* دکمه‌های اجرای سراسری بر حسب حیطه‌های مختلف */}
            <div className="group relative">
              <button
                type="button"
                id="apply-all-products-btn"
                onClick={() => executeMassPriceAction('all')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>اعمال روی کل کالاها</span>
                <span className="text-[10px] font-normal opacity-80">({products.length})</span>
              </button>
            </div>

            {selectedProductIds.length > 0 && (
              <button
                type="button"
                id="apply-selected-products-btn"
                onClick={() => executeMassPriceAction('selected')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>اعمال روی انتخاب شده‌ها</span>
                <span className="text-[10px] font-normal opacity-85">({selectedProductIds.length})</span>
              </button>
            )}

            {searchQuery && filteredProducts.length !== products.length && (
              <button
                type="button"
                id="apply-filtered-products-btn"
                onClick={() => executeMassPriceAction('filtered')}
                className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>اعمال روی فیلتر شده‌ها</span>
                <span className="text-[10px] font-normal opacity-85">({filteredProducts.length})</span>
              </button>
            )}
          </div>

        </div>

        {/* توضیح برای فرمول تراز سود (set_from_opposite) */}
        {opType === 'set_from_opposite' && (
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-xs text-slate-600 flex items-start gap-1.5" id="opposite-formula-help">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">توضیح فرمول تراز سود:</span> قیمت 
              <span className="px-1 text-indigo-600 font-bold underline">{targetField === 'sale_price' ? 'فروش' : 'خرید'}</span> شما مستقیماً بر مبنای قیمت 
              <span className="px-1 text-slate-700 font-bold">{targetField === 'sale_price' ? 'خرید' : 'فروش'}</span> محصول محاسبه خواهد شد. 
              {calcMethod === 'percent' ? (
                <span> هر کالا بازنویسی می‌شود به: قیمتی متمم به علاوه <strong className="text-slate-800">{modifierValue} درصد</strong> آن.</span>
              ) : (
                <span> هر کالا بازنویسی می‌شود به: قیمتی متمم به علاوه <strong className="text-slate-800">{formatToman(modifierValue)}</strong> سود خالص.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* بدنه جدول لیست محصولات، فیلتر و جستجوی پیشرفته */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1" id="pricing-core-list-table">
        
        {/* نوار جستجوی پیشرفته و انواع فیلترها */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center" id="table-filter-toolbar">
          
          <div className="w-full md:w-1/3 relative">
            <input
              type="text"
              id="search-price-products"
              placeholder="جستجوی نام کالا یا بارکد فیزیکی برای تغییر قیمت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-10 py-2 bg-white text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          <div className="w-full md:w-auto flex flex-wrap gap-2 items-center">
            
            {/* فیلتر وضعیت موجودی */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5" id="stock-quantity-filters">
              <button
                type="button"
                id="stock-filter-all"
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stockFilter === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                موجودی (همه)
              </button>
              <button
                type="button"
                id="stock-filter-instock"
                onClick={() => setStockFilter('instock')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stockFilter === 'instock' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                موجود در انبار
              </button>
              <button
                type="button"
                id="stock-filter-low"
                onClick={() => setStockFilter('low')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stockFilter === 'low' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                رو به اتمام (کمتر از ۱۰)
              </button>
              <button
                type="button"
                id="stock-filter-out"
                onClick={() => setStockFilter('out')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stockFilter === 'out' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                ناموجود فیزیکی
              </button>
            </div>

            {/* فیلتر حاشیه سود تولیدی */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5" id="profit-margin-filters">
              <button
                type="button"
                id="margin-filter-all"
                onClick={() => setMarginFilter('all')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${marginFilter === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                سود (همه)
              </button>
              <button
                type="button"
                id="margin-filter-positive"
                onClick={() => setMarginFilter('positive')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${marginFilter === 'positive' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                حاشیه سود مثبت
              </button>
              <button
                type="button"
                id="margin-filter-negative"
                onClick={() => setMarginFilter('negative')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${marginFilter === 'negative' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                ضررانباشته / منفی
              </button>
            </div>

          </div>

        </div>

        {/* لیست محصولات درون جدول */}
        <div className="overflow-x-auto flex-1 max-h-[500px]" id="pricing-rows-table-scroller">
          <table className="w-full text-right border-collapse" id="products-internal-table">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs text-slate-700 font-bold">
                <th className="p-3 w-12 text-center">
                  <button
                    type="button"
                    id="checkbox-th-toggle"
                    onClick={() => toggleSelectAll(filteredProducts)}
                    className="p-1 rounded bg-slate-200 hover:bg-slate-300 transition-colors"
                  >
                    {filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id)) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3">کد / بارکد</th>
                <th className="p-3">عنوان محصول</th>
                <th className="p-3 text-center">موجودی انبار</th>
                <th className="p-3 w-48">قیمت خرید (تومان)</th>
                <th className="p-3 w-48">قیمت فروش (تومان)</th>
                <th className="p-3 text-center w-28">حاشیه سود فعلی</th>
                <th className="p-3 text-center w-36">علمیات تک کاره</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-bold text-xs bg-slate-50">
                    موردی یافت نشد؛ فیلترها را بررسی یا محصولی جدید اضافه کنید.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 10;
                  const isOutOfStock = p.stock_quantity <= 0;

                  // Evaluate current pricing based on initial item vs cached inline edits
                  const currentPurchase = editedPrices[p.id]?.purchase_price !== undefined 
                    ? editedPrices[p.id].purchase_price 
                    : p.purchase_price;
                    
                  const currentSale = editedPrices[p.id]?.sale_price !== undefined 
                    ? editedPrices[p.id].sale_price 
                    : p.sale_price;

                  const marginVal = getMargin(currentPurchase, currentSale);
                  const isDirty = editedPrices[p.id] !== undefined;

                  return (
                    <tr 
                      key={p.id}
                      className={`border-b border-slate-100 text-xs hover:bg-slate-50 transition ${isDirty ? 'bg-yellow-50/50' : ''} ${isSelected ? 'bg-indigo-50/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          id={`select-row-${p.id}`}
                          onClick={() => toggleSelectProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Barcode */}
                      <td className="p-3 font-mono text-slate-600 font-semibold">{p.barcode || '—'}</td>

                      {/* Title */}
                      <td className="p-3 font-semibold text-slate-800">
                        {p.title}
                        {isDirty && (
                          <span className="mr-2 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold text-[9px]">
                            تغییر کانونی ثبت نشده
                          </span>
                        )}
                      </td>

                      {/* Stock levels */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-center rounded-full text-[10px] font-bold ${
                          isOutOfStock 
                            ? 'bg-rose-100 text-rose-700' 
                            : isLowStock 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock_quantity.toLocaleString('fa-IR')} {p.unit}
                        </span>
                      </td>

                      {/* Inline Purchase price */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            id={`col-purchase-${p.id}`}
                            value={currentPurchase === 0 ? '' : currentPurchase.toLocaleString('fa-IR')}
                            onChange={(e) => handleInlineChange(p.id, 'purchase_price', e.target.value)}
                            className="w-full text-left font-mono font-bold border border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 bg-white text-xs max-w-[140px]"
                            placeholder="خرید (تومان)"
                          />
                          <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                        </div>
                      </td>

                      {/* Inline Sale price */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            id={`col-sale-${p.id}`}
                            value={currentSale === 0 ? '' : currentSale.toLocaleString('fa-IR')}
                            onChange={(e) => handleInlineChange(p.id, 'sale_price', e.target.value)}
                            className="w-full text-left font-mono font-bold border border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 bg-white text-xs max-w-[140px]"
                            placeholder="فروش (تومان)"
                          />
                          <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                        </div>
                      </td>

                      {/* Margin estimation info badge */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-0.5 ${
                          marginVal < 0 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : marginVal < 15 
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {marginVal < 0 ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>{marginVal.toLocaleString('fa-IR')}٪</span>
                        </span>
                      </td>

                      {/* Single action save & reset */}
                      <td className="p-3 text-center">
                        {isDirty ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              id={`save-btn-${p.id}`}
                              onClick={() => handleSaveRow(p.id)}
                              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              title="ذخیره قیمت جدید"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ذخیره</span>
                            </button>
                            <button
                              type="button"
                              id={`reset-btn-${p.id}`}
                              onClick={() => handleResetRow(p.id)}
                              className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                              title="لغو تغییرات"
                            >
                              بازنشانی
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">بدون تغییر</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ساب‌هدر راهنما  */}
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>می‌توانید کادرهای قیمت را تغییر دهید، سیستم ردیف تغییر یافته را به رنگ زرد درآورده و آماده ذخیره می‌سازد.</span>
          </div>

          <div className="flex items-center gap-3">
            <span>در حال نمایش: <strong>{filteredProducts.length.toLocaleString('fa-IR')} کالا</strong></span>
            {selectedProductIds.length > 0 && (
              <span className="text-indigo-600 font-bold">انتخاب شده جهت بروزرسانی گروهی: {selectedProductIds.length.toLocaleString('fa-IR')} ردیف</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
