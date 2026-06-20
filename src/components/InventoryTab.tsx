import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/settings';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Warehouse } from '../types';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  CheckCircle, 
  ArrowRightLeft, 
  TrendingUp, 
  BarChart4,
  Warehouse as WarehouseIcon,
  X,
  Edit,
  MapPin,
  ClipboardList
} from 'lucide-react';

export default function InventoryTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Tab within inventory levels
  const [activeSubTab, setActiveSubTab] = useState<'levels' | 'transfer' | 'warehouses'>('levels');

  // Search and Warehouse selection context
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('All');

  // Manual Stock Correction state
  const [selectedProductIdForAdjustment, setSelectedProductIdForAdjustment] = useState<string>('');
  const [adjustWarehouseId, setAdjustWarehouseId] = useState<string>('wh_central');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustReason, setAdjustReason] = useState('انبارگردانی سالانه و بازشماری ممتد');
  const [adjustPositionStr, setAdjustPositionStr] = useState<string>('');

  useEffect(() => {
    if (selectedProductIdForAdjustment) {
      const p = products.find(prod => prod.id === selectedProductIdForAdjustment);
      if (p) {
        setAdjustPositionStr(p.warehouse_positions?.[adjustWarehouseId] || '');
      }
    }
  }, [adjustWarehouseId, selectedProductIdForAdjustment, products]);

  // Transfer stock state
  const [transferProductId, setTransferProductId] = useState<string>('');
  const [transferSourceWhId, setTransferSourceWhId] = useState<string>('wh_central');
  const [transferDestWhId, setTransferDestWhId] = useState<string>('wh_store');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState('حواله انتقال بابت شارژ موجودی ویترین مغازه');

  // Warehouse CRUD states
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [showWhModal, setShowWhModal] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whNotes, setWhNotes] = useState('');
  const [whIsActive, setWhIsActive] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setWarehouses(OfflineDatabase.getWarehouses());
  };

  const getFarsiWarehouseName = (id: string) => {
    const found = warehouses.find(w => w.id === id);
    return found ? found.name : 'انبار نامشخص';
  };

  // Submit manual correction for a specific warehouse
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductIdForAdjustment) return;

    const originalProduct = products.find(p => p.id === selectedProductIdForAdjustment);
    if (!originalProduct) return;

    // Load active stocks
    const stocks = originalProduct.warehouse_stocks || { wh_central: originalProduct.stock_quantity || 0 };
    const currentWarehouseQty = stocks[adjustWarehouseId] || 0;
    
    const delta = adjustType === 'increase' ? adjustQty : -adjustQty;
    const previousWarehouseQty = currentWarehouseQty;
    const newWarehouseQty = Math.max(0, currentWarehouseQty + delta);

    // Calc overall difference to adjust main stock_quantity
    const diff = newWarehouseQty - previousWarehouseQty;

    const updatedStocks = {
      ...stocks,
      [adjustWarehouseId]: newWarehouseQty
    };

    // Calculate total aggregated quantity across all warehouses
    const newTotalQty = Object.values(updatedStocks).reduce((sum: number, qty: any) => sum + (qty || 0), 0) as number;

    const updatedPositions = {
      ...(originalProduct.warehouse_positions || {}),
      [adjustWarehouseId]: adjustPositionStr.trim()
    };

    const updatedProductPayload = {
      ...originalProduct,
      stock_quantity: newTotalQty,
      warehouse_stocks: updatedStocks,
      warehouse_positions: updatedPositions
    };

    // Save in Database
    OfflineDatabase.saveProduct(updatedProductPayload);

    // Save detailed audited stock log specifically detailing the warehouse change
    const whName = getFarsiWarehouseName(adjustWarehouseId);
    const actionText = adjustType === 'increase' ? 'ورود' : 'خروج/کسری';
    const reasonText = `اصلاح موجودی دستی (${actionText}) - دپو: ${whName} - بابت: ${adjustReason}`;
    
    OfflineDatabase.addStockLog(
      originalProduct.id,
      originalProduct.title,
      originalProduct.stock_quantity, // Overall previous
      newTotalQty, // Overall new
      reasonText,
      adjustWarehouseId,
      whName
    );

    // Reset Form
    setSelectedProductIdForAdjustment('');
    setAdjustQty(1);
    setAdjustReason('انبارگردانی سالانه و بازشماری ممتد');
    refreshData();
    
    // Dispatch custom update trigger
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Execute transfer of stock from Wh A to Wh B
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferSourceWhId || !transferDestWhId) {
      alert('لطفاً مشخصات حواله را کامل کنید.');
      return;
    }

    if (transferSourceWhId === transferDestWhId) {
      alert('انبار مبدا و مقصد نمی‌توانند یکسان باشند.');
      return;
    }

    if (transferQty <= 0) {
      alert('تعداد انتقال نامعتبر است.');
      return;
    }

    const matchedProduct = products.find(p => p.id === transferProductId);
    if (!matchedProduct) return;

    const stocks = matchedProduct.warehouse_stocks || { wh_central: matchedProduct.stock_quantity || 0 };
    const sourceQty = stocks[transferSourceWhId] || 0;

    if (sourceQty < transferQty) {
      alert(`موجودی کالا در ${getFarsiWarehouseName(transferSourceWhId)} کماکان برای این حواله کافی نمی‌باشد. (موجودی فعلی: ${sourceQty} عدد)`);
      return;
    }

    // Deduct from source and add to destination
    const destQty = stocks[transferDestWhId] || 0;
    const updatedStocks = {
      ...stocks,
      [transferSourceWhId]: sourceQty - transferQty,
      [transferDestWhId]: destQty + transferQty
    };

    // Recalculate aggregated total quantity
    const finalTotalQty = Object.values(updatedStocks).reduce((sum: number, q: any) => sum + (q || 0), 0) as number;

    const updatedPayload = {
      ...matchedProduct,
      stock_quantity: finalTotalQty,
      warehouse_stocks: updatedStocks
    };

    // Save product specs
    OfflineDatabase.saveProduct(updatedPayload);

    // Create log detailing the move
    const srcName = getFarsiWarehouseName(transferSourceWhId);
    const destName = getFarsiWarehouseName(transferDestWhId);
    const transferAuditReason = `حواله جابجایی کالا: انتقال تعداد ${transferQty} عدد مابین ${srcName} به ${destName} - بابت: ${transferNotes}`;

    OfflineDatabase.addStockLog(
      matchedProduct.id,
      matchedProduct.title,
      matchedProduct.stock_quantity,
      finalTotalQty, // Aggregated total unchanged physically but tracked
      transferAuditReason,
      transferSourceWhId,
      srcName
    );

    // Reset Transfer form
    setTransferProductId('');
    setTransferQty(1);
    setTransferNotes('حواله انتقال بابت شارژ موجودی ویترین مغازه');
    alert('حواله انتقال فیزیکی مابین انبارها با موفقیت صادر و ثبت شد.');
    refreshData();
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Submit Warehouse Profile CRUD
  const handleSaveWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCode.trim()) return;

    OfflineDatabase.saveWarehouse({
      id: editingWh?.id || undefined,
      name: whName.trim(),
      code: whCode.trim().toUpperCase(),
      location: whLocation.trim(),
      notes: whNotes.trim(),
      isActive: whIsActive
    });

    setEditingWh(null);
    setWhName('');
    setWhCode('');
    setWhLocation('');
    setWhNotes('');
    setWhIsActive(true);
    setShowWhModal(false);
    refreshData();
    alert('اطلاعات انبار (دپو) با موفقیت در سیستم پایدارسازی شد.');
  };

  const startEditWarehouse = (wh: Warehouse) => {
    setEditingWh(wh);
    setWhName(wh.name);
    setWhCode(wh.code);
    setWhLocation(wh.location || '');
    setWhNotes(wh.notes || '');
    setWhIsActive(wh.isActive);
    setShowWhModal(true);
  };

  const handleDeleteWarehouse = (id: string) => {
    if (id === 'wh_central' || id === 'wh_store') {
      alert('امکان حذف انبارهای پیش‌فرض و سیستمی وجود ندارد.');
      return;
    }

    if (confirm('آیا از حذف این انبار دپو اطمینان دارید؟ با حذف این انبار، سوابق فیزیکی و مقادیر ست شده بر پایه آن به بخش تعلیق انتقال می‌یابد.')) {
      const ok = OfflineDatabase.deleteWarehouse(id);
      if (ok) {
        refreshData();
        alert('انبار با موفقیت حذف شد.');
      }
    }
  };

  const formatToman = (val: number) => {
    return formatPrice(val);
  };

  const getProductPositionInContext = (p: Product, warehouseId: string) => {
    if (warehouseId === 'All') {
      const positions = p.warehouse_positions || {};
      const pairs = Object.entries(positions)
        .filter(([whId, pos]) => pos && pos.trim() !== '')
        .map(([whId, pos]) => {
          const whName = warehouses.find(w => w.id === whId)?.name || 'انبار';
          return `${whName}: ${pos}`;
        });
      return pairs.length > 0 ? pairs.join(' | ') : 'تعیین نشده 📍';
    }
    const positions = p.warehouse_positions || {};
    return positions[warehouseId] || 'تعیین نشده 📍';
  };

  // Aggregated calculations based on filtered warehouse stock context!
  const getProductQtyInContext = (p: Product, warehouseId: string) => {
    if (warehouseId === 'All') {
      return p.stock_quantity;
    }
    const stocks = p.warehouse_stocks || { wh_central: p.stock_quantity || 0 };
    return stocks[warehouseId] || 0;
  };

  // Calculate totals matching selected warehouse filter context!
  const currentTotalItemsCount = products.reduce((sum, p) => sum + getProductQtyInContext(p, selectedWarehouseFilter), 0);
  const lowStockProductsCount = products.filter(p => getProductQtyInContext(p, selectedWarehouseFilter) <= 10).length;
  const currentAssetsValuePurchase = products.reduce((sum, p) => sum + (p.purchase_price * getProductQtyInContext(p, selectedWarehouseFilter)), 0);
  const currentAssetsValueSale = products.reduce((sum, p) => sum + (p.sale_price * getProductQtyInContext(p, selectedWarehouseFilter)), 0);
  const currentExpectedProfit = currentAssetsValueSale - currentAssetsValuePurchase;

  const filteredProducts = products.filter(p => p.title.includes(searchQuery) || p.barcode.includes(searchQuery));

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 bg-slate-50 select-none" id="inventory-pane-master">
      
      {/* هدر بالایی صفحه */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="inv-panel-header">
        <div className="space-y-1 text-right">
          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 inline-flex items-center gap-1 font-mono">
            <Boxes className="w-3.5 h-3.5" /> Modern multi-depot grid system
          </span>
          <h2 className="text-lg font-black text-slate-800">کنترل موجودی انبار و سازماندهی دپوهای آریا</h2>
          <p className="text-xs text-slate-500 font-sans font-medium">
            تخصیص مجزای کالاها مابین انبارهای فیزیکی، ممیزی مغایرت‌های کاتالوگ و صدور حواله‌های رسمی ترخیص کالا
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-stretch md:self-auto">
          <button
            onClick={() => {
              setEditingWh(null);
              setWhName('');
              setWhCode('');
              setWhLocation('');
              setWhNotes('');
              setWhIsActive(true);
              setShowWhModal(true);
            }}
            className="flex-1 md:flex-initial py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            افزودن آدرس انبار جدید
          </button>
        </div>
      </div>

      {/* ناوبری دپارتمان تبرک‌ها */}
      <div className="flex border-b border-slate-205 pb-0.5 gap-2" id="inv-subtab-navigation">
        <button
          onClick={() => setActiveSubTab('levels')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubTab === 'levels' 
              ? 'border-indigo-505 border-indigo-600 text-indigo-705 text-indigo-600 bg-white shadow-3xs font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Boxes className="w-4 h-4" />
            سطوح تفصیلی موجودی انبارها ({filteredProducts.length} ردیف کالا)
          </div>
        </button>
        
        <button
          onClick={() => setActiveSubTab('transfer')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubTab === 'transfer' 
              ? 'border-indigo-505 border-indigo-600 text-indigo-705 text-indigo-600 bg-white shadow-3xs font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4" />
            صدور حواله انتقال بین انبارها
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('warehouses')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubTab === 'warehouses' 
              ? 'border-indigo-505 border-indigo-600 text-indigo-705 text-indigo-600 bg-white shadow-3xs font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <WarehouseIcon className="w-4 h-4" />
            سازماندهی شعب و انبارهای فیزیکی ({warehouses.length} آدرس دپو)
          </div>
        </button>
      </div>

      {/* ۱. تب اول: سطوح تفصیلی موجودی */}
      {activeSubTab === 'levels' && (
        <div className="space-y-6 animate-fade-in" id="inventory-levels-view">
          
          {/* بخش آمار بالایی فیلتر شده بر اساس کانتکست انبار */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="filtered-warehouse-stats">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">اقلام کلی موجود در فیلتر:</span>
                <strong className="text-base font-black text-slate-800 block font-mono">
                  {currentTotalItemsCount.toLocaleString('fa-IR')} قلم کالا
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">بر مبنای انبار انتخابی فعلی شما</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Boxes className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">کالاهای بحرانی حاضر (کمتر از ۱۰ عدد):</span>
                <strong className="text-base font-black text-amber-600 block font-mono">
                  {lowStockProductsCount} ردیف قطعات
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">نیازمند شارژ متمم فیزیکی سریع دپو</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">ارزش بهای دارایی فیزیکی (خرید):</span>
                <strong className="text-base font-black text-teal-650 block font-mono">
                  {currentAssetsValuePurchase.toLocaleString('fa-IR')} T
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">کل هزینه کرد مالی انباشته کالاها</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <BarChart4 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">برآورد حاشیه سود متصور:</span>
                <strong className="text-base font-black text-rose-600 block font-mono">
                  {currentExpectedProfit.toLocaleString('fa-IR')} T
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">مربوط به انبارداری و تراز خرده‌فروشی</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="inv-levels-topbar">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* کادر سرچ کاتالوگ */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">جستجوی کالا بر پایه عنوان یا بارکد:</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="مثلاً چای سیاه، کاله، فاکتور، بارکد..."
                    className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* کادر سلکت کانتکست انبار */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-indigo-700 font-sans">انتخاب و بررسی تفکیکی دپوی انبارگاه:</label>
                <select
                  value={selectedWarehouseFilter}
                  onChange={e => setSelectedWarehouseFilter(e.target.value)}
                  className="w-full p-2.5 border border-indigo-200 rounded-xl bg-indigo-50/20 text-xs text-indigo-900 font-black"
                >
                  <option value="All">نمایش تجمیعی کل موجودی (همگی انبارها)</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* جدول نمایش موجودی */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-3xs space-y-4" id="products-multi-wh-table-card">
              <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-2">
                لیست کاتالوگ و توزیع ذخیره کالایی
                <span className="text-[10px] text-slate-450 mr-2 font-normal font-sans">
                  (محاسبه بر اساس انبار: {selectedWarehouseFilter === 'All' ? 'همگی انبارها' : getFarsiWarehouseName(selectedWarehouseFilter)})
                </span>
              </h3>

              <div className="overflow-x-auto text-[11px]" id="levels-tbl-contextual">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 h-9 font-bold border-b border-slate-200">
                      <th className="p-2 w-12 text-center text-xs font-bold">ردیف</th>
                      <th className="p-2 text-xs font-bold">عنوان کالا</th>
                      <th className="p-2 text-center text-xs font-bold">بارکد</th>
                      <th className="p-2 text-right text-xs font-bold text-indigo-850">📍 جایگاه در قفسه انبار/ویترین</th>
                      <th className="p-2 text-left text-xs font-bold">ارزش خرید (T)</th>
                      <th className="p-2 text-left text-xs font-bold">ارزش فروش (T)</th>
                      <th className="p-2 text-left text-xs font-bold text-indigo-700">موجودی</th>
                      <th className="p-2 text-center w-12 text-xs font-bold">اصلاح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p, idx) => {
                      const qty = getProductQtyInContext(p, selectedWarehouseFilter);
                      const isOutOfStock = qty <= 0;
                      const isLow = qty <= 10;
                      const positionStr = getProductPositionInContext(p, selectedWarehouseFilter);
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 h-11 text-slate-800 animate-fade-in">
                          <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-extrabold text-slate-900">{p.title}</td>
                          <td className="p-2 text-center font-mono text-slate-400">{p.barcode || '---'}</td>
                          <td className="p-2 text-right">
                            <span className="text-[10px] font-sans font-black text-indigo-900 bg-indigo-50/60 px-2 py-0.8 rounded-lg border border-indigo-150 inline-block max-w-[200px] truncate" title={positionStr}>
                              📍 {positionStr}
                            </span>
                          </td>
                          <td className="p-2 text-left font-mono">{p.purchase_price.toLocaleString('fa-IR')}</td>
                          <td className="p-2 text-left font-mono font-semibold">{p.sale_price.toLocaleString('fa-IR')}</td>
                          <td className="p-2 text-left font-mono">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                              isOutOfStock 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : isLow 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-black'
                            }`}>
                              {qty} {p.unit}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedProductIdForAdjustment(p.id);
                                const targetWhId = selectedWarehouseFilter === 'All' ? 'wh_central' : selectedWarehouseFilter;
                                setAdjustWarehouseId(targetWhId);
                                setAdjustQty(1);
                                setAdjustPositionStr(p.warehouse_positions?.[targetWhId] || '');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline cursor-pointer"
                            >
                              کالیبره
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                          هیچ کالایی متناسب با واژه سرچ کارتابل یافت نگردید.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ساید اینپوت: فرم تعدیل دستی یک کالا در انبار انتخابی */}
            <div className="lg:col-span-4 space-y-6" id="inventory-correction-form-pane">
              {selectedProductIdForAdjustment ? (
                <div className="bg-white rounded-3xl border border-indigo-200 p-5 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                    <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
                      <ClipboardList className="w-4.5 h-4.5" />کالیبراسیون و اصلاح مستقل انبار
                    </h4>
                    <button 
                      onClick={() => setSelectedProductIdForAdjustment('')}
                      className="text-slate-400 hover:text-red-500 font-bold text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs text-right">
                    <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
                      <span className="text-[9.5px] text-indigo-550 block font-normal">کالای انتخابی جهت تعدیل:</span>
                      <strong className="text-xs font-black text-indigo-900 block mt-1">
                        {products.find(p => p.id === selectedProductIdForAdjustment)?.title}
                      </strong>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">انبار فیزیکی هدف جهت اعمال:</label>
                      <select
                        value={adjustWarehouseId}
                        onChange={e => setAdjustWarehouseId(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
                      >
                        {warehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">نوع ممیزی تعدیل:</label>
                      <div className="flex bg-slate-150 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setAdjustType('increase')}
                          className={`flex-1 py-1.8 rounded-lg text-[10px] font-black transition ${
                            adjustType === 'increase' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          افزایش (اموال تازه / ورود)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustType('decrease')}
                          className={`flex-1 py-1.8 rounded-lg text-[10px] font-black transition ${
                            adjustType === 'decrease' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          کاهش (مغایرت/کسری/خرابی)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-550 mb-1">میزان تعداد:</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={adjustQty}
                          onChange={e => setAdjustQty(Number(e.target.value))}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-left font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-550 mb-1">جهت توجیه تعدیل:</label>
                        <select
                          value={adjustReason}
                          onChange={e => setAdjustReason(e.target.value)}
                          className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-750 font-bold"
                        >
                          <option value="انبارگردانی سالانه و بازشماری ممتد">بازشماری رسمی انبار</option>
                          <option value="ضایعات کالا، تخریب بار و تاریخ گذشته">تخریب، ضایعات و فساد</option>
                          <option value="سرقت یا مفقودی قطعات دپو">کسری مفقودی یا سرقت</option>
                          <option value="برگشت از فروش مشتری و عودت کالا">تعدیل برگشت کالا فیزیکی</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-150 rounded-xl">
                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">📍 موقعیت دقیق فیزیکی در این انبار:</label>
                      <input
                        type="text"
                        placeholder="مشخصه قفسه‌بندی (مثال: ردیف ۲، قفسه ۴)"
                        value={adjustPositionStr}
                        onChange={e => setAdjustPositionStr(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      ثبت اصلاحیه و ممیزی موجودی 💾
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-3xl border border-dashed border-slate-250 p-6 text-center text-slate-450 space-y-2">
                  <ClipboardList className="w-8 h-8 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">کارگزینی کالیبراسیون و اصلاح دستی موجودی</p>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    جهت اعمال مغایرت انبارگردانی برای یک کالا در دپوی خاص، بر روی دکمه «کالیبره» در جدول موجودی روبرو کلیک کنید تا پنل ویرایش باز شود.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* چارت عارضه‌یابی و بررسی سلامت فرآیندهای انبارداری آریا */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-3xs space-y-4" id="warehouse-audit-chart-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ClipboardList className="text-indigo-600 w-5 h-5" />
              <div className="text-right">
                <h4 className="font-black text-xs text-slate-800">📊 چارت تراز و عارضه‌یابی جامع سیستم انبارداری (سازگار با محیط دسکتاپ ویندوز)</h4>
                <p className="text-[10px] text-slate-400 font-sans">کنترل نارسایی‌ها، تجهیزات فیزیکی تایید شده و الزامات فنی نرم‌افزار</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-right">
              {/* بخش اول: وضعیت هسته سیستم */}
              <div className="p-3 bg-emerald-50/45 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-emerald-950 text-[11px]">۱. بستر داده و ذخیره‌سازی ممتد</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold">فعال و تایید شده</span>
                </div>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  سیستم به قابلیت <strong className="text-emerald-800">Hybrid Storage</strong> مجهز گردید. داده‌ها علاوه بر مرورگر، به صورت خودکار بر روی هارد دیسک ویندوز در فایل دسکتاپی <code className="font-mono bg-white px-1 border border-slate-200 rounded text-[9.5px]">shop_database.json</code> ذخیره و پایدار می‌شوند.
                </p>
                <div className="text-[9.5px] text-emerald-755 font-bold flex items-center gap-1 text-emerald-700">
                  ✓ امنیت بومی لود داده دسکتاپ ویندوز برقرار است.
                </div>
              </div>

              {/* بخش دوم: سیستم قفسه برداری و موقعیت کالا */}
              <div className="p-3 bg-indigo-50/45 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-indigo-950 text-[11px]">۲. مکان‌یابی کالاها در انبار و ویترین</span>
                  <span className="bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded font-bold">کامل و ارتقا یافته</span>
                </div>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  مکانیزم اختصاص مستقل قفسه به هر کالا بر اساس شناسه جداگانه انبار ویترین مغازه و انبار مرکزی فعال است. امکان ویرایش قفسه و جایگاه فیزیکی چه متمم فرم افزودن کالا و چه از طریق کالیبراسیون فوری پیاده‌سازی گشت.
                </p>
                <div className="text-[9.5px] text-indigo-755 font-bold flex items-center gap-1 text-indigo-700">
                  ✓ ثبت تفکیکی چیدمان قفسه‌ها فعال می‌باشد.
                </div>
              </div>

              {/* بخش سوم: نیازمندی‌های فیزیکی مغازه (عارضه‌یابی) */}
              <div className="p-3 bg-amber-50/65 rounded-2xl border border-amber-150 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-amber-955 text-[11px]">۳. نیازمندی فیزیکی و چاپ فاکتور</span>
                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold">توصیه سخت‌افزاری</span>
                </div>
                <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
                  پرینترهای حرارتی فاکتور ۸۰ میلی‌متری مغازه از طریق سرویس چاپ با فرمان بومی بوندلر <code className="font-mono bg-white px-1 text-[9.5px]">printInvoice</code> سازگار شده‌اند. برای بارکدخوان فیزیکی تفنگ لیزری مغازه، از فیلد اسکن سریع بارکد متمم برنامه استفاده کنید.
                </p>
                <div className="text-[9.5px] text-amber-855 font-bold flex items-center gap-1 text-amber-800">
                  ⚠️ اتصال بارکدخوان دستی از طریق پروتکل صفحه‌کلید (KB) توصیه می‌شود.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ۲. تب دوم: حواله جابجایی مابین دپوها */}
      {activeSubTab === 'transfer' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 max-w-2xl mx-auto text-right animate-fade-in" id="inter-depot-transfer">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">حواله رسمی نقل‌وانتقال متمم کالا بومی</h3>
              <p className="text-[10.5px] text-slate-400">جابجایی کانتکست بین انبارهای توزیع به ویترین جلویی با حفظ لاگ و مسئول تراکنش</p>
            </div>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4 text-xs">
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">۱. محصول مورد نظر جهت جابجایی دپو:</label>
              <select
                required
                value={transferProductId}
                onChange={e => setTransferProductId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-bold"
              >
                <option value="">-- انتخاب کالا از کاتالوگ فروشگاه --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} (کل کارتن‌های دپو: {p.stock_quantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">۲. انبار فیزیکی مبدا (دپوی کسر کالا):</label>
                <select
                  value={transferSourceWhId}
                  onChange={e => setTransferSourceWhId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">۳. انبار فیزیکی مقصد (دپوی ورود کالا):</label>
                <select
                  value={transferDestWhId}
                  onChange={e => setTransferDestWhId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">۴. تعداد فیزیکی جهت حواله:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={e => setTransferQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-left font-mono focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 font-sans">بابت توجیه حواله انتقال:</label>
                <input
                  type="text"
                  required
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="شارژ قفسه‌های صنف پوز..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-[11px] text-indigo-800 leading-relaxed font-sans font-medium space-y-1">
              <strong className="text-indigo-950 font-black block text-xs">قوانین و تراز فرآیندهای انتقال:</strong>
              <p>۱. سیستم کلاک فعال حسابرسی، صحت ترخیص از انبار صنف دپوی مبدا را قبل از انتقال سنجیده و در صورت کمبود مقدار، انتقال منقضی می‌گردد.</p>
              <p>۲. ثبت تراکنش با برچسب انتقال دپو به صورت مجزا در بخش «بایگانی تراکنش‌های انباردار» درج می‌شود.</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              ثبت حواله قطعی انتقال دپو و موازنه فیزیکی 🔗
            </button>
            
          </form>
        </div>
      )}

      {/* ۳. تب سوم: سازماندهی شعب و دپوها */}
      {activeSubTab === 'warehouses' && (
        <div className="space-y-6 animate-fade-in" id="warehouses-profile-vault">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="warehouses-grid">
            {warehouses.map(wh => (
              <div key={wh.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 transition relative flex flex-col justify-between" id={`wh-card-${wh.id}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        کد شعبه: {wh.code}
                      </span>
                      <strong className="text-sm font-black text-slate-800 block mt-1.5">{wh.name}</strong>
                    </div>
                    {wh.id === 'wh_central' || wh.id === 'wh_store' ? (
                      <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-1.5 py-0.5 rounded">
                        انبار پیش‌فرض سیستم 🔒
                      </span>
                    ) : (
                      <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 font-bold px-1.5 py-0.5 rounded">
                        انبار افزوده جانبی 📦
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[10.5px] text-slate-605">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>آدرس دپو:</strong> {wh.location || 'فاقد لوکیشن ثبت شده'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug bg-slate-50 p-2 rounded-xl">
                      <strong>توضیحات سازماندهی:</strong> {wh.notes || 'فاقد یادداشت توضیحی متمم.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px]">
                  <button
                    onClick={() => startEditWarehouse(wh)}
                    className="px-3 py-1.5 border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer bg-white flex items-center gap-1 font-bold shadow-3xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    ویرایش پرونده انبار
                  </button>
                  {wh.id !== 'wh_central' && wh.id !== 'wh_store' && (
                    <button
                      onClick={() => handleDeleteWarehouse(wh.id)}
                      className="px-3 py-1.5 border border-slate-200 hover:border-red-500 hover:bg-neutral-50 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer bg-white font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* مودال ایجاد و اصلاح مشخصات انبار دپو */}
      {showWhModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in" id="wh-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative space-y-4 text-right" id="wh-form-box">
            
            <button
              onClick={() => setShowWhModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              {editingWh ? 'اصلاح پوشه مشخصات پایگاه دپوی کالا' : 'افزودن نام پایگاه انبار/دپو رسمی'}
            </h3>

            <form onSubmit={handleSaveWarehouseSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نام رسمی انبار (مثلا انبار فرعی ویترین):</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={e => setWhName(e.target.value)}
                  placeholder="انبار طبقه بالا، شعبه خاوران..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">کد انشار و رفرنس انبارداری (مثل WH-03):</label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={e => setWhCode(e.target.value)}
                  placeholder="WH-03..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">آدرس فیزیکی دقیق جغرافیایی:</label>
                <input
                  type="text"
                  value={whLocation}
                  onChange={e => setWhLocation(e.target.value)}
                  placeholder="خیابان یا مجتمع تجاری..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">یادداشت‌های مالی/مدیریتی انبار:</label>
                <textarea
                  value={whNotes}
                  onChange={e => setWhNotes(e.target.value)}
                  placeholder="مسئول نگهبان، ظرفیت کارتن های مجاز فیزیکی..."
                  rows={2.5}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  ذخیره سازی انبار دپو در کارتابل 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhModal(false)}
                  className="py-2.5 px-4 bg-slate-150 text-slate-600 text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
