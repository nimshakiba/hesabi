import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  FileText, 
  Boxes, 
  ChevronDown, 
  LayoutDashboard, 
  Cpu, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Eye,
  AlertTriangle,
  History,
  FileSpreadsheet,
  KeyRound,
  Settings,
  UserPlus,
  Coins,
  Briefcase,
  UserCheck,
  Award,
  PlusCircle,
  FolderTree,
  Tag,
  Zap,
  Printer,
  Palette,
  Store,
  ChevronLeft,
  ChevronRight,
  User,
  Power,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string, parentMenuId: string | null) => void;
  lowStockCount: number;
  currentUser?: any;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  currentUserRole?: string;
  storeName?: string;
  storeLogo?: string;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  lowStockCount, 
  currentUser,
  onOpenProfile,
  onLogout,
  currentUserRole = 'Admin', 
  storeName, 
  storeLogo 
}: SidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>('sales'); // پیشفرض بخش فاکتور باز باشد
  const [isCollapsed, setIsCollapsed] = useState(false);

  // افکت مانیتورینگ اندازه صفحه برای بستن اتوماتیک منو در سایزهای کوچک
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    // اجرای بار اولیه
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = (menuId: string) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null); // بستن منوی باز شده فعلی
    } else {
      setExpandedMenu(menuId); // باز کردن منوی جدید و بسته شدن بقیه اتوماتیک
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبورد و گزارشات',
      icon: LayoutDashboard,
      isSingle: true, // منوی تکی بدون زیرمنو
    },
    {
      id: 'persons',
      label: 'اشخاص و مشتریان',
      icon: Users,
      subMenus: [
        { id: 'persons-list', label: 'مدیریت اشخاص و حساب‌ها', icon: UserPlus },
        { id: 'persons-debtors', label: 'بدهکاران و بستانکاران', icon: TrendingDown },
        { id: 'persons-shareholders', label: 'سهامداران شرکت', icon: Coins },
        { id: 'persons-employees', label: 'مدیریت کارمندان', icon: Briefcase },
        { id: 'persons-salespersons', label: 'عملکرد فروشندگان (ویژه مدیر)', icon: Award },
      ]
    },
    {
      id: 'items',
      label: 'محصولات و خدمات',
      icon: ShoppingBag,
      subMenus: [
        { id: 'items-list', label: 'افزودن محصول و خدمات', icon: PlusCircle },
        { id: 'items-catalog', label: 'لیست محصولات و خدمات', icon: ClipboardList },
        { id: 'items-categories', label: 'مدیریت دسته‌بندی‌ها (درختی)', icon: FolderTree },
        { id: 'items-bulk-price', label: 'بروزرسانی لیست قیمت‌ها', icon: Tag },
      ]
    },
    {
      id: 'sales',
      label: 'فاکتور و بهای فروش',
      icon: FileText,
      subMenus: [
        { id: 'quick-pos', label: 'فروش سریع (صندوق POS)', highlight: true, icon: Zap },
        { id: 'standard-invoice', label: 'ثبت فاکتور پیشرفته', icon: FileText },
        { id: 'invoice-history', label: 'تاریخچه فاکتورها', icon: History },
      ]
    },
    {
      id: 'inventory',
      label: 'لجستیک و انبارداری',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      subMenus: [
        { id: 'inventory-levels', label: 'کنترل موجودی انبار', icon: Boxes },
        { id: 'inventory-logs', label: 'تاریخچه عملیات انبار', icon: History },
      ]
    },
    {
      id: 'users-access',
      label: 'کاربران و دسترسی‌ها',
      icon: KeyRound,
      isSingle: true,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: Settings,
      subMenus: [
        { id: 'settings-app', label: 'تنظیمات برنامه', icon: Settings },
        { id: 'settings-print', label: 'تنظیمات چاپ', icon: Printer },
        { id: 'settings-designer', label: 'طراحی فاکتور (المنتور)', icon: Palette },
        { id: 'settings-store', label: 'اطلاعات فروشگاه', icon: Store },
        { id: 'settings-logs', label: 'لاگ‌های برنامه (مسیر ممیزی)', icon: FileSpreadsheet },
      ]
    },
    {
      id: 'electron',
      label: 'برقراری اتصال Electron',
      icon: Cpu,
      isSingle: true,
    }
  ];

  // فیلتر کردن منوها براساس نقش کاربر و دسترسی‌های اختصاصی کالیبره‌شده در ماژول فایروال
  const getRolePermissions = (roleName: string): string[] => {
    if (roleName === 'Admin') {
      return [
        'dashboard', 
        'persons-list', 'persons-debtors', 'persons-shareholders', 'persons-employees', 'persons-salespersons',
        'items-list', 'items-catalog', 'items-categories', 'items-bulk-price',
        'quick-pos', 'standard-invoice', 'invoice-history',
        'inventory-levels', 'inventory-logs',
        'users-access', 'settings', 'electron'
      ];
    }
    const raw = localStorage.getItem('shop_accounting_role_permissions');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed[roleName]) {
          return parsed[roleName];
        }
      } catch (e) {}
    }
    
    // مقادیر پیش‌فرض پشتیبانی در صورت عدم ذخیره‌سازی قبلی
    if (roleName === 'Salesperson') {
      return ['dashboard', 'quick-pos', 'invoice-history', 'electron'];
    }
    if (roleName === 'Accountant') {
      return [
        'dashboard', 
        'persons-list', 'persons-debtors', 'persons-shareholders',
        'items-list', 'items-catalog', 'items-categories', 'items-bulk-price',
        'quick-pos', 'standard-invoice', 'invoice-history',
        'inventory-levels', 'inventory-logs'
      ];
    }
    return ['dashboard'];
  };

  const allowedPermissions = getRolePermissions(currentUserRole);

  const allowedMenuItems = menuItems.map(item => {
    if (item.isSingle) {
      if (!allowedPermissions.includes(item.id)) return null;
      return item;
    }
    
    // فیلتر کردن زیرمنوها بر اساس لیست فایروال سیستم دسترسی
    const subFiltered = item.subMenus?.filter(sub => {
      if (item.id === 'settings') {
        if (sub.id === 'settings-logs') {
          return currentUserRole === 'Admin';
        }
        return allowedPermissions.includes('settings');
      }
      return allowedPermissions.includes(sub.id);
    });
    
    if (!subFiltered || subFiltered.length === 0) {
      return null;
    }
    
    return {
      ...item,
      subMenus: subFiltered
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <aside 
      className={`h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 flex flex-col border-l border-slate-800 shadow-xl select-none transition-all duration-350 relative shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`} 
      id="sidebar-container"
    >
      {/* دکمه شناور جمع کردن سایدبار در لبه سمت چپ (تلاقی با محتوا - مناسب برای RTL) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute left-[-14px] top-6 w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 z-50 no-print"
        title={isCollapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
      >
        {isCollapsed ? <ChevronLeft className="w-4.5 h-4.5" /> : <ChevronRight className="w-4.5 h-4.5" />}
      </button>

      {/* هدر سایدبار */}
      <div className={`p-5 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`} id="sidebar-header">
        {isCollapsed ? (
          <button 
            type="button" 
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-black/40 text-white font-bold text-lg hover:bg-slate-800 transition-colors p-1 border border-slate-800 overflow-hidden shrink-0"
            title="باز کردن سایدبار"
          >
            {storeLogo ? (
              <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-md animate-fade-in" />
            ) : (
              'ح'
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-black/40 text-white font-bold text-lg p-1 border border-slate-800 overflow-hidden shrink-0">
              {storeLogo ? (
                <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-md" />
              ) : (
                'ح'
              )}
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide truncate max-w-[150px]">{storeName || 'حسابداری فروشگاهی آریا'}</h1>
              <span className="text-[10px] text-slate-400 font-mono">نسخه ۱۰۰٪ آفلاین</span>
            </div>
          </div>
        )}
        {!isCollapsed && (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">سریع</span>
        )}
      </div>

      {/* لیست منوها با انیمیشن و رفتار دقیق آکاردئونی */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-800/60" id="sidebar-menu-list">
        {allowedMenuItems.map((menu) => {
          const isSelectedParent = activeTab === menu.id || (menu.subMenus?.some(sub => sub.id === activeTab));

          if (menu.isSingle) {
            return (
              <div key={menu.id} className="relative group">
                <button
                  id={`menu-single-${menu.id}`}
                  onClick={() => {
                    onTabChange(menu.id, null);
                    setExpandedMenu(null); // بستن زیرمنوهای آکاردئون
                  }}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3 rounded-xl' : 'justify-between px-4 py-3 rounded-xl'} transition-all font-medium text-xs duration-200 cursor-pointer ${
                    activeTab === menu.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <menu.icon className="w-5 h-5" />
                    {!isCollapsed && <span>{menu.label}</span>}
                  </div>
                </button>
                
                {/* تولتیپ در حالت بسته بودن سایدبار */}
                {isCollapsed && (
                  <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 whitespace-nowrap pointer-events-none select-none font-sans">
                    {menu.label}
                  </div>
                )}
              </div>
            );
          }

          const isExpanded = expandedMenu === menu.id;

          return (
            <div key={menu.id} className="space-y-1 relative group" id={`menu-group-${menu.id}`}>
              <button
                id={`menu-header-${menu.id}`}
                onClick={() => toggleMenu(menu.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3 rounded-xl' : 'justify-between px-4 py-3 rounded-xl'} transition-all font-medium text-xs duration-200 cursor-pointer ${
                  isSelectedParent 
                    ? 'bg-slate-800 text-white border-r-4 border-emerald-500' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <menu.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  {!isCollapsed && <span className="truncate max-w-[150px]">{menu.label}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    {menu.badge && (
                      <span className="bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold font-mono">
                        {menu.badge}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                )}
              </button>

              {/* تولتیپ منوی والد در حالت بسته بودن سایدبار */}
              {isCollapsed && (
                <div className="absolute right-full mr-3 top-5 -translate-y-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 whitespace-nowrap pointer-events-none select-none font-sans">
                  {menu.label} {menu.badge ? `(هشدارهای انبار: ${menu.badge})` : ''}
                </div>
              )}

              {/* باز شدن آکاردئونی با شرط پهنا */}
              {isExpanded && (
                isCollapsed ? (
                  /* زیرمنوهای فشرده با آیکونهای متمایز */
                  <div className="flex flex-col gap-1.5 bg-slate-900/60 py-2 rounded-xl mt-1 shadow-inner border border-slate-800/50" id={`collapsed-submenus-${menu.id}`}>
                    {menu.subMenus?.map((sub) => {
                      const isSubSelected = activeTab === sub.id;
                      const SubIcon = sub.icon || Eye;
                      return (
                        <div key={sub.id} className="relative group/sub flex justify-center py-0.5">
                          <button
                            id={`submenu-item-${sub.id}`}
                            onClick={() => onTabChange(sub.id, menu.id)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                              isSubSelected
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : (sub as any).highlight
                                  ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-4.5 h-4.5 shrink-0" />
                          </button>
                          
                          {/* تولتیپ شناور برای زیرمنو در حالت بسته */}
                          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-95 invisible group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:scale-100 transition-all duration-150 z-50 whitespace-nowrap pointer-events-none select-none font-sans">
                            {sub.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* زیرمنوهای عریض معمولی با آیکونهای متمایز در کنار متن */
                  <div className="mr-4 pr-3 border-r border-slate-800 space-y-1 mt-1 transition-all" id={`submenus-for-${menu.id}`}>
                    {menu.subMenus?.map((sub) => {
                      const isSubSelected = activeTab === sub.id;
                      const SubIcon = sub.icon || Eye;
                      return (
                        <button
                          key={sub.id}
                          id={`submenu-item-${sub.id}`}
                          onClick={() => onTabChange(sub.id, menu.id)}
                          className={`w-full flex items-center gap-2.5 text-right px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                            isSubSelected
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium shadow-md shadow-emerald-500/5'
                              : (sub as any).highlight
                                ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 font-medium'
                                : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                          }`}
                        >
                          <SubIcon className="w-4 h-4 opacity-70 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* بخش بیوگرافی و پروفایل کاربر فعال بر اساس درخواست کاربر */}
      {currentUser && (
        <div className={`mx-3 mb-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 ${isCollapsed ? 'flex justify-center' : 'space-y-2.5'}`} id="sidebar-user-card">
          {isCollapsed ? (
            <div className="relative group">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 flex items-center justify-center transition cursor-pointer"
                title="ویرایش مشخصات پروفایل"
              >
                <User className="w-5 h-5" />
              </button>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 whitespace-nowrap pointer-events-none select-none font-sans">
                پروفایل: {currentUser.fullName}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 border-b border-slate-800/40 pb-2.5" dir="rtl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {currentUser.fullName?.charAt(0) || 'ک'}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <h4 className="font-bold text-[11.5px] text-white truncate">{currentUser.fullName}</h4>
                  <span className="text-[9.5px] text-slate-400 font-medium block truncate">
                    {currentUser.role === 'Admin' ? 'مدیر ارشد سیستم' : currentUser.role === 'Salesperson' ? 'صندوق‌دار/فروشنده' : 'حسابدار ارشد'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 justify-between">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex-1 flex items-center justify-center gap-1 bg-indigo-600/10 hover:bg-indigo-600/20 active:bg-indigo-600/30 text-indigo-400 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  title="ویرایش مشخصات پروفایل من"
                >
                  <User className="w-3 h-3" />
                  <span>پروفایل من</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-1 bg-rose-600/10 hover:bg-rose-600/20 active:bg-rose-600/30 text-rose-400 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  title="خروج امن از حساب"
                >
                  <Power className="w-3 h-3" />
                  <span>خروج</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* کارت وضعیت دیتابیس بومی پایین منو */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col justify-center rounded-b-xl" id="sidebar-footer">
        {isCollapsed ? (
          <div className="relative group flex justify-center py-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse border border-emerald-500/20 shadow-md"></span>
            
            {/* تولتیپ شناور وضعیت دیتابیس در حالت بسته بودن */}
            <div className="absolute right-full mr-3 bottom-0 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-medium py-2 px-3 rounded-lg shadow-xl opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 whitespace-nowrap pointer-events-none select-none font-sans">
              <div className="font-bold text-emerald-400">پایگاه داده: آماده‌به‌کار (SQLite)</div>
              <div className="text-[10px] text-slate-400 mt-1">SQLite engine state: persisted</div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full flex justify-between items-center text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                وضعیت پایگاه داده:
              </span>
              <span className="text-emerald-400 font-medium font-sans">آماده‌به‌کار (SQLite)</span>
            </div>
            <div className="text-[10px] text-slate-500 text-center select-text font-mono mt-1">
              SQLite engine state: persisted
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
