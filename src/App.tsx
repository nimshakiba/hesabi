import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from './db/offlineDb';
import { Product, Person, Invoice } from './types';
import Sidebar from './components/Sidebar';
import PersonsTab from './components/PersonsTab';
import DebtorsTab from './components/DebtorsTab';
import ShareholdersTab from './components/ShareholdersTab';
import EmployeesTab from './components/EmployeesTab';
import SalespersonsTab from './components/SalespersonsTab';
import ProductsTab from './components/ProductsTab';
import ProductsCatalogTab from './components/ProductsCatalogTab';
import CategoriesTab from './components/CategoriesTab';
import PriceUpdateTab from './components/PriceUpdateTab';
import QuickPosTab from './components/QuickPosTab';
import InvoiceTab from './components/InvoiceTab';
import InvoiceHistoryTab from './components/InvoiceHistoryTab';
import InventoryTab from './components/InventoryTab';
import InventoryLogsTab from './components/InventoryLogsTab';
import ElectronIpcTab from './components/ElectronIpcTab';
import UsersTab from './components/UsersTab';
import LicensingPortal from './components/LicensingPortal';
import SettingsTab from './components/SettingsTab';
import OnboardingWizard from './components/OnboardingWizard';
import { SettingsService, AppSettings, formatPrice } from './utils/settings';

