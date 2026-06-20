import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person } from '../types';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Calendar, 
  Filter, 
  BarChart4, 
  PieChart as PieIcon, 
  LineChart as LineIcon,
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PenSquare,
  RefreshCw,
  Coins,
  History,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

interface ShareholderTx {
  id: string;
  shareholderId: string;
  shareholderName: string;
  type: 'Profit' | 'Withdrawal' | 'Capital'; // تخصیص سود ماهانه، برداشت نقدی، تزریق سرمایه جدید
  amount: number;
  date: string; // ISO date string or YYYY-MM-DD
  notes: string;
}

export default function ShareholdersTab() {
  const [shareholders, setShareholders] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<ShareholderTx[]>([]);
  
  // Tab states: 'overview' | 'transactions' | 'charts'
  const [activeSubView, setActiveSubView] = useState<'overview' | 'transactions' | 'charts'>('overview');
  
  // Shareholder form
  const [showShareholderModal, setShowShareholderModal] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Person | null>(null);
  const [shName, setShName] = useState('');
  const [shPhone, setShPhone] = useState('');
  const [shPercentage, setShPercentage] = useState<number>(0);
  const [shNotes, setShNotes] = useState('');
  const [shAddress, setShAddress] = useState('');

  // Transaction form
  const [showTxModal, setShowTxModal] = useState(false);
  const [txShareholderId, setTxShareholderId] = useState('');
  const [txType, setTxType] = useState<'Profit' | 'Withdrawal' | 'Capital'>('Profit');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');

  // Chart and Ledger active filters
  const [filterShareholder, setFilterShareholder] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'area' | 'pie'>('bar');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    // 1. Load active persons of type 'Shareholder' from OfflineDatabase
    const allPersons = OfflineDatabase.getPersons();
    const shList = allPersons.filter(p => p.type === 'Shareholder');
    
    // Autoseed template shareholders if none exist to make it immediately beautiful!
    if (shList.length === 0) {
      const s1 = OfflineDatabase.savePerson({
        name: 'مهندس بابک طاهری (سهام‌دار رئیس هیات مدیره)',
        phone: '09121112233',
        type: 'Shareholder',
        balance: 4500000,
        share_percentage: 40,
        notes: 'بنیان‌گذار اولیه فروشگاهی آریا',
        address: 'دفتر مرکزی تهران'
      });
      const s2 = OfflineDatabase.savePerson({
        name: 'دکتر هومن نجفی (سهام‌دار سرمایه‌گذار)',
        phone: '09124445566',
        type: 'Shareholder',
        balance: -1200000,
        share_percentage: 30,
        notes: 'سرمایه‌گذار فاز اول توسعه تدارکات',
        address: 'مرکز تجاری آریا'
      });
      const updatedList = [s1, s2];
      setShareholders(updatedList);
      seedInitTransactions(updatedList);
    } else {
      setShareholders(shList);
      loadShareholderTransactions();
    }
  };

  const seedInitTransactions = (shs: Person[]) => {
    const defaultTxs: ShareholderTx[] = [
      {
        id: 'tx_seed_1',
        shareholderId: shs[0].id,
        shareholderName: shs[0].name,
        type: 'Capital',
        amount: 25000000,
        date: '2026-05-10',
        notes: 'تزریق سرمایه نقدی کلید توسعه'
      },
      {
        id: 'tx_seed_2',
        shareholderId: shs[0].id,
        shareholderName: shs[0].name,
        type: 'Profit',
        amount: 6000000,
        date: '2026-06-01',
        notes: 'تقسیم سود دوره اردیبهشت‌ماه ۱۴۰۵'
      },
      {
        id: 'tx_seed_3',
        shareholderId: shs[0].id,
        shareholderName: shs[0].name,
        type: 'Withdrawal',
        amount: 1500000,
        date: '2026-06-05',
        notes: 'برداشت نقدی سهام‌دار طاهری'
      },
      // Shareholder 2
      {
        id: 'tx_seed_4',
        shareholderId: shs[1].id,
        shareholderName: shs[1].name,
        type: 'Capital',
        amount: 18000000,
        date: '2026-05-15',
        notes: 'سرمایه ثبتی اولیه سهام‌دار نجفی'
      },
      {
        id: 'tx_seed_5',
        shareholderId: shs[1].id,
        shareholderName: shs[1].name,
        type: 'Profit',
        amount: 4500000,
        date: '2026-06-01',
        notes: 'تقسیم سود دوره اردیبهشت‌ماه ۱۴۰۵'
      },
      {
        id: 'tx_seed_6',
        shareholderId: shs[1].id,
        shareholderName: shs[1].name,
        type: 'Withdrawal',
        amount: 5700000,
        date: '2026-06-11',
        notes: 'برداشت نقدی بابت هزینه‌های شخصی'
      }
    ];

    localStorage.setItem('shop_accounting_shareholder_txs', JSON.stringify(defaultTxs));
    setTransactions(defaultTxs);
  };

  const loadShareholderTransactions = () => {
    const raw = localStorage.getItem('shop_accounting_shareholder_txs');
    if (raw) {
      setTransactions(JSON.parse(raw));
    } else {
      setTransactions([]);
    }
  };

  const saveTransactionsToStorage = (list: ShareholderTx[]) => {
    localStorage.setItem('shop_accounting_shareholder_txs', JSON.stringify(list));
    setTransactions(list);
  };

  // Create or Update shareholder
  const handleSaveShareholderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shName.trim()) return;

    const percentageVal = Number(shPercentage);
    if (percentageVal < 0 || percentageVal > 100) {
      alert('درصد سهام باید بین ۰ تا ۱۰۰ باشد.');
      return;
    }

    // Verify limit 100% total
    const otherSum = shareholders
      .filter(s => s.id !== editingShareholder?.id)
      .reduce((sum, s) => sum + (s.share_percentage || 0), 0);
    
    if (otherSum + percentageVal > 100) {
      alert(`مجموع درصد سهام نمی‌تواند بیشتر از ۱۰۰ باشد. سهم تخصیص‌یافته به بقیه: ${otherSum}٪، حداکثر مقدار مجاز باقیمانده: ${100 - otherSum}٪ است.`);
      return;
    }

    OfflineDatabase.savePerson({
      id: editingShareholder?.id || undefined,
      name: shName,
      phone: shPhone || '0',
      type: 'Shareholder',
      balance: editingShareholder?.balance || 0,
      share_percentage: percentageVal,
      notes: shNotes,
      address: shAddress
    });

    setEditingShareholder(null);
    setShName('');
    setShPhone('');
    setShPercentage(0);
    setShNotes('');
    setShAddress('');
    setShowShareholderModal(false);
    refreshData();
    
    // notify parent component update
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Edit action
  const startEditShareholder = (sh: Person) => {
    setEditingShareholder(sh);
    setShName(sh.name);
    setShPhone(sh.phone);
    setShPercentage(sh.share_percentage || 0);
    setShNotes(sh.notes || '');
    setShAddress(sh.address || '');
    setShowShareholderModal(true);
  };

  // Delete Action
  const handleDeleteShareholder = (id: string) => {
    if (confirm('آیا از حذف این ردیف سهام‌دار و ترازهای ذی‌ربط اطمینان دارید؟')) {
      OfflineDatabase.deletePerson(id);
      
      // Also delete corresponding transactions
      const cleanedTxs = transactions.filter(tx => tx.shareholderId !== id);
      saveTransactionsToStorage(cleanedTxs);
      
      refreshData();
      window.dispatchEvent(new Event('cofeclick_settings_updated'));
    }
  };

  // Record Shareholder Payout or Profit distribution
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txShareholderId || !txAmount) {
      alert('لطماً سهامدار و مبلغ تراکنش را مشخص نمایید.');
      return;
    }

    const value = Number(txAmount);
    if (value <= 0 || isNaN(value)) {
      alert('مبلغ معتبری وارد نمایید.');
      return;
    }

    const matchedSh = shareholders.find(s => s.id === txShareholderId);
    if (!matchedSh) return;

    // Create transactional record
    const newTx: ShareholderTx = {
      id: 'sh_tx_' + Date.now(),
      shareholderId: txShareholderId,
      shareholderName: matchedSh.name,
      type: txType,
      amount: value,
      date: txDate,
      notes: txNotes || 'بدون یادداشت'
    };

    // Update shareholder balance in database
    // - Profit Distribution (سود تقسیمی): increases shareholder balance (what store owes them) -> balance decreases (since store owes them, it represents owner's credit)
    // Wait, in our schema: Positive balance = the person owes money to the store. Negative balance = store owes money to them.
    // If we assign them PROFIT: the store owes them MORE. So their balance decreases (or goes more negative/less positive).
    // If they WITHDRAW money (برداشت نقدی): They take money from the store. This increases progress of what they owe / decreases store's debt to them -> balance increases (becomes less negative/more positive).
    // If they inject CAPITAL (تزریق سرمایه): The store owes them more -> balance decreases.
    let balanceDelta = 0;
    if (txType === 'Profit') {
      balanceDelta = -value; // Store owes them more
    } else if (txType === 'Capital') {
      balanceDelta = -value; // Store owes them more
    } else if (txType === 'Withdrawal') {
      balanceDelta = value; // They withdrew from we owe, or they now owe store
    }

    OfflineDatabase.savePerson({
      ...matchedSh,
      balance: matchedSh.balance + balanceDelta
    });

    const updatedTxs = [newTx, ...transactions];
    saveTransactionsToStorage(updatedTxs);
    
    // reset form
    setTxAmount('');
    setTxNotes('');
    setShowTxModal(false);
    refreshData();
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Delete Transaction
  const handleDeleteTx = (txId: string) => {
    if (!confirm('آیا از بازگرداندن این تراکنش مالی و خنثی‌سازی تراز آن مطمئن می‌باشید؟')) return;
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const matchedSh = shareholders.find(s => s.id === tx.shareholderId);
    if (matchedSh) {
      // Revert the balance changes
      let balanceDelta = 0;
      if (tx.type === 'Profit' || tx.type === 'Capital') {
        balanceDelta = tx.amount; // Add back what we subtracted
      } else if (tx.type === 'Withdrawal') {
        balanceDelta = -tx.amount; // Subtract what we added
      }

      OfflineDatabase.savePerson({
        ...matchedSh,
        balance: matchedSh.balance + balanceDelta
      });
    }

    const updated = transactions.filter(t => t.id !== txId);
    saveTransactionsToStorage(updated);
    refreshData();
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Dynamic filter application for ledger & charts
  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      const matchSh = filterShareholder === 'all' || tx.shareholderId === filterShareholder;
      const matchStart = !filterStartDate || tx.date >= filterStartDate;
      const matchEnd = !filterEndDate || tx.date <= filterEndDate;
      return matchSh && matchStart && matchEnd;
    });
  };

  const filteredTxList = getFilteredTransactions();

  // Recharts Data Aggregation for Dataviz
  // Chart 1: Pie chart of capital shares allocations
  const getPieChartData = () => {
    const data = shareholders.map(s => ({
      name: s.name.split(' ')[0] + ' ' + (s.name.split(' ')[1] || ''),
      value: s.share_percentage || 0
    }));

    const totalAssigned = shareholders.reduce((sum, s) => sum + (s.share_percentage || 0), 0);
    if (totalAssigned < 100) {
      data.push({
        name: 'سهم آزاد صنف فروشگاه',
        value: 100 - totalAssigned
      });
    }
    return data;
  };

  // Chart 2: Grouped Bar chart of profits vs withdrawals of each shareholder
  const getBarChartData = () => {
    return shareholders.map(s => {
      const shTxs = transactions.filter(t => t.shareholderId === s.id);
      const totalProfits = shTxs.filter(t => t.type === 'Profit').reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = shTxs.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
      const totalCapitals = shTxs.filter(t => t.type === 'Capital').reduce((sum, t) => sum + t.amount, 0);

      return {
        name: s.name.split(' ')[0],
        'سود تخصیصی': totalProfits / 1000, // Show in thousand Tomans for cleaner axis
        'برداشت‌های نقدی': totalWithdrawals / 1000,
        'سرمایه‌گذاری اضافی': totalCapitals / 1000,
      };
    });
  };

  // Chart 3: Over-time distribution details (Area chart) sorted by date
  const getTimelineChartData = () => {
    const sortedTxs = [...filteredTxList].sort((a, b) => a.date.localeCompare(b.date));
    
    // Group totals by date
    const dateMap: { [date: string]: { profit: number; withdrawal: number; capital: number } } = {};
    
    sortedTxs.forEach(tx => {
      if (!dateMap[tx.date]) {
        dateMap[tx.date] = { profit: 0, withdrawal: 0, capital: 0 };
      }
      if (tx.type === 'Profit') dateMap[tx.date].profit += tx.amount / 1000;
      else if (tx.type === 'Withdrawal') dateMap[tx.date].withdrawal += tx.amount / 1000;
      else if (tx.type === 'Capital') dateMap[tx.date].capital += tx.amount / 1000;
    });

    return Object.keys(dateMap).map(d => ({
      date: new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      'برداشت': dateMap[d].withdrawal,
      'سود تقسیمی': dateMap[d].profit,
      'سرمایه': dateMap[d].capital,
    }));
  };

  // Themes and colors
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#cbd5e1'];

  // Global aggregate summaries
  const totalShareholdersCount = shareholders.length;
  const totalProfitDistributed = transactions.filter(t => t.type === 'Profit').reduce((sum, t) => sum + t.amount, 0);
  const totalCashWithdrawals = transactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 select-none bg-slate-50" id="shareholders-pane-root">
      
      {/* هدر بخش سهامداران با دکوراسیون طلایی مدرن */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="sh-header">
        <div className="space-y-1.5 text-right">
          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1 font-mono">
            <Coins className="w-3.5 h-3.5" /> Shareholder Capital Ledger
          </span>
          <h2 className="text-lg font-black text-slate-800">سامانه جامع نظارت بر سهامداران و توزیع منافع ماهانه</h2>
          <p className="text-xs text-slate-500 font-sans font-medium">
            مدیریت ترازنامه، توزیع سود، برداشت‌های جاری سهامداران، تحلیل درصد مشارکت و پایش بصری اهداف سوددهی
          </p>
        </div>

        {/* کلیدهای افزودن */}
        <div className="flex flex-wrap gap-2 self-stretch md:self-auto">
          <button
            onClick={() => {
              setEditingShareholder(null);
              setShName('');
              setShPhone('');
              setShPercentage(0);
              setShNotes('');
              setShAddress('');
              setShowShareholderModal(true);
            }}
            className="flex-1 md:flex-initial py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            سهام‌دار جدید
          </button>
          <button
            onClick={() => {
              if (shareholders.length === 0) {
                alert('لطفاً ابتدا سهام‌دار ثبت فرمایید.');
                return;
              }
              setTxShareholderId(shareholders[0].id);
              setShowTxModal(true);
            }}
            className="flex-1 md:flex-initial py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            ثبت و تقسیم سود / برداشت
          </button>
        </div>
      </div>

      {/* زبانه ناوبری داخلی هدر فرعی */}
      <div className="flex border-b border-slate-205 pb-0.5 gap-2" id="sh-inner-navigation">
        <button
          onClick={() => setActiveSubView('overview')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubView === 'overview' 
              ? 'border-amber-500 text-amber-600 bg-white shadow-3xs' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            نمای کلی و سهام سهامداران
          </div>
        </button>
        <button
          onClick={() => setActiveSubView('transactions')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubView === 'transactions' 
              ? 'border-amber-500 text-amber-600 bg-white shadow-3xs' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            دفتر اندیکاتور تراکنش‌های سهام ({transactions.length} رکورد)
          </div>
        </button>
        <button
          onClick={() => setActiveSubView('charts')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubView === 'charts' 
              ? 'border-amber-500 text-amber-600 bg-white shadow-3xs' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BarChart4 className="w-4 h-4" />
            نمودارهای تعاملی و سود ماهانه 📊
          </div>
        </button>
      </div>

      {/* ۱. نمای کلی (Overview List) */}
      {activeSubView === 'overview' && (
        <div className="space-y-6" id="sh-view-overview">
          
          {/* کارت‌های خلاصه حسابداری سهام */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="sh-aggregate-cards">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">سود تقسیم‌شده کل سرمایه‌گذاری:</span>
                <strong className="text-base font-black text-teal-600 font-mono tracking-tight block mt-1">
                  {totalProfitDistributed.toLocaleString('fa-IR')} تومان
                </strong>
                <span className="text-[9px] text-slate-400 block font-normal">کل دوره‌های حسابرسی معلق</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">برداشت نقدی جاری سهام‌داران:</span>
                <strong className="text-base font-black text-rose-600 font-mono tracking-tight block mt-1">
                  {totalCashWithdrawals.toLocaleString('fa-IR')} تومان
                </strong>
                <span className="text-[9px] text-slate-400 block font-normal">مستهلک‌کننده بستانکاری سهامداران</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">تعداد سهامداران ثبتی شرکت:</span>
                <strong className="text-base font-black text-amber-600 font-mono block mt-1">
                  {totalShareholdersCount} عضو سرمایه‌گذار
                </strong>
                <span className="text-[9px] text-slate-400 block font-normal">
                  سهم تخصیصی: {shareholders.reduce((sum, s) => sum + (s.share_percentage || 0), 0)}٪ متعارف
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="sh-list-card">
            <h3 className="font-extrabold text-xs text-slate-800 mb-4 font-sans">فهرست کل اعضای سهام‌دار و شرکای تجاری</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="sh-partners-grid">
              {shareholders.map(sh => {
                const totalShProfits = transactions.filter(t => t.shareholderId === sh.id && t.type === 'Profit').reduce((sum, t) => sum + t.amount, 0);
                const totalShWiths = transactions.filter(t => t.shareholderId === sh.id && t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div
                    key={sh.id}
                    className="border border-slate-200 hover:border-amber-400 rounded-2xl p-4.5 bg-white transition hover:shadow-md relative overflow-hidden"
                  >
                    {/* Ring indicator showing share percent value */}
                    <div className="absolute left-4 top-4 bg-amber-50 border border-amber-200 rounded-2xl px-2.5 py-1 text-amber-650 font-black text-xs font-mono">
                      {sh.share_percentage || 0}% سهم
                    </div>

                    <div className="space-y-1 pr-1">
                      <h4 className="font-extrabold text-xs text-slate-800">{sh.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">تلفن: {sh.phone}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10.5px] leading-relaxed">
                      <div>
                        <span className="text-slate-400 block">مانده حساب بومی:</span>
                        <strong className={`font-mono text-xs ${sh.balance < 0 ? 'text-teal-650' : sh.balance > 0 ? 'text-red-655' : 'text-slate-600'}`}>
                          {sh.balance === 0 ? 'بی‌تراز (صفر)' : sh.balance < 0 ? `${Math.abs(sh.balance).toLocaleString('fa-IR')} فروشگاه بدهکار` : `${sh.balance.toLocaleString('fa-IR')} طلبکار فروشگاه`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-normal">سود دریافتی تفکیکی:</span>
                        <strong className="text-slate-700 font-mono text-xs">
                          {totalShProfits.toLocaleString('fa-IR')}
                        </strong>
                      </div>
                      <div className="col-span-2 mt-1 bg-slate-50 p-2 rounded-xl text-[9.5px] text-slate-500 font-sans leading-relaxed">
                        <strong>یادداشت آدرس:</strong> {sh.address || 'ثبت نشده'}
                        <div className="mt-0.5"><strong>توضیحات:</strong> {sh.notes || '---'}</div>
                      </div>
                    </div>

                    {/* عملیات */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px]">
                      <button
                        onClick={() => startEditShareholder(sh)}
                        className="p-1.5 border border-slate-200 hover:border-amber-400 text-slate-500 hover:text-amber-600 rounded-lg cursor-pointer flex items-center justify-center bg-white shadow-3xs"
                        title="ویرایش سهامدار"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShareholder(sh.id)}
                        className="p-1.5 border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer flex items-center justify-center bg-white shadow-3xs"
                        title="حذف سهامدار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* ۲. دفتر معین تراکنش‌های سهام (Transactions List with dates) */}
      {activeSubView === 'transactions' && (
        <div className="space-y-6" id="sh-view-transactions">
          
          {/* کارت ابزارهای فیلترینگ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="sh-tx-filters">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-amber-500" />
              موتور جستجوی اسناد حسابرسی سهامداران
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium" id="sh-tx-inputs">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">تفکیک بر اساس سهام‌دار:</label>
                <select
                  value={filterShareholder}
                  onChange={e => setFilterShareholder(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="all">تمام سهام‌داران</option>
                  {shareholders.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">از تاریخ صدور:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">تا تاریخ صدور:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-left"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="sh-ledger-table-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-xs text-slate-800">اسناد معلق ثبتی دفترداری</h3>
              {filteredTxList.length > 0 && (
                <button
                  onClick={() => {
                    setFilterShareholder('all');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-amber-600 hover:underline text-[10px] font-bold"
                >
                  حذف فیلترها
                </button>
              )}
            </div>

            <div className="overflow-x-auto text-[11px]" id="sh-ledgers-tbl">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 h-9">
                    <th className="p-2 w-12 text-center">ردیف</th>
                    <th className="p-2">نام سهام‌دار</th>
                    <th className="p-2 text-center">نوع تراکنش</th>
                    <th className="p-2 text-left">مبلغ (تومان)</th>
                    <th className="p-2 text-center">تاریخ تراکنش</th>
                    <th className="p-2">یادداشت تخصیصی مدیر مالی</th>
                    <th className="p-2 text-center w-12">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxList.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 h-9">
                      <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-extrabold text-slate-700">{tx.shareholderName}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          tx.type === 'Profit' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : tx.type === 'Withdrawal' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {tx.type === 'Profit' ? 'کاهش طلبکار / سود تقسیم‌شده 🟢' : tx.type === 'Withdrawal' ? 'برداشت نقدی سهام 🔴' : 'تزریق سرمایه نقدی 🔵'}
                        </span>
                      </td>
                      <td className="p-2 text-left font-mono font-bold text-slate-800">
                        {tx.amount.toLocaleString('fa-IR')} T
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500">
                        {new Date(tx.date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-2 text-slate-400 italic text-[10px]">{tx.notes}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                        >
                          لغو سند
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTxList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-sans italic">
                        هیچ سندی سازگار با فیلتر سهامداری بارگذاری نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ۳. بخش پایش چارت‌های تعاملی پوینده */}
      {activeSubView === 'charts' && (
        <div className="space-y-6 animate-fade-in" id="sh-view-charts">
          
          {/* پنل انتخاب چارت برتر */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="sh-chart-picker-wrapper">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <BarChart4 className="w-4 h-4 text-amber-500 animate-pulse" />
                تعیین فرمت نقشه و مدل چارت هوشمند
              </h4>
              
              <div className="flex p-0.5 rounded-lg bg-slate-100 text-xs font-medium">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  مقایسه سود و برداشت (کارتونی میله‌ای)
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartType === 'area' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  خطوط زمانی برداری (موجی انباشته)
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartType === 'pie' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  تقویم تقسیم سهام (فلاپی دایره‌ای)
                </button>
              </div>
            </div>

            {/* تفکیک فیلتری مخصوص چارت */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium" id="chart-subfilters">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">انتخاب سهامدار مرجع روی چارت:</label>
                <select
                  value={filterShareholder}
                  onChange={e => setFilterShareholder(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="all">پایش کل سهامداران</option>
                  {shareholders.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500 font-sans">بازه فیزیکی شروع تاریخ:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500 font-sans">انتهای تاریخ فیلتر:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-left"
                />
              </div>
            </div>
          </div>

          {/* کادر چارت Recharts */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm min-h-[350px] relative" id="charts-render-area">
            
            {/* عنوان پویای چارت */}
            <div className="text-right mb-5">
              <h3 className="font-bold text-xs text-slate-800 leading-none">
                {chartType === 'bar' ? 'تحلیل مقایسه‌ای سود تقسیمی در برابر برداشت‌ها (مبالغ به هزار تومان)' : chartType === 'area' ? 'ترند نوسان مالی فصلی درآمدها بابت تاریخ فیلترشده (بر اساس هزار تومان)' : 'نمودار کیک دایره‌ای توزیع حق مالکیت سرمایه ثبتی اولیه'}
              </h3>
              <p className="text-[10px] text-slate-400 block mt-1.5">نرمال‌سازی اتوماتیک و هماهنگی کامل با کوئری‌های معین</p>
            </div>

            {/* بدنه چارت ریچارتز */}
            <div className="w-full h-80" dir="ltr" id="inner-canvas">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis label={{ value: 'هزار تومان', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${(Number(value) * 1000).toLocaleString('fa-IR')} تومان`, '']} itemStyle={{ textAlign: 'right', direction: 'rtl', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, direction: 'rtl' }} />
                    <Bar dataKey="سود تخصیصی" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="برداشت‌های نقدی" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="سرمایه‌گذاری اضافی" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'area' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getTimelineChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${(Number(value) * 1000).toLocaleString('fa-IR')} تومان`, '']} itemStyle={{ direction: 'rtl', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="سود تقسیمی" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                    <Area type="monotone" dataKey="برداشت" stroke="#ef4444" fillOpacity={1} fill="url(#colorWith)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} درصد از کل سهام`, '']} itemStyle={{ direction: 'rtl', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, direction: 'rtl' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>

        </div>
      )}

      {/* مودال اول: ویرایش یا ثبت سهام‌دار */}
      {showShareholderModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in" id="sh-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative space-y-4 text-right" id="sh-modal">
            
            <button
              onClick={() => setShowShareholderModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              {editingShareholder ? 'ویرایش مشخصات ثبتی سهام‌دار' : 'افزودن عضو سهام‌دار جدید به شرکت'}
            </h3>

            <form onSubmit={handleSaveShareholderSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  value={shName}
                  onChange={e => setShName(e.target.value)}
                  placeholder="مثلا مهندس طاهری..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">تلفن همراه متمم:</label>
                  <input
                    type="text"
                    value={shPhone}
                    onChange={e => setShPhone(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">سهم شراکت (درصد ۱ تا ۱۰۰):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={shPercentage === 0 ? '' : shPercentage}
                    onChange={e => setShPercentage(Number(e.target.value))}
                    placeholder="مثلا ۳۰ درصد..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نشانی مرکز:</label>
                <input
                  type="text"
                  value={shAddress}
                  onChange={e => setShAddress(e.target.value)}
                  placeholder="آدرس مرکز..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">یادداشت داخلی:</label>
                <textarea
                  value={shNotes}
                  onChange={e => setShNotes(e.target.value)}
                  placeholder="مشخصات بانکی، سمت یا شرایط واگذاری..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  ذخیره عضو سهام‌دار 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareholderModal(false)}
                  className="py-2.5 px-4 bg-slate-150 text-slate-600 text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال دوم: ثبت تراکنش مادی (تقسیم سود یا برداشت) */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in" id="tx-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative space-y-4 text-right" id="tx-modal">
            
            <button
              onClick={() => setShowTxModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              سند انتقال مال و ثبت سرمایه سهامداری
            </h3>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">انتخاب سهام‌دار:</label>
                <select
                  value={txShareholderId}
                  onChange={e => setTxShareholderId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                >
                  {shareholders.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.share_percentage || 0}٪ سهم)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نوع سند و تراکنش معین:</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTxType('Profit')}
                    className={`py-2 rounded-lg text-center cursor-pointer transition ${txType === 'Profit' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-slate-500'}`}
                  >
                    تقسیم سود دوره 🟢
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('Withdrawal')}
                    className={`py-2 rounded-lg text-center cursor-pointer transition ${txType === 'Withdrawal' ? 'bg-rose-600 text-white shadow-3xs' : 'text-slate-500'}`}
                  >
                    برداشت جاری سهام‌دار 🔴
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('Capital')}
                    className={`py-2 rounded-lg text-center cursor-pointer transition ${txType === 'Capital' ? 'bg-indigo-650 text-white shadow-3xs' : 'text-slate-500'}`}
                  >
                    تزریق سرمایه جدید 🔵
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">مبلغ سند مالی (تومان):</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    placeholder="مبلغ سند..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">تاریخ تراکنش:</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 font-sans">یادداشت و جزئیات سند مالی:</label>
                <textarea
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  placeholder="مثلا پرداخت نقدی بابت سود اردیبهشت، خرید شماره رسید..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  ثبت قطعی سند حسابرسی 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
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
