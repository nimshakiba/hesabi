import React, { useState, useEffect } from 'react';
import { SettingsService, AppSettings, DEFAULT_SETTINGS } from '../utils/settings';
import { OfflineDatabase } from '../db/offlineDb';
import InvoiceDesignerSubTab from './InvoiceDesignerSubTab';
import { 
  Sliders, 
  Printer, 
  Store, 
  Check, 
  RefreshCw, 
  Palette, 
  FileText, 
  Smartphone,
  Save,
  AlertCircle,
  Sparkles,
  Activity,
  Trash2,
  Search,
  Clock,
  Database,
  Barcode
} from 'lucide-react';

interface SettingsTabProps {
  activeSubTab?: string;
}

export default function SettingsTab({ activeSubTab = 'settings-app' }: SettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentTab, setCurrentTab] = useState<string>(activeSubTab);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [logsList, setLogsList] = useState<any[]>([]);
  const [searchLogText, setSearchLogText] = useState<string>('');
  const [filterLogUser, setFilterLogUser] = useState<string>('all');
  const [filterLogAction, setFilterLogAction] = useState<string>('all');
  const [systemPrinters, setSystemPrinters] = useState<{name: string, isDefault: boolean}[]>([]);

  const activeUserRaw = localStorage.getItem('shop_accounting_active_user');
  const activeUser = activeUserRaw ? JSON.parse(activeUserRaw) : null;
  const isAdmin = activeUser?.role === 'Admin';

  useEffect(() => {
    if (currentTab === 'settings-logs') {
      const allLogs = OfflineDatabase.getUserLogs();
      const sorted = [...allLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogsList(sorted);
    }
  }, [currentTab]);

  const filteredLogs = logsList.filter(log => {
    if (searchLogText.trim() && !log.description?.toLowerCase().includes(searchLogText.toLowerCase())) {
      return false;
    }
    if (filterLogUser !== 'all' && log.username !== filterLogUser && log.userFullName !== filterLogUser) {
      return false;
    }
    if (filterLogAction !== 'all' && log.actionType !== filterLogAction) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    // Sync tab when prop changes
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    setSettings(SettingsService.get());

    // دریافت مسیر دیتابیس فعال بومی
    const getActiveDb = async () => {
      try {
        let activePath = '';
        if (window.dbAPI?.getDbPath) {
          activePath = await window.dbAPI.getDbPath();
        } else {
          const res = await fetch('./api/db/get-path').then(r => r.json());
          if (res.success) activePath = res.dbPath;
        }
        if (activePath) {
          setSettings(prev => ({ ...prev, dbPath: activePath }));
        }
      } catch (err) {
        console.error("خطا در فراخوانی آدرس دیتابیس:", err);
      }
    };
    getActiveDb();

    // دریافت لیست پرینترهای واقعی سیستم عامل
    if (window.dbAPI?.getPrinters) {
      window.dbAPI.getPrinters().then(list => {
        if (list && list.length > 0) {
          setSystemPrinters(list);
        } else {
          setSystemPrinters([
            { name: 'Samsung SL-M2020 Series', isDefault: true },
            { name: 'HP LaserJet M111w', isDefault: false },
            { name: 'Microsoft Print to PDF', isDefault: false }
          ]);
        }
      });
    } else {
      setSystemPrinters([
        { name: 'Samsung J7-1600 (شبیه‌ساز سیستم)', isDefault: true },
        { name: 'HP LaserJet M111w (شبیه‌ساز سیستم)', isDefault: false },
        { name: 'Microsoft Print to PDF', isDefault: false }
      ]);
    }
  }, []);

  const handleSave = async () => {
    SettingsService.save(settings);

    // ذخیره فیزیکی و ری‌کانکت دیتابیس بومی
    try {
      if (window.dbAPI?.reconnectDb) {
        await window.dbAPI.reconnectDb(settings.dbPath);
      } else {
        await fetch('./api/db/reconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbPath: settings.dbPath })
        });
      }
    } catch (err) {
      console.error("خطا در سوییچ کانکشن دیتابیس:", err);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تنظیمات را به حالت پیش‌فرض بازگردانید؟')) {
      setSettings({ ...DEFAULT_SETTINGS });
      SettingsService.save(DEFAULT_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const preselectedCardBgs = [
    { value: '#edfcf2', label: 'سبز نعنائی بسیار کم‌رنگ', preview: 'bg-[#edfcf2] border-emerald-200' },
    { value: '#f0fdf4', label: 'سبز ملایم بهاری', preview: 'bg-[#f0fdf4] border-green-200' },
    { value: '#f0f9ff', label: 'آبی بسیار کم‌رنگ آسمانی', preview: 'bg-[#f0f9ff] border-sky-200' },
    { value: '#f4f4f5', label: 'خاکستری مدرن', preview: 'bg-[#f4f4f5] border-zinc-200' },
    { value: '#fffbeb', label: 'کهربایی بسیار کم‌رنگ', preview: 'bg-[#fffbeb] border-amber-200' },
  ];

  const preselectedServiceBgs = [
    { value: '#faf5ff', label: 'بنفش سلطنتی ملایم', preview: 'bg-[#faf5ff] border-purple-200' },
    { value: '#fdf4ff', label: 'صورتی ملایم ارکیده', preview: 'bg-[#fdf4ff] border-fuchsia-200' },
    { value: '#f0fdfa', label: 'آبی فیروزه‌ای', preview: 'bg-[#f0fdfa] border-teal-200' },
    { value: '#f8fafc', label: 'اسلیتی بسیار ملایم', preview: 'bg-[#f8fafc] border-slate-200' },
    { value: '#fff7ed', label: 'نارنجی بسیار کم‌رنگ', preview: 'bg-[#fff7ed] border-orange-200' },
  ];

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 text-right" id="settings-tab-view" dir="rtl">
      
      {/* هدر بخش تنظیمات */}
      {currentTab !== 'settings-designer' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm" id="settings-header">
          <div>
            <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              تنظیمات و پیکربندی سراسری نرم‌افزار
            </h2>
            <p className="text-xs text-slate-500 mt-1">مدیریت ظاهر برنامه، مشخصات چاپ پیش‌فاکتورها و اطلاعات پایه فروشگاه</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              id="settings-reset-btn"
              onClick={handleReset}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              بازنشانی به پیش‌فرض
            </button>
            
            <button
              id="settings-save-btn"
              onClick={handleSave}
              className="flex-1 md:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات کنونی
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 animate-fade-in" id="save-success-notification">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تنظیمات و ترجیحات شما با موفقیت در بانک اطلاعاتی محلی ذخیره و بروزرسانی شد.</span>
        </div>
      )}

      {/* ناوبری فرعی تنظیمات */}
      <div className="flex border-b border-slate-200 pb-px gap-2" id="settings-tabs-nav">
        <button
          id="btn-subtab-app"
          onClick={() => setCurrentTab('settings-app')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-app'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          تنظیمات ظاهر و برنامه
        </button>

        <button
          id="btn-subtab-print"
          onClick={() => setCurrentTab('settings-print')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-print'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          تنظیمات اسناد و چاپ
        </button>

        <button
          id="btn-subtab-designer"
          onClick={() => setCurrentTab('settings-designer')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-designer'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          طراحی فاکتور (المنتور)
        </button>

        <button
          id="btn-subtab-store"
          onClick={() => setCurrentTab('settings-store')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-store'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          اطلاعات عمومی فروشگاه
        </button>

        <button
          id="btn-subtab-numbering"
          onClick={() => setCurrentTab('settings-numbering')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-numbering'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Barcode className="w-4 h-4" />
          پیشوند و شماره‌گذاری اسناد
        </button>

        {isAdmin && (
          <button
            id="btn-subtab-logs"
            onClick={() => setCurrentTab('settings-logs')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              currentTab === 'settings-logs'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
            لاگ‌های ممیزی سیستم (مخصوص مدیر)
          </button>
        )}
      </div>

      {/* پنل محتوا */}
      <div className={`p-6 shadow-xs ${currentTab === 'settings-designer' ? 'bg-transparent p-0 border-0 shadow-none' : 'bg-white rounded-2xl border border-slate-200'}`} id="settings-panel-content">
        
        {/* طراحی فاکتور زنده المنتور */}
        {currentTab === 'settings-designer' && <InvoiceDesignerSubTab />}
        
        {/* ۱. تنظیمات برنامه و ظاهر */}
        {currentTab === 'settings-app' && (
          <div className="space-y-6" id="settings-app-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-emerald-600" />
              سفارشی‌سازی ظاهر و عملکردهای داخلی
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* انتخاب تم برنامه */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">پوسته رنگی اصلی نرم‌افزار (Theme):</label>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: 'slate', label: 'خاکستری تیره', color: 'bg-slate-800' },
                    { value: 'light', label: 'سفید خالص', color: 'bg-slate-100 border border-slate-300' },
                    { value: 'emerald', label: 'نعنائی زمرد', color: 'bg-emerald-600' },
                    { value: 'amber', label: 'طلایی کهربا', color: 'bg-amber-500' },
                  ].map(t => (
                    <button
                      key={t.value}
                      id={`theme-${t.value}`}
                      type="button"
                      onClick={() => setSettings({ ...settings, theme: t.value as any })}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition ${
                        settings.theme === t.value 
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.color}`}></div>
                      <span className="text-[10.5px] font-bold text-slate-700">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
 
              {/* واحد پول سراسری */}
              <div className="space-y-2" id="settings-currency-container">
                <label className="block text-xs font-bold text-slate-700">واحد پول اصلی نرم‌افزار:</label>
                <select
                  id="settings-currency-select"
                  value={settings.currency || 'Toman'}
                  onChange={e => setSettings({ ...settings, currency: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="Toman">تومان ایران (پیش‌فرض)</option>
                  <option value="Rial">ریال معادل رسمی کشور</option>
                </select>
                <span className="text-[10px] text-slate-400 block">واحد پولی که در فاکتورها، انبارداری و تمام گزارش‌های مالی نرم‌افزار درج خواهد شد.</span>
              </div>

              {/* روش پرداخت پیش‌فرض */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">روش پرداخت پیش‌فرض صندوق:</label>
                <select
                  id="settings-default-payment"
                  value={settings.defaultPaymentMethod}
                  onChange={e => setSettings({ ...settings, defaultPaymentMethod: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="POS">کارتخوان سیستمی (POS)</option>
                  <option value="Cash">صندوق نقدی مغازه (Cash)</option>
                  <option value="Mixed">ترکیبی (واریز بانکی / چک)</option>
                </select>
                <span className="text-[10px] text-slate-400 block">مکانیزم پیش‌فرض تسویه در فاکتورهای جدید ثبت شده.</span>
              </div>

              {/* رنگ نازک کارت‌های کالا */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">پس‌زمینه ملایم کارت‌های کالا (تفکیک از خدمات):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {preselectedCardBgs.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, productCardBg: item.value })}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 cursor-pointer ${
                        settings.productCardBg === item.value
                          ? 'border-emerald-600 ring-2 ring-emerald-500/15 bg-emerald-50/20'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border ${item.preview}`}></div>
                      <span className="text-[10px] text-slate-600">{item.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* ورودی رنگ کاستوم */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">انتخاب کد رنگ دلخواه (Hex):</span>
                  <input
                    type="color"
                    value={settings.productCardBg}
                    onChange={e => setSettings({ ...settings, productCardBg: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.productCardBg}
                    onChange={e => setSettings({ ...settings, productCardBg: e.target.value })}
                    className="w-24 text-[11px] font-mono p-1 border border-slate-200 rounded text-center"
                  />
                </div>
              </div>

              {/* رنگ نازک کارت‌های دستمزد خدمات */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">پس‌زمینه ملایم کارت‌های بخش خدمات (تفکیک از کالا):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {preselectedServiceBgs.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, serviceCardBg: item.value })}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 cursor-pointer ${
                        settings.serviceCardBg === item.value
                          ? 'border-purple-600 ring-2 ring-purple-500/15 bg-purple-50/20'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border ${item.preview}`}></div>
                      <span className="text-[10px] text-slate-600">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* ورودی رنگ کاستومخدمات */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">انتخاب کد رنگ دلخواه (Hex):</span>
                  <input
                    type="color"
                    value={settings.serviceCardBg}
                    onChange={e => setSettings({ ...settings, serviceCardBg: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.serviceCardBg}
                    onChange={e => setSettings({ ...settings, serviceCardBg: e.target.value })}
                    className="w-24 text-[11px] font-mono p-1 border border-slate-200 rounded text-center"
                  />
                </div>
              </div>

              {/* تنظیم مسیر ذخیره‌سازی پایگاه داده */}
              <div className="space-y-3 md:col-span-2 bg-emerald-50/15 p-5 rounded-2xl border border-emerald-100/70">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5 font-sans">
                  <Database className="w-4 h-4 text-emerald-600 animate-pulse" />
                  محل استقرار فیزیکی فایل پایگاه‌داده (.db SQLite)
                </label>
                <div className="flex gap-3">
                  <input
                    id="settings-db-path-input"
                    type="text"
                    value={settings.dbPath}
                    onChange={e => setSettings({ ...settings, dbPath: e.target.value })}
                    className="flex-1 text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl h-11 font-mono focus:outline-none focus:border-emerald-500 text-left"
                    placeholder="shop.db"
                  />
                </div>
                <span className="text-[10.5px] text-slate-400 block leading-relaxed Farsi-text">
                  مسیر پیش‌فرض ذخیره‌سازی فایل حسابداری دیتابیس شما <code className="bg-white px-1.5 py-0.5 border border-slate-100 rounded text-[9.5px]">shop.db</code> در پوشه نصب برنامه است. با درج مسیر فیزیکی متمایز (مانند <code className="bg-white px-1.5 py-0.5 border border-slate-100 rounded text-[9.5px]">D:\Databases\shop.db</code>) می‌توانید از پاک نشدن یا آرشیو امن کاتالوگ فروشگاه در درایوهای جانبی اطمینان حاصل نمایید. تغییرات بلافاصله اعمال خواهد شد.
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ۲. تنظیمات اسناد و چاپ */}
        {currentTab === 'settings-print' && (
          <div className="space-y-6" id="settings-print-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-emerald-600" />
              پیکربندی چاپی فاکتورها، فیش‌ها و صورتحساب‌ها
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ابعاد استاندارد خروجی فاکتور */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">سایز پیش‌فرض انتشار فاکتور:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'A4', label: 'برگ رسمی A4', icon: FileText },
                    { value: 'A5', label: 'برگه متوسط A5', icon: FileText },
                    { value: 'thermal', label: 'فیش‌پرینتر حرارتی (80mm)', icon: Smartphone },
                  ].map(p => (
                    <button
                      key={p.value}
                      id={`print-${p.value}`}
                      type="button"
                      onClick={() => setSettings({ ...settings, paperSize: p.value as any })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition ${
                        settings.paperSize === p.value 
                          ? 'border-emerald-600 bg-emerald-50/10 text-emerald-700 font-bold' 
                          : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <p.icon className="w-5 h-5" />
                      <span className="text-[10.5px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* انتخاب پرینتر دیفالت سیستم */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">انتخاب دستگاه پرینتر پیش‌فرض سیستم:</label>
                <select
                  id="settings-default-printer"
                  value={settings.defaultPrinter}
                  onChange={e => setSettings({ ...settings, defaultPrinter: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="">پرینتر عمومی سیستم (نمایش دیالوگ چاپی)</option>
                  {systemPrinters.map(printer => (
                    <option key={printer.name} value={printer.name}>
                      {printer.name} {printer.isDefault ? '(پیش‌فرض ویندوز)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  در صورت انتخاب، دستورهای چاپ فاکتور مستقیماً به صفحه سخت‌افزار این دستگاه فرستاده خواهد شد.
                </span>
              </div>

              {/* درصد مالیات پیش‌فرض */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">درصد مالیات بر ارزش افزوده موقت (IR-VAT):</label>
                <div className="flex items-center gap-3">
                  <input
                    id="settings-tax-pct-input"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultTaxPct}
                    onChange={e => setSettings({ ...settings, defaultTaxPct: Number(e.target.value) })}
                    className="w-24 text-center text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 font-mono focus:outline-none"
                  />
                  <span className="text-xs text-slate-600">درصد ارزش افزوده مصوب سالیانه</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">با زدن تیک دکمه احتساب مالیات، این درصد روی فاکتور اعمال خواهد شد.</span>
              </div>

              {/* تاگل نمایش امضا و قوانین */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">نمایش ابزار مُهر و امضا کادر پایین فاکتور:</span>
                  <span className="text-[9.5px] text-slate-400">کادرهای امضای خریدار، فروشنده و فاکتور چاپی معتبر دفتری</span>
                </div>
                <input
                  id="settings-show-signature"
                  type="checkbox"
                  checked={settings.showSignature}
                  onChange={e => setSettings({ ...settings, showSignature: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* تاگل نمایش کد اقتصادی */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">نمایش کدهای ملی ملیتی و اقتصادی طرفین:</span>
                  <span className="text-[9.5px] text-slate-400">نمایش کد ملی و کد اقتصادی خریدار و فروشنده در فاکتورهای رسمی</span>
                </div>
                <input
                  id="settings-show-economic"
                  type="checkbox"
                  checked={settings.showEconomicCode}
                  onChange={e => setSettings({ ...settings, showEconomicCode: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* تاگل فاکتور سیاه و سفید بدون بک‌گراند رنگی */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between md:col-span-2">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">چاپ دفتری فاکتور بصورت سیاه و سفید (Border-only):</span>
                  <span className="text-[9.5px] text-slate-400">حذف تمامی بک‌گراندها و رنگ‌های کادرها و دکمه‌ها و المان‌ها برای ممانعت از تیره شدن کامل در پرینتر لِیزی و استفاده از خط‌مش‌های بردر ساده</span>
                </div>
                <input
                  id="settings-black-white-invoice"
                  type="checkbox"
                  checked={settings.blackAndWhiteInvoice || false}
                  onChange={e => setSettings({ ...settings, blackAndWhiteInvoice: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* ۳. اطلاعات عمومی فروشگاه */}
        {currentTab === 'settings-store' && (
          <div className="space-y-6" id="settings-store-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-emerald-600" />
              تنظیمات شناسنامه، نام تجاری و مستندات فروشگاه
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">نام تجاری فروشگاه / کسب‌وکار:</label>
                <input
                  id="settings-store-name"
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none"
                  placeholder="مثال: فروشگاه اسباب‌بازی آریا"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">تلفن تماس فروشگاه:</label>
                <input
                  id="settings-store-phone"
                  type="text"
                  value={settings.storePhone}
                  onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="تلفکس رسمی مغازه"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">کد اقتصادی فروشگاه (Economic Code):</label>
                <input
                  id="settings-store-eco-code"
                  type="text"
                  value={settings.storeEconomicCode}
                  onChange={e => setSettings({ ...settings, storeEconomicCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="۱۲ رقم کد اقتصادی ثبت شده"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">شناسه ملی / ثبت شرکت:</label>
                <input
                  id="settings-store-national-id"
                  type="text"
                  value={settings.storeNationalId}
                  onChange={e => setSettings({ ...settings, storeNationalId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="یا ممیز پروانه کسب"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">کد پستی ده رقمی:</label>
                <input
                  id="settings-store-postal"
                  type="text"
                  value={settings.storePostalCode}
                  onChange={e => setSettings({ ...settings, storePostalCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-bold text-slate-700">آدرس فیزیکی فروشگاه (جهت درج در فاکتورها):</label>
                <textarea
                  id="settings-store-address"
                  rows={2}
                  value={settings.storeAddress}
                  onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-right text-xs"
                  placeholder="نشانی دقیق مغازه یا شعب مرکزی جهت چاپ"
                />
              </div>

              {/* آپلود لوگوی فروشگاه */}
              <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-800 text-xs">انتخاب لوگو و آیکون فروشگاه:</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {settings.storeLogo ? (
                    <div className="relative group w-20 h-20 border border-slate-300 rounded-xl bg-white p-1 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={settings.storeLogo} alt="Logo Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, storeLogo: '' })}
                        className="absolute inset-0 bg-red-600/85 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                      >
                        حذف لوگو
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                      بدون لوگو
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 800000) {
                            alert('سایز لوگو نباید بیشتر از ۸۰۰ کیلوبایت باشد.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setSettings({ ...settings, storeLogo: event.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-0 file:ml-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">لوگوی انتخاب شده در هدر سایدبار منوی برنامه و همچنین در ساختار چاپی فاکتورهای رسمی و غیررسمی قرار خواهد گرفت (فرمت png یا jpg با حجم کمتر از ۸۰۰ کیلوبایت).</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* تنظیمات پیشوندها و شماره‌گذاری کالا، خدمات، اشخاص و فاکتورها */}
        {currentTab === 'settings-numbering' && (
          <div className="space-y-6" id="settings-numbering-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Barcode className="w-4.5 h-4.5 text-emerald-600" />
              تنظیم پیشوندها و الگوهای شماره‌گذاری خودکار ساختار اسناد
            </h3>

            <p className="text-xs text-slate-505 leading-relaxed font-sans">
              شما می‌توانید الگوهای تولید شناسه (کد) منحصربفرد پیوسته را برای دسته‌های گوناگون داده تعیین کنید. سیستم بومی به شکل خودکار پس از هر ثبت جدید، گام بعدی را محاسبه نموده و در فیلد مربوطه قرار می‌دهد. همچنین امکان ویرایش دستی کدهای تولید شده همواره میسر است.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* کالاها */}
              <div className="p-4 border border-slate-200/85 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-[12px] text-slate-800 flex items-center gap-1.5 border-b border-slate-205 pb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 block"></span>
                  کد کالاها و محصولات (SKU)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">پیشوند (Prefix):</label>
                    <input
                      type="text"
                      value={settings.productPrefix}
                      onChange={e => setSettings({ ...settings, productPrefix: e.target.value })}
                      placeholder="PRO-"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">شماره بعدی (Counter):</label>
                    <input
                      type="number"
                      value={settings.productNextNumber}
                      onChange={e => setSettings({ ...settings, productNextNumber: Number(e.target.value) })}
                      placeholder="1001"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 font-bold">
                  مثال تولیدی شناسه: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[10px]">{settings.productPrefix}{settings.productNextNumber}</code>
                </div>
              </div>

              {/* خدمات */}
              <div className="p-4 border border-slate-200/85 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-[12px] text-slate-800 flex items-center gap-1.5 border-b border-slate-205 pb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 block"></span>
                  کد خدمات جاری فروشگاه
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">پیشوند (Prefix):</label>
                    <input
                      type="text"
                      value={settings.servicePrefix}
                      onChange={e => setSettings({ ...settings, servicePrefix: e.target.value })}
                      placeholder="SRV-"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">شماره بعدی (Counter):</label>
                    <input
                      type="number"
                      value={settings.serviceNextNumber}
                      onChange={e => setSettings({ ...settings, serviceNextNumber: Number(e.target.value) })}
                      placeholder="1001"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 font-bold">
                  مثال تولیدی شناسه: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[10px]">{settings.servicePrefix}{settings.serviceNextNumber}</code>
                </div>
              </div>

              {/* اشخاص و اپراتورها */}
              <div className="p-4 border border-slate-200/85 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-[12px] text-slate-800 flex items-center gap-1.5 border-b border-slate-205 pb-2">
                  <span className="w-2 h-2 rounded-full bg-sky-600 block"></span>
                  کد حساب و شناسه اشخاص (طرفین معامله)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">پیشوند (Prefix):</label>
                    <input
                      type="text"
                      value={settings.personPrefix}
                      onChange={e => setSettings({ ...settings, personPrefix: e.target.value })}
                      placeholder="PER-"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">شماره بعدی (Counter):</label>
                    <input
                      type="number"
                      value={settings.personNextNumber}
                      onChange={e => setSettings({ ...settings, personNextNumber: Number(e.target.value) })}
                      placeholder="1001"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 font-bold">
                  مثال تولیدی شناسه: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[10px]">{settings.personPrefix}{settings.personNextNumber}</code>
                </div>
              </div>

              {/* فاکتورها */}
              <div className="p-4 border border-slate-200/85 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-[12px] text-slate-800 flex items-center gap-1.5 border-b border-slate-205 pb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                  شماره فاکتورهای صادره فروشگاهی
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">پیشوند (Prefix):</label>
                    <input
                      type="text"
                      value={settings.invoicePrefix}
                      onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                      placeholder="INV-"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">شماره بعدی (Counter):</label>
                    <input
                      type="number"
                      value={settings.invoiceNextNumber}
                      onChange={e => setSettings({ ...settings, invoiceNextNumber: Number(e.target.value) })}
                      placeholder="1001"
                      className="w-full text-xs font-mono text-left p-2.5 bg-white border border-slate-202 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 font-bold">
                  مثال تولیدی شناسه: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[10px]">{settings.invoicePrefix}{settings.invoiceNextNumber}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ۴. لاگ‌های برنامه (مسیر ممیزی امنیت) */}
        {currentTab === 'settings-logs' && isAdmin && (
          <div className="space-y-6 animate-fade-in text-slate-800" id="settings-logs-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center text-right">
              <span className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                مسیر ممیزی امنیت و گزارش حوادث سیستم (Audit Trail)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("آیا مطمئن هستید که می‌خواهید کل لیست لاگ‌های امنیتی سیستم را پاک کنید؟ این عملیات غیرقابل بازگشت است.")) {
                    localStorage.setItem('shop_accounting_user_logs', JSON.stringify([]));
                    setLogsList([]);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 border border-rose-200/50 bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف و پاکسازی تاریخچه لاگ‌ها
              </button>
            </h3>

            {/* بخش جستجو و فیلترهای لاگ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو در شرح عملکرد..."
                  value={searchLogText}
                  onChange={e => setSearchLogText(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={filterLogUser}
                  onChange={e => setFilterLogUser(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none font-sans"
                >
                  <option value="all">همه پرسنل و اپراتورها</option>
                  {Array.from(new Set(logsList.map((l: any) => l.username || l.userFullName))).map((userKey: any) => {
                    if (!userKey) return null;
                    return (
                      <option key={userKey} value={userKey}>
                        {userKey}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <select
                  value={filterLogAction}
                  onChange={e => setFilterLogAction(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none font-sans"
                >
                  <option value="all">همه رویدادها</option>
                  <option value="LOGIN_SUCCESS">ورودهای موفق پرسنل (LOGIN_SUCCESS)</option>
                  <option value="LOGIN_FAILED">ورودهای ناموفق و مشکوک (LOGIN_FAILED)</option>
                  <option value="INVOICE_CREATE">ثبت سفارش و صدور فاکتور (INVOICE_CREATE)</option>
                  <option value="INVOICE_DELETE">ابطال و حذف فاکتور (INVOICE_DELETE)</option>
                  <option value="PRODUCT_CREATE">افزودن کالای کاتالوگ (PRODUCT_CREATE)</option>
                  <option value="PRODUCT_UPDATE">ویرایش قیمت یا ویژگی کالا (PRODUCT_UPDATE)</option>
                  <option value="PRODUCT_DELETE">حذف فیزیکی ردیف کالا (PRODUCT_DELETE)</option>
                  <option value="PERSON_CREATE">ثبت طرف‌حساب جدید (PERSON_CREATE)</option>
                  <option value="PERSON_UPDATE">ویرایش حساب مالیاتی طرف‌حساب (PERSON_UPDATE)</option>
                  <option value="PERSON_DELETE">حذف شخص از سیستم (PERSON_DELETE)</option>
                </select>
              </div>
            </div>

            {/* لیست لاگ‌ها */}
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 space-y-3">
                <Database className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">هیچ لاگ یا مسیر ممیزی منطبق با فیلترهای انتخابی یافت نگردید.</p>
              </div>
            ) : (
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-right border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3 font-semibold">کاربر / اپراتور</th>
                      <th className="p-3 font-semibold">نوع عملیات</th>
                      <th className="p-3 font-semibold">دستور کار و شرح رویداد</th>
                      <th className="p-3 font-semibold">مقادیر سابق (سورس) / فعلی</th>
                      <th className="p-3 text-left font-semibold">زمان وقوع رویداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{log.userFullName || 'ناشناس'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{log.username || 'unknown'}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.actionType === 'LOGIN_SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            log.actionType === 'LOGIN_FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-150 font-black animate-pulse' :
                            log.actionType?.includes('DELETE') ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-150'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3 leading-relaxed max-w-xs">{log.description}</td>
                        <td className="p-3">
                          {(log.oldValue || log.newValue) ? (
                            <div className="flex flex-col gap-1 text-[10px]">
                              {log.oldValue && (
                                <div className="text-rose-600 bg-rose-50/40 p-1 rounded border border-rose-100/50 truncate font-mono" title={log.oldValue}>
                                  سابق: {log.oldValue}
                                </div>
                              )}
                              {log.newValue && (
                                <div className="text-emerald-600 bg-emerald-50/20 p-1 rounded border border-emerald-100/50 truncate font-mono" title={log.newValue}>
                                  جدید: {log.newValue}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-left whitespace-nowrap font-mono text-slate-500">
                          <div className="flex items-center justify-end gap-1">
                            <span>{new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleDateString('fa-IR')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* اعلان‌های ایمنی پایگاه داده */}
      <div className="bg-slate-150 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3" id="settings-db-status-notice">
        <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-[11px]">
          <span className="font-bold text-slate-700 block text-xs">ثبت آنی و ایمن در پایگاه‌داده (Database Center):</span>
          <p className="leading-relaxed">
            تمامی مقادیر وارد شده در فرم‌های فوق به صورت کامل روی **بانک اطلاعاتی محلی بومی برنامه** مستندسازی و با مکانیزم حفاظت تراکنش (Atomicity Isolation) نگهداشته می‌شوند.
            پس از ذخیره تغییرات، پوسته‌ها و تنظیمات چاپی بلافاصله بدون فوت وقت در خطوط سفارش POS و صدور فاکتور شما اعمال خواهد شد.
          </p>
        </div>
      </div>

    </div>
  );
}
