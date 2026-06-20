import React, { useState, useEffect } from 'react';
import { generateMachineCode, checkLicenseStatus, registerAppLicense, LicenseStatusResponse } from '../utils/licensing';
import { OfflineDatabase } from '../db/offlineDb';
import { Shield, KeyRound, CheckCircle2, AlertTriangle, XCircle, Cpu, Wifi, WifiOff, RefreshCw, Smartphone, UserPlus, UserCheck } from 'lucide-react';

interface LicensingPortalProps {
  onValidated: (licenseInfo: LicenseStatusResponse) => void;
}

export default function LicensingPortal({ onValidated }: LicensingPortalProps) {
  // Generate/Fetch machine fingerprint
  const [machineCode, setMachineCode] = useState('');
  const [statusInfo, setStatusInfo] = useState<LicenseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration Form States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Simulator Mode (To allow sandbox evaluation if cofeclick.ir isn't ready)
  const [useSimulator, setUseSimulator] = useState(localStorage.getItem('cofeclick_license_mock_active') === 'true');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const code = generateMachineCode();
    setMachineCode(code);
    performCheck(code);
  }, []);

  const performCheck = async (code: string) => {
    setLoading(true);
    setErrorText('');
    try {
      const response = await checkLicenseStatus(code);
      setStatusInfo(response);
      if (response.status === 'active') {
        onValidated(response);
      }
    } catch (err: any) {
      setErrorText('بروز خطا در برقراری ارتباط با پورتال پشتیبان.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !phone.trim() || !password.trim()) {
      alert('لطماً همه‌ فیلدها را با دقت پر کنید.');
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const registerRes = await registerAppLicense({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        machineCode
      });

      // بر طبق خواسته مشتری: کسی که ثبت نام میکند مدیر سیستم و سهامدار ۱۰۰٪ می‌شود
      
      // ۱. ثبت در دیتابیس لوکال به عنوان مدیر کل سیستم
      const newAdminId = 'user_' + Date.now();
      OfflineDatabase.saveUser({
        id: newAdminId,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: 'Admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // ۲. ثبت در دیتابیس لوکال به عنوان سهام‌دار (سرمایه‌گذار/مدیرعامل) با ۱۰۰٪ سهم
      OfflineDatabase.savePerson({
        name: fullName.trim() + ' (مدیرعامل و بنیان‌گذار)',
        phone: phone.trim(),
        type: 'Shareholder',
        balance: 0,
        notes: 'ثبت خودکار سیستم در طی راه اندازی اولیه نرم افزار ثبت لایسنس',
        share_percentage: 100,
      });

      setStatusInfo(registerRes);
      
      if (registerRes.status === 'active') {
        alert('ثبت سیستم و لایسنس فعالسازی اتوماتیک (شبیه‌ساز) با موفقیت روی هسته‌ محلی صورت گرفت!');
        onValidated(registerRes);
      } else {
        alert('اطلاعات با موفقیت در بانک وب‌سایت cofeclick.ir ذخیره شد. لطفاً جهت فعالسازی لایسنس با مدیریت هماهنگ کنید.');
      }
    } catch (err: any) {
      setErrorText(err.message || 'خطا در ثبت نام.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMockMode = () => {
    const isMock = !useSimulator;
    setUseSimulator(isMock);
    localStorage.setItem('cofeclick_license_mock_active', isMock ? 'true' : 'false');
    if (isMock) {
      localStorage.setItem('cofeclick_license_mock_status', 'active');
      localStorage.setItem('cofeclick_license_mock_expiry', '2027-06-12 12:00:00');
    } else {
      localStorage.removeItem('cofeclick_license_mock_status');
      localStorage.removeItem('cofeclick_license_mock_expiry');
    }
    // Re-check
    performCheck(machineCode);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-100 z-50 p-6 font-sans">
        <div className="relative flex flex-col items-center gap-4 bg-slate-950 p-8 rounded-3xl border border-slate-800 text-center shadow-2xl max-w-sm w-full">
          <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
          <h3 className="font-bold text-base">در حال برقراری کانال ایمن...</h3>
          <p className="text-xs text-slate-400">تطبیق امضای سخت‌افزاری سیستم و صحت‌سنجی اطلاعات لایسنس از cofeclick.ir</p>
        </div>
      </div>
    );
  }

  // ۱. در صورتی که ثبت نام نکرده است: فرم ثبت نام
  if (!statusInfo || statusInfo.status === 'not_registered') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4 overflow-y-auto font-sans" id="licensing-portal-screen">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-right leading-relaxed flex flex-col">
          {/* بخش بالای کارت به رنگ تیره */}
          <div className="p-6 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-400/20">گام اول: شتابدهی اولیه</span>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-amber-500" />
                ثبت نام و راه‌اندازی اولیه مالک سیستم
              </h2>
            </div>
            
            {/* شبیه‌ساز لایسنس برای بررسی آسانتر بدون پلاگین وردپرس */}
            <button 
              onClick={toggleMockMode}
              className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold border transition ${
                useSimulator 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
            >
              {useSimulator ? 'شبیه‌ساز: فعال (بدون نیاز به هاست)' : 'شبیه‌ساز غیرفعال (تست اتصال واقعی)'}
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="bg-slate-950/65 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                <Cpu className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-0.5 flex-1">
                <label className="block text-[11px] font-bold text-slate-500">کد امنیتی سخت‌افزاری کامپیوتر شما:</label>
                <code className="text-xs text-amber-300 font-mono font-bold block bg-slate-900/50 p-1.5 rounded border border-slate-800 tracking-wide text-left">{machineCode}</code>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              با تکمیل فرم زیر، یک پرونده امن لایسنس برای این سیستم صادر شده و در پورتال وردپرس شما ذخیره می‌گردد. همچنین حساب کاربری ثبت‌نام‌کننده به صورت خودکار به عنوان **مدیر سیستم** و **سهام‌دار ارشد ۱۰۰٪** به ثبت خواهد رسید.
            </p>

            {errorText && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{errorText}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">نام کامل مدیرعامل / سهامدار:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سید علی حسینی"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">شماره تماس (موبایل):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 09121111111"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">نام کاربری جهت ورود به سیستم:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ali_admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">رمز عبور امنیتی سیستم:</label>
                <input
                  type="password"
                  required
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="sm:col-span-2 border-t border-slate-800/60 pt-4 mt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-900/10"
                >
                  ثبت سیستم در سایت و فعالسازی راه اندازی
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-slate-950/80 p-4 border-t border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <span>آدرس دامنه ثبت‌نام و ذخیره لایسنس:</span>
            <code className="text-amber-400">cofeclick.ir</code>
          </div>
        </div>
      </div>
    );
  }

  // ۲. در صورتی که ثبت نام کرده ولی لایسنس تایید نشده یا منقضی/بلاک است
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4 font-sans text-right">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        <div className="p-6 bg-slate-950 border-b border-slate-800/80 text-center flex flex-col items-center gap-3">
          {statusInfo.status === 'pending' && (
            <>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="font-bold text-slate-100">در انتظار تایید لایسنس مدیریت</h2>
              <p className="text-xs text-slate-400">اطلاعات شما با موفقیت در پایگاه وب‌سایت ذخیره شده است.</p>
            </>
          )}

          {statusInfo.status === 'expired' && (
            <>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="font-bold text-rose-400">اعتبار اشتراک به اتمام رسیده است</h2>
              <p className="text-xs text-slate-400">دوره فعال شما به سر آمده و نیاز به تمدید دارد.</p>
            </>
          )}

          {statusInfo.status === 'blocked' && (
            <>
              <div className="p-3 bg-slate-800 text-slate-400 border border-slate-800/30 rounded-2xl">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="font-bold text-slate-400">این دستگاه مسدود گشته است</h2>
              <p className="text-xs text-slate-400">دسترسی رایانه فیزیکی جاری به جهت مقررات قطع شده است.</p>
            </>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2 text-xs bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">نام مالک سیستم:</span>
              <strong className="text-slate-100 font-bold">{statusInfo.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">شناسه کاربری:</span>
              <code className="text-slate-300 font-mono">@{statusInfo.username}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">کلید یکبارمصرف:</span>
              <code className="text-amber-400 font-mono">{statusInfo.licenseKey}</code>
            </div>
            <div className="border-t border-slate-800 my-2 pt-2 flex justify-between">
              <span className="text-slate-400">موعد انقضاء لایسنس:</span>
              <span className="text-rose-400 font-mono font-bold">{statusInfo.expiryDate ? statusInfo.expiryDate : 'نامشخص'}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed text-center">
            جهت تایید لایسنس، تمدید دوره یا حل مشکل، کد کامپیوتری زیر را به همراه نام کاربری برای مدیریت سایت کافه کلیک یا پشتیبانی ارسال فرمایید.
          </div>

          <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-center">
            <span className="block text-[9px] text-slate-500 mb-1 font-bold">شناسه سخت‌افزاری کامپیوتر شما</span>
            <code className="text-[11px] text-amber-300 font-mono tracking-wide block select-all cursor-pointer">{machineCode}</code>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => performCheck(machineCode)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              بررسی مجدد وضعیت لایسنس
            </button>
            <button
              onClick={toggleMockMode}
              className="px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs py-2 rounded-xl font-bold transition"
            >
              تنظیم شبیه‌سازی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
