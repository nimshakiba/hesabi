import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Service, Category, Brand } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
  ShoppingBag, Search, PlusCircle, Trash2, Edit2, Barcode, TrendingUp, 
  DollarSign, Folder, Tag, Clock, Package, AlertTriangle, X, Check, 
  Plus, Eye, Filter, SlidersHorizontal, ArrowUpDown, Image as ImageIcon,
  Sparkles, Layers, Sliders, RefreshCw
} from 'lucide-react';

const PRODUCT_IMAGE_PRESETS = [
  { name: 'خواروبار و عمومی', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  { name: 'برنج و کیسه‌جات', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
  { name: 'روغن و مایعات', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
  { name: 'لبنیات و نوشیدنی', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80' },
  { name: 'چای و تنقلات', url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80' },
  { name: 'سخت‌افزار و فیزیکی', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80' },
];

const SERVICE_IMAGE_PRESETS = [
  { name: 'پیک و ارسال سریع', url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80' },
  { name: 'بسته‌بندی و سلفون', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80' },
  { name: 'مونتاژ و تست فنی', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80' },
  { name: 'کارگری و حمل کالا', url: 'https://images.unsplash.com/photo-1524143986875-3b098d78b363?auto=format&fit=crop&w=400&q=80' },
];

export default function ProductsCatalogTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // فیلترهای بالا
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock' | 'over_stock'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'stock' | 'id'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // مدیریت برندها در پاپ آپ
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState('');
  const [brandLogoError, setBrandLogoError] = useState(false);

  // ویرایش سریع محصول/خدمت
  const [editingItem, setEditingItem] = useState<{ type: 'product' | 'service'; item: any } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // فرم موقت برای مدال ویرایش
  const [editTitle, setEditTitle] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editBarcodeStore, setEditBarcodeStore] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(5);
  const [editMaxStock, setEditMaxStock] = useState<number>(100);
  const [editDimensions, setEditDimensions] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImage, setEditImage] = useState('');

  // فیلد موقت ویرایش خدمت
  const [editSrvDuration, setEditSrvDuration] = useState<number>(30);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setServices(OfflineDatabase.getServices());
    setCategories(OfflineDatabase.getCategories());
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

  // ذخیره برند جدید
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      alert('لطفاً نام برند یا سازنده را وارد کنید.');
      return;
    }
    const slug = 'brand-' + Math.random().toString(36).substr(2, 9);
    const added: Brand = {
      id: slug,
      name: newBrandName.trim(),
      logoUrl: newBrandLogoUrl.trim() || undefined
    };
    const updated = [...brands, added];
    localStorage.setItem('shop_accounting_brands', JSON.stringify(updated));
    setBrands(updated);
    setNewBrandName('');
    setNewBrandLogoUrl('');
    setBrandLogoError(false);
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (window.confirm(`آیا مطمئن هستید که برند "${name}" را حذف کنید؟`)) {
      const updated = brands.filter(b => b.id !== id);
      localStorage.setItem('shop_accounting_brands', JSON.stringify(updated));
      setBrands(updated);
    }
  };

  // ویرایش آی‌تم‌ها
  const openEditModal = (type: 'product' | 'service', item: any) => {
    setEditingItem({ type, item });
    setEditTitle(item.title);
    setEditCategoryId(item.category_id || '');
    setEditDescription(item.description || '');
    setEditImage(item.image || '');
    
    if (type === 'product') {
      setEditBarcode(item.barcode || '');
      setEditBarcodeStore(item.barcode_store || '');
      setEditBrand(item.brand || '');
      setEditSku(item.sku || '');
      setEditPurchasePrice(item.purchase_price || 0);
      setEditSalePrice(item.sale_price || 0);
      setEditStock(item.stock_quantity || 0);
      setEditUnit(item.unit || 'عدد');
      setEditMinStock(item.min_stock ?? 5);
      setEditMaxStock(item.max_stock ?? 100);
      setEditDimensions(item.dimensions || '');
    } else {
      setEditSalePrice(item.price || 0);
      setEditSrvDuration(item.duration_mins ?? 30);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('لطفاً عنوان را به درستی وارد کنید.');
      return;
    }

    if (editingItem?.type === 'product') {
      const updatedProduct: Product = {
        ...editingItem.item,
        title: editTitle.trim(),
        barcode: editBarcode.trim(),
        barcode_store: editBarcodeStore.trim(),
        brand: editBrand.trim(),
        sku: editSku.trim(),
        purchase_price: Number(editPurchasePrice),
        sale_price: Number(editSalePrice),
        stock_quantity: Number(editStock),
        unit: editUnit || 'عدد',
        min_stock: Number(editMinStock),
        max_stock: Number(editMaxStock),
        dimensions: editDimensions.trim(),
        category_id: editCategoryId || undefined,
        description: editDescription.trim(),
        image: editImage.trim() || undefined
      };
      OfflineDatabase.saveProduct(updatedProduct);
    } else if (editingItem?.type === 'service') {
      const updatedService: Service = {
        ...editingItem.item,
        title: editTitle.trim(),
        price: Number(editSalePrice),
        duration_mins: Number(editSrvDuration),
        category_id: editCategoryId || undefined,
        description: editDescription.trim(),
        image: editImage.trim() || undefined
      };
      OfflineDatabase.saveService(updatedService);
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
    refreshData();
  };

  const handleDeleteItem = (type: 'product' | 'service', id: string, title: string) => {
    if (window.confirm(`آیا مایل هستید کالا یا خدمت "${title}" را برای همیشه از سیستم حذف کنید؟`)) {
      if (type === 'product') {
        OfflineDatabase.deleteProduct(id);
      } else {
        OfflineDatabase.deleteService(id);
      }
      refreshData();
    }
  };

  // تهیه لیست ترکیبی به همراه فیلترها و مرتب‌سازی دوتایی
  const processedItems = useMemo(() => {
    const combined: Array<{
      id: string;
      title: string;
      type: 'product' | 'service';
      price: number;
      purchase_price?: number;
      stock?: number;
      unit?: string;
      brand?: string;
      sku?: string;
      barcode?: string;
      barcode_store?: string;
      category_id?: string;
      description?: string;
      image?: string;
      min_stock?: number;
      max_stock?: number;
      duration_mins?: number;
    }> = [];

    // کالاها
    if (typeFilter === 'all' || typeFilter === 'product') {
      products.forEach(p => {
        combined.push({
          id: p.id,
          title: p.title,
          type: 'product',
          price: p.sale_price,
          purchase_price: p.purchase_price,
          stock: p.stock_quantity,
          unit: p.unit,
          brand: p.brand,
          sku: p.sku,
          barcode: p.barcode,
          barcode_store: p.barcode_store,
          category_id: p.category_id,
          description: p.description,
          image: p.image,
          min_stock: p.min_stock,
          max_stock: p.max_stock
        });
      });
    }

    // خدمات
    if (typeFilter === 'all' || typeFilter === 'service') {
      services.forEach(s => {
        combined.push({
          id: s.id,
          title: s.title,
          type: 'service',
          price: s.price,
          category_id: s.category_id,
          description: s.description,
          image: s.image,
          duration_mins: s.duration_mins
        });
      });
    }

    // فیلتر جستجو
    let result = combined.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.includes(q)) ||
        (item.barcode_store && item.barcode_store.includes(q)) ||
        item.id.toLowerCase().includes(q)
      );
    });

    // دسته‌بندی
    if (selectedCategory !== 'all') {
      // پیدا کردن خود دسته و تمام زیرمجموعه‌ها روی درختچه
      const getBranchIds = (catId: string): string[] => {
        const children = categories.filter(c => c.parentId === catId);
        return [catId, ...children.flatMap(ch => getBranchIds(ch.id))];
      };
      const allowedCategories = getBranchIds(selectedCategory);
      result = result.filter(item => item.category_id && allowedCategories.includes(item.category_id));
    }

    // برند
    if (brandFilter !== 'all') {
      result = result.filter(item => item.brand === brandFilter);
    }

    // رنج قیمتی
    if (minPrice) {
      result = result.filter(item => item.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(item => item.price <= Number(maxPrice));
    }

    // وضعیت موجودی انبار (فقط روی کالاها تاثیر دارد)
    if (typeFilter !== 'service' && stockFilter !== 'all') {
      result = result.filter(item => {
        if (item.type !== 'product') return false;
        const currentStock = item.stock || 0;
        const minVal = item.min_stock ?? 5;
        const maxVal = item.max_stock ?? 100;

        if (stockFilter === 'out_of_stock') return currentStock === 0;
        if (stockFilter === 'low_stock') return currentStock > 0 && currentStock <= minVal;
        if (stockFilter === 'in_stock') return currentStock > minVal;
        if (stockFilter === 'over_stock') return currentStock >= maxVal;
        return true;
      });
    }

    // مرتب سازی
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'fa');
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'stock') {
        const aStock = a.stock || 0;
        const bStock = b.stock || 0;
        comparison = aStock - bStock;
      } else {
        comparison = a.id.localeCompare(b.id);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, services, categories, searchQuery, selectedCategory, typeFilter, brandFilter, stockFilter, minPrice, maxPrice, sortBy, sortOrder]);

  const renderCategoryDetails = (catId?: string) => {
    if (!catId) return null;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return null;

    return (
      <div className="flex items-center gap-1.5 bg-sky-50/70 border border-sky-100/60 px-2.5 py-1 rounded-lg text-sky-700 text-[10.5px] font-bold">
        {cat.iconPng ? (
          <img src={cat.iconPng} alt={cat.name} className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
        ) : cat.icon ? (
          (() => {
            const LucideIcon = (LucideIcons as any)[cat.icon];
            return LucideIcon ? <LucideIcon className="w-3.5 h-3.5 text-sky-600" /> : null;
          })()
        ) : (
          <Tag className="w-3 h-3 text-sky-500" />
        )}
        <span>{cat.name}</span>
      </div>
    );
  };

  const getPresetImage = (item: any) => {
    if (item.image) return item.image;
    const presets = item.type === 'product' ? PRODUCT_IMAGE_PRESETS : SERVICE_IMAGE_PRESETS;
    const hash = item.title.charCodeAt(0) % presets.length;
    return presets[hash].url;
  };

  return (
    <div className="p-6 flex flex-col gap-6 h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50" id="products-catalog-container" dir="rtl">
      
      {/* هدر صفحه و خلاصه آمار کاتالوگ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-lg border border-slate-800 shrink-0">
        <div className="text-right">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            کاتالوگ پیشرفته و لیست خلاقانه محصولات و خدمات
          </h2>
          <p className="text-xs text-indigo-200 mt-1">دید سراسری، جستجو، و فیلترهای لجستیکی بر دپوی کالا و کارهای خدماتی</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1" id="catalog-header-stats">
          <div className="bg-white/10 px-4 py-2 border border-white/5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] text-indigo-300 block">🛍️ کل کالاها</span>
            <span className="text-base font-extrabold font-mono block text-emerald-450">{products.length}</span>
          </div>
          <div className="bg-white/10 px-4 py-2 border border-white/5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] text-indigo-300 block">🔧 کل خدمات</span>
            <span className="text-base font-extrabold font-mono block text-purple-400">{services.length}</span>
          </div>
          <div className="bg-white/10 px-4 py-2 border border-white/5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] text-indigo-300 block">⚠️ کمبود موجودی</span>
            <span className="text-base font-extrabold font-mono block text-amber-400">
              {products.filter(p => p.stock_quantity <= (p.min_stock ?? 5)).length}
            </span>
          </div>
          
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="bg-indigo-600/30 hover:bg-indigo-600/55 text-indigo-300 hover:text-white px-4 py-2 rounded-2xl border border-indigo-500/20 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>مدیریت برندها {brands.length > 0 && `(${brands.length})`}</span>
          </button>
        </div>
      </div>

      {/* بخش ابزارهای فیلترینگ و جستجو هرمی */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-4 shrink-0">
        
        {/* سطر اول: جستجو و سوییچ کالا/خدمت */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">
          
          {/* باکس جستجوی فراگیر */}
          <div className="xl:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع عنوان، بارکد، برند یا شناسه فنی (SKU)..."
              className="w-full text-xs pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-205 focus:bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>

          {/* نوع قلم */}
          <div className="xl:col-span-3 flex bg-slate-50 border border-slate-200 p-1 rounded-2xl">
            {(['all', 'product', 'service'] as const).map(typeKey => (
              <button
                key={typeKey}
                onClick={() => { setTypeFilter(typeKey); if (typeKey === 'service') setStockFilter('all'); }}
                className={`flex-1 py-1.8 text-[11px] font-black rounded-xl transition cursor-pointer ${
                  typeFilter === typeKey
                    ? 'bg-white text-slate-900 border-b border-indigo-600 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {typeKey === 'all' ? '🌐 همه اقلام' : typeKey === 'product' ? '📦 کالاها' : '🔧 خدمات دفتری'}
              </button>
            ))}
          </div>

          {/* دسته‌بندی درختی */}
          <div className="xl:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">📁 همه شاخه‌های اصلی و فرعی</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? '┠ ' : '■ '} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* مرتب‌سازی */}
          <div className="xl:col-span-2 flex gap-1 items-center">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="flex-1 text-[11px] px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer font-bold text-slate-600"
            >
              <option value="title">✍️ براساس حروف الفبا</option>
              <option value="price">💰 براساس نرخ بها</option>
              {typeFilter !== 'service' && <option value="stock">📦 میزان انبارداری</option>}
              <option value="id">🆔 ترتیب ثبت سیستمی</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-50 border border-slate-205 rounded-xl hover:bg-slate-100 transition text-slate-500"
              title="تغییر جهت صعودی / نزولی"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* سطر دوم: ابزارهای عمیق و شرط‌های متقاطع انبار و محدوده‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2.5 border-t border-slate-100 items-center">
          
          {/* برند */}
          <div>
            <label className="block text-[10px] mb-1 font-bold text-slate-400">فیلتر اختصاصی بر اساس برند:</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">🏷️ تمام برندها و سازندگان</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* موجودی انبار */}
          <div>
            <label className="block text-[10px] mb-1 font-bold text-slate-400">وضعیت دپو و کارخانه لجستیک:</label>
            <select
              value={stockFilter}
              disabled={typeFilter === 'service'}
              onChange={(e: any) => setStockFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-705 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">📦 تمام سطوح دپو کالا</option>
              <option value="in_stock">✅ موجود کافی (بیشتر از حد هشدار)</option>
              <option value="low_stock">⚠️ حد هشدار کمبود (رو به اتمام)</option>
              <option value="out_of_stock">❌ ناموجود فیزیکی (صفر)</option>
              <option value="over_stock">📈 انباشتگی مازاد بر سقف ظرفیت</option>
            </select>
          </div>

          {/* رنج قیمت حداقل */}
          <div>
            <label className="block text-[10px] mb-1 font-bold text-slate-400">کف قیمت فروش (ریال):</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="مثلا ۱۰۰,۰۰۰"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          {/* رنج قیمت حداکثر */}
          <div>
            <label className="block text-[10px] mb-1 font-bold text-slate-400">سقف قیمت فروش (ریال):</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="مثلا ۲۰,۰۰۰,۰۰۰"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

        </div>

      </div>

      {/* جدول/کارت‌پستال نمایش اقلام کاتالوگ */}
      <div className="flex-1 overflow-y-auto" id="catalog-list-scrollable">
        {processedItems.length === 0 ? (
          <div className="text-center py-24 bg-white border rounded-3xl shadow-3xs flex flex-col items-center justify-center space-y-3">
            <Sliders className="w-12 h-12 text-slate-300 animate-pulse" />
            <h4 className="font-bold text-slate-700 text-sm">پیچیدگی فیلترها یا عدم ثبت اطلاعات!</h4>
            <p className="text-xs text-slate-400 max-w-sm">هیچ محصول یا خدمتی متناظر با فیلترها و کلمات کلیدی مورد جستجو یافت نشد. می‌توانید با دکمه زیر فیلترها را ریست کنید.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setTypeFilter('all');
                setBrandFilter('all');
                setStockFilter('all');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              پاکسازی کامل تمام فیلترها
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {processedItems.map(item => {
              const currentStock = item.stock ?? 0;
              const minVal = item.min_stock ?? 5;
              const maxVal = item.max_stock ?? 100;

              // سیستم هوش سه گانه دپوی بومی
              let stockBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
              let stockLabel = 'سرویس خدمتی';

              if (item.type === 'product') {
                if (currentStock === 0) {
                  stockBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                  stockLabel = '❌ کاملا ناموجود';
                } else if (currentStock <= minVal) {
                  stockBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  stockLabel = `⚠️ آستانه اتمام کالا (${currentStock} ${item.unit})`;
                } else if (currentStock >= maxVal) {
                  stockBadgeColor = 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse';
                  stockLabel = `📈 سرریز ظرفیت انبار (${currentStock} ${item.unit})`;
                } else {
                  stockBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  stockLabel = `✅ موجود در انبار (${currentStock} ${item.unit})`;
                }
              }

              return (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group ${
                    item.type === 'service' ? 'border-purple-200/40 hover:border-purple-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  id={`catalog-card-${item.id}`}
                >
                  
                  {/* بخش بالا: تصویر و پوشش شیشه‌ای هاور (بسیار جمع و جورتر) */}
                  <div className="relative h-32 overflow-hidden bg-slate-50 shrink-0 select-none border-b border-slate-100">
                    <img 
                      src={getPresetImage(item)} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* بج بالا چپ: دسته بندی کالا یا خدمت */}
                    <div className="absolute left-2.5 top-2.5">
                      <span className={`text-[9.5px] font-black tracking-tight border px-2 py-0.5 rounded-full text-white shadow-xs ${
                        item.type === 'product' ? 'bg-emerald-600 border-emerald-500' : 'bg-purple-600 border-purple-500'
                      }`}>
                        {item.type === 'product' ? '📦 کالا' : '🔧 خدمت'}
                      </span>
                    </div>

                    {/* دکمه‌های شناور هاور محصول */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item.type, item)}
                        className="w-8 h-8 rounded-lg bg-white text-slate-800 hover:bg-slate-100 transition flex items-center justify-center font-bold shadow-xs cursor-pointer"
                        title="ویرایش سریع شناسنامه"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.type, item.id, item.title)}
                        className="w-8 h-8 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition flex items-center justify-center font-bold shadow-xs cursor-pointer"
                        title="پاک کردن از حافظه بومی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* برند شاخص در پایین راست تصویر در صورت وجود */}
                    {item.brand && (
                      <div className="absolute right-2.5 bottom-2.5 bg-slate-900/75 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-700 text-slate-200 text-[9px] font-black flex items-center gap-1 shrink-0">
                        {(() => {
                          const matchedB = brands.find(b => b.name === item.brand);
                          return matchedB?.logoUrl ? (
                            <img src={matchedB.logoUrl} className="w-3 h-3 object-contain rounded-full" alt={item.brand} referrerPolicy="no-referrer" />
                          ) : <Tag className="w-2.5" />;
                        })()}
                        <span>{item.brand}</span>
                      </div>
                    )}
                  </div>

                  {/* بخش بدنه کارت (کم حجم شده) */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-3 text-right">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1 items-center justify-between">
                        {renderCategoryDetails(item.category_id)}
                        <span className="text-[9px] text-slate-400 font-mono font-black select-none">کد: {item.id.substring(0, 6)}</span>
                      </div>

                      <h3 className="font-extrabold text-[11px] text-slate-800 leading-relaxed group-hover:text-slate-950 transition-colors">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[10px] text-slate-400 font-sans line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* بارکد یا شناسه کالا و خدمات */}
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[9px] space-y-1">
                      {item.sku && (
                        <div className="flex justify-between items-center text-slate-500 font-sans">
                          <span>طرح کالا (SKU):</span>
                          <span className="font-mono font-bold">{item.sku}</span>
                        </div>
                      )}
                      
                      {item.barcode && (
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            بارکد کارخانه:
                          </span>
                          <span className="font-mono tracking-xs">{item.barcode}</span>
                        </div>
                      )}

                      {item.barcode_store && (
                        <div className="flex justify-between items-center text-slate-500">
                          <span>بارکد داخلی:</span>
                          <span className="font-mono tracking-xs font-bold text-slate-600">{item.barcode_store}</span>
                        </div>
                      )}

                      {item.duration_mins !== undefined && (
                        <div className="flex justify-between items-center text-purple-750 font-sans font-bold">
                          <span>⏳ زمان تخمینی:</span>
                          <span>{item.duration_mins} دقیقه</span>
                        </div>
                      )}
                    </div>

                    {/* وضعیت انبارداری فقط کالا */}
                    {item.type === 'product' && (
                      <div className={`py-1 px-2 border rounded-xl text-[9px] font-black text-center shrink-0 ${stockBadgeColor}`}>
                        {stockLabel}
                      </div>
                    )}
                  </div>

                  {/* بخش قیمت و فوتر کارت (جمع و جور با ارتفاع معقول) */}
                  <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 shrink-0 flex items-center justify-between gap-1 text-right font-sans">
                    <div>
                      {item.purchase_price !== undefined && item.purchase_price > 0 && (
                        <span className="text-[9px] text-slate-400 block line-through">
                          خرید: {item.purchase_price.toLocaleString('fa-IR')}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-450 block font-bold leading-none mt-0.5">قیمت فروش:</span>
                    </div>

                    <div className="bg-indigo-50/80 border border-indigo-100 px-2 py-1 rounded-lg text-left font-sans">
                      <span className="text-[11px] text-indigo-700 font-extrabold font-mono block">
                        {item.price.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[8px] text-indigo-500 font-black block text-center leading-none">ریال {item.unit ? `/ ${item.unit}` : ''}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- پاپ آپ (مدال) مدیریت برندها --- */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="brand-manager-modal" dir="rtl">
          <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
            
            {/* هدر مدال */}
            <div className="bg-gradient-to-l from-indigo-900 to-indigo-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  مدیریت و افزودن برندها و شرکت‌های تولیدکننده
                </h3>
                <p className="text-[10px] text-indigo-200 mt-1">امکان تعریف نام‌های تجاری به همراه تصویر لوگوی مستقیم برای تخصیص کالا</p>
              </div>
              <button 
                onClick={() => setIsBrandModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بدنه مدال */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              
              {/* بخش راست: افزودن برند جدید */}
              <form onSubmit={handleAddBrand} className="space-y-4">
                <h4 className="font-black text-xs text-slate-800 border-b pb-2 flex items-center gap-1">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  ثبت برند جدید
                </h4>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 mb-1">نام فارسی یا بین‌المللی برند:</label>
                    <input
                      type="text"
                      required
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="مانند: کاله، سن‌ایچ، آدیداس"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-202 rounded-xl focus:bg-white text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-505 mb-1">آدرس اینترنتی تصویر لوگو (URL):</label>
                    <input
                      type="text"
                      value={newBrandLogoUrl}
                      onChange={(e) => {
                        setNewBrandLogoUrl(e.target.value);
                        setBrandLogoError(false);
                      }}
                      placeholder="https://example.com/logo.png"
                      className="w-full text-left text-xs px-3 py-2 bg-slate-50 border border-slate-180 rounded-xl focus:bg-white font-mono"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-1 block leading-normal">می‌توانید لینک مستقیم عکس لوگو را از گوگل مپ یا اینترنت کپی کرده و در این باکس وارد نمایید.</span>
                  </div>

                  {newBrandLogoUrl && !brandLogoError && (
                    <div className="border rounded-2xl p-3 bg-slate-50 flex flex-col items-center justify-center space-y-1.5 shrink-0">
                      <span className="text-[8.5px] font-bold text-slate-400">پیش‌نمایش زنده لوگو</span>
                      <img 
                        src={newBrandLogoUrl} 
                        alt="Logo preview" 
                        className="h-10 object-contain"
                        referrerPolicy="no-referrer"
                        onError={() => setBrandLogoError(true)} 
                      />
                    </div>
                  )}

                  {brandLogoError && (
                    <div className="bg-red-50 text-red-600 text-[10px] p-2.5 rounded-xl flex items-center gap-1 select-none font-sans">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>لینک ارائه شده نامعتبر بود یا اجازه لود آفلاین ندارد!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    <Check className="w-4 h-4" />
                    <span>تایید و ذخیره دائم برند</span>
                  </button>
                </div>
              </form>

              {/* بخش چپ: لیست برندهای تعریف شده فعلی */}
              <div className="space-y-3.5 h-full flex flex-col">
                <h4 className="font-black text-xs text-slate-800 border-b pb-2 flex items-center gap-1">
                  <Folder className="w-4 h-4 text-indigo-500" />
                  لیست برندها ({brands.length} مورد کامپایل شده)
                </h4>

                <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 border border-slate-150 rounded-2xl bg-white p-2">
                  {brands.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">هیچ برندی ثبت نگردیده.</div>
                  ) : (
                    brands.map(brandItem => (
                      <div key={brandItem.id} className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-xl transition">
                        <div className="flex items-center gap-2.5 min-w-0 text-right">
                          <div className="w-9 h-9 border border-slate-200/80 rounded-lg p-1 bg-white flex items-center justify-center shrink-0">
                            {brandItem.logoUrl ? (
                              <img src={brandItem.logoUrl} alt={brandItem.name} className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Tag className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">{brandItem.name}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteBrand(brandItem.id, brandItem.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="حذف برند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* فوتر مدال */}
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-805 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                بستن و اعمال اطلاعات
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- پاپ آپ (مدال) ویرایش شناسنامه محصول یا خدمت --- */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto py-10 animate-fade-in" id="edit-item-modal" dir="rtl">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-scale-up">
            
            {/* هدر مدال */}
            <div className="bg-gradient-to-l from-slate-905 to-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <Edit2 className="w-5 h-5 text-indigo-400" />
                  بروزرسانی کل شناسنامه {editingItem.type === 'product' ? '📦 کالا' : '🔧 خدمت'}
                </h3>
                <p className="text-[10px] text-slate-300 mt-1">شناسه سیستمی: {editingItem.item.id}</p>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* فرم ویرایش */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* بخش اول: تصویر (پیش‌نمایش و تغییر با لینک) */}
                <div className="flex flex-col items-center justify-center space-y-2 border-b pb-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    {editImage ? (
                      <img src={editImage} alt="Product logo" className="w-22 h-22 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-350" />
                    )}
                  </div>
                  <div className="w-full max-w-md">
                    <label className="block text-[10.5px] font-bold text-slate-500 mb-1 text-center font-sans">آدرس مستقیم اینترنتی تصویر (لینک دائم):</label>
                    <input
                      type="text"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      placeholder="اینترنت https://images.unsplash.com/... یا Preset"
                      className="w-full text-center text-xs px-3 py-2 bg-slate-50 border border-slate-202 rounded-xl focus:bg-white font-mono text-slate-600"
                    />
                  </div>
                </div>

                {/* نام کالا / خدمت */}
                <div>
                  <label className="block text-[10.5px] font-black text-slate-700 mb-1">نام یا عنوان کالا/خدمت فیزیکی:</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>

                {/* دسته‌بندی */}
                <div>
                  <label className="block text-[10.5px] font-black text-slate-700 mb-1">شاخه یا غرفه واگذاری (دسته‌بندی درخت):</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer"
                  >
                    <option value="">انتخاب دسته بندی درختی</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? '┠ ' : '■ '} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* جزئیات اختصاصی کالا */}
                {editingItem.type === 'product' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-505 mb-1">برند یا کارخانه سازنده:</label>
                        <select
                          value={editBrand}
                          onChange={(e) => setEditBrand(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer"
                        >
                          <option value="">فاقد برند و ناشناس</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-505 mb-1">شناسه فنی انبارداری (SKU):</label>
                        <input
                          type="text"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          placeholder="PRD-1002"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-505 mb-1">بارکد کارخانه (بارکد خوان):</label>
                        <input
                          type="text"
                          value={editBarcode}
                          onChange={(e) => setEditBarcode(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-505 mb-1">بارکد اختصاصی مغازه:</label>
                        <input
                          type="text"
                          value={editBarcodeStore}
                          onChange={(e) => setEditBarcodeStore(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border">
                      <div>
                        <label className="block text-[10.5px] font-black text-rose-800 mb-1">نرخ خرید واحد (ریال):</label>
                        <input
                          type="number"
                          value={editPurchasePrice}
                          onChange={(e) => setEditPurchasePrice(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-black text-indigo-850 mb-1">نرخ مصرف‌کننده (ریال):</label>
                        <input
                          type="number"
                          value={editSalePrice}
                          onChange={(e) => setEditSalePrice(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-650 mb-1">واحد اندازه‌گیری:</label>
                        <input
                          type="text"
                          value={editUnit}
                          placeholder="مثلا عدد، کیلوگرم، لیتر"
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:bg-white text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-505 mb-1">موجودی فیزیکی فعلی دپو:</label>
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-center font-mono font-bold text-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-amber-800 mb-1">نقطه هشدار کمبود (مینیمم):</label>
                        <input
                          type="number"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-center font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-blue-800 mb-1">سرریز ظرفیت فیزیکی (ماکزیمم):</label>
                        <input
                          type="number"
                          value={editMaxStock}
                          onChange={(e) => setEditMaxStock(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-center font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-505 mb-1">ابعاد، سایز یا مشخصات وزنی:</label>
                      <input
                        type="text"
                        value={editDimensions}
                        onChange={(e) => setEditDimensions(e.target.value)}
                        placeholder="سایز بزرگ، وزن ۲ کیلوگرم، طول ۳۰ سانتی‌متر"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700"
                      />
                    </div>
                  </>
                )}

                {/* جزئیات اختصاصی خدمت */}
                {editingItem.type === 'service' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                    <div>
                      <label className="block text-[10.5px] font-black text-purple-900 mb-1">تعرفه انجام خدمات (ریال):</label>
                      <input
                        type="number"
                        value={editSalePrice}
                        onChange={(e) => setEditSalePrice(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-purple-200 rounded-xl focus:bg-white font-bold text-purple-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-purple-850 mb-1">تخمین مدت زمان انجام کار (دقیقه):</label>
                      <input
                        type="number"
                        value={editSrvDuration}
                        onChange={(e) => setEditSrvDuration(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-purple-200 rounded-xl focus:bg-white text-center font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* توضیحات */}
                <div>
                  <label className="block text-[10.5px] font-black text-slate-705 mb-1">شرح محصول یا توضیحات بسته‌بندی:</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="توضیحات تکمیلی پیرامون نحوه ارائه کالا یا ارجاع..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>

              </div>

              {/* فوتر فرم ویرایش */}
              <div className="bg-slate-50 px-6 py-4.5 border-t flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2.5 bg-white border border-slate-250 text-slate-650 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف و لغو تغییرات
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                >
                  <Check className="w-4 h-4" />
                  <span>بروزرسانی شناسنامه و ذخیره نهایی</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