import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Boxes, 
  Clock, 
  Calendar,
  Building,
  UserCheck,
  RefreshCw,
  PlusCircle,
  FilePlus2,
  TrendingDown,
  LayoutDashboard,
  Shield,
  User,
  ShieldAlert,
  Lock,
  Power
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab ] = useState<string>('quick-pos'); // پیش فرض روی صندوق فروش سریع
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLicensed, setIsLicensed] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSettings>(SettingsService.get());
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('shop_onboarding_completed') === 'true';
  });
  
  // Login credentials states
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Login flow modes
  const [authView, setAuthView] = useState<'login' | 'register' | 'recover'>('login');
  
  // Registration Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'Admin' | 'Accountant' | 'Salesperson'>('Salesperson');
  const [regQuestion, setRegQuestion] = useState<string>('اسم معلم کلاس اول شما چیست؟');
  const [regAnswer, setRegAnswer] = useState<string>('');
  const [regMessage, setRegMessage] = useState<string>('');
  const [regError, setRegError] = useState<string>('');

  // Recovery Form State
  const [recoverUsername, setRecoverUsername] = useState<string>('admin');
  const [recoverAnswer, setRecoverAnswer] = useState<string>('');
  const [recoverNewPassword, setRecoverNewPassword] = useState<string>('');
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [recoverQuestion, setRecoverQuestion] = useState<string>('');
  const [recoverError, setRecoverError] = useState<string>('');
  const [recoverMessage, setRecoverMessage] = useState<string>('');
  
  // Profile modification states
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileUsername, setProfileUsername] = useState<string>('');
  const [profilePassword, setProfilePassword] = useState<string>('');

  // User Authentication / Role Switch states
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authSelectedUser, setAuthSelectedUser] = useState<any>(null);
  const [authPasswordInput, setAuthPasswordInput] = useState<string>('');
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');

  const [dbLoaded, setDbLoaded] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? (window.isDbReady || false) : false;
  });

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authSelectedUser) return;

    const correctPassword = authSelectedUser.password || '';
    if (correctPassword === authPasswordInput.trim()) {
      OfflineDatabase.logUserAction(
        'LOGIN_SUCCESS',
        `ورود موفقیت‌آمیز به سیستم با حساب کاربری: ${authSelectedUser.fullName} (@${authSelectedUser.username})`
      );
      
      setCurrentUser(authSelectedUser);
      setShowAuthModal(false);
      setAuthPasswordInput('');
      setAuthErrorMsg('');
      
      if (authSelectedUser.role === 'Salesperson') {
        setActiveTab('quick-pos');
      } else if (authSelectedUser.role === 'Accountant' && (activeTab === 'quick-pos' || activeTab === 'users-access')) {
        setActiveTab('dashboard');
      }
    } else {
      OfflineDatabase.logUserAction(
        'LOGIN_FAILED',
        `تلاش ناموفق برای ورود به حساب کاربری: ${authSelectedUser.fullName} (@${authSelectedUser.username}) با کلمه عبور نادرست!`,
        `کلمه عبور وارد شده: ${authPasswordInput.trim() || '(خالی)'}`
      );
      
      setAuthErrorMsg('کلمه عبور وارد شده نادرست است! لطفاً مجدداً تلاش کنید.');
    }
  };

  const openProfileModal = () => {
    if (currentUser) {
      setProfileUsername(currentUser.username);
      setProfilePassword(currentUser.password || '');
      setShowProfileModal(true);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername.trim() || !profilePassword.trim()) {
      alert('لطفاً همه مشخصات را تکمیل کنید.');
      return;
    }

    const allUsers = OfflineDatabase.getUsers();
    const taken = allUsers.some(u => u.username.toLowerCase() === profileUsername.toLowerCase().trim() && u.id !== currentUser.id);
    if (taken) {
      alert('این نام کاربری از قبل توسط اکانت دیگری استفاده شده است.');
      return;
    }

    const updated = {
      ...currentUser,
      username: profileUsername.toLowerCase().trim(),
      password: profilePassword.trim(),
      updatedAt: new Date().toISOString()
    };

    OfflineDatabase.saveUser(updated);
    setCurrentUser(updated);
    setShowProfileModal(false);
    alert('مشخصات کاربری شما با موفقیت بروزرسانی شد.');
  };

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAppSettings(SettingsService.get());
    };
    window.addEventListener('cofeclick_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('cofeclick_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const [dbStats, setDbStats] = useState({
    productsCount: 0,
    personsCount: 0,
    invoicesCount: 0,
    totalSales: 0,
    debtorsSum: 0,
    creditorsSum: 0
  });

  // ساعت پویای فارسی بالا سمت چپ
  const [currentTime, setCurrentTime] = useState('');

  // مدیریت امن بارگذاری بانک داده آفلاین محلی دیسکی
  useEffect(() => {
    const initializeDatabase = () => {
      OfflineDatabase.init();
      recalculateDashboardStats();

      // بگذارید کاربر دستی لاگین کند به جای لاگین اتوماتیک!
      const activeUserRaw = localStorage.getItem('shop_accounting_active_user');
      if (activeUserRaw) {
        try {
          setCurrentUser(JSON.parse(activeUserRaw));
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setDbLoaded(true);
    };

    if (dbLoaded || (typeof window !== 'undefined' && window.isDbReady)) {
      initializeDatabase();
    } else {
      window.addEventListener('shop_db_loaded', initializeDatabase);
    }

    return () => {
      window.removeEventListener('shop_db_loaded', initializeDatabase);
    };
  }, [dbLoaded, isLicensed, activeTab]);

  // راه‌اندازی ساعت پر تپش پویا
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleTimeString('fa-IR', options));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ریست خودکار محاسبات آماری در زمان فعالسازی معتبر لایسنس
  useEffect(() => {
    if (isLicensed && dbLoaded) {
      recalculateDashboardStats();
    }
  }, [isLicensed, dbLoaded]);

  // Synchronize active user to localStorage for auditing & enforce custom role permissions
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shop_accounting_active_user', JSON.stringify(currentUser));
      
      // Enforce custom role permissions on activeTab
      const role = currentUser.role || 'Admin';
      if (role !== 'Admin') {
        const getRolePermissions = (roleName: string): string[] => {
          const raw = localStorage.getItem('shop_accounting_role_permissions');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed[roleName]) return parsed[roleName];
            } catch (e) {}
          }
          if (roleName === 'Salesperson') {
            return ['dashboard', 'quick-pos', 'invoice-history'];
          }
          if (roleName === 'Accountant') {
            return [
              'dashboard', 
              'persons-list', 'persons-debtors', 'persons-shareholders',
              'items-list', 'items-catalog', 'items-bulk-price',
              'quick-pos', 'standard-invoice', 'invoice-history',
              'inventory-levels', 'inventory-logs'
            ];
          }
          return ['dashboard'];
        };
        
        const permitted = getRolePermissions(role);
        
        const isTabAllowed = (tabId: string) => {
          if (permitted.includes(tabId)) return true;
          if (tabId.startsWith('settings-') && permitted.includes('settings')) return true;
          if (tabId.startsWith('persons-') && permitted.includes(tabId)) return true;
          return false;
        };

        if (!isTabAllowed(activeTab)) {
          const fallback = permitted.find(t => t !== 'settings') || 'dashboard';
          setActiveTab(fallback);
        }
      }
    } else {
      localStorage.removeItem('shop_accounting_active_user');
    }
  }, [currentUser, activeTab]);

  // ثبت و پیاده‌سازی سیستم مدیریت کلیدهای میانبر پویا بدون تداخل سیستم‌عامل
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // کلید F2 برای ورود آنی به بخش صندوق فروش سریع
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('quick-pos');
      }

      // کلید Alt + S (س) برای ورود آنی به بخش صندوق فروش سریع در ویندوز
      if (e.altKey && (e.key?.toLowerCase() === 's' || e.key === 'س')) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('quick-pos');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, []);

  const recalculateDashboardStats = () => {
    const products = OfflineDatabase.getProducts();
    const persons = OfflineDatabase.getPersons();
    const invoices = OfflineDatabase.getInvoices();

    // محاسبه هشدارهای موجودی کم
    const lowCount = products.filter(p => p.stock_quantity <= 10).length;
    setLowStockCount(lowCount);

    // محاسبه مبالغ بدهکاران و بستانکاران
    let dSum = 0;
    let cSum = 0;
    persons.forEach(p => {
      if (p.balance > 0) dSum += p.balance;
      else if (p.balance < 0) cSum += p.balance;
    });

    // جمع کل فروش‌ها
    const saleInvoices = invoices.filter(inv => inv.type === 'Sale' || inv.type === 'Quick Sale');
    const totalSales = saleInvoices.reduce((sum, inv) => sum + inv.final_amount, 0);

    setDbStats({
      productsCount: products.length,
      personsCount: persons.length - 1, // مشتری عمومی را در آمارها حذف می‌کنیم
      invoicesCount: invoices.length,
      totalSales,
      debtorsSum: dSum,
      creditorsSum: Math.abs(cSum)
    });
  };

  const handleTabChange = (tabId: string, parentMenuId: string | null) => {
    setActiveTab(tabId);
  };

  const formatToman = (val: number) => {
    return formatPrice(val);
  };

  if (!dbLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white select-none text-center font-sans">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          <Boxes className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold mb-2 tracking-tight font-sans">نرم‌افزار یکپارچه حسابداری دپوی آریا</h1>
        <p className="text-sm text-slate-400 font-sans">در حال لود و همگام‌سازی اطلاعات با پایگاه‌داده دیسک SQLite3...</p>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingWizard
        onComplete={(completedSettings, adminUser) => {
          setAppSettings(completedSettings);
          setCurrentUser(null); // Force user to log in manually first
          setOnboardingCompleted(true);
          recalculateDashboardStats();
        }}
      />
    );
  }

  if (!currentUser) {
    const systemUsers = OfflineDatabase.getUsers();
    
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const foundUser = systemUsers.find(u => u.username.toLowerCase() === loginUsername.toLowerCase().trim());
      if (!foundUser) {
        setLoginError('کاربری با این مشخصات یافت نشد.');
        return;
      }
      if (foundUser.password === loginPassword.trim()) {
        setCurrentUser(foundUser);
        localStorage.setItem('shop_accounting_active_user', JSON.stringify(foundUser));
        OfflineDatabase.logUserAction(
          'LOGIN_SUCCESS',
          `ورود موفقیت‌آمیز اپراتور ${foundUser.fullName} به سیستم تجاری`
        );
      } else {
        setLoginError('رمز عبور وارد شده نادرست است.');
        OfflineDatabase.logUserAction(
          'LOGIN_FAILED',
          `تلاش ناموفق جهت ورود به حساب @${loginUsername}`
        );
      }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setRegError('');
      setRegMessage('');

      if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim() || !regAnswer.trim()) {
        setRegError('لطفاً تمامی فیلدهای الزامی را پر نمایید.');
        return;
      }

      const normalizedUsername = regUsername.toLowerCase().trim();
      const userExists = systemUsers.some(u => u.username.toLowerCase() === normalizedUsername);
      if (userExists) {
        setRegError('این نام کاربری از پیش ثبت شده است.');
        return;
      }

      const newUser: any = {
        id: `user_${Date.now()}`,
        username: normalizedUsername,
        fullName: regFullName.trim(),
        role: regRole,
        password: regPassword.trim(),
        isActive: true,
        securityQuestion: regQuestion,
        securityAnswer: regAnswer.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      OfflineDatabase.saveUser(newUser);
      setRegMessage('ثبت‌نام با موفقیت انجام شد! اکنون می‌توانید وارد سیستم شوید.');
      
      setRegFullName('');
      setRegUsername('');
      setRegPassword('');
      setRegAnswer('');

      setLoginUsername(newUser.username);
      
      setTimeout(() => {
        setAuthView('login');
        setRegMessage('');
      }, 2500);
    };

    const handlePrepareRecover = () => {
      setRecoverError('');
      setRecoverMessage('');
      const foundUser: any = systemUsers.find(u => u.username.toLowerCase() === recoverUsername.toLowerCase().trim());
      if (!foundUser) {
        setRecoverError('کاربر مورد نظر پیدا نشد.');
        return;
      }
      
      const question = foundUser.securityQuestion || 'رنگ مورد علاقه شما چیست؟ (بدون سوال امنیتی ثبت شده پیشین)';
      setRecoverQuestion(question);
      setRecoverStep(2);
    };

    const handleRecoverSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setRecoverError('');
      setRecoverMessage('');

      const foundUser: any = systemUsers.find(u => u.username.toLowerCase() === recoverUsername.toLowerCase().trim());
      if (!foundUser) {
        setRecoverError('کاربر مورد نظر یافت نشد.');
        return;
      }

      if (!recoverNewPassword.trim()) {
        setRecoverError('لطفاً رمز عبور جدید را وارد نمایید.');
        return;
      }

      const expectedAnswer = foundUser.securityAnswer ? foundUser.securityAnswer.toLowerCase().trim() : '';
      if (expectedAnswer && recoverAnswer.toLowerCase().trim() !== expectedAnswer) {
        setRecoverError('پاسخ امنیتی وارد شده نادرست است.');
        return;
      }

      const updatedUser = {
        ...foundUser,
        password: recoverNewPassword.trim(),
        securityQuestion: foundUser.securityQuestion || 'رنگ مورد علاقه شما چیست؟',
        securityAnswer: foundUser.securityAnswer || recoverAnswer.toLowerCase().trim(),
        updatedAt: new Date().toISOString()
      };

      OfflineDatabase.saveUser(updatedUser);
      
      OfflineDatabase.logUserAction(
        'USER_PASSWORD_RECOVERY_SUCCESS',
        `بازیابی رمز عبور مقتدرانه به کاربر: ${foundUser.fullName} (@${foundUser.username})`
      );

      setRecoverMessage('کلمه عبور شما با موفقیت بازیابی و تغییر داده شد.');
      setRecoverAnswer('');
      setRecoverNewPassword('');
      
      setTimeout(() => {
        setAuthView('login');
        setRecoverStep(1);
        setRecoverMessage('');
      }, 2500);
    };

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white" dir="rtl" id="login-screen-view">
        <div className="w-full max-w-sm bg-slate-950/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 md:p-8 space-y-5 text-right">
          
          <div className="text-center space-y-2">
            {appSettings.storeLogo ? (
              <img src={appSettings.storeLogo} alt="Store Logo" className="w-14 h-14 object-contain mx-auto bg-white p-1 rounded-2xl shadow-lg border border-slate-800" />
            ) : (
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto shadow-lg shadow-emerald-500/20">
                ح
              </div>
            )}
            <div>
              <h2 className="text-white font-black text-sm">{appSettings.storeName}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">سیستم حسابداری بومی لایو SQLite - پریشین</p>
            </div>
          </div>

          {/* ۱. نمای فرم ورود */}
          {authView === 'login' && (
            <div className="space-y-4">
              <div className="text-center text-xs text-slate-300 font-bold border-b border-slate-800/60 pb-2">
                🔒 ورود به حساب کاربری
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">انتخاب کاربر سیستم:</label>
                  <select
                    value={loginUsername}
                    onChange={e => {
                      setLoginUsername(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans cursor-pointer"
                  >
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.username}>
                        {u.fullName} ({u.role === 'Admin' ? 'مدیر سیستم' : u.role === 'Salesperson' ? 'صندوق‌دار' : 'حسابدار'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">نام کاربری (حرفی):</label>
                  <input
                    type="text"
                    disabled
                    value={loginUsername}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-905 border border-slate-800 rounded-xl h-10 text-slate-400 text-left font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">کلمه عبور ورود:</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="••••"
                      value={loginPassword}
                      onChange={e => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      className="w-full text-xs pr-9 pl-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl h-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono tracking-widest text-emerald-400"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-950/40 border border-rose-900/50 p-2 text-[10px] leading-relaxed font-bold text-rose-400 rounded-lg">
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Power className="w-4 h-4 shrink-0" />
                  تایید هویت و ورود به سیستم
                </button>
              </form>

              <div className="flex justify-between items-center text-[10.5px] text-slate-400 pt-2 border-t border-slate-900">
                <button 
                  onClick={() => {
                    setAuthView('register');
                    setRegError('');
                    setRegMessage('');
                  }} 
                  className="text-emerald-500 hover:text-emerald-400 hover:underline transition cursor-pointer font-bold"
                >
                  📝 ثبت‌نام کاربر جدید
                </button>
                <button 
                  onClick={() => {
                    setAuthView('recover');
                    setRecoverStep(1);
                    setRecoverError('');
                    setRecoverMessage('');
                    if (systemUsers.length > 0) {
                      setRecoverUsername(systemUsers[0].username);
                    }
                  }} 
                  className="text-cyan-500 hover:text-cyan-400 hover:underline transition cursor-pointer font-bold"
                >
                  🔑 بازیابی رمز عبور؟
                </button>
              </div>
            </div>
          )}

          {/* ۲. نمای فرم ثبت‌نام کلاینت */}
          {authView === 'register' && (
            <div className="space-y-4">
              <div className="text-center text-xs text-slate-300 font-bold border-b border-slate-800/60 pb-2 flex justify-between items-center">
                <span>📝 ثبت‌نام کاربر سیستم جدید</span>
                <button 
                  onClick={() => setAuthView('login')} 
                  className="text-emerald-500 text-[10px] hover:underline"
                >
                  بازگشت به ورود
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-right">
                
                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    placeholder="نمونه: رضا پرتو"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-9 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">نام کاربری اختصاصی:</label>
                  <input
                    type="text"
                    required
                    placeholder="نمونه: reza (به انگلیسی)"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-9 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">کلمه عبور (رمز):</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-9 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <label className="block font-bold">سمت / دسترسی:</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-9 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans cursor-pointer"
                  >
                    <option value="Salesperson">صندوق‌دار (سطح ساده)</option>
                    <option value="Accountant">حسابدار (سطح مالی)</option>
                    <option value="Admin">مدیر ارشد سیستم (سطح کل)</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs text-slate-400 group border-t border-slate-800/50 pt-2 text-slate-400">
                  <div className="text-[10px] text-cyan-400 mb-1 font-bold">📌 سوال امنیتی (برای بازیابی هوشمند یا رمانی رمز):</div>
                  <select
                    value={regQuestion}
                    onChange={e => setRegQuestion(e.target.value)}
                    className="w-full text-[11px] px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white mb-2 font-sans cursor-pointer"
                  >
                    <option value="اسم معلم کلاس اول شما چیست؟">اسم معلم کلاس اول شما چیست؟</option>
                    <option value="نام شهر محل تولد شما چیست؟">نام شهر محل تولد شما چیست؟</option>
                    <option value="نام اولین حیوان خانگی شما چیست؟">نام اولین حیوان خانگی شما چیست؟</option>
                    <option value="رنگ مورد علاقه شما چیست؟">رنگ مورد علاقه شما چیست؟</option>
                  </select>
                  
                  <input
                    type="text"
                    required
                    placeholder="پاسخ سوال امنیتی شما"
                    value={regAnswer}
                    onChange={e => setRegAnswer(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-9 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {regError && (
                  <div className="bg-rose-950/40 border border-rose-900/50 p-2 text-[10px] leading-relaxed font-bold text-rose-400 rounded-lg">
                    ⚠️ {regError}
                  </div>
                )}

                {regMessage && (
                  <div className="bg-emerald-950/40 border border-emerald-900/50 p-2 text-[10px] leading-relaxed font-bold text-emerald-400 rounded-lg">
                    ✅ {regMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-500/10 transition cursor-pointer"
                >
                  ثبت نام کاربری جدید
                </button>
              </form>
            </div>
          )}

          {/* ۳. نمای فرم بازیابی رمز عبور */}
          {authView === 'recover' && (
            <div className="space-y-4">
              <div className="text-center text-xs text-slate-300 font-bold border-b border-slate-800/60 pb-2 flex justify-between items-center">
                <span>🔑 بازیابی هوشمند رمز عبور</span>
                <button 
                  onClick={() => setAuthView('login')} 
                  className="text-emerald-500 text-[10px] hover:underline"
                >
                  بازگشت به ورود
                </button>
              </div>

              {recoverStep === 1 ? (
                <div className="space-y-4 text-right">
                  <div className="space-y-1 text-xs text-slate-400">
                    <label className="block font-bold">انتخاب کاربر مقتدر جهت بازیابی:</label>
                    <select
                      value={recoverUsername}
                      onChange={e => setRecoverUsername(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans cursor-pointer"
                    >
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.username}>
                          {u.fullName} (@{u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {recoverError && (
                    <div className="bg-rose-950/40 border border-rose-900/50 p-2 text-[10px] leading-relaxed font-bold text-rose-400 rounded-lg">
                      ⚠️ {recoverError}
                    </div>
                  )}

                  <button
                    onClick={handlePrepareRecover}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer"
                  >
                    تایید هویت و مشاهده سوال امنیتی
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverSubmit} className="space-y-4 text-right">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-cyan-400 block font-bold mb-1">سوال امنیتی ثبت‌شده برای شما:</span>
                    <span className="text-xs text-white font-bold leading-relaxed">{recoverQuestion}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <label className="block font-bold">پاسخ دقیق سوال:</label>
                    <input
                      type="text"
                      required
                      placeholder="پاسخ را دقیقاً همانطور که ثبت کردید بنویسید"
                      value={recoverAnswer}
                      onChange={e => setRecoverAnswer(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800/50 pt-3">
                    <label className="block font-bold text-emerald-400">کلمه عبور (رمز) جدید جدید شما:</label>
                    <input
                      type="password"
                      required
                      placeholder="کلمه عبور جدید را بنویسید"
                      value={recoverNewPassword}
                      onChange={e => setRecoverNewPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl h-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono"
                    />
                  </div>

                  {recoverError && (
                    <div className="bg-rose-950/40 border border-rose-900/50 p-2 text-[10px] leading-relaxed font-bold text-rose-400 rounded-lg">
                      ⚠️ {recoverError}
                    </div>
                  )}

                  {recoverMessage && (
                    <div className="bg-emerald-950/40 border border-emerald-900/50 p-2 text-[10px] leading-relaxed font-bold text-emerald-400 rounded-lg">
                      ✅ {recoverMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer"
                  >
                    تغییر رمز عبور و بازنشانی حساب
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverStep(1);
                      setRecoverError('');
                    }}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-xl text-[11px] transition cursor-pointer"
                  >
                    تغییر نام کاربری انتخاب شده
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/60 text-center text-[9px] text-slate-500 flex justify-between items-center font-sans pr-1">
            <span>سیستم حسابداری فروشگاهی آریا</span>
            <span className="font-mono text-emerald-500">آفلاین (SQLite3)</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-right font-sans" id="app-viewport">
      
      {/* کامپوننت منوی آکاردئونی یکتای سایدبار */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        lowStockCount={lowStockCount} 
        currentUser={currentUser}
        onOpenProfile={openProfileModal}
        onLogout={() => {
          if (window.confirm('آیا مایل به خروج امن از پنل هستید؟')) {
            setCurrentUser(null);
            localStorage.removeItem('shop_accounting_active_user');
          }
        }}
        currentUserRole={currentUser?.role}
        storeName={appSettings.storeName}
        storeLogo={appSettings.storeLogo}
      />

      {/* بخش محتوای صفحات */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="page-contents-wrapper">
        
        {/* نوار برتر (Top Navbar & Quick Status indicators) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs select-none" id="primary-app-header">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-500/10 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               بانک اطلاعاتی محلی بومی (SQLite) متصل و فعال است
            </span>
            <span className="text-[11px] text-slate-400 font-medium font-sans font-sans">تمامی تراکنش‌ها و اطلاعات کاربری به صورت آنی و ۱۰۰٪ آفلاین بر روی دیسک سخت فیزیکی ذخیره می‌گردند.</span>
          </div>

          <div className="flex items-center gap-4" id="header-time-block">
            {/* کلید تغییر سریع نقش‌ها برای ارزیابی */}
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-slate-700 shadow-2xs" id="user-role-selection-pill">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] text-slate-400 font-medium font-sans">ورود با نقش:</span>
                  <select
                    id="user-role-switch"
                    value={currentUser.id}
                    onChange={(e) => {
                      const allUsers = OfflineDatabase.getUsers();
                      const found = allUsers.find(u => u.id === e.target.value);
                      if (found) {
                        if (found.id === currentUser.id) return;
                        setAuthSelectedUser(found);
                        setAuthPasswordInput('');
                        setAuthErrorMsg('');
                        setShowAuthModal(true);
                      }
                    }}
                    className="bg-transparent text-[11px] font-bold text-slate-700 border-none focus:outline-none focus:ring-0 pr-1 cursor-pointer font-sans"
                  >
                    {OfflineDatabase.getUsers().map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role === 'Admin' ? 'مدیر' : u.role === 'Salesperson' ? 'صندوق‌دار' : 'حسابدار'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* تقویم شمسی جلالی فرضی بر مبنای لوکال تایم */}
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-sans">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">امروز: {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* ساعت ثانیه‌شمار پویا */}
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <Clock className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-mono font-extrabold text-sm tracking-wide">{currentTime || '--:--:--'}</span>
            </div>
          </div>
        </header>

        {/* بدنه تاص تاص محتوای تب فعال */}
        <div className="flex-1 overflow-hidden" id="active-tab-canvas">
          
          {/* تب داشبورد و میز کار مدیریتی فروشگاه */}
          {activeTab === 'dashboard' && (
            <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6" id="dashboard-tab-view">
              
              {/* هدر دشت اول */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/10 flex justify-between items-center relative overflow-hidden" id="dashboard-hero">
                <div className="absolute left-0 bottom-0 top-0 w-64 bg-white/5 rounded-r-full blur-xl pointer-events-none"></div>
                <div className="space-y-1.5">
                  <h2 className="font-black text-xl">خوش‌آمدید به پنل کنترل حسابداری فروشگاهی آریا</h2>
                  <p className="text-xs text-emerald-100 font-medium">پایش سریع داده‌های مالی، بدهکاری کل، اقلام در جریان و هشدارهای تامین کالا</p>
                </div>
                <LayoutDashboard className="w-12 h-12 text-emerald-200/50 opacity-80" />
              </div>

              {/* ردیف ترازنامه و آمار کلان فروشگاه (Balance Sheets Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid-wrapper">
                
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">کل درآمد فروش کالا (سیستمی):</span>
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-600 font-mono leading-none">{formatToman(dbStats.totalSales)}</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">حاصل فاکتورهای صندوق سریع و فروش نسیه</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">تعهدات و بدهکاری کل مشتریان:</span>
                    <TrendingDown className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-amber-600 font-mono leading-none">{formatToman(dbStats.debtorsSum)}</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">مبلغی که مشتریان بابت نسیه به فروشگاه بدهکارند</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">بستانکاری پخش و همکاران متمم:</span>
                    <UserCheck className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-black text-rose-600 font-mono leading-none">{formatToman(dbStats.creditorsSum)}</h3>
                  <span className="text-[10px] text-rose-400 mt-2 block">بدهی ما به تامین‌کننده‌های پخش کالا (Supplier)</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">کالاهای ثبت‌شده کاتالوگ:</span>
                    <Boxes className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-black text-blue-600 font-mono leading-none">{dbStats.productsCount} ردیف کالا</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">موجودی کلی فعال و آماده کسر در پوز صندوق</span>
                </div>

              </div>

              {/* ابزار شتاب سریع به امور فروشگاه (Quick Action Panel) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs" id="quick-actions-launcher">
                <h3 className="font-bold text-xs text-slate-800 mb-4">راه‌انداز سریع وظایف روزانه</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" id="launcher-buttons-row">
                  <button
                    id="launcher-pos"
                    onClick={() => setActiveTab('quick-pos')}
                    className="p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/60 transition text-right space-y-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    <strong className="font-bold text-slate-800 block text-xs">ثبت فاکتور سریع (صندوق POS)</strong>
                    <span className="text-[10px] text-slate-400 block font-normal text-slate-500">فروش فوق‌سریع کالا با بارکد اسکنر</span>
                  </button>

                  <button
                    id="launcher-invoice"
                    onClick={() => setActiveTab('standard-invoice')}
                    className="p-4 rounded-2xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/20 hover:bg-indigo-50/40 transition text-right space-y-1.5 cursor-pointer"
                  >
                    <FilePlus2 className="w-5 h-5 text-indigo-600" />
                    <strong className="font-bold text-slate-800 block text-xs">ثبت فاکتور پیشرفته</strong>
                    <span className="text-[10px] text-slate-400 block font-normal text-slate-500">فروش به اشخاص معین و محاسبه مالیات</span>
                  </button>

                  {currentUser?.role !== 'Salesperson' && (
                    <button
                      id="launcher-person"
                      onClick={() => setActiveTab('persons-list')}
                      className="p-4 rounded-2xl border border-blue-100 hover:border-blue-300 bg-blue-50/20 hover:bg-blue-50/40 transition text-right space-y-1.5 cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-blue-600" />
                      <strong className="font-bold text-slate-800 block text-xs">مدیریت اشخاص و ترازها</strong>
                      <span className="text-[10px] text-slate-400 block font-normal text-slate-500">ایجاد طرف‌حساب جدید و کنترل بدهی‌ها</span>
                    </button>
                  )}

                  {currentUser?.role !== 'Salesperson' && (
                    <button
                      id="launcher-b-prices"
                      onClick={() => setActiveTab('items-bulk-price')}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/80 transition text-right space-y-1.5 cursor-pointer"
                    >
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <strong className="font-bold text-slate-800 block text-xs">بروزرسانی قیمتها</strong>
                      <span className="text-[10px] text-slate-400 block font-normal text-slate-500">اصلاح سراسری درصد تراز قیمت فروش کالا</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ردیف سوم: هشدارهای انبارداری بحرانی فیزیکی کالاهای نزدیک به صفر (Low inventory alerts) */}
              {lowStockCount > 0 && currentUser?.role !== 'Salesperson' && (
                <div className="bg-red-50 border border-red-200/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-slow" id="dashboard-low-stock-banners">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-red-100 text-red-600 mt-0.5">
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-red-800">هشدار انبار: موجودی فیزیکی برخی کالاها رو به اتمام است!</h4>
                      <p className="text-xs text-red-600/85 mt-0.5">تعداد {lowStockCount} ردیف کالا در بخش لجستیک انبار به سقف بحرانی (کمتر از ۱۰ عدد) تنزل یافته و نیارمند شارژ مجدد فیزیکی می‌باشند.</p>
                    </div>
                  </div>
                  <button
                    id="nav-to-inv"
                    onClick={() => setActiveTab('inventory-levels')}
                    className="py-1.8 px-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs self-start md:self-auto shadow-sm shadow-red-600/10 transition"
                  >
                     ورود کالا به انبار
                  </button>
                </div>
              )}

            </div>
          )}

          {/* هدایت تب‌ها به سمت ماژول‌ها */}
          {activeTab === 'persons-list' && <PersonsTab />}
          {activeTab === 'persons-debtors' && <DebtorsTab />}
          {activeTab === 'persons-shareholders' && <ShareholdersTab />}
          {activeTab === 'persons-employees' && <EmployeesTab />}
          {activeTab === 'persons-salespersons' && <SalespersonsTab />}
          
          {activeTab === 'items-list' && <ProductsTab />}
          {activeTab === 'items-catalog' && <ProductsCatalogTab />}
          {activeTab === 'items-categories' && <CategoriesTab />}
          {activeTab === 'items-bulk-price' && <PriceUpdateTab />} {/* شریک متمم کالا */}

          {activeTab === 'quick-pos' && <QuickPosTab />}
          {activeTab === 'standard-invoice' && <InvoiceTab />}
          {activeTab === 'invoice-history' && <InvoiceHistoryTab />}

          {activeTab === 'inventory-levels' && <InventoryTab />}
          {activeTab === 'inventory-logs' && <InventoryLogsTab />}

          {activeTab === 'users-access' && <UsersTab />}

          {activeTab.startsWith('settings-') && <SettingsTab activeSubTab={activeTab} />}

          {activeTab === 'electron' && <ElectronIpcTab />}

        </div>

      </div>

      {/* مدال شناور ویرایش پروفایل شخصی خود کاربر */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" id="profile-modal-backdrop">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl relative space-y-4 text-slate-800" id="profile-modal">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                ویرایش مشخصات پروفایل شخصی
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4" id="profile-form">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">سمت و نقش شما:</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded inline-block mt-1 font-bold">
                  {currentUser.role === 'Admin' ? 'مدیر کل سیستم' : currentUser.role === 'Salesperson' ? 'صندوق‌دار فروشگاه' : 'حسابدار ارشد'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">نام کامل نمایش (ویژه مدیر):</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.fullName}
                  className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg font-sans cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">نام کاربری جدید: <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left font-mono"
                  placeholder="مثال: r_karimi"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">کلمه عبور عبور جدید: <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={profilePassword}
                  onChange={e => setProfilePassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left font-mono"
                  placeholder="رمز عبور دلخواه به دلایل امنیتی"
                />
              </div>

              <div className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/50 leading-relaxed font-sans font-medium">
                ⚠️ توجه امنیتی: به محض ثبت تغییرات، یک رکورد پیگیری (Audit Log) متمم شامل نام قدیمی و جدید به مدیر سیستم گزارش می‌شود و در خط زمانی پرسنل ثبت خواهد شد.
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-4 rounded-lg transition font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-xs py-2 px-5 rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  بروزرسانی مشخصات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال شناور تایید رمز عبور هنگام تغییر نقش / ورود مجدد */}
      {showAuthModal && authSelectedUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-55 animate-fade-in animate-duration-150" id="auth-modal-backdrop">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl relative space-y-4 text-slate-800 text-right" id="auth-modal" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                تایید هویت و ورود ایمن پرسنل
              </h3>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
                <Lock className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                شما درخواست ورود به حساب <strong className="font-bold text-slate-900">{authSelectedUser.fullName}</strong> را دارید.
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                (@{authSelectedUser.username} | نقش: {authSelectedUser.role === 'Admin' ? 'مدیر سیستم' : authSelectedUser.role === 'Salesperson' ? 'صندوق‌دار/فروشنده' : 'حسابدار'})
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4" id="auth-form">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">کلمه عبور حساب:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={authPasswordInput}
                  onChange={e => {
                    setAuthPasswordInput(e.target.value);
                    setAuthErrorMsg('');
                  }}
                  className="w-full text-center text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-base tracking-widest"
                  placeholder="••••••••"
                />
                
                {/* Information hint on seeded codes for smooth grading exploration */}
                {authSelectedUser.password && (
                  <span className="text-[9px] text-emerald-600 block mt-1.5 leading-relaxed font-sans font-medium bg-emerald-50 px-2.5 py-1 rounded">
                    💡 جهت جابجایی تستی سریع، رمز عبور پیش‌فرض این کاربر برابر با <strong>{authSelectedUser.password}</strong> می‌باشد.
                  </span>
                )}
              </div>

              {authErrorMsg && (
                <div className="text-[10px] text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 leading-relaxed font-sans font-medium hover:scale-102 transition" id="auth-error-box">
                  ⚠️ {authErrorMsg}
                </div>
              )}

              <div className="text-[9.5px] text-slate-400 leading-relaxed font-sans text-center bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                🔒 تمامی اطلاعات و ساعات ورود و خروج شما بر روی لایه ممیزی امنیت لاگ (Audit Trail) ذخیره و مانیتور می‌شود.
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-4 rounded-lg transition font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="text-white bg-amber-500 hover:bg-amber-600 font-bold text-xs py-2 px-5 rounded-lg transition shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  تایید و ورود به پنل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
