import React, { useState } from 'react';
import { 
  Building, 
  Lock, 
  Phone, 
  Store, 
  Save, 
  Image,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { OfflineDatabase } from '../db/offlineDb';
import { SettingsService } from '../utils/settings';

interface OnboardingWizardProps {
  onComplete: (completedSettings: any, adminUser: any) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  // اطلاعات اصلی فروشگاه
  const [storeName, setStoreName] = useState<string>('');
  const [storePhone, setStorePhone] = useState<string>('');
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [storeEconomicCode, setStoreEconomicCode] = useState<string>('');
  const [storeLogo, setStoreLogo] = useState<string>('');
  
  // کلمه عبور مدیر سیستم
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFinishOnboarding = () => {
    setErrorMsg('');
    
    if (!storeName.trim()) {
      setErrorMsg('لطفاً نام فروشگاه خود را وارد کنید.');
      return;
    }
    if (!storePhone.trim()) {
      setErrorMsg('لطفاً تلفن تماس فروشگاه را وارد کنید.');
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 4) {
      setErrorMsg('لطفاً کلمه عبور مدیر سیستم را با حداقل ۴ کاراکتر مشخص نمایید.');
      return;
    }

    try {
      // ۱. کانفیگ تنظیمات کلی فروشگاه با لوگوی دلخواه
      const currentSettings = SettingsService.get();
      const updatedSettings = {
        ...currentSettings,
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim() || 'تهران، ایران',
        storePhone: storePhone.trim(),
        storeEconomicCode: storeEconomicCode.trim(),
        storeLogo: storeLogo,
      };
      SettingsService.save(updatedSettings);

      // ۲. قالب‌بندی اطلاعات پیشرفته با مقادیر پیش‌فرض
      const advancedConfig = {
        inventorySystem: 'ادواری',
        valuationMethod: 'FIFO',
        useProduction: true,
        useWarehousing: true,
        useMultiCurrency: false,
        mainCurrency: 'IRT - تومان ایران',
        calendarType: 'هجری شمسی',
        fiscalYearStart: '1405/01/01',
        fiscalYearEnd: '1405/12/29',
        fiscalYearTitle: 'سال مالی ۱۴۰۵',
        defaultLanguage: 'fa'
      };
      localStorage.setItem('shop_accounting_advanced_onboarding', JSON.stringify(advancedConfig));

      // ۳. ثبت مشخصات مدیر سیستم فعال
      const adminUserObj = {
        id: 'user_admin',
        username: 'admin',
        fullName: 'مدیر سیستم',
        role: 'Admin' as const,
        password: adminPassword.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const allUsers = OfflineDatabase.getUsers();
      const filteredUsers = allUsers.filter(u => u.id !== 'user_admin');
      filteredUsers.push(adminUserObj);
      localStorage.setItem('shop_accounting_users', JSON.stringify(filteredUsers));

      // ۴. ذخیره به عنوان شریک تجاری ۱۰۰ درصد
      const allPersons = OfflineDatabase.getPersons();
      const shareholderPerson = {
        id: 'sh_admin_onboard',
        name: 'مدیر سیستم',
        phone: storePhone.trim(),
        type: 'Shareholder' as 'Shareholder',
        balance: 0,
        notes: `مدیر سیستم و موسس فروشگاه با شراکت ۱۰۰٪`,
        share_percentage: 100,
        roles: ['Shareholder', 'Employee'] as any
      };
      const filteredPersons = allPersons.filter(p => p.id !== 'sh_admin_onboard');
      filteredPersons.push(shareholderPerson);
      localStorage.setItem('shop_accounting_persons', JSON.stringify(filteredPersons));

      // تکمیل فرایند
      localStorage.setItem('shop_onboarding_completed', 'true');
      
      // برای اینکه کاربر ابتدا وارد صفحه ورود (Login) شود و رمز را بزند، مقدار کاربر جاری را خالی ذخیره کرده و null به والد پاس می‌دهیم
      localStorage.removeItem('shop_accounting_active_user');

      OfflineDatabase.logUserAction(
        'LOGIN_SUCCESS',
        `نصب و راه‌اندازی اولیه فروشگاه ${storeName} با کلمه‌عبور انتخابی با موفقیت ثبت شد.`
      );

      onComplete(updatedSettings, null);
    } catch (err: any) {
      setErrorMsg('خطا در ثبت نهایی اطلاعات: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white" dir="rtl">
      <div className="w-full max-w-xl bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative" id="onboarding-main-card">
        
        {/* هدر گرافیکی */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
            <Store className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">راه‌اندازی اولیه و شناسنامه فروشگاه</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">لطفاً مشخصات فروشگاه و کلمه‌عبور ادمین را جهت شروع وارد نمایید</p>
          </div>
        </div>

        {/* فیلدها */}
        <div className="p-6 md:p-8 space-y-5 text-right">
          
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs font-bold leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            
            {/* ۱. نام فروشگاه */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-400">نام تجاری فروشگاه / مغازه <span className="text-rose-400">*</span></label>
              <div className="relative">
                <Building className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full text-xs pr-10 pl-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl h-11 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  placeholder="مثال: فروشگاه پوشاک آریا"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ۲. تلفن تماس */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-400">تلفن تماس <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={storePhone}
                    onChange={e => setStorePhone(e.target.value)}
                    className="w-full text-xs pr-10 pl-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl h-11 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="02188889900"
                  />
                </div>
              </div>

              {/* ۳. کد اقتصادی */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-400">کد اقتصادی (اختیاری)</label>
                <input
                  type="text"
                  value={storeEconomicCode}
                  onChange={e => setStoreEconomicCode(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl h-11 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                  placeholder="۱۲ رقم کد مالياتی"
                />
              </div>
            </div>

            {/* ۴. کلمه عبور مدیر */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-400">کلمه عبور ورود به پنل مدیریت <span className="text-rose-400">*</span></label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full text-xs pr-10 pl-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl h-11 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono tracking-widest text-emerald-400"
                  placeholder="رمز عبور شما جهت لاگین بعدی"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">نام کاربری پیش‌فرض برای ورود شما <strong className="text-white">admin</strong> خواهد بود.</p>
            </div>

            {/* ۵. آدرس */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-400">آدرس فیزیکی فروشگاه (جهت چاپ در فاکتور)</label>
              <div className="relative">
                <MapPin className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={storeAddress}
                  onChange={e => setStoreAddress(e.target.value)}
                  className="w-full text-xs pr-10 pl-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl h-11 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="آدرس دقیق مغازه یا شعبه"
                />
              </div>
            </div>

            {/* ۶. لوگو */}
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs">
              <label className="block font-bold text-slate-300">انتخاب لوگوی فروشگاه (اختیاری):</label>
              <div className="flex items-center gap-4">
                {storeLogo ? (
                  <div className="relative group w-14 h-14 border border-slate-700 bg-slate-950 p-1 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    <img src={storeLogo} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setStoreLogo('')}
                      className="absolute inset-0 bg-red-600/90 text-white font-bold text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-150"
                    >
                      حذف
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 text-[9px] shrink-0">
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
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setStoreLogo(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-0 file:ml-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-950 file:text-emerald-400 hover:file:bg-emerald-900 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500">فرمت تصویری PNG/JPG با سایز حداکثر ۵۰۰ کیلوبایت.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleFinishOnboarding}
              id="onboard-btn-finish"
              type="button"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              ✓ ایجاد شناسنامه و ذخیره مشخصات فروشگاه
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
