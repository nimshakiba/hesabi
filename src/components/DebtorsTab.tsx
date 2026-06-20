import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/settings';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Invoice } from '../types';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  User, 
  Phone, 
  Filter, 
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function DebtorsTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debtors' | 'creditors' | 'settled'>('all');
  const [sortOrder, setSortOrder] = useState<'low-to-high' | 'high-to-low'>('high-to-low');
  
  // Custom threshold filters to dynamic highlight backgrounds
  const [amountThreshold, setAmountThreshold] = useState<number>(0);
  const [highlightColor, setHighlightColor] = useState<'none' | 'soft-red' | 'soft-indigo' | 'soft-amber' | 'soft-green'>('none');

  // Quick Action State
  const [settlePerson, setSettlePerson] = useState<Person | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleType, setSettleType] = useState<'Receive' | 'Pay'>('Receive');
  const [settleNotes, setSettleNotes] = useState<string>('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPersons(OfflineDatabase.getPersons());
    setInvoices(OfflineDatabase.getInvoices());
  };

  // Helper to get formatted currency
  const formatToman = (val: number) => {
    return formatPrice(Math.abs(val));
  };

  // Quick payout settlement
  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePerson || !settleAmount) return;

    const parsedAmount = Number(settleAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('مبلغ وارد شده معتبر نیست.');
      return;
    }

    // Adjust balance according to action type
    // If we receive money from standard Debtor (balance > 0): it reduces their debt (balance decreases)
    // If we pay money to standard Creditor (balance < 0): it reduces our debt to them (balance increases/becomes closer to 0)
    let finalBalance = settlePerson.balance;
    if (settleType === 'Receive') {
      finalBalance -= parsedAmount;
    } else {
      finalBalance += parsedAmount;
    }

    // Save update in the offline database
    OfflineDatabase.savePerson({
      ...settlePerson,
      balance: finalBalance,
      notes: `${settlePerson.notes || ''}\n[ثبت تراز تجاری جدید]: به مبلغ ${parsedAmount.toLocaleString()} در تاریخ ${new Date().toLocaleDateString('fa-IR')} (${settleNotes || 'توضیحات پیش‌فرض'})`
    });

    // Create a virtual billing invoice to maintain double-entry bookkeeping traces
    try {
      OfflineDatabase.createInvoice({
        person_id: settlePerson.id,
        type: settleType === 'Receive' ? 'Sale' : 'Purchase',
        total_amount: parsedAmount,
        discount: 0,
        final_amount: parsedAmount,
        payment_status: 'Paid',
        payment_method: 'Cash'
      }, [
        {
          item_id: 'srv_1',
          item_type: 'Service',
          quantity: 1,
          price: parsedAmount
        }
      ]);
    } catch (err) {
      console.warn("Could not write bookkeeping invoice track:", err);
    }

    setSettlePerson(null);
    setSettleAmount('');
    setSettleNotes('');
    refreshData();

    // Fire a global event to let other tabs know database updated
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // 1. Filter persons
  const filteredList = persons
    .filter(p => p.id !== 'general_customer') // Exempt general cash counter
    .filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || p.phone.includes(searchQuery);
      if (!matchesSearch) return false;

      if (filterMode === 'debtors') return p.balance > 0;
      if (filterMode === 'creditors') return p.balance < 0;
      if (filterMode === 'settled') return p.balance === 0;

      return true;
    });

  // 2. Sort persons dynamically by balance
  const sortedList = [...filteredList].sort((a, b) => {
    if (sortOrder === 'low-to-high') {
      return a.balance - b.balance;
    } else {
      return b.balance - a.balance;
    }
  });

  // Calculate stats
  const totalDebtorsCount = persons.filter(p => p.balance > 0 && p.id !== 'general_customer').length;
  const totalCreditorsCount = persons.filter(p => p.balance < 0 && p.id !== 'general_customer').length;
  const totalDebtsSum = persons.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
  const totalCreditsSum = persons.filter(p => p.balance < 0).reduce((sum, p) => sum + p.balance, 0);

  // Dynamic color coding calculation from Red to Green
  // We want to color-code based on the actual balance. 
  // - High Debtors (very positive, owe us a lot) -> Red light or Orange (Risk of overdue)
  // - High Creditors (very negative, we owe them a lot) -> Crimson/Amber
  // - Clear / Near Zero -> Soft Green or Emerald.
  // Let's calculate percentage index:
  const getPillColor = (balanceVal: number) => {
    if (balanceVal > 0) {
      // Debtors owe us.
      if (balanceVal > 1000000) {
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'بدهکاری سنگین 🔴',
          text: 'text-rose-600',
          gradientHex: '#fecdd3' // red shade
        };
      } else if (balanceVal > 100000) {
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'بدهکار متوسط 🟡',
          text: 'text-amber-600',
          gradientHex: '#fef3c7' // orange/amber shade
        };
      } else {
        return {
          bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          badge: 'بدهکار خرد 🟡',
          text: 'text-yellow-600',
          gradientHex: '#fef9c3' // yellow shade
        };
      }
    } else if (balanceVal < 0) {
      // Creditors we owe.
      if (Math.abs(balanceVal) > 1000000) {
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          badge: 'بستانکاری سنگین 🔵',
          text: 'text-indigo-600',
          gradientHex: '#e0e7ff'
        };
      } else {
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          badge: 'بستانکار خرد 🔵',
          text: 'text-blue-600',
          gradientHex: '#dbeafe'
        };
      }
    } else {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'تسویه حساب ممتاز 🟢',
        text: 'text-emerald-600',
        gradientHex: '#a7f3d0' // green shade
      };
    }
  };

  // Custom User highlight checking
  const shouldHighlight = (person: Person) => {
    if (amountThreshold <= 0) return false;
    return Math.abs(person.balance) >= amountThreshold;
  };

  const getCustomHighlightBg = () => {
    if (highlightColor === 'soft-red') return 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30';
    if (highlightColor === 'soft-indigo') return 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-400/30';
    if (highlightColor === 'soft-amber') return 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30';
    if (highlightColor === 'soft-green') return 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30';
    return '';
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 select-none bg-slate-50" id="debtors-view-pane">
      
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] gap-4" id="debtors-header">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
            تراز جامع بدهکاران و بستانکاران سیستم
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">
            گزارش‌گیری دقیق مبالغ معوق، مرتب‌سازی ردیفی از کم به زیاد رنگی (طیف قرمز ریسک به سبز تسویه) با قابلیت کاوش فیلتردار
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-stretch md:self-auto" id="sorting-toggle-wrapper">
          <button
            onClick={() => setSortOrder('high-to-low')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sortOrder === 'high-to-low' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            طلب بالا به پایین 📈
          </button>
          <button
            onClick={() => setSortOrder('low-to-high')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sortOrder === 'low-to-high' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            بدهکاری از کم به زیاد 📉
          </button>
        </div>
      </div>

      {/* بخش کارت‌های آمار فیزیکی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="debtors-stats-cards">
        <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">مجموع دارایی طلب معوق (بدهکاران):</span>
            <h3 className="text-base font-black text-rose-600 font-mono leading-none">{formatToman(totalDebtsSum)}</h3>
            <span className="text-[9.5px] text-slate-500 font-sans block">نزد {totalDebtorsCount} شخص حقیقی یا حقوقی</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <ArrowUpRight className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">تعهدات پرداخت فروشگاه (بستانکاران):</span>
            <h3 className="text-base font-black text-indigo-600 font-mono leading-none">{formatToman(Math.abs(totalCreditsSum))}</h3>
            <span className="text-[9.5px] text-slate-500 font-sans block">به {totalCreditorsCount} شرکت همکار و تامین‌کننده</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-50 rounded-xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-2xs col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">معدل خالص حسابداری سرمایه در گردش:</span>
            <h3 className={`text-base font-black font-mono leading-none ${totalDebtsSum - Math.abs(totalCreditsSum) >= 0 ? 'text-emerald-600' : 'text-crimson-600'}`}>
              {formatToman(totalDebtsSum - Math.abs(totalCreditsSum))}
            </h3>
            <span className="text-[9.5px] text-slate-500 font-sans block">موازنه کلی مطالبات معلق انبار بومی</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* کارت ابزارهای فیلترینگ و هایلایت‌کننده پیشرفته */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="debtors-filters-manager-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
            <Filter className="w-4 h-4 text-emerald-500" />
            میز کار فیلتر هوشمند و هایلایت تعاملی ردیف‌ها
          </h4>
          <div className="flex gap-1.5 bg-slate-50 border p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg ${filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              همه حساب‌ها
            </button>
            <button
              onClick={() => setFilterMode('debtors')}
              className={`px-3 py-1 rounded-lg ${filterMode === 'debtors' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}
            >
              بدهکاران (طلب ما) 🔴
            </button>
            <button
              onClick={() => setFilterMode('creditors')}
              className={`px-3 py-1 rounded-lg ${filterMode === 'creditors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              بستانکاران (بدهی ما) 🔵
            </button>
            <button
              onClick={() => setFilterMode('settled')}
              className={`px-3 py-1 rounded-lg ${filterMode === 'settled' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              تسویه شده‌ها 🟢
            </button>
          </div>
        </div>

        {/* فیلترهای ورودی */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1" id="debtors-search-inputs">
          {/* کادر سرچ متنی */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500">جستجوی مشتری یا تامین‌کننده:</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="نام شخص یا شماره همراه وی..."
                className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* فیلتر کنترلی هایلایت بر اساس مقدار */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">مبلغ شرط مرز هایلایت (بازه تراز):</label>
            <input
              type="number"
              value={amountThreshold === 0 ? '' : amountThreshold}
              onChange={e => setAmountThreshold(Number(e.target.value))}
              placeholder="مثلا ۱,۰۰۰,۰۰۰ تومان"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500 bg-slate-50/50 font-mono text-left"
            />
          </div>

          {/* انتخاب رنگ پس‌زمینه هایلایت */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">رنگ پس‌زمینه ردیف‌های منطبق:</label>
            <select
              value={highlightColor}
              onChange={e => setHighlightColor(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
            >
              <option value="none">بدون تغییر رنگ (ساده)</option>
              <option value="soft-red">صورتی فسفری خطر (پوست قرمز)</option>
              <option value="soft-amber">نارنجی هشدار حسابداری</option>
              <option value="soft-indigo">آبی کهکشانی ملایم</option>
              <option value="soft-green">سبز تایید و رضایت ممتاز</option>
            </select>
          </div>
        </div>

        {/* راهنمای طیف رنگ از قرمز به سبز */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 flex flex-wrap items-center justify-between gap-3 text-[10.5px]">
          <span className="font-bold text-slate-500">طیف تراز در یک نگاه:</span>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-850 font-extrabold border border-rose-200">بدهکاری خیلی زیاد (مخاطره‌انگیز) 🔴</span>
            <span className="text-slate-300">←</span>
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-850 font-extrabold border border-amber-200">طلب‌های متوسط حاشیه امن 🟡</span>
            <span className="text-slate-300">←</span>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-850 font-extrabold border border-emerald-200">وضعیت شفاف و نسیه تسویه 🟢</span>
          </div>
          {(searchQuery || filterMode !== 'all' || amountThreshold > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
                setAmountThreshold(0);
                setHighlightColor('none');
              }}
              className="text-red-500 font-bold hover:underline flex items-center gap-1 cursor-pointer font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              پاک کردن همه فیلترها
            </button>
          )}
        </div>
      </div>

      {/* کارد بزرگ لیست اشخاص تجاری با رنگ‌بندی داینامیک */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="debtors-grid-list-view">
        <h3 className="font-bold text-xs text-slate-800 mb-4 flex items-center justify-between">
          <span>لیست کل ترازهای مالی اشخاص ({sortedList.length} شخص یافت شد)</span>
          <span className="text-[10px] text-slate-400 font-sans font-normal">برای ورود تسویه یا کاهش نقدینگی بدهی روی شخص کلیک کنید.</span>
        </h3>

        {sortedList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-sans space-y-2 border border-dashed rounded-2xl" id="debtors-empty-state">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
            <p className="text-xs font-bold text-slate-600">هیچ بدهکار یا بستانکاری بر اساس شرایط جستجوی شما یافت نشد.</p>
            <p className="text-[10px]">فیلتر خود را تغییر داده یا نسبت به ثبت شخص جدید در تب اشخاص و حساب‌ها اقدام نمایید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="debtors-cards-layout">
            {sortedList.map(p => {
              const pillColor = getPillColor(p.balance);
              const hasHighlight = shouldHighlight(p);
              
              // Base custom gradient computed visually 
              return (
                <div
                  key={p.id}
                  id={`debtor-card-${p.id}`}
                  onClick={() => {
                    setSettlePerson(p);
                    setSettleType(p.balance > 0 ? 'Receive' : 'Pay');
                  }}
                  className={`border rounded-2xl p-4.5 cursor-pointer hover:shadow-md transition-all duration-300 relative group overflow-hidden ${
                    hasHighlight 
                      ? getCustomHighlightBg() 
                      : 'bg-white hover:bg-slate-50/50 border-slate-200/85'
                  }`}
                  style={!hasHighlight ? {
                    borderRightWidth: '5px',
                    borderRightColor: p.balance > 0 ? '#ef4444' : p.balance < 0 ? '#4f46e5' : '#10b981'
                  } : {}}
                >
                  {/* Subtle water-marked background pattern depending on status */}
                  <div className="absolute left-2 bottom-2 text-slate-100 group-hover:text-slate-200/80 transition-colors pointer-events-none select-none">
                    <User className="w-16 h-16 opacity-10" />
                  </div>

                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-800 tracking-tight group-hover:text-emerald-700 transition">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{p.phone !== '0' ? p.phone : 'تلفن همراه مفقود'}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-250 rounded-full text-[9px] font-bold">
                      {p.type === 'Customer' ? 'خریدار' : p.type === 'Supplier' ? 'تامین‌کننده پخش' : p.type === 'Employee' ? 'کارمند' : p.type === 'Shareholder' ? 'سهام‌دار' : 'سایر طرف حساب‌ها'}
                    </span>
                  </div>

                  {/* تراز مانده بدهی */}
                  <div className="pt-3 border-t border-dashed border-slate-100 flex items-center justify-between relative z-10">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">تراز مانده معین:</span>
                      <strong className={`text-sm font-black font-mono block tracking-tight ${p.balance > 0 ? 'text-red-650' : p.balance < 0 ? 'text-indigo-655' : 'text-emerald-600'}`}>
                        {p.balance === 0 ? 'حساب کاملا تسویه ✓' : p.balance > 0 ? `+${formatToman(p.balance)}` : `-${formatToman(Math.abs(p.balance))}`}
                      </strong>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${pillColor.bg}`}>
                      {pillColor.badge}
                    </span>
                  </div>

                  {/* Actions hover label */}
                  <div className="mt-2.5 text-[9.5px] text-slate-400 font-sans font-medium text-left pt-2 border-t border-slate-100/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    کلیک جهت ثبت دریافت/پرداخت وجه نقد 💸
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مودال ورود دریافت یا پرداخت بدهی برای طرف حساب‌ها */}
      {settlePerson && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" id="settle-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative space-y-4" id="settle-modal-box">
            
            <button
              onClick={() => setSettlePerson(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 text-right border-b border-slate-100 pb-3">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">وصول سریع دستی</span>
              <h3 className="font-extrabold text-sm text-slate-900 mt-1">تعدیل و تسویه نقدی حساب: {settlePerson.name}</h3>
              <p className="text-[11px] text-slate-400">
                آخرین وضعیت تراز مانده: <strong className="font-mono text-slate-700">{formatToman(settlePerson.balance)} {settlePerson.balance > 0 ? '(بدهکار به ما)' : settlePerson.balance < 0 ? '(طلبکار از ما)' : '(تسویه شده)'}</strong>
              </p>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4 text-right">
              
              {/* جهت وصول */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نوع عملیات دریافت/پرداخت:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSettleType('Receive')}
                    className={`py-2 rounded-lg text-xs font-black text-center cursor-pointer transition ${
                      settleType === 'Receive' 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    دریافت نقدی از شخص (کاهش طلب ما) 💰
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleType('Pay')}
                    className={`py-2 rounded-lg text-xs font-black text-center cursor-pointer transition ${
                      settleType === 'Pay' 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    پرداخت وجه نقد به وی (تسویه بدهی ما) 💸
                  </button>
                </div>
              </div>

              {/* مبلغ */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">معدل مبلغ واریزی (به تومان):</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={settleAmount}
                    onChange={e => setSettleAmount(e.target.value)}
                    placeholder="مبلغ واریزی..."
                    className="w-full pr-3 pl-12 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 bg-slate-50 font-mono text-left"
                  />
                  <span className="absolute left-3 top-3 text-[10px] font-sans font-bold text-slate-400">تومان</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-sans pt-1">
                  <span>کل تراز معلق:</span>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(Math.abs(settlePerson.balance).toString())}
                    className="text-emerald-600 hover:underline font-bold cursor-pointer"
                  >
                    تسویه کل مانده حساب شخص
                  </button>
                </div>
              </div>

              {/* توضیحات */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">یادداشت ثبت در آفرینش تراز معین:</label>
                <textarea
                  value={settleNotes}
                  onChange={e => setSettleNotes(e.target.value)}
                  placeholder="دلیل واریزی، رسید بانکی، کارت به کارت یا چک معلق..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500 bg-slate-50 font-sans"
                />
              </div>

              {/* کلیدها */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  ثبت قطعی در دفاتر روزنامه 💾
                </button>
                <button
                  type="button"
                  onClick={() => setSettlePerson(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
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
