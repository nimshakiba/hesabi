import React, { useState, useEffect } from 'react';
import { OfflineDatabase, ELECTRON_IPC_BOILERPLATE } from '../db/offlineDb';
import { Cpu, Terminal, Copy, Check, Download, Upload, Trash2, Database } from 'lucide-react';

export default function ElectronIpcTab() {
  const [sqlLogs, setSqlLogs] = useState<string[]>([]);
  const [copiedSection, setCopiedSection] = useState<'preload' | 'main' | null>(null);

  // لود پرونده‌ها یا پیام موفقیت
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [dbBackupString, setDbBackupString] = useState('');

  useEffect(() => {
    setSqlLogs(OfflineDatabase.getSqlLogs());
    setDbBackupString(OfflineDatabase.exportDatabaseState());
    
    // پولینگ کوتاه مدت جهت بروز نگه داشتن سریع کدهای دیتابیس در تلوین
    const interval = setInterval(() => {
      setSqlLogs(OfflineDatabase.getSqlLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyText = (text: string, sec: 'preload' | 'main') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sec);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleExportBackup = () => {
    const rawState = OfflineDatabase.exportDatabaseState();
    const blob = new Blob([rawState], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shop_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result as string;
      const success = OfflineDatabase.importDatabaseState(data);
      setImportSuccess(success);
      if (success) {
        setDbBackupString(data);
        alert('پایگاه‌داده با موفقیت بازگرانی شد. تمام اقلام، کالاها، تراکنش‌های مشتری و انبار بازنویسی شدند.');
      } else {
        alert('خطا در بازگردانی فایل پشتیبان. کدهای JSON فاقد ساختار استاندارد هستند.');
      }
      setTimeout(() => setImportSuccess(null), 4000);
    };
    reader.readAsText(file);
  };

  const clearDatabaseLogs = () => {
    OfflineDatabase.clearSqlLogs();
    setSqlLogs([]);
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto" id="electron-ipc-container">
      <div className="max-w-6xl mx-auto space-y-6" id="electron-grid">
        
        {/* ردیف اول: وضعیت زنده دیتابیس بومی و لاگ‌های SQL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="live-telemetry-row">
          
          {/* مدیریت پشتیبان آفلاین */}
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 shadow-lg space-y-4" id="offline-backup-card">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
               پشتیبان‌گیری آفلاین و بازیابی بانک اطلاعاتی
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              شما می‌توانید تراز نهایی اطلاعات شامل افراد، کالاها و انبار را در قالب یک فایل پشتیبان دانلود نموده و هنگام نیاز مجددا وارد نرم‌افزار کنید.
            </p>

            <div className="pt-2 flex flex-col gap-2.5 text-xs">
              <button
                id="export-db-backup-btn"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                دانلود بکاپ طلایی فروشگاه (JSON)
              </button>

              <div className="relative">
                <input
                  id="import-db-backup-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  id="trigger-import-btn"
                  onClick={() => document.getElementById('import-db-backup-input')?.click()}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  بارگذاری فایل بکاپ و بازخوانی
                </button>
              </div>

              {importSuccess && (
                <div className="text-[10px] text-emerald-400 font-medium text-center animate-pulse">
                  ✓ اطلاعات با موفقیت همسان‌سازی شد!
                </div>
              )}
            </div>
          </div>

          {/* ترمینال دستورات و کوئری‌های SQL صادره توسط IPC */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-64" id="terminal-pane">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-xs text-slate-100 flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-emerald-400" />
                ترمینال زنده اجرای تعهدات و کوئری‌های SQLite
              </h3>
              <button
                id="clear-logs-btn"
                onClick={clearDatabaseLogs}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" />
                پاکسازی کنسول کوئری‌ها
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 mb-2">
              با ایجاد تغییر، تعریف کالا، ثبت فاکتور و پرداخت، ساختار کوئری‌های تعهدی زیر تولید و در این کنسول لاگ می‌شود:
            </p>

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3.5 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 select-text leading-relaxed" id="sql-terminal-scroller">
              {sqlLogs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-12">
                  در انتظار ثبت فاکتور سریع یا افزودن کالا جهت رهگیری کوئری‌های IPC...
                </div>
              ) : (
                sqlLogs.map((log, index) => (
                  <div key={index} className="border-b border-slate-800/40 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ردیف دوم: کدهای بویلرپلیت بومی جهت استقرار در بستر Electron */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6" id="electron-source-cards">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
               بویلرپلیت بومی اتصال امن با Context Isolation (الکترون و SQLite)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مجموعه کدهایی که می‌توانید در ساختار لایه‌های بومی Preload و Main فریم‌ورک Electron خود کپی کنید تا همین کاتالوگ و پایگاه‌داده را مستقیماً به SQLite3 محلی پیوند بزنید.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="code-snippets-columns">
            {/* کد پری لود */}
            <div className="space-y-2" id="preload-code-box">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-t-xl text-xs">
                <span className="font-bold text-slate-700 font-mono">preload.js (Context Bridge)</span>
                <button
                  id="copy-preload-btn"
                  onClick={() => handleCopyText(ELECTRON_IPC_BOILERPLATE.preloadCode, 'preload')}
                  className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'preload' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      کپی کد
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 rounded-b-xl p-4 overflow-x-auto text-[10px] font-mono h-80 select-text leading-relaxed">
                {ELECTRON_IPC_BOILERPLATE.preloadCode}
              </pre>
            </div>

            {/* کد پروسه اصلی */}
            <div className="space-y-2" id="main-code-box">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-t-xl text-xs">
                <span className="font-bold text-slate-700 font-mono">main.js (IPC SQLite Handlers)</span>
                <button
                  id="copy-main-btn"
                  onClick={() => handleCopyText(ELECTRON_IPC_BOILERPLATE.mainProcessCode, 'main')}
                  className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'main' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      کپی کد
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 rounded-b-xl p-4 overflow-x-auto text-[10px] font-mono h-80 select-text leading-relaxed">
                {ELECTRON_IPC_BOILERPLATE.mainProcessCode}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
