import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { StockLog, Warehouse } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  UserCheck, 
  Boxes, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  X 
} from 'lucide-react';

export default function InventoryLogsTab() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('All');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedChangeType, setSelectedChangeType] = useState<'All' | 'Increase' | 'Decrease' | 'Transfer'>('All');

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    setLogs(OfflineDatabase.getStockLogs());
    setWarehouses(OfflineDatabase.getWarehouses());
  };

  // Generate unique list of operators in logs for dynamic filtering
  const operatorsList = Array.from(
    new Set(logs.map(log => log.user_name || 'نامعلوم').filter(Boolean))
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedWarehouseId('All');
    setSelectedOperator('All');
    setSelectedChangeType('All');
  };

  const filteredLogs = logs.filter(log => {
    // 1. Search filter
    const matchesSearch = 
      log.product_title.includes(searchQuery) || 
      (log.product_id && log.product_id.includes(searchQuery)) ||
      log.reason.includes(searchQuery);
    if (!matchesSearch) return false;

    // 2. Warehouse Filter
    if (selectedWarehouseId !== 'All' && log.warehouse_id !== selectedWarehouseId) {
      return false;
    }

    // 3. Operator Filter
    if (selectedOperator !== 'All') {
      const opName = log.user_name || 'نامعلوم';
      if (opName !== selectedOperator) return false;
    }

    // 4. Change Type Filter
    if (selectedChangeType !== 'All') {
      const isTransfer = log.reason.includes('انتقال') || log.reason.includes('بین انبار');
      if (selectedChangeType === 'Transfer' && !isTransfer) return false;
      if (selectedChangeType === 'Increase' && (log.change_qty <= 0 || isTransfer)) return false;
      if (selectedChangeType === 'Decrease' && (log.change_qty >= 0 || isTransfer)) return false;
    }

    return true;
  });

  const getLogTypeBadge = (log: StockLog) => {
    const isTransfer = log.reason.includes('انتقال') || log.reason.includes('بین انبار');
    if (isTransfer) {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-150 inline-flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" /> انتقال بین انبار
        </span>
      );
    }
    if (log.change_qty > 0) {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-150 inline-flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> ورود/افزایش
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-150 inline-flex items-center gap-1">
        <TrendingDown className="w-3 h-3" /> خروج/کاهش
      </span>
    );
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 bg-slate-50 select-none" id="inventory-logs-main">
      
      {/* هدر صفحه */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="logs-header">
        <div className="space-y-1 text-right">
          <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 inline-flex items-center gap-1 font-mono">
            <History className="w-3.5 h-3.5" /> Warehousing Stock Audit Trails
          </span>
          <h2 className="text-lg font-black text-slate-800">تاریخچه ممیزی و کارتابل عملیات انبارداری</h2>
          <p className="text-xs text-slate-500 font-sans font-medium">
            ردگیری ثانیه به ثانیه ورود و خروج کالا، انتقال مابین دپوها، کسری بابت صندوق POS و تفکیک پرونده بر پایه ثبت‌کننده
          </p>
        </div>

        <button
          onClick={refreshLogs}
          className="py-1.8 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> بروزرسانی لیست
        </button>
      </div>

      {/* پنل فیلترینگ و ممیزی پیشرفته */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="logs-filtering-card">
        <h3 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          ابزارهای فیلترینگ و بازرسی اسناد دپوها
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* کادر سرچ چشمی */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">جستجوی کالا یا بابت دلیل:</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="نام محصول، شناسه یا فاکتور..."
                className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* فیلتر انبار */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">بایگانی مربوط به انبار:</label>
            <select
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
            >
              <option value="All">نمایش تمامی انبارها (دپوها)</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          {/* فیلتر ثبت‌کننده */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">ممیزی مسئول ثبت‌کننده (کاربر):</label>
            <select
              value={selectedOperator}
              onChange={e => setSelectedOperator(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
            >
              <option value="All">نمایش تمامی کاربران ثبت‌کننده</option>
              {operatorsList.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {/* فیلتر نوع تغییر */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">دسته‌بندی ماهیت رویداد انبار:</label>
            <select
              value={selectedChangeType}
              onChange={e => setSelectedChangeType(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
            >
              <option value="All">نمایش کل رویدادها</option>
              <option value="Increase">صرفاً ورود کالا (افزایش موجودی ثبتی)</option>
              <option value="Decrease">صرفاً خروج کالا (فروش صندوق یا ضایعات)</option>
              <option value="Transfer">صرفاً حواله انتقال بین انبارها</option>
            </select>
          </div>

        </div>

        {(searchQuery || selectedWarehouseId !== 'All' || selectedOperator !== 'All' || selectedChangeType !== 'All') && (
          <div className="flex justify-end pt-1" id="clear-filters-btn-holder">
            <button
              onClick={clearFilters}
              className="py-1 px-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold hover:bg-rose-100 flex items-center gap-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> پاکسازی تمامی فیلترها
            </button>
          </div>
        )}
      </div>

      {/* گرید/لیست اسناد تراکنش های انبار */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_3px_12px_-5px_rgba(0,0,0,0.04)] overflow-hidden" id="logs-list-holder">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <strong className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-indigo-600" />
            رویدادهای تفصیلی و دفترچه تفکیک فرآیندها
          </strong>
          <span className="text-[10px] font-mono text-slate-400 font-bold bg-white border border-slate-200/60 px-2.5 py-1 rounded-full">
            تعداد اسناد یافت شده: {filteredLogs.length} ردیف
          </span>
        </div>

        <div className="overflow-x-auto text-[11px]" id="logs-history-tbl">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 h-10 font-bold">
                <th className="p-3 w-12 text-center">ردیف</th>
                <th className="p-3 text-center">ثبت رویداد</th>
                <th className="p-3">عنوان کالا</th>
                <th className="p-3 text-center">نوع تراکنش</th>
                <th className="p-3">انبار مرجع</th>
                <th className="p-3 text-center">مقادیر قبل ← بعد</th>
                <th className="p-3 text-left">تغییر تراز</th>
                <th className="p-3">مسئول مسئول (اپراتور)</th>
                <th className="p-3">انگیزه و دلیل رسمی سیستمی انبار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => {
                const isPositive = log.change_qty > 0;
                const isTransfer = log.reason.includes('انتقال') || log.reason.includes('بین انبار');
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/40 h-12">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 text-center text-slate-550 font-mono">
                      {new Date(log.created_at).toLocaleDateString('fa-IR')}
                      <span className="text-[9px] text-slate-350 block mt-0.5 font-mono">
                        {new Date(log.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-800">
                      {log.product_title}
                      <span className="text-[9px] text-slate-400 block font-mono">ID: {log.product_id}</span>
                    </td>
                    <td className="p-3 text-center">
                      {getLogTypeBadge(log)}
                    </td>
                    <td className="p-3 text-slate-700 font-bold">
                      {log.warehouse_name || 'انبار مرکزی (سوله دپوی قطران)'}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      {log.previous_qty} ← {log.new_qty}
                    </td>
                    <td className={`p-3 text-left font-mono font-black text-sm ${
                      isTransfer 
                        ? 'text-indigo-600' 
                        : isPositive 
                          ? 'text-emerald-600' 
                          : 'text-rose-650'
                    }`}>
                      {isTransfer 
                        ? `⇄ ${Math.abs(log.change_qty)}` 
                        : isPositive 
                          ? `+${log.change_qty}` 
                          : `${log.change_qty}`}
                    </td>
                    <td className="p-3 text-slate-850 font-extrabold">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-205">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        {log.user_name || 'نامعلوم'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-xl text-[10px] text-slate-500 font-medium font-sans inline-block leading-snug">
                        {log.reason}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400 italic bg-white border-dashed">
                    در پرونده بایگانی انبارداری با شروط انتخابی شما، هیچ نوع رویداد فیزیکی برای کالا دپارتمان ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
