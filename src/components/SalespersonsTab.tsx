import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Invoice, InvoiceItem, Product } from '../types';
import { 
  Users, ShoppingBag, DollarSign, Calendar, TrendingUp, Clock, 
  ShieldAlert, UserCheck, BarChart3, FileSpreadsheet, History, Activity, Award
} from 'lucide-react';

export default function SalespersonsTab() {
  const [salespersons, setSalespersons] = useState<Person[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Person | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'items' | 'logs'>('invoices');
  
  // Checking active user role for strict access control
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    // 1. Load active user
    try {
      const activeUserRaw = localStorage.getItem('shop_accounting_active_user');
      if (activeUserRaw) {
        setActiveUser(JSON.parse(activeUserRaw));
      }
    } catch (e) {
      console.error(e);
    }

    refreshData();
  }, []);

  const refreshData = () => {
    const allPersons = OfflineDatabase.getPersons();
    const allInvoices = OfflineDatabase.getInvoices();
    const allLogs = OfflineDatabase.getUserLogs();
    const allProducts = OfflineDatabase.getProducts();

    // Filter persons who have "Salesperson" in their roles OR type is Salesperson
    const filtered = allPersons.filter(p => {
      const isSalespersonType = p.type === 'Salesperson';
      const hasSalespersonRole = p.roles && p.roles.includes('Salesperson');
      return isSalespersonType || hasSalespersonRole;
    });

    setSalespersons(filtered);
    setInvoices(allInvoices);
    setLogs(allLogs);
    setProducts(allProducts);

    if (filtered.length > 0 && !selectedSalesperson) {
      setSelectedSalesperson(filtered[0]);
    }
  };

  const formatToman = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  // Helper to check if a date string is from "today"
  const isToday = (dateString: string) => {
    try {
      const today = new Date();
      const checkDate = new Date(dateString);
      return today.toDateString() === checkDate.toDateString();
    } catch (e) {
      return false;
    }
  };

  // Get stats for a salesperson
  const getSalespersonStats = (salesperson: Person) => {
    // Match invoices either by exact user_name field, or if they match the salesperson's name
    const matchesOperatorName = (inv: Invoice) => {
      const operator = inv.user_name || '';
      return operator.toLowerCase().trim() === salesperson.name.toLowerCase().trim();
    };

    const salespersonInvoices = invoices.filter(inv => {
      const isSale = inv.type === 'Sale' || inv.type === 'Quick Sale';
      return isSale && matchesOperatorName(inv);
    });

    const salesToday = salespersonInvoices.filter(inv => isToday(inv.created_at));
    const totalSalesToday = salesToday.reduce((sum, inv) => sum + inv.final_amount, 0);
    const totalSalesAllTime = salespersonInvoices.reduce((sum, inv) => sum + inv.final_amount, 0);

    return {
      invoicesCountToday: salesToday.length,
      salesAmountToday: totalSalesToday,
      invoicesCountAllTime: salespersonInvoices.length,
      salesAmountAllTime: totalSalesAllTime,
      allInvoices: salespersonInvoices,
    };
  };

  // Get sold items detailed lists for selected salesperson
  const getSalespersonSoldItems = (salesperson: Person) => {
    const stats = getSalespersonStats(salesperson);
    const itemCounts: Record<string, { product: Product | null; title: string; qty: number; totalRev: number }> = {};

    stats.allInvoices.forEach(inv => {
      try {
        const items = OfflineDatabase.getInvoiceItemsByInvoiceId(inv.id);
        items.forEach(item => {
          if (item.item_type === 'Product') {
            const prod = products.find(p => p.id === item.item_id) || null;
            const title = prod ? prod.title : 'محصول ناشناس';
            const key = item.item_id;
            
            if (itemCounts[key]) {
              itemCounts[key].qty += item.quantity;
              itemCounts[key].totalRev += item.total;
            } else {
              itemCounts[key] = {
                product: prod,
                title,
                qty: item.quantity,
                totalRev: item.total
              };
            }
          }
        });
      } catch (e) {
        console.error(e);
      }
    });

    return Object.values(itemCounts).sort((a, b) => b.qty - a.qty);
  };

  // Get actions logged by the salesperson
  const getSalespersonActions = (salesperson: Person) => {
    // Audit logs registered under this user
    return logs.filter(log => {
      const nameMatch = log.userFullName?.toLowerCase().trim() === salesperson.name.toLowerCase().trim();
      const usernameMatch = log.username?.toLowerCase().trim() === salesperson.name.toLowerCase().trim();
      return nameMatch || usernameMatch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Strict check: if not Admin, render an elegant block page
  if (activeUser && activeUser.role !== 'Admin') {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center h-[calc(100vh-64px)] overflow-y-auto" id="salesperson-tab-blocked">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-rose-200">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">دسترسی به بخش عملکرد فروشندگان محدود است</h2>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6 font-medium">
          شما با حساب صندوق‌دار یا حسابدار وارد شده‌اید. اطلاعات مالی دقیق، تعداد فاکتورها و عملکرد لاگ فروش روزانه کارمندان فقط برای **مدیر ارشد سیستم** قابل رویت است.
        </p>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          Enforced by Shop Audit Control Firewall
        </span>
      </div>
    );
  }

  // Summary figures
  const totalInvoicesToday = salespersons.reduce((sum, sp) => sum + getSalespersonStats(sp).invoicesCountToday, 0);
  const totalSalesTodaySum = salespersons.reduce((sum, sp) => sum + getSalespersonStats(sp).salesAmountToday, 0);
  const totalSalesAllTimeSum = salespersons.reduce((sum, sp) => sum + getSalespersonStats(sp).salesAmountAllTime, 0);

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 bg-slate-50" id="salespersons-dashboard">
      
      {/* 1. Header with overall metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs" id="salesperson-top-bar">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            سیستم کنترل و نظارت بر عملکرد فروشندگان (نوبت کاری جاری)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            پایش هوشمند امروز، مشاهده کالاها، خدمات صادرشده و مانیتورینگ زنده اقدامات پرسنل
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs px-3.5 py-2 rounded-xl border border-emerald-100 font-bold">
          <Clock className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '10s' }} />
          <span>بروزرسانی لحظه‌ای بر مبنای لاگ پایگاه داده اصلی</span>
        </div>
      </div>

      {/* 2. Top Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="salesperson-top-widgets">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex justify-between items-center opacity-85 text-xs font-bold">
            <span>مجموع فروش امروز صندوق‌داران</span>
            <DollarSign className="w-4 h-4 text-emerald-100" />
          </div>
          <h3 className="text-xl font-black font-mono mt-2 leading-none">
            {formatToman(totalSalesTodaySum)}
          </h3>
          <span className="text-[10px] text-emerald-100 block mt-1.5">حاصل ضرب فاکتورهای صادره امروز</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>تعداد فاکتورهای امروز فروشندگان</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 font-mono mt-2 leading-none">
            {totalInvoicesToday} فاکتور
          </h3>
          <span className="text-[10px] text-slate-400 block mt-1.5">میانگین بهره‌وری نوبت کاری پرسنل</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>کل عملکرد و ثبتی فاکتورها</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 font-mono mt-2 leading-none">
            {formatToman(totalSalesAllTimeSum)}
          </h3>
          <span className="text-[10px] text-slate-400 block mt-1.5 font-sans">تراز کل مبادلات انجام شده</span>
        </div>
      </div>

      {/* 3. Main Dashboard Layout (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="salespersons-workspace">
        
        {/* RIGHT COLUMN: Salespersons list */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-3 h-[600px]" id="salesperson-list-panel">
          <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              فروشندگان فعال ثبت‌شده ({salespersons.length})
            </span>
          </h3>
          
          {salespersons.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Users className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
              <p className="text-xs font-extrabold text-slate-500">هیچ شخصی با نقش "فروشنده" برای این مغازه تعریف نشده است.</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">جهت افزودن، به صفحه مدیریت اشخاص بروید و هنگام ساخت شخص جدید، نقش تجاری کادر را به عنوان "فروشنده" تیک بزنید.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1" id="salespersons-scroller">
              {salespersons.map(sp => {
                const isSelected = selectedSalesperson?.id === sp.id;
                const stats = getSalespersonStats(sp);

                return (
                  <div
                    key={sp.id}
                    id={`salesperson-card-${sp.id}`}
                    onClick={() => {
                      setSelectedSalesperson(sp);
                      setActiveSubTab('invoices');
                    }}
                    className={`p-4 rounded-2xl border transition duration-200 cursor-pointer text-right relative flex flex-col gap-2 ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-xs shadow-emerald-500/5' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shadow-2xs ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sp.name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 leading-tight">
                            {sp.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{sp.phone || 'بدون تلفن همراه'}</span>
                        </div>
                      </div>
                      
                      {/* Active Roles indicators */}
                      <div className="flex flex-wrap gap-1">
                        {sp.roles?.map(role => (
                          <span key={role} className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[8.5px]">
                            {role === 'Customer' ? 'مشتری' : role === 'Supplier' ? 'تامین‌کننده' : role === 'Shareholder' ? 'سهام‌دار' : role === 'Employee' ? 'کارمند' : 'فروشنده'}
                          </span>
                        )) || (
                          <span className="bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded text-[8.5px]">فروشنده</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats list */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10.5px]">
                      <div className="bg-slate-50 p-2 rounded-xl text-right">
                        <span className="text-slate-400 block text-[9px] font-bold">فروش امروز:</span>
                        <span className="font-black text-emerald-600 font-mono mt-0.5 block">
                          {stats.salesAmountToday > 0 ? formatToman(stats.salesAmountToday) : '۰ ریال'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-right">
                        <span className="text-slate-400 block text-[9px] font-bold">فروش کل:</span>
                        <span className="font-black text-slate-800 font-mono mt-0.5 block">
                          {formatToman(stats.salesAmountAllTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LEFT COLUMN: Detailed activity and sales ledger of selected salesperson */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col h-[600px]" id="salesperson-details-panel">
          {selectedSalesperson ? (
            <>
              {/* Detailed Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100" id="salesperson-detail-header">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-black text-slate-800 text-sm">
                      کارنامه عملکرد پرسنلی: {selectedSalesperson.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    کنترل لحظه‌ای فعالیت‌ها، لاگ‌ها، لیست اقلام سودآور به تفکیک فاکتورهای صادره
                  </p>
                </div>
                
                {/* Visual state selector */}
                <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold" id="salesperson-tab-selector">
                  <button
                    onClick={() => setActiveSubTab('invoices')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeSubTab === 'invoices' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    فاکتورهای ثبت شده
                  </button>
                  <button
                    onClick={() => setActiveSubTab('items')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeSubTab === 'items' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    اقلام فروخته شده
                  </button>
                  <button
                    onClick={() => setActiveSubTab('logs')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeSubTab === 'logs' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    کارهای انجام شده (اقدامات)
                  </button>
                </div>
              </div>

              {/* Data Display Content Block */}
              <div className="flex-1 overflow-y-auto pt-4" id="salesperson-detail-content">
                
                {/* 1. Invoices sub-tab */}
                {activeSubTab === 'invoices' && (
                  <div className="space-y-3.5 pr-1">
                    <h4 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      لیست فاکتورهای فروش صادر شده توسط این فروشنده
                    </h4>
                    
                    {getSalespersonStats(selectedSalesperson).allInvoices.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 font-bold">هیچ فاکتور فروش فعالی به نام این مشتری در دیتابیسی یافت نشد.</span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">زمانی که این صندوق‌دار وارد سیستم شود و تراکنشی اضافه کند، نام وی در فاکتورها درج می‌شود.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSalespersonStats(selectedSalesperson).allInvoices.map(inv => (
                          <div key={inv.id} className="p-4 border border-slate-200 shadow-3xs rounded-2xl hover:bg-slate-50/40 transition">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${inv.type === 'Quick Sale' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                                <strong className="font-extrabold text-slate-800">فاکتور صنف {inv.invoice_number}</strong>
                                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                                  {inv.type === 'Quick Sale' ? 'صندوق سریع (POS)' : 'فروش معمولی نسیه/نقدی'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono font-bold">
                                {new Date(inv.created_at).toLocaleDateString('fa-IR')} | {new Date(inv.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 py-3 border-t border-slate-100 mt-3 text-xs text-slate-500 font-medium">
                              <div>
                                <span className="block opacity-75">مجموع کل اقلام:</span>
                                <span className="font-bold text-slate-700">{formatToman(inv.total_amount)}</span>
                              </div>
                              <div>
                                <span className="block opacity-75 text-rose-600">تخفیف متمم:</span>
                                <span className="font-bold text-rose-500">{formatToman(inv.discount)}</span>
                              </div>
                              <div>
                                <span className="block opacity-75">روش تسویه:</span>
                                <span className="font-bold text-slate-800 bg-slate-100/75 rounded px-2 py-0.5 inline-block mt-0.5">
                                  {inv.payment_method === 'POS' ? 'کارتخوان صنف' : inv.payment_method === 'Cash' ? 'نقدی وجه' : 'ترکیبی ارقام'}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="block opacity-75">تراز نهایی پرداختی:</span>
                                <span className="font-black text-emerald-600 font-mono text-sm block mt-0.5">{formatToman(inv.final_amount)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Sold items sub-tab */}
                {activeSubTab === 'items' && (
                  <div className="space-y-4 pr-1">
                    <h4 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      لیست اقلامی که این فروشنده موفق به نهایی کردن فروش کالا آن‌ها شده است
                    </h4>

                    {getSalespersonSoldItems(selectedSalesperson).length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-slide-up">
                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-400">هیچ کالا یا خدمتی هنوز به نام این فروشنده ثبت نشده است.</span>
                      </div>
                    ) : (
                      <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                        <div className="grid grid-cols-12 gap-2 bg-slate-50 p-3 text-[10px] font-bold text-slate-500">
                          <span className="col-span-6">نام و عنوان کالا</span>
                          <span className="col-span-3 text-center">تعداد فروخته شده</span>
                          <span className="col-span-3 text-left">مجموع مبلغ تراکنش</span>
                        </div>

                        {getSalespersonSoldItems(selectedSalesperson).map(item => (
                          <div key={item.title} className="grid grid-cols-12 gap-2 p-3 text-xs items-center hover:bg-slate-50/50 transition">
                            <span className="col-span-6 font-bold text-slate-800 truncate" title={item.title}>{item.title}</span>
                            <span className="col-span-3 text-center font-bold font-mono bg-slate-50 text-slate-700 py-1.5 rounded-xl border border-slate-200/30">
                              {item.qty} {item.product?.unit || 'عدد'}
                            </span>
                            <span className="col-span-3 text-left font-black text-emerald-600 font-mono">
                              {formatToman(item.totalRev)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Activity logs sub-tab */}
                {activeSubTab === 'logs' && (
                  <div className="space-y-4 pr-1">
                    <h4 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      لاگ اقدامات پرسنلی و ردپای تغییر دیتابیس (Audit Tracker)
                    </h4>

                    {getSalespersonActions(selectedSalesperson).length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
                        <span className="text-xs text-slate-400">هیچ عملیاتی نظیر تعریف کلا، تغییر قیمت یا خروج دپو به نام این فروشنده ثبت نگردیده است.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSalespersonActions(selectedSalesperson).map(log => (
                          <div key={log.id} className="p-4 border border-slate-200/70 bg-white shadow-3xs rounded-2xl">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                                {log.actionType === 'PRODUCT_CREATE' ? 'ایجاد کالا' : log.actionType === 'PRODUCT_UPDATE' ? 'ویرایش کالا' : log.actionType === 'INVOICE_CREATE' ? 'صدور فاکتور' : log.actionType}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.createdAt).toLocaleDateString('fa-IR')} | {new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-700 font-semibold mt-2.5">
                              {log.description}
                            </p>

                            {log.newValue && (
                              <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 text-[10px] font-mono text-slate-500">
                                <strong>تغییرات ثبت شده:</strong> {log.newValue}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8 h-full">
              <Users className="w-12 h-12 text-slate-300 mb-2 mt-4 animate-pulse" />
              <p className="text-xs font-bold text-slate-500">فروشنده‌ای را جهت پایش زنده کارنامه انتخاب کنید</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
