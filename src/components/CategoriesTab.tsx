import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Category, Product, Service } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Edit2, Trash2, 
  Tag, Clock, Check, Search, Layers, Star, Info, HelpCircle, AlertTriangle, 
  X, BarChart3, ShoppingBag, Eye, StarOff, Sparkles
} from 'lucide-react';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // جستجو و درخت
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // فیلدهای فرم ویرایشگر متمم
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [parentId, setParentId] = useState('');
  const [catType, setCatType] = useState<'product' | 'service' | 'both'>('product');
  const [catDescription, setCatDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [catIcon, setCatIcon] = useState('');
  const [catIconPng, setCatIconPng] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    const catsList = OfflineDatabase.getCategories();
    const prodsList = OfflineDatabase.getProducts();
    const srvsList = OfflineDatabase.getServices();

    setCategories(catsList);
    setProducts(prodsList);
    setServices(srvsList);

    // به صورت پیش‌فرض ریشه‌ها را تاشو باز بگذاریم
    const roots = catsList.filter(c => !c.parentId);
    const initialExpanded = new Set<string>();
    roots.forEach(r => initialExpanded.add(r.id));
    setExpandedNodes(initialExpanded);
  };

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
  };

  const handleEditCategory = (cat: Category) => {
    setCatId(cat.id);
    setCatName(cat.name);
    setParentId(cat.parentId || '');
    setCatType(cat.type);
    setCatDescription(cat.description || '');
    setIsImportant(!!cat.isImportant);
    setCatIcon(cat.icon || '');
    setCatIconPng(cat.iconPng || '');
    
    // اسکرول نرم به فرم ویرایش در صفحات کوچک
    const formElement = document.getElementById('category-editor-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetCategoryForm = () => {
    setCatId('');
    setCatName('');
    setParentId('');
    setCatType('product');
    setCatDescription('');
    setIsImportant(false);
    setCatIcon('');
    setCatIconPng('');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('لطفاً عنوان دسته‌بندی معتبری وارد نمایید.');
      return;
    }

    if (catId && parentId === catId) {
      alert('خطا: یک دسته‌بندی نمی‌تواند زیرمجموعه یا والد خودش باشد!');
      return;
    }

    // فرستادن اطلاعات به متد ذخیره‌ساز دیتابیس
    OfflineDatabase.saveCategory({
      id: catId ? catId : undefined,
      name: catName.trim(),
      parentId: parentId || undefined,
      type: catType,
      description: catDescription.trim(),
      isImportant: isImportant,
      icon: catIcon || undefined,
      iconPng: catIconPng || undefined
    });

    const actionText = catId ? 'بروزرسانی شد' : 'ثبت گردید';
    setSuccessMsg(`دسته‌بندی "${catName.trim()}" با موفقیت ${actionText}.`);
    
    resetCategoryForm();
    refreshAllData();

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const associatedProds = products.filter(p => p.category_id === id);
    const associatedSrvs = services.filter(s => s.category_id === id);
    const childrenCount = categories.filter(c => c.parentId === id).length;

    let warningMsg = `آیا مایلید دسته‌بندی "${name}" را حذف کنید؟\n`;
    if (childrenCount > 0) {
      warningMsg += `⚠️ این دسته‌بندی دارای ${childrenCount} زیرمجموعه فعال است که فرزند معلق در ریشه خواهند شد!\n`;
    }
    if (associatedProds.length > 0) {
      warningMsg += `⚠️ تعداد ${associatedProds.length} کالا مستقیماً روی این دسته‌بندی هستند که پس از حذف بدون دسته‌بندی می‌شوند!\n`;
    }
    if (associatedSrvs.length > 0) {
      warningMsg += `⚠️ تعداد ${associatedSrvs.length} خدمت مستقیماً روی این دسته‌بندی هستند!\n`;
    }

    if (confirm(warningMsg)) {
      OfflineDatabase.deleteCategory(id);
      resetCategoryForm();
      refreshAllData();
      setSuccessMsg('دسته‌بندی حذف گردید و کارهای مرتبط آزادسازی شدند.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // گرفتن آمار اقلام متعلق به دسته‌بندی (شامل خود و زیرشاخه‌ها)
  const getCategoryStats = (catId: string) => {
    // جمع‌آوری تمامی زیرشاخه‌ها به صورت بازگشتی
    const getSubIds = (id: string): string[] => {
      const children = categories.filter(c => c.parentId === id);
      return [id, ...children.flatMap(ch => getSubIds(ch.id))];
    };

    const allBranchIds = getSubIds(catId);
    const prodCount = products.filter(p => p.category_id && allBranchIds.includes(p.category_id)).length;
    const srvCount = services.filter(s => s.category_id && allBranchIds.includes(s.category_id)).length;
    
    // موجودی فیزیکی کل کالاهای این دسته
    const totalStock = products
      .filter(p => p.category_id && allBranchIds.includes(p.category_id))
      .reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

    return { prodCount, srvCount, totalStock };
  };

  // تهیه آپشن‌های مجاز والدهای درخت (برای حذف حلقه لوپ خود-والدی)
  const availableParents = categories.filter(c => !catId || c.id !== catId);

  // جستجوی بومی در کلمات کلیدی دسته‌بندی‌ها
  const filteredCategoriesForTree = searchQuery.trim() === ''
    ? categories
    : categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // تابع بازگشتی رندر گام‌به‌گام درخت در UI
  const renderTreeNodes = (parentIdVal: string | undefined, depth: number) => {
    const nodes = filteredCategoriesForTree.filter(c => c.parentId === parentIdVal || (!parentIdVal && !c.parentId));
    
    if (nodes.length === 0) return null;

    return (
      <div className={`space-y-2.5 ${depth > 0 ? 'mr-6 border-r border-dashed border-slate-200 pr-4 mt-1.5' : ''}`}>
        {nodes.map(node => {
          const hasChildren = categories.some(child => child.parentId === node.id);
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = catId === node.id;
          const stats = getCategoryStats(node.id);
          
          return (
            <div key={node.id} className="relative" id={`tree-node-${node.id}`}>
              {/* بدنه سطر گره */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-3.5 rounded-2xl border transition-all ${
                isSelected 
                  ? 'bg-sky-50 shadow-xs border-sky-300 text-sky-950' 
                  : node.isImportant
                    ? 'bg-amber-50/40 border-amber-200 hover:bg-slate-100/50'
                    : 'bg-white border-slate-150 hover:bg-slate-50 hover:shadow-2xs'
              }`}>
                
                {/* بخش اطلاعات گره */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* دکمه باز و بسته کردن تاشو */}
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleNode(node.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer shrink-0 transition"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <span className="w-6 flex justify-center text-slate-300 select-none text-[8px] font-sans">●</span>
                  )}

                  {/* آیکون دسته بندی بر حسب نوع */}
                  <span className="shrink-0 flex items-center justify-center">
                    {node.iconPng ? (
                      <img src={node.iconPng} className="w-5 h-5 object-contain rounded border border-slate-205 bg-white" alt={node.name} referrerPolicy="no-referrer" />
                    ) : node.icon ? (
                      (() => {
                        const LucideIcon = (LucideIcons as any)[node.icon];
                        return LucideIcon ? <LucideIcon className="w-4.5 h-4.5 text-sky-600" /> : <Tag className="w-4.5 h-4.5 text-sky-600" />;
                      })()
                    ) : node.type === 'service' ? (
                      <Clock className="w-4 h-4 text-purple-500" />
                    ) : hasChildren ? (
                      isExpanded ? <FolderOpen className="w-4.5 h-4.5 text-amber-500" /> : <Folder className="w-4.5 h-4.5 text-amber-500" />
                    ) : (
                      <Tag className="w-4 h-4 text-sky-505" />
                    )}
                  </span>

                  {/* نام و دکمه ویرایش مستقیم */}
                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => handleEditCategory(node)}
                        className={`text-xs font-black hover:underline cursor-pointer truncate ${
                          isSelected ? 'text-sky-700' : 'text-slate-800'
                        }`}
                      >
                        {node.name}
                      </span>
                      {node.isImportant && (
                        <span className="bg-amber-100 text-amber-800 text-[8.5px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5 shadow-2xs border border-amber-200 animate-pulse">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          مهم / پرفروش اول
                        </span>
                      )}
                    </div>
                    {node.description && (
                      <p className="text-[9.5px] text-slate-400 mt-0.5 truncate max-w-xs md:max-w-md font-sans">
                        {node.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* آمار، نشانگرها و دکمه‌های کنترلی */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {/* شمارنده‌ها */}
                  <div className="flex gap-1.5 text-[9px] font-sans" id={`stats-indicators-${node.id}`}>
                    {node.type !== 'service' && stats.prodCount > 0 && (
                      <span className="bg-slate-100 text-slate-600 px-1.8 py-0.6 rounded-lg font-bold border border-slate-200">
                        📦 {stats.prodCount} کالا ({stats.totalStock} عدد)
                      </span>
                    )}
                    {node.type !== 'product' && stats.srvCount > 0 && (
                      <span className="bg-purple-50 text-purple-700 px-1.8 py-0.6 rounded-lg font-bold border border-purple-100">
                        🔧 {stats.srvCount} خدمت
                      </span>
                    )}
                    {stats.prodCount === 0 && stats.srvCount === 0 && (
                      <span className="text-slate-350 bg-slate-50 px-1.5 py-0.5 rounded text-[8.5px]">
                        خالی
                      </span>
                    )}
                  </div>

                  {/* دکمه‌های عملیاتی گره */}
                  <div className="flex gap-1 bg-slate-50 border border-slate-150 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        resetCategoryForm();
                        setParentId(node.id);
                        setCatType(node.type);
                        const editor = document.getElementById('category-editor-form');
                        if (editor) editor.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-1 px-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg hover:shadow-3xs border border-transparent hover:border-slate-150 transition cursor-pointer flex items-center gap-0.5"
                      title="افزودن مستقیم زیرمجموعه"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="text-[8px] font-bold">زیرشاخه‌ جدید</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCategory(node)}
                      className="p-1 text-slate-400 hover:text-sky-655 hover:bg-white rounded-lg hover:shadow-3xs transition cursor-pointer"
                      title="ویرایش کل شناسنامه"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(node.id, node.name)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg hover:shadow-3xs transition cursor-pointer"
                      title="حذف شاخه"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                </div>

              </div>
              
              {/* رندر تودرتوی بازگشتی فرزندان */}
              {hasChildren && isExpanded && renderTreeNodes(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6" id="categories-tab-layout">
      
      {/* هدر بخش دسته‌بندی پیشرفته */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4" id="categories-hero">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" />
            <h2 className="font-black text-lg">طبقه‌بندی سلسله‌مراتبی و خانواده کالا و خدمات</h2>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            ایجاد غرفه‌ها، خانواده‌های کالایی و دسته‌های خدمات در ساختار درختی هوشمند با قابلیت فیلترینگ کاروسل چپ و راست کششی
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 text-center shrink-0">
            <div className="text-lg font-mono font-black text-sky-400">{categories.length}</div>
            <div className="text-[10px] text-slate-350">کل شاخه‌ها</div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 text-center shrink-0">
            <div className="text-lg font-mono font-black text-amber-400">
              {categories.filter(c => c.isImportant).length}
            </div>
            <div className="text-[10px] text-slate-350">پرفروش و مهم</div>
          </div>
        </div>
      </div>

      {/* الرت اعلان تغییرات */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs py-3 px-4 rounded-2xl font-bold text-right flex items-center gap-2 animate-bounce-slow" id="categories-notification">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* چیدمان ستونی دوتایی */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ستون راست: درخت زیبا به همراه ابزار جستجو */}
        <div className="col-span-1 xl:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3.1 gap-2">
            <div>
              <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-sky-600" />
                کاتالوگ و چارت درخت دسته‌ها
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">درخت سلسله‌مراتب کالاها و خدمات فروشگاه شما</p>
            </div>

            {/* نوار جستجوی کاتالوگی */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی سریع شناسه یا نام..."
                className="w-full text-xs pr-8 pl-3 py-1.8 bg-slate-50 border border-slate-180 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500/35"
              />
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-[9.5px] text-slate-500 font-sans">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              برای ایجاد زیرشاخه، روی دکمه‌ی «زیرشاخه‌ جدید» متعلق به آن دسته کلیک کنید.
            </span>
            <button
              type="button"
              onClick={() => {
                const allIds = categories.map(c => c.id);
                setExpandedNodes(expandedNodes.size === allIds.length ? new Set() : new Set(allIds));
              }}
              className="text-sky-600 font-black hover:underline cursor-pointer"
            >
              {expandedNodes.size === categories.length ? '◀ بستن همه شاخه‌ها' : '▼ گسترش کامل درخت'}
            </button>
          </div>

          <div className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-400 italic">هیچ دسته‌بندی فعالی ثبت نشده است.</div>
            ) : (
              renderTreeNodes(undefined, 0)
            )}
          </div>
        </div>

        {/* ستون چپ: فرم ایجاد یا ویرایش دسته‌بندی */}
        <div 
          id="category-editor-form"
          className="col-span-1 xl:col-span-5 bg-white border border-slate-205 rounded-3xl p-5 shadow-xs flex flex-col space-y-4"
        >
          <div className="flex justify-between items-center border-b pb-3.5">
            <h3 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4.5 h-4.5 text-sky-550" />
              {catId ? 'فرم تغییر شناسنامه شاخه انتخابی' : 'ثبت دسته‌بندی هوشمند جدید'}
            </h3>
            {catId && (
              <button
                type="button"
                onClick={resetCategoryForm}
                className="text-[10px] text-red-500 bg-red-50 hover:bg-red-100 rounded-lg px-2 py-1 font-bold shrink-0 transition"
              >
                لغو تغییر شاخه
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            
            {/* عنوان دسته‌بندی */}
            <div>
              <label className="block text-[10.5px] font-black text-slate-700 mb-1">نام یا عنوان فارسی دسته‌بندی:</label>
              <input
                type="text"
                required
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="مثال: روغن لادن، چای کلکته اصل، شوینده فیزیکی"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500/35 font-semibold text-slate-800"
              />
            </div>

            {/* والد آن در ساختار درختی */}
            <div>
              <label className="block text-[10.5px] font-black text-slate-700 mb-1">جاگذاری در سلسله‌مراتب (انتخاب والد):</label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer text-slate-700 font-sans"
              >
                <option value="">دسته اصلی مستقل (ریشه - Root Node)</option>
                {availableParents.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? '┠ ' : '■ '} {c.name} ({c.type === 'product' ? 'کالا' : c.type === 'service' ? 'خدمت' : 'هر دو'})
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-slate-400 mt-1 block">رعایت ساختار درختی به پوز فروش سریع شما نظم می‌دهد.</span>
            </div>

            {/* نوع وابستگی اقلام */}
            <div>
              <label className="block text-[10.5px] font-black text-slate-700 mb-1.5">نوع قلم واگذاری:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['product', 'service', 'both'] as const).map(typeKey => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setCatType(typeKey)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                      catType === typeKey
                        ? 'bg-sky-50 text-sky-700 border-sky-400 ring-2 ring-sky-500/10'
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {typeKey === 'product' ? '📦 کالاها' : typeKey === 'service' ? '🔧 خدمات' : '🌐 عمومی'}
                  </button>
                ))}
              </div>
            </div>

            {/* اولویت پرفروش و مهم */}
            <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-2xl flex items-center justify-between gap-3 select-none">
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-900 block flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  برچسب دسته مهم و پرفروش اول‌کاتالوگ
                </span>
                <span className="text-[9.5px] text-amber-700 block mt-0.5 font-sans">
                  برای سرفصل های کلیدی، قله‌های فروش یا فیلترهای چپ‌وراست پرکاربرد
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportant(!isImportant)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border tracking-tight transition shrink-0 cursor-pointer ${
                  isImportant
                    ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                }`}
              >
                {isImportant ? '⭐ فعال شد' : '☆ غیرفعال'}
              </button>
            </div>

            {/* انتخاب آیکون آفلاین یا PNG سفارشی */}
            <div className="border border-slate-200/80 p-4 rounded-2xl bg-slate-50/50 space-y-3">
              <span className="text-[10.5px] font-black text-slate-700 block flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-sky-505" />
                آیکون دسته‌بندی (آفلاین یا لینک PNG سفارشی)
              </span>

              {/* جستجوگر آیکون‌های آفلاین */}
              <div className="space-y-2">
                <label className="block text-[9.5px] font-bold text-slate-505">جستجو و انتخاب آیکون فونت آفلاین (Lucide):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    id="icon-search-input"
                    placeholder="فیلتر آیکون‌ها (مانند Store, Tag, Coffee)..."
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase();
                      const items = document.querySelectorAll('.offline-icon-item');
                      items.forEach((item) => {
                        const name = item.getAttribute('data-name') || '';
                        if (name.toLowerCase().includes(val)) {
                          (item as HTMLElement).style.display = 'flex';
                        } else {
                          (item as HTMLElement).style.display = 'none';
                        }
                      });
                    }}
                    className="col-span-2 text-[10.5px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500/35"
                  />
                </div>

                <div className="max-h-[120px] overflow-y-auto border border-slate-150 rounded-xl bg-white p-2 grid grid-cols-5 gap-1.5" id="offline-icons-container">
                  {[
                    'ShoppingBag', 'Tag', 'Coffee', 'Laptop', 'Baby', 'Beef', 'Cookie', 'GlassWater',
                    'Book', 'Clock', 'Heart', 'Home', 'Shirt', 'Sparkles', 'Wrench', 'Scissors',
                    'Activity', 'Apple', 'Gift', 'Truck', 'Settings', 'Layers', 'Video', 'Phone',
                    'MapPin', 'User', 'Gamepad', 'Smile', 'Flame', 'Folder', 'Printer', 'Coins',
                    'DollarSign', 'Package', 'Box', 'Key', 'Cpu', 'TrendingUp', 'Wallet', 'Store',
                    'Camera', 'Music', 'Wine', 'Tv', 'Pill', 'Plug', 'BookOpen', 'Glasses', 'Feather', 'Dumbbell', 'Scale'
                  ].map((iconName) => {
                    const LucideIcon = (LucideIcons as any)[iconName];
                    const isSelected = catIcon === iconName && !catIconPng;
                    if (!LucideIcon) return null;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        data-name={iconName}
                        onClick={() => {
                          setCatIcon(iconName);
                          setCatIconPng('');
                        }}
                        title={iconName}
                        className={`offline-icon-item flex flex-col items-center justify-center p-1.5 rounded-lg border transition hover:bg-slate-50 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 border-sky-400 text-sky-700 ring-1 ring-sky-305'
                            : 'bg-white border-slate-150 text-slate-500'
                        }`}
                      >
                        <LucideIcon className="w-4 h-4 shrink-0" />
                        <span className="text-[7.5px] truncate max-w-full mt-0.5">{iconName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* آپشن اضافه کردن لینک تصویر PNG */}
              <div className="space-y-2 pt-2 border-t border-slate-205">
                <label className="block text-[9.5px] font-bold text-slate-505">یا آدرس مستقیم تصویر لوگو/پی‌ان‌جی (PNG Custom URL):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={catIconPng}
                    onChange={(e) => {
                      setCatIconPng(e.target.value);
                      if (e.target.value) setCatIcon('');
                    }}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 text-[11px] px-3 py-1.8 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500/35 text-left font-mono"
                  />
                  {catIconPng && (
                    <div className="w-9 h-9 border border-slate-200 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                      <img src={catIconPng} alt="Preview" className="w-7 h-7 object-contain" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                <span className="text-[8.5px] text-slate-400 block leading-normal">برای تصویر سفارشی، آدرس کامل عکس (png) در اینترنت را وارد کنید. با پر کردن این فیلد، آیکون بالا نادیده گرفته می‌شود.</span>
              </div>
            </div>

            {/* توضیحات */}
            <div>
              <label className="block text-[10.5px] font-black text-slate-700 mb-1">شرح یا توضیحات تکمیلی:</label>
              <textarea
                rows={2}
                value={catDescription}
                onChange={e => setCatDescription(e.target.value)}
                placeholder="توضیحات غرفه، شرایط، یا نگارش لجستیکی انبار..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500/35 text-slate-700"
              />
            </div>

            {/* ثبت و تایید */}
            <div className="pt-2 border-t flex gap-2">
              {catId && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(catId, catName)}
                  className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 py-3 rounded-xl text-xs font-black transition cursor-pointer border border-rose-200"
                >
                  حذف این شاخه
                </button>
              )}
              <button
                type="submit"
                className="flex-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl text-xs text-center shadow-md shadow-sky-500/10 hover:shadow-sky-500/15 transition cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-white" />
                {catId ? 'اعمال دائم تغییرات شاخه' : 'ثبت غرفه‌ / دسته‌بندی جدید'}
              </button>
            </div>

          </form>

          {/* پنل اطلاعات کمکی */}
          <div className="bg-slate-50 border rounded-2xl p-3 text-[10px] text-slate-400 space-y-1 font-sans">
            <h5 className="font-extrabold text-slate-500">مزیت سیستم درختی چیست؟</h5>
            <p className="leading-relaxed">
              با ایجاد زیردسته‌ها، در فیلترها و صندوق‌های POS محصولات به طور سلسله‌مراتبی سازماندهی شده و می‌توانید آمارهای تفکیکی و مدیریت بهتری بر جریان لجستیک انبار داشته باشید.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
