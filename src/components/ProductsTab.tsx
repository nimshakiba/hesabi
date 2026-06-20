import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Service, Category, Brand, Warehouse } from '../types';
import { 
  Package, Clock, Tag, Barcode, TrendingUp, DollarSign, Check, X, Sparkles, 
  Image as ImageIcon, Plus, HelpCircle, AlertTriangle, ChevronDown, CheckCircle2, 
  RefreshCw, Code2, Search, Warehouse as WarehouseIcon, Percent, Layers
} from 'lucide-react';
import { SettingsService, formatPrice } from '../utils/settings';
import Swal from 'sweetalert2';

export default function ProductsTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [activeFormTab, setActiveFormTab] = useState<'product' | 'service'>('product');

  // Dynamic currency label from global settings
  const [currencyLabel, setCurrencyLabel] = useState('تومان');

  useEffect(() => {
    const updateCurrency = () => {
      const settings = SettingsService.get();
      setCurrencyLabel(settings.currency === 'Rial' ? 'ریال' : 'تومان');
    };
    updateCurrency();
    window.addEventListener('cofeclick_settings_updated', updateCurrency);
    return () => window.removeEventListener('cofeclick_settings_updated', updateCurrency);
  }, []);

  // JSON Import Panel State
  const [isJsonPanelOpen, setIsJsonPanelOpen] = useState(false);

  const handleCopyJsonTemplate = () => {
    const template = {
      title: "موس تسکو مدل 7965",
      barcode: "6260150927965",
      brand: "TSCO - تسکو",
      sku: "TSCO-7965",
      purchasePrice: 120000,
      salePrice: 150000,
      stockQuantity: 20,
      unit: "عدد",
      minStock: 5,
      maxStock: 100,
      dimensions: "115x62x37 میلیمتر",
      description: "موس گیمینگ ارگونومیک برند معتبر تسکو با گارانتی ۱۲ ماهه توسن سیستم.",
      image: ""
    };
    setJsonInput(JSON.stringify(template, null, 2));
    Swal.fire({
      title: 'قالب نمونه بارگذاری شد',
      text: 'قالب نمونه JSON در کادر متنی درج شد. می‌توانید فیلدهای آن را ویرایش نموده و دکمه اعمال را بزنید.',
      icon: 'success',
      confirmButtonText: 'عالی'
    });
  };

  const handleApplyJson = () => {
    if (!jsonInput.trim()) {
      Swal.fire({
        title: 'خطای فرمت',
        text: 'کادر متنی مربوط به کد JSON خالی است.',
        icon: 'error',
        confirmButtonText: 'تصحیح'
      });
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (parsed.title) setTitle(parsed.title);
      if (parsed.barcode) setBarcode(parsed.barcode);
      if (parsed.brand) setBrand(parsed.brand);
      if (parsed.sku) setSku(parsed.sku);
      if (parsed.purchasePrice !== undefined) setPurchasePrice(parsed.purchasePrice.toString());
      if (parsed.salePrice !== undefined) setSalePrice(parsed.salePrice.toString());
      if (parsed.stockQuantity !== undefined) setStockQuantity(parsed.stockQuantity.toString());
      if (parsed.unit) setUnit(parsed.unit);
      if (parsed.minStock !== undefined) setMinStock(parsed.minStock.toString());
      if (parsed.maxStock !== undefined) setMaxStock(parsed.maxStock.toString());
      if (parsed.dimensions) setDimensions(parsed.dimensions);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.image) setImage(parsed.image);
      if (parsed.categoryId) setCategoryId(parsed.categoryId);
      if (parsed.warehouseStocks) setWarehouseStocks(parsed.warehouseStocks);

      Swal.fire({
        title: 'درج موفق اطلاعات JSON',
        text: 'تمامی فیلدهای فرم افزودن کالا بر اساس مشخصات JSON ورودی با موفقیت پر شدند!',
        icon: 'success',
        confirmButtonText: 'مشاهده فرم'
      });
      setIsJsonPanelOpen(false);
    } catch (err: any) {
      Swal.fire({
        title: 'خطا در ساختار JSON',
        text: 'کد وارد شده یک JSON معتبر نیست. لطفاً کاماها و گیومه‌ها را بررسی کنید. خطا: ' + err.message,
        icon: 'error',
        confirmButtonText: 'بررسی مجدد'
      });
    }
  };

  // product form state
  const [title, setTitle] = useState('');
  const [barcode, setBarcode] = useState('');
  const [barcodeStore, setBarcodeStore] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [unit, setUnit] = useState('عدد');
  const [minStock, setMinStock] = useState<string>('5');
  const [maxStock, setMaxStock] = useState<string>('150');
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      Swal.fire({
        title: 'خطای حجم فایل',
        text: 'حداکثر حجم مجاز تصویر محصول ۲ مگابایت می‌باشد.',
        icon: 'warning',
        confirmButtonText: 'متوجه شدم'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, number>>({});
  
  // service form state
  const [srvTitle, setSrvTitle] = useState('');
  const [srvPrice, setSrvPrice] = useState<string>('');
  const [srvDuration, setSrvDuration] = useState<string>('30');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvCategoryId, setSrvCategoryId] = useState('');
  const [srvImage, setSrvImage] = useState('');

  // state of selections & UI helpers
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isBrandSelectOpen, setIsBrandSelectOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [targetProfitPercent, setTargetProfitPercent] = useState<string>('');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Brand adding helper
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState('');

  useEffect(() => {
    loadData();
    generateDefaultCodes();
  }, []);

  const generateDefaultCodes = () => {
    const rand = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcodeStore('900' + rand.substring(0, 10));

    try {
      const s = SettingsService.get();
      if (s && s.productPrefix) {
        setSku(`${s.productPrefix}${s.productNextNumber || 1001}`);
      }
    } catch (e) {}
  };

  const loadData = () => {
    setCategories(OfflineDatabase.getCategories());
    setWarehouses(OfflineDatabase.getWarehouses());
    loadBrands();
  };

  const loadBrands = () => {
    const raw = localStorage.getItem('shop_accounting_brands');
    if (raw) {
      try {
        setBrands(JSON.parse(raw));
      } catch (e) {
        setBrands([]);
      }
    } else {
      const defaults: Brand[] = [
        { id: 'b1', name: 'کاله', logoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80' },
        { id: 'b2', name: 'لادن', logoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=150&q=80' },
        { id: 'b3', name: 'گلستان', logoUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=150&q=80' },
        { id: 'b4', name: 'میهن', logoUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=150&q=80' }
      ];
      localStorage.setItem('shop_accounting_brands', JSON.stringify(defaults));
      setBrands(defaults);
    }
  };

  const handleGenerateFactoryBarcode = () => {
    const randDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcode('626' + randDigits.substring(0, 10));
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.barcode) setBarcode(parsed.barcode);
      if (parsed.brand) setBrand(parsed.brand);
      if (parsed.purchase_price) setPurchasePrice(parsed.purchase_price.toString());
      if (parsed.sale_price) setSalePrice(parsed.sale_price.toString());
      if (parsed.stock_quantity) setStockQuantity(parsed.stock_quantity.toString());
      if (parsed.unit) setUnit(parsed.unit);
      if (parsed.min_stock) setMinStock(parsed.min_stock.toString());
      if (parsed.max_stock) setMaxStock(parsed.max_stock.toString());
      if (parsed.dimensions) setDimensions(parsed.dimensions);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.image) setImage(parsed.image);
      
      setIsJsonModalOpen(false);
      setJsonError('');
      
      Swal.fire({
        title: 'همگام‌سازی جادویی انجام شد ✨',
        text: 'داده‌های ساختاریافته روی متغیرهای فرم اعمال شد.',
        icon: 'success',
        confirmButtonText: 'تایید',
        customClass: {
          confirmButton: 'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold'
        },
        buttonsStyling: false
      });
    } catch (e) {
      setJsonError('فرمت متغیرهای ورودی JSON فاقد مشخصات استاندارد کالا است.');
    }
  };

  const handleAddNewBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      Swal.fire({ text: 'نام برند تجاری نمی‌تواند خالی باشد.', icon: 'warning', confirmButtonText: 'اصلاح' });
      return;
    }
    const newB: Brand = {
      id: 'brand_' + Date.now(),
      name: newBrandName.trim(),
      logoUrl: newBrandLogoUrl.trim() || undefined
    };
    const updated = [...brands, newB];
    localStorage.setItem('shop_accounting_brands', JSON.stringify(updated));
    setBrands(updated);
    setBrand(newB.name);
    setNewBrandName('');
    setNewBrandLogoUrl('');
    setIsBrandModalOpen(false);
    
    Swal.fire({
      title: 'برند تجاری جدید اضافه شد 🚀',
      text: `برند «${newB.name}» با موفقیت ثبت و برگزیده شد.`,
      icon: 'success',
      confirmButtonText: 'متوجه شدم',
      customClass: { confirmButton: 'px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-bold font-sans' },
      buttonsStyling: false
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      Swal.fire({
        title: 'فیلد الزامی پر نشده است ⚠️',
        text: 'لطفاً «نام یا عنوان تفصیلی کالا» را وارد نمایید.',
        icon: 'error',
        confirmButtonText: 'ورود اطلاعات',
        customClass: { confirmButton: 'px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold' },
        buttonsStyling: false
      }).then(() => {
        document.getElementById('product-title-input')?.focus();
      });
      return;
    }

    if (!purchasePrice || Number(purchasePrice) <= 0) {
      Swal.fire({
        title: 'فیلد الزامی پر نشده است ⚠️',
        text: 'مبلغ «قیمت خرید کالا» وارد نشده یا نامعتبر است.',
        icon: 'error',
        confirmButtonText: 'ورود اطلاعات',
        customClass: { confirmButton: 'px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold' },
        buttonsStyling: false
      }).then(() => {
        document.getElementById('purchase-price-input')?.focus();
      });
      return;
    }

    if (!salePrice || Number(salePrice) <= 0) {
      Swal.fire({
        title: 'فیلد الزامی پر نشده است ⚠️',
        text: 'مبلغ «قیمت فروش مصوب» وارد نشده یا نامعتبر است.',
        icon: 'error',
        confirmButtonText: 'ورود اطلاعات',
        customClass: { confirmButton: 'px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold' },
        buttonsStyling: false
      }).then(() => {
        document.getElementById('sale-price-input')?.focus();
      });
      return;
    }

    // Calculate warehouse allocation
    const stockValues = Object.values(warehouseStocks) as number[];
    const hasWarehouseValues = stockValues.some(v => (Number(v) || 0) > 0);
    const totalWarehouseStock = stockValues.reduce((sum, current) => (Number(sum) || 0) + (Number(current) || 0), 0);
    const finalStockQty = hasWarehouseValues ? totalWarehouseStock : (Number(stockQuantity) || 0);

    const payload: Omit<Product, 'id'> = {
      title: title.trim(),
      barcode: barcode.trim(),
      barcode_store: barcodeStore.trim(),
      brand: brand.trim() || undefined,
      sku: sku.trim() || undefined,
      purchase_price: Number(purchasePrice) || 0,
      sale_price: Number(salePrice) || 0,
      stock_quantity: finalStockQty,
      warehouse_stocks: warehouseStocks,
      unit: unit || 'عدد',
      min_stock: Number(minStock) || 5,
      max_stock: Number(maxStock) || 150,
      dimensions: dimensions.trim() || undefined,
      category_id: categoryId || undefined,
      description: description.trim() || undefined,
      image: image.trim() || undefined
    };

    OfflineDatabase.saveProduct(payload as any);

    // sequential SKU stepping
    try {
      const s = SettingsService.get();
      if (s && s.productPrefix && sku.startsWith(s.productPrefix)) {
        const numPart = sku.replace(s.productPrefix, '');
        const num = Number(numPart);
        if (!isNaN(num) && num === s.productNextNumber) {
          s.productNextNumber = s.productNextNumber + 1;
          SettingsService.save(s);
        }
      }
    } catch (e) {}

    Swal.fire({
      title: 'محصول با موفقیت ثبت شد 🎉',
      html: `<div class="text-right text-xs leading-relaxed space-y-1 font-sans">
              <p>کالای تفصیلی <b>«${title.trim()}»</b> با موفقیت ثبت گردید.</p>
              <p>ماده فیزیکی کل: <b>${finalStockQty} ${unit}</b></p>
              <p>بارکد شناسایی مغازه: <span class="font-mono text-indigo-700 font-bold">${barcodeStore}</span></p>
             </div>`,
      icon: 'success',
      confirmButtonText: 'بسیار عالی',
      customClass: {
        confirmButton: 'px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition',
        popup: 'rounded-3xl border border-slate-200 shadow-2xl p-6 font-sans'
      },
      buttonsStyling: false
    });

    clearProductForm();
    generateDefaultCodes();
  };

  const clearProductForm = () => {
    setTitle('');
    setBarcode('');
    setBrand('');
    setPurchasePrice('');
    setSalePrice('');
    setStockQuantity('');
    setUnit('عدد');
    setMinStock('5');
    setMaxStock('150');
    setDimensions('');
    setDescription('');
    setCategoryId('');
    setImage('');
    setWarehouseStocks({});
    setTargetProfitPercent('');
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) {
      Swal.fire({ text: 'لطفاً نام یا عنوان خدمات را وارد نمایید.', icon: 'warning', confirmButtonText: 'اصلاح' });
      return;
    }

    let customSrvId: string | undefined = undefined;
    try {
      const s = SettingsService.get();
      if (s && s.servicePrefix) {
        customSrvId = `${s.servicePrefix}${s.serviceNextNumber || 1001}`;
        s.serviceNextNumber = (s.serviceNextNumber || 1001) + 1;
        SettingsService.save(s);
      }
    } catch (e) {}

    const payload: Omit<Service, 'id'> & { id?: string } = {
      id: customSrvId,
      title: srvTitle.trim(),
      price: Number(srvPrice) || 0,
      duration_mins: Number(srvDuration) || 30,
      category_id: srvCategoryId || undefined,
      description: srvDescription.trim() || undefined,
      image: srvImage.trim() || undefined
    };

    OfflineDatabase.saveService(payload);

    Swal.fire({
      title: 'خدمت با موفقیت ایجاد شد 🛠️',
      text: `خدمت تفصیلی «${srvTitle.trim()}» ثبت و شناسه پیگیری صادر شد.`,
      icon: 'success',
      confirmButtonText: 'بسیار عالی',
      customClass: { confirmButton: 'px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold' },
      buttonsStyling: false
    });

    clearServiceForm();
  };

  const clearServiceForm = () => {
    setSrvTitle('');
    setSrvPrice('');
    setSrvDuration('30');
    setSrvDescription('');
    setSrvCategoryId('');
    setSrvImage('');
  };

  const handleApplyTargetProfit = (percentStr: string) => {
    setTargetProfitPercent(percentStr);
    const p = Number(percentStr) || 0;
    const numPurchase = Number(purchasePrice) || 0;
    if (numPurchase > 0 && p > 0) {
      const calculatedSalePrice = Math.round(numPurchase * (1 + p / 100));
      setSalePrice(calculatedSalePrice.toString());
    }
  };

  const numPurchase = Number(purchasePrice) || 0;
  const numSale = Number(salePrice) || 0;
  const profitAmount = Math.max(0, numSale - numPurchase);
  const profitMarginPercent = numSale > 0 ? Math.round((profitAmount / numSale) * 100) : 0;
  const markupPercent = numPurchase > 0 ? Math.round((profitAmount / numPurchase) * 100) : 0;

  // filtered dropdown matches
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) && 
    (activeFormTab === 'product' ? c.type !== 'service' : c.type !== 'product')
  );

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  const selectedCategoryObj = categories.find(c => c.id === (activeFormTab === 'product' ? categoryId : srvCategoryId));

  return (
    <div className="space-y-6 text-right max-w-7xl mx-auto px-4 h-[calc(100vh-110px)] overflow-y-auto pb-16 scrollbar-thin" dir="rtl" id="product_mngr_layout">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-right">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-tight">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>PRODUCT MANAGEMENT INTERFACE v3.1</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">طراحی شناسنامه و درج کالا / خدمات سیستم</h1>
          <p className="text-xs text-slate-300">درج هوشمند و کاملاً متناسب اطلاعات مالی، مقدار فیزیکی کالا و همچنین خدمات جانبی.</p>
        </div>
      </div>

      {/* Main Action Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
        <button
              onClick={() => setActiveFormTab('product')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition ${
                activeFormTab === 'product' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-650" />
              <span>ثبت شناسنامه محصول (کالای فیزیکی و اموال)</span>
            </button>
            <button
              onClick={() => setActiveFormTab('service')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition ${
                activeFormTab === 'service' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-650 text-teal-600" />
              <span>ثبت نوع خدمت جدید (پیک، دستمزد و کارمزد)</span>
            </button>
          </div>

          {/* TWO COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Form Editor Controls */}
            <div className="lg:col-span-8 space-y-6">
              {activeFormTab === 'product' ? (
            <form onSubmit={handleSaveProduct} className="space-y-6 animate-fade-in">
              
              {/* بخش درج متنی محصول از طریق کد JSON */}
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsJsonPanelOpen(!isJsonPanelOpen)}>
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Code2 className="w-5 h-5 animate-pulse" />
                    <h3 className="font-extrabold text-sm font-sans text-slate-100">درج هوشمند مشخصات محصول با الگو کد JSON</h3>
                  </div>
                  <span className="text-[11px] bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-bold hover:bg-slate-700 transition">
                    {isJsonPanelOpen ? 'بستن پنل متنی ✕' : 'باز کردن ابزار کمکی ⚡'}
                  </span>
                </div>
                
                {isJsonPanelOpen && (
                  <div className="space-y-4 pt-3 border-t border-slate-800 animate-fade-in text-right">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      کافیست کدهای ساختاری متعلق به محصول خود (مثلا قالب کالا، قیمت‌ها، برند و موجودی) را با ساختار استاندارد JSON در کادر زیر وارد کنید و بر روی دکمه اعمال کلیک کنید تا تمام فیلدهای فرم به صورت خودکار پر شوند.
                    </p>
                    
                    <textarea
                      rows={8}
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='{ ... }'
                      className="w-full p-4 bg-slate-950 border border-slate-850 rounded-2xl font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-indigo-500 text-left leading-relaxed"
                      dir="ltr"
                    />
                    
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyJsonTemplate}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        بارگذاری ساختار کالا نمونه (موس تسکو)
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleApplyJson}
                        className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-indigo-600/15"
                      >
                        <Check className="w-4 h-4" />
                        اعمال و پرکردن خودکار فرم بالا
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card 1: Primary Identity Information */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Tag className="w-5 h-5" />
                    <h3 className="font-extrabold text-sm text-slate-800">مشخصات هویتی و ثبتی کالا</h3>
                  </div>
                </div>

                {/* بخش نوین و اختصاصی بارگذاری مستقیم عکس محصول از هارد سیستم کاربر */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-4 relative transition-all hover:border-indigo-400 focus-within:border-indigo-400 shadow-inner" id="product-file-upload-zone">
                  <input
                    type="file"
                    id="product-image-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {image ? (
                    <div className="w-full relative flex flex-col items-center gap-3">
                      <div className="w-32 h-32 rounded-2xl border-4 border-indigo-600/30 overflow-hidden relative shadow-lg bg-white">
                        <img src={image} className="w-full h-full object-cover" alt="Product Selected" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute top-2 left-2 bg-red-650 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition cursor-pointer animate-fade-in"
                          title="حذف تصویر"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-extrabold bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          تصویر فیزیکی کالا با موفقیت بارگذاری شد
                        </span>
                      </div>
                      <label 
                        htmlFor="product-image-file-input"
                        className="text-xs font-bold text-slate-500 hover:text-indigo-650 cursor-pointer underline decoration-dotted mt-1"
                      >
                        برای تغییر تصویر و انتخاب فایل دیگر کلیک کنید
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="product-image-file-input" className="w-full cursor-pointer flex flex-col items-center justify-center py-6 select-none animate-fade-in">
                      <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 shadow-sm transition hover:scale-105 hover:bg-indigo-100">
                        <ImageIcon className="w-8 h-8 text-indigo-650" />
                      </div>
                      <span className="block text-sm font-black text-slate-800">بارگذاری تصویر واقعی کالا از روی هارد کامپیوتر (دیسک سخت)</span>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1.5 max-w-lg px-4 leading-relaxed">
                        روی این دکمه کلیک فرمایید تا تصویر فیزیکی و اختصاصی این کالا را از روی حافظه دستگاه انتخاب کنید تا در ویترین و صندوق کاتالوگ نمایش داده شود.
                      </p>
                      <span className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer transition">
                        انتخاب تصویر از روی هارد
                      </span>
                    </label>
                  )}
                  
                  {/* درج آدرس اینترنتی فتو به عنوان فیلد مکمل تکمیلی */}
                  <div className="w-full border-t border-slate-200/60 pt-4 flex flex-col gap-2 text-right">
                    <label className="text-[10.5px] text-slate-400 font-bold pr-1">یا در صورت تمایل، می‌توانید آدرس اینترنتی مستقیم آنلاین تصویر کالا را در زیر بنویسید:</label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none font-mono text-left"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Product Title */}
                  <div className="md:col-span-6">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">عنوان تفصیلی کالا <span className="text-red-500">*</span></label>
                    <input
                      id="product-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مانند: روغن مایع آفتابگردان گیاهی ۱.۸ لیتری لادن"
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-2xl focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* SKU Code (Unique Item Store Identifier) */}
                  <div className="md:col-span-3">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">کد انحصاری کالا (SKU)</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="PRD-1001"
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-2xl focus:outline-none text-center font-mono font-bold transition"
                    />
                  </div>

                  {/* Unit sizing */}
                  <div className="md:col-span-3">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">واحد سنجش بارکد</label>
                    <select
                      value={unit || 'عدد'}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none font-bold"
                    >
                      <option value="عدد">عدد (Item)</option>
                      <option value="بسته">بسته (Box)</option>
                      <option value="کارتن">کارتن (Carton)</option>
                      <option value="کیلوگرم">کیلوگرم (Kg)</option>
                      <option value="لیتر">لیتر (Litre)</option>
                      <option value="متر">متر (Meter)</option>
                      <option value="حلقه">حلقه</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Selection Dropdown */}
                  <div className="relative">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">دسته‌بندی درختی کاتالوگ</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategorySelectOpen(!isCategorySelectOpen);
                        setIsBrandSelectOpen(false);
                      }}
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-2xl focus:outline-none flex justify-between items-center text-slate-700 transition"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-400" />
                        {selectedCategoryObj ? selectedCategoryObj.name : 'انتخاب نشده / عمومی'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategorySelectOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCategorySelectOpen && (
                      <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl z-55 p-3 space-y-2 max-h-56 overflow-y-auto">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            placeholder="جستجوی شاخه‌ها..."
                            className="bg-transparent text-[11px] w-full focus:outline-none text-right font-sans"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryId('');
                              setIsCategorySelectOpen(false);
                            }}
                            className="w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 text-indigo-600 font-bold rounded-lg block"
                          >
                            بدون انتساب (عمومی)
                          </button>
                          {filteredCategories.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(c.id);
                                setIsCategorySelectOpen(false);
                              }}
                              className={`w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 rounded-lg flex items-center justify-between ${
                                categoryId === c.id ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700'
                              }`}
                            >
                              <span>{c.name}</span>
                              {c.isImportant && <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded">ویژه</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Brand Selector */}
                  <div className="relative">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">برند تجاری محصول</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsBrandSelectOpen(!isBrandSelectOpen);
                          setIsCategorySelectOpen(false);
                        }}
                        className="flex-1 text-xs px-3.5 py-2.8 bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-2xl focus:outline-none flex justify-between items-center text-slate-700 transition"
                      >
                        <span className="font-bold">
                          {brand ? brand : 'بدون برند (متفرقه)'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBrandModalOpen(true)}
                        className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center"
                        title="ثبت برند جدید"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {isBrandSelectOpen && (
                      <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl z-55 p-3 space-y-2 max-h-56 overflow-y-auto">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={brandSearchQuery}
                            onChange={(e) => setBrandSearchQuery(e.target.value)}
                            placeholder="جستجوی برندها..."
                            className="bg-transparent text-[11px] w-full focus:outline-none text-right font-sans"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setBrand('');
                              setIsBrandSelectOpen(false);
                            }}
                            className="w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 text-indigo-600 font-bold rounded-lg block"
                          >
                            بدون برند (متفرقه)
                          </button>
                          {filteredBrands.map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setBrand(b.name);
                                setIsBrandSelectOpen(false);
                              }}
                              className={`w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 rounded-lg flex items-center gap-2 ${
                                brand === b.name ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700'
                              }`}
                            >
                              {b.logoUrl && <img src={b.logoUrl} className="w-4 h-4 rounded-full object-cover" reffererPolicy="no-referrer" />}
                              <span>{b.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimensions Size */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">قیمت، رنگ، سایز یا ابعاد کالا</label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="مانند: ۴۵ * ۳۰ سانتی‌متر"
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl focus:outline-none text-center font-bold text-slate-700"
                    />
                  </div>
                </div>

              </div>

              {/* Card 2: Redesigned Pricing & Gross Margin Tool */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-800">قیمت‌گذاری و حسابرسی سود فروشگاه</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Purchase Price */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">قیمت خرید کالا از فاکتور وارده ({currencyLabel}) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        id="purchase-price-input"
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder={`ثبت به واحد ${currencyLabel}`}
                        className="w-full text-xs px-3.5 py-3.2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 rounded-2xl focus:outline-none text-center font-mono font-bold transition"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currencyLabel}</span>
                    </div>
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">قیمت فروش مصوب ویترین مغازه ({currencyLabel}) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        id="sale-price-input"
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder={`ثبت به واحد ${currencyLabel}`}
                        className="w-full text-xs px-3.5 py-3.2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 rounded-2xl focus:outline-none text-center font-mono font-bold transition"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currencyLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Profit Presets and Math Preview - Beautifully compact */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="space-y-1 text-center md:text-right">
                    <span className="text-[10.5px] font-extrabold text-slate-500">حاشیه سود تخمینی فروش بر اساس قیمت خرید:</span>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {['10', '15', '20', '25', '30', '40', '50'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleApplyTargetProfit(p)}
                          className={`text-[10px] px-3 py-1.5 rounded-lg border font-black transition cursor-pointer ${
                            targetProfitPercent === p 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {p}٪ سود 💸
                        </button>
                      ))}
                    </div>
                  </div>

                  {numPurchase > 0 && numSale > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-2 px-4 shadow-sm grid grid-cols-2 gap-4 text-center">
                      <div className="border-l border-slate-100 pl-2">
                        <p className="text-[9.5px] text-slate-400 font-bold">میزان سود خالص کالا</p>
                        <p className="text-xs font-black text-emerald-600">{(profitAmount).toLocaleString()} <span className="text-[9px]">ریال</span></p>
                      </div>
                      <div>
                        <p className="text-[9.5px] text-slate-400 font-bold">نرخ حاشیه فروشنده</p>
                        <p className="text-xs font-black text-indigo-700">{profitMarginPercent}٪ <span className="text-[8px] text-slate-400">کش پی بک</span></p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Card 3: COMPACT & PROPORTIONATE INVENTORY INPUTS */}
              {/* This directly solves: "فیلد موجودوی کالا خیلی بزرگ هست نسبت اندازه ها رو رعایت کن" */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-indigo-600">
                  <WarehouseIcon className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-800">موجودی فیزیکی اولیه و کنترل دپو</h3>
                </div>

                <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl space-y-3">
                  <p className="text-[10.5px] font-bold text-slate-500 leading-normal">
                    تعیین موجودی اول دوره کالا در انبارها. مقدار را در تناسب با سایر اجزا تعیین کنید:
                  </p>
                  
                  {/* Grid to perfectly proportion input sizes - No massive input boxes! */}
                  <div className="grid grid-cols-3 gap-4">
                    
                    {/* Compact Stock Quantity - beautifully limited size */}
                    <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 flex flex-col justify-between">
                      <label className="block text-[10.5px] font-black text-slate-600 mb-1">تعداد موجودی کل مغازه:</label>
                      <div className="relative">
                        <input
                          id="stock-quantity-input"
                          type="number"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          placeholder="موجودی اول دوره"
                          className="w-full text-xs font-bold text-center border-0 focus:ring-0 p-1 font-mono text-indigo-700 bg-slate-50 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Minimum stock indicator - Compact */}
                    <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 flex flex-col justify-between">
                      <label className="block text-[10.5px] font-black text-amber-800 mb-1">حداقل شارژ (هشدار اتمام):</label>
                      <input
                        type="number"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        placeholder="نقطه سفارش کالا"
                        className="w-full text-xs font-bold text-center border-0 focus:ring-0 p-1 font-mono text-amber-700 bg-slate-50 rounded-lg"
                      />
                    </div>

                    {/* Maximum stock indicator - Compact */}
                    <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 flex flex-col justify-between">
                      <label className="block text-[10.5px] font-black text-rose-800 mb-1">سقف ذخیره (حداکثر سوله):</label>
                      <input
                        type="number"
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                        placeholder="سقف ظرفیت قفسه‌ها"
                        className="w-full text-xs font-bold text-center border-0 focus:ring-0 p-1 font-mono text-rose-700 bg-slate-50 rounded-lg"
                      />
                    </div>

                  </div>

                  {/* Multi-Warehouse Distribution Option */}
                  {warehouses.length > 1 && (
                    <div className="pt-3 border-t border-indigo-100/40">
                      <p className="text-[10px] text-indigo-750 font-black mb-2 flex items-center gap-1">
                        <WarehouseIcon className="w-3.5 h-3.5" />
                        توزیع فیزیکی کالا مابین انبارهای توزیع آریا:
                      </p>
                      
                      {/* Compact grid for multiple warehouses stock */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {warehouses.map(w => (
                          <div key={w.id} className="bg-white/80 p-2 rounded-xl border border-slate-150 flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold truncate block">{w.name}:</span>
                            <input
                              type="number"
                              value={warehouseStocks[w.id] || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = { ...warehouseStocks, [w.id]: val };
                                setWarehouseStocks(updated);
                                // Set aggregated stock count
                                const sum = (Object.values(updated) as number[]).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
                                setStockQuantity(sum.toString());
                              }}
                              placeholder="موجودی"
                              className="w-full text-center text-xs font-bold font-mono text-slate-800 bg-slate-50 border-0 focus:ring-0 rounded-lg py-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Card 4: Additional Details, Images & Barcodes */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-700">
                  <Barcode className="w-5 h-5 text-indigo-505" />
                  <h3 className="font-extrabold text-sm text-slate-800">کدهای ارتباطی کالا و رسانه</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Factory Barcode */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">بارکد کارخانه‌ای محصول (موجود روی بسته)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="مانند بارکد خطی ۶۲۶"
                        className="flex-1 text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl focus:outline-none text-center font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateFactoryBarcode}
                        className="bg-white hover:bg-indigo-50 text-indigo-650 border border-indigo-200 text-xs font-black transition px-3 rounded-2xl cursor-pointer"
                        title="تولید بارکد تستی ایران"
                      >
                        درج تصادفی
                      </button>
                    </div>
                  </div>

                  {/* Store specific custom label */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">بارکد اختصاصی فروشگاه (تولید خودکار سیستم)</label>
                    <input
                      type="text"
                      readOnly
                      value={barcodeStore}
                      className="w-full text-xs px-3.5 py-2.8 bg-indigo-50/40 border border-slate-250 text-indigo-800 rounded-2xl font-mono font-black text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">شرح کالا یا یادداشت املایی انبارداری:</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحاتی مانند نحوه انبارش، شرایط دمایی سوله، نوع ارسال..."
                    className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

              </div>

              {/* Main submit buttons */}
              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={clearProductForm}
                  className="px-5 py-3 bg-white border border-slate-250 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  پاکسازی کل فیلدها
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت شناسنامه جدید و ذخیره در کاتالوگ انبار</span>
                </button>
              </div>

            </form>
          ) : (
            // Service creation form (ثبت خدمت)
            <form onSubmit={handleSaveService} className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-teal-600">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-800">مشخصات خدمات و کارمزدهای فنی</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Service Title */}
                  <div className="md:col-span-8">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">عنوان کامل خدمت یا کارمزد پیک <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={srvTitle}
                      onChange={(e) => setSrvTitle(e.target.value)}
                      placeholder="مانند: عیب‌یابی و تعمیر تخصصی بورد الکترونیکی خودرو"
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-2xl focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* Estimation time duration */}
                  <div className="md:col-span-4">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">تخمین مدت زمان کل کارمزد (به دقیقه)</label>
                    <select
                      value={srvDuration}
                      onChange={(e) => setSrvDuration(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none font-bold"
                    >
                      <option value="15">۱۵ دقیقه کل کار</option>
                      <option value="30">۳۰ دقیقه کارکرد</option>
                      <option value="45">۴۵ دقیقه</option>
                      <option value="60">۶۰ دقیقه (۱ ساعت)</option>
                      <option value="120">۱۲۰ دقیقه (۲ ساعت)</option>
                      <option value="180">۳ ساعت یا بالاتر</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wage / Price */}
                  <div>
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">قیمت مصوب / دستمزد خدمت ({currencyLabel})</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={srvPrice}
                        onChange={(e) => setSrvPrice(e.target.value)}
                        placeholder={`نرخ خدمات به ${currencyLabel} را وارد کنید`}
                        className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none text-center font-mono font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currencyLabel}</span>
                    </div>
                  </div>

                  {/* Brand Category representation for services */}
                  <div className="relative">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">دسته‌بندی درختی خدمات</label>
                    <button
                      type="button"
                      onClick={() => setIsCategorySelectOpen(!isCategorySelectOpen)}
                      className="w-full text-xs px-3.5 py-2.8 bg-slate-50 border border-slate-200 hover:border-teal-500 rounded-2xl focus:outline-none flex justify-between items-center text-slate-700 transition"
                    >
                      <span className="font-bold">
                        {selectedCategoryObj ? selectedCategoryObj.name : 'انتخاب نشده / عمومی'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategorySelectOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCategorySelectOpen && (
                      <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl z-55 p-3 space-y-2 max-h-56 overflow-y-auto">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            placeholder="جستجوی شاخه‌ها..."
                            className="bg-transparent text-[11px] w-full focus:outline-none text-right font-sans"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSrvCategoryId('');
                              setIsCategorySelectOpen(false);
                            }}
                            className="w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 text-teal-600 font-bold rounded-lg block"
                          >
                            بدون انتساب (عمومی)
                          </button>
                          {filteredCategories.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSrvCategoryId(c.id);
                                setIsCategorySelectOpen(false);
                              }}
                              className={`w-full text-right text-xs py-1.5 px-2 hover:bg-slate-50 rounded-lg flex items-center justify-between ${
                                srvCategoryId === c.id ? 'bg-teal-50 text-teal-700 font-black' : 'text-slate-700'
                              }`}
                            >
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Photo for services */}
                  <div className="md:col-span-12">
                    <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">لینک تصویر اینترنتی خدمت (برای کاتالوگ تبلت)</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={srvImage}
                        onChange={(e) => setSrvImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full text-xs px-3.5 py-2.8 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none font-mono"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-black text-slate-700 mb-1.5">یادداشت فنی یا جزئیات اجرایی خدمت:</label>
                  <textarea
                    rows={2}
                    value={srvDescription}
                    onChange={(e) => setSrvDescription(e.target.value)}
                    placeholder="مشخصات و ابزارکار لازم برای تکنسین، یا نحوه توزیع سهم پورسانت..."
                    className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={clearServiceForm}
                  className="px-5 py-3 bg-white border border-slate-250 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  پاکسازی فرم خدمات
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md shadow-teal-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و صدور کارت خدمت جدید 🛠️</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Column: Beautiful Live Label/Ticket Studio Mockup */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
            
            {/* Ambient decorative glowing backdrops */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-[12.5px] text-slate-200 tracking-tight">استودیو برچسب هوشمند (پیش‌نمایش زنده)</h3>
            </div>

            {/* Sticker container */}
            <div className="bg-white text-slate-900 rounded-2xl p-4.5 border border-slate-200/40 shadow-inner flex flex-col justify-between min-h-[340px] relative">
              
              {/* Sticker header info */}
              <div className="flex justify-between items-start gap-2 border-b border-dashed border-slate-200 pb-2.5">
                <div className="text-right">
                  <span className="text-[8px] uppercase font-black text-slate-400 font-mono tracking-tight tracking-widest block">Aria Boutique</span>
                  <span className="bg-indigo-50 text-indigo-700 text-[8.5px] font-black px-2 py-0.5 rounded-full inline-block mt-1">
                    {(activeFormTab === 'product' ? selectedCategoryObj?.name : 'بخش خدمات') || 'کاتالوگ متفرقه'}
                  </span>
                </div>
                {activeFormTab === 'product' && brand && (
                  <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-700">{brand}</span>
                )}
              </div>

              {/* Product title and photo indicator */}
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-3">
                  {/* Photo area */}
                  <div className="w-14 h-14 rounded-xl border border-slate-150 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                    {activeFormTab === 'product' && image ? (
                      <img src={image} className="w-full h-full object-cover" alt="Product" reffererPolicy="no-referrer" />
                    ) : activeFormTab === 'service' && srvImage ? (
                      <img src={srvImage} className="w-full h-full object-cover" alt="Service" reffererPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Title and details */}
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-slate-800 leading-relaxed min-h-[2.5rem]">
                      {activeFormTab === 'product' 
                        ? (title.trim() || 'نام نمایشی محصول در فاکتور...')
                        : (srvTitle.trim() || 'عنوان کارمزد ارائه خدمت...')
                      }
                    </h4>
                    
                    {activeFormTab === 'product' && dimensions && (
                      <p className="text-[9.5px] text-slate-400 font-bold">{dimensions}</p>
                    )}
                  </div>
                </div>

                {/* Stock distribution warning info inside the sticker */}
                {activeFormTab === 'product' && (
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[10px]">
                    <span className="text-slate-500 font-bold">موجود به واحد سنجش:</span>
                    <span className="text-indigo-800 font-black font-mono">
                      {stockQuantity ? `${stockQuantity} ${unit || 'عدد'}` : `۰ ${unit || 'عدد'}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Barcode representation */}
              <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                {activeFormTab === 'product' ? (
                  <div className="flex flex-col items-center">
                    {/* Simulated barcode bars rendered via striped CSS which looks extremely classy */}
                    <div className="w-full h-11 bg-slate-900 rounded-sm relative overflow-hidden" style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 7px, #000 7px, #000 10px, #fff 10px, #fff 11px)'
                    }}></div>
                    <span className="text-[9px] font-mono text-slate-500 font-semibold tracking-widest mt-1">
                      {barcodeStore}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-500 font-bold">مدت زمان تخمینی انجام:</span>
                    <span className="text-teal-700 font-black flex items-center gap-1 font-sans">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {srvDuration} دقیقه
                    </span>
                  </div>
                )}
              </div>

              {/* Retail Cash price Tag */}
              <div className="mt-4 bg-indigo-900 text-white rounded-xl p-3 flex justify-between items-center shadow-md">
                <span className="text-[9.5px] font-black text-indigo-200 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-indigo-300" /> قیمت ویترین:
                </span>
                <span className="text-sm font-black font-mono">
                  {activeFormTab === 'product' 
                    ? (salePrice ? Number(salePrice).toLocaleString() : '۰')
                    : (srvPrice ? Number(srvPrice).toLocaleString() : '۰')
                  } <span className="text-[9px] font-sans font-normal">{currencyLabel}</span>
                </span>
              </div>

            </div>

            {/* Sticker helpful hints */}
            <div className="mt-3.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30 text-[10px] text-slate-400 font-sans leading-relaxed">
              <p>📍 سیستم به صورت اتوماتیک بارکدهای انحصاری فروشگاه را به استانداردهای تفکیکی بارکدخوان‌های فیزیکی مغازه متصل می‌کند.</p>
            </div>

          </div>
        </div>

      </div>

      {/* JSON Import Dialog Popup Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-999 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-right animate-fade-in" id="json_importer_modal">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Code2 className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800">درج گروهی متغیرها با کدهای خام JSON</h3>
              </div>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                عالی برای کپی کردن ساختار محصولات از دیتابیس خارجی یا فایل‌های اکسل دیگر سیستم‌ها. قالب زیر را رعایت کنید:
              </p>
              
              <div className="bg-slate-55 bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-100">
                <pre className="text-[9px] text-indigo-700 font-mono text-left leading-normal overflow-x-auto select-all" dir="ltr">
{`{
  "title": "پنیر پیتزا مطهر ۲ کیلوگرمی",
  "barcode": "6261234567890",
  "brand": "میهن",
  "purchase_price": 1400000,
  "sale_price": 1850000,
  "stock_quantity": 40,
  "unit": "عدد"
}`}
                </pre>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="کلیدواژه‌ها و مقادیر شیئی محصول را اینجا چسبان کنید..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {jsonError && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[10.5px] text-rose-600 font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer"
                >
                  تحلیل و همگام‌سازی جادویی کدهای JSON 💫
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Modal Popup */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-999 p-4">
          <form onSubmit={handleAddNewBrand} className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-right animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800">تعریف برند تجاری جدید</h3>
              <button type="button" onClick={() => setIsBrandModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">نام فارسی برند تجاری:</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="مانند: شیرین عسل"
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">آدرس اینترنتی دایرکت لوگو (اختیاری):</label>
                <input
                  type="url"
                  value={newBrandLogoUrl}
                  onChange={(e) => setNewBrandLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition shadow-md"
                >
                  ذخیره برند تجاری
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
