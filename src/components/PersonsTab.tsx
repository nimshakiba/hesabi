import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Invoice, InvoiceItem, Product } from '../types';
import { SettingsService, formatPrice } from '../utils/settings';
import { 
  UserPlus, Search, Edit2, Trash2, Phone, Briefcase, FileText, 
  ArrowUpRight, ArrowDownLeft, Receipt, Users, Plus, X, 
  TrendingUp, Coins, Activity, Percent, Building, Mail, MapPin, 
  Calendar, Layers, Sparkles, DollarSign, Wallet
} from 'lucide-react';

export default function PersonsTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [shareholderTxs, setShareholderTxs] = useState<any[]>([]);

  // وضعیت نمایش مودال فرم ایجاد و ویرایش شخص
  const [isModalOpen, setIsModalOpen] = useState(false);

  // وضعیت فرم اشخاص
  const [personId, setPersonId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [type, setType] = useState<'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson' | 'Other'>('Customer');
  const [selectedRoles, setSelectedRoles] = useState<('Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson')[]>(['Customer']);
  const [balance, setBalance] = useState<number>(0);
  const [sharePercentage, setSharePercentage] = useState<number>(0);
  const [nationalCode, setNationalCode] = useState<string>('');
  const [economicCode, setEconomicCode] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [landline, setLandline] = useState<string>('');
  
  // وضعیت جستجو، فیلتر و تب فعال معین
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson' | 'Other' | 'Debtors' | 'Creditors'>('All');
  const [showSystemAccounts, setShowSystemAccounts] = useState(false);
  const [ledgerTab, setLedgerTab] = useState<'invoices' | 'items' | 'analytics'>('invoices');

  // بارگذاری داده‌ها پس از بارگذاری کامپوننت
  useEffect(() => {
    refreshData();
  }, []);

  const toggleRole = (role: 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson') => {
    if (selectedRoles.includes(role)) {
      // Allow deselecting unless it's the last role
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
      } else {
        alert('شخص باید حداقل دارای یک نقش تجاری باشد.');
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const refreshData = () => {
    const pList = OfflineDatabase.getPersons();
    const invList = OfflineDatabase.getInvoices();
    try {
      const prodList = OfflineDatabase.getProducts();
      setProducts(prodList);
    } catch (e) {
      console.error(e);
    }
    
    setPersons(pList);
    setInvoices(invList);
    loadShareholderTransactions();
    
    // انتخاب خودکار اولین شخص معتبر در صورت عدم انتخاب پیشین
    if (selectedPerson) {
      const updated = pList.find(p => p.id === selectedPerson.id);
      setSelectedPerson(updated || null);
    } else {
      // فیلتر کردن مشتری عمومی برای انتخاب پیش‌فرض
      const realPeople = pList.filter(p => p.id !== 'general_customer');
      if (realPeople.length > 0) {
        setSelectedPerson(realPeople[0]);
      } else if (pList.length > 0) {
        setSelectedPerson(pList[0]);
      }
    }
  };

  const loadShareholderTransactions = () => {
    const raw = localStorage.getItem('shop_accounting_shareholder_txs');
    if (raw) {
      try {
        setShareholderTxs(JSON.parse(raw));
      } catch (err) {
        setShareholderTxs([]);
      }
    } else {
      setShareholderTxs([]);
    }
  };

  // ریست کردن فرم
  const resetForm = () => {
    setPersonId('');
    setName('');
    setPhone('');
    setType('Customer');
    setSelectedRoles(['Customer']);
    setBalance(0);
    setSharePercentage(0);
    setNationalCode('');
    setEconomicCode('');
    setAddress('');
    setEmail('');
    setNotes('');
    setPostalCode('');
    setLandline('');
  };

  // باز کردن مودال برای ایجاد شخص جدید
  const handleOpenCreateModal = () => {
    resetForm();
    try {
      const settings = SettingsService.get();
      if (settings && settings.personPrefix) {
        setPersonId(`${settings.personPrefix}${settings.personNextNumber || 1001}`);
      }
    } catch (e) {}
    setIsModalOpen(true);
  };

  // باز کردن مودال برای ویرایش شخص
  const handleOpenEditModal = (p: Person, e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonId(p.id);
    setName(p.name);
    setPhone(p.phone);
    setType(p.type);
    setSelectedRoles(p.roles || [p.type as any]);
    setBalance(p.balance);
    setSharePercentage(p.share_percentage || 0);
    setNationalCode(p.national_code || '');
    setEconomicCode(p.economic_code || '');
    setAddress(p.address || '');
    setEmail(p.email || '');
    setNotes(p.notes || '');
    setPostalCode(p.postal_code || '');
    setLandline(p.landline || '');
    setIsModalOpen(true);
  };

  // ذخیره اطلاعات شخص
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (selectedRoles.length === 0) {
      alert('لطفاً حداقل یک نقش و مسئولیت برای شخص تیک بزنید.');
      return;
    }

    // تعیین نوع تجاری سازگار براساس اولویت نقش انتخابی جهت جلوگیری از به هم خوردن عملکرد سایر بخش‌های برنامه
    let determinedType: 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson' | 'Other' = 'Customer';
    if (selectedRoles.includes('Shareholder')) {
      determinedType = 'Shareholder';
    } else if (selectedRoles.includes('Employee')) {
      determinedType = 'Employee';
    } else if (selectedRoles.includes('Salesperson')) {
      determinedType = 'Salesperson';
    } else if (selectedRoles.includes('Supplier')) {
      determinedType = 'Supplier';
    } else if (selectedRoles.includes('Customer')) {
      determinedType = 'Customer';
    }

    if (selectedRoles.includes('Shareholder')) {
      const shareVal = Number(sharePercentage);
      if (shareVal < 0 || shareVal > 100) {
        alert('درصد سهم وارد شده باید بین ۰ تا ۱۰۰ باشد.');
        return;
      }

      // بررسی سهم سایر سهام‌داران تا مطمئن شویم از ۱۰۰ درصد عبور نمی‌کند
      const totalOtherShare = persons
        .filter(p => {
          const isSh = p.type === 'Shareholder' || (p.roles && p.roles?.includes('Shareholder'));
          return isSh && p.id !== personId;
        })
        .reduce((sum, p) => sum + (p.share_percentage || 0), 0);

      if (totalOtherShare + shareVal > 100) {
        alert(`خطا: مجموع درصد سهام از ۱۰۰٪ بیشتر می‌شود. مجموع سهم سایر سهام‌داران: ${totalOtherShare}٪ است. حداکثر سهم مجاز جدید: ${100 - totalOtherShare}٪ است.`);
        return;
      }
    }

    // بررسی برای افزایش گام شماره بعدی در تنظیمات پیشامد ثبت ناموفق شخص جدید
    const isNew = !persons.some(p => p.id === personId);

    const saved = OfflineDatabase.savePerson({
      id: personId ? personId : undefined,
      name,
      phone,
      type: determinedType,
      roles: selectedRoles,
      balance: Number(balance),
      national_code: nationalCode,
      economic_code: economicCode,
      address,
      email,
      notes,
      postal_code: postalCode,
      landline,
      share_percentage: selectedRoles.includes('Shareholder') ? Number(sharePercentage) : undefined,
    });

    if (isNew && personId) {
      try {
        const settings = SettingsService.get();
        if (settings && personId.startsWith(settings.personPrefix)) {
          const numPart = personId.replace(settings.personPrefix, '');
          const num = Number(numPart);
          if (!isNaN(num) && num === settings.productNextNumber) {
            // we should compare against personNextNumber
          }
          if (!isNaN(num) && num === settings.personNextNumber) {
            settings.personNextNumber = settings.personNextNumber + 1;
            SettingsService.save(settings);
          }
        }
      } catch (e) {}
    }

    setIsModalOpen(false);
    resetForm();
    refreshData();
    setSelectedPerson(saved);
  };

  // حذف شخص
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'general_customer') {
      alert('مشتری عمومی سیستم قابل حذف نمی‌باشد.');
      return;
    }
    if (confirm('آیا از حذف این شخص مطمئن هستید؟ با حذف وی، مانده حساب او از سیستم حذف می‌شود.')) {
      OfflineDatabase.deletePerson(id);
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }
      refreshData();
    }
  };

  // فیلتر کردن و جستجوی اشخاص
  const filteredPersons = persons.filter(p => {
    // اگر تیک نمایش حساب‌های سیستمی خاموش بود، مشتری عمومی را فیلتر کن
    if (!showSystemAccounts && p.id === 'general_customer') {
      return false;
    }

    const matchesSearch = p.name.includes(searchQuery) || p.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    
    const includesRole = (personItem: Person, roleName: 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Salesperson') => {
      if (personItem.roles && Array.isArray(personItem.roles)) {
        return personItem.roles.includes(roleName);
      }
      return personItem.type === roleName;
    };

    if (filterType === 'Customer') return includesRole(p, 'Customer');
    if (filterType === 'Supplier') return includesRole(p, 'Supplier');
    if (filterType === 'Shareholder') return includesRole(p, 'Shareholder');
    if (filterType === 'Employee') return includesRole(p, 'Employee');
    if (filterType === 'Salesperson') return includesRole(p, 'Salesperson');
    if (filterType === 'Other') return p.type === 'Other' && (!p.roles || p.roles.length === 0);
    if (filterType === 'Debtors') return p.balance > 0;
    if (filterType === 'Creditors') return p.balance < 0;
    
    return true;
  });

  // دریافت تمامی فاکتورهای شخص انتخابی
  const personInvoices = invoices.filter(inv => inv.person_id === selectedPerson?.id);

  // تبدیل مبالغ به تومان همرا با جداکننده هزارگان
  const formatToman = (amount: number) => {
    return formatPrice(Math.abs(amount));
  };

  // تشخیص و رنگ‌آمیزی تراز حساب شخص
  const getBalanceStatus = (amount: number) => {
    if (amount > 0) return { text: 'بدهکار (به ما بدهکار است)', color: 'text-amber-600 bg-amber-50 border-amber-200/60' };
    if (amount < 0) return { text: 'بستانکار (از ما طلبکار است)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' };
    return { text: 'تصفیه کامل (بی‌حساب)', color: 'text-slate-500 bg-slate-50 border-slate-200/60' };
  };

  // دریافت اولین کلمات نام شخص به عنوان آواتار
  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}‌${parts[1][0]}`;
    }
    return fullName.substring(0, 2);
  };

  // محاسبات پیشرفته و آماری شخص
  const getPersonStats = (personId: string) => {
    const personInvoices = invoices.filter(inv => inv.person_id === personId);
    let totalSales = 0;
    let totalPurchases = 0;
    let salesCount = 0;
    let purchaseCount = 0;

    personInvoices.forEach(inv => {
      if (inv.type === 'Sale' || inv.type === 'Quick Sale') {
        totalSales += inv.final_amount;
        salesCount++;
      } else if (inv.type === 'Purchase') {
        totalPurchases += inv.final_amount;
        purchaseCount++;
      }
    });

    return {
      totalSales,
      totalPurchases,
      salesCount,
      purchaseCount,
      totalInvoices: personInvoices.length
    };
  };

  // جمع‌آوری و گروه‌بندی اقلام مبادله شده (کالاها و خدمات) برای شخص انتخابی
  const getPersonExchangedItems = (personId: string) => {
    const personInvoices = invoices.filter(inv => inv.person_id === personId);
    
    // ایجاد مپ محصولات جهت استخراج قیمت خرید و سود
    const productMap = new Map<string, Product>();
    products.forEach(p => productMap.set(p.id, p));

    const itemsMap = new Map<string, {
      itemId: string;
      title: string;
      type: 'Product' | 'Service';
      totalQty: number;
      totalAmount: number;
      averagePrice: number;
      invoiceTypes: Set<string>;
    }>();

    personInvoices.forEach(inv => {
      try {
        const items = OfflineDatabase.getInvoiceItemsByInvoiceId(inv.id);
        items.forEach(item => {
          const key = `${item.item_id}_${item.item_type}`;
          const existing = itemsMap.get(key);
          
          let title = item.item_type === 'Service' ? 'خدمات همکار' : 'کالای تعریف نشده';
          if (item.item_type === 'Product') {
            const prod = productMap.get(item.item_id);
            if (prod) title = prod.title;
          }

          if (existing) {
            existing.totalQty += item.quantity;
            existing.totalAmount += item.total;
            existing.averagePrice = Math.round(existing.totalAmount / existing.totalQty);
            existing.invoiceTypes.add(inv.type === 'Purchase' ? 'خرید' : 'فروش');
          } else {
            itemsMap.set(key, {
              itemId: item.item_id,
              title,
              type: item.item_type,
              totalQty: item.quantity,
              totalAmount: item.total,
              averagePrice: item.price,
              invoiceTypes: new Set([inv.type === 'Purchase' ? 'خرید' : 'فروش'])
            });
          }
        });
      } catch (err) {
        console.error('Error fetching items for invoice:', inv.id, err);
      }
    });

    return Array.from(itemsMap.values());
  };

  // محاسبه کل سود ناخالص فروشگاه در یک دوره ماهانه یا کل دوره
  const calculateStoreProfit = (currentMonthOnly: boolean = false) => {
    let totalProfit = 0;
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const productMap = new Map<string, Product>();
    products.forEach(p => productMap.set(p.id, p));

    const targetInvoices = invoices.filter(inv => {
      if (inv.type !== 'Sale' && inv.type !== 'Quick Sale') return false;
      if (currentMonthOnly) {
        return inv.created_at.startsWith(currentYearMonth);
      }
      return true;
    });

    targetInvoices.forEach(inv => {
      try {
        const items = OfflineDatabase.getInvoiceItemsByInvoiceId(inv.id);
        let invoiceCost = 0;
        let invoiceRevenue = 0;

        items.forEach(item => {
          if (item.item_type === 'Product') {
            const prod = productMap.get(item.item_id);
            if (prod) {
              invoiceCost += (prod.purchase_price || 0) * item.quantity;
            } else {
              invoiceCost += (item.price * 0.70) * item.quantity; // پیش‌فرض ۳۰ درصد حاشیه سود برای کالای نامشخص
            }
            invoiceRevenue += item.price * item.quantity;
          } else {
            invoiceCost += (item.price * 0.10) * item.quantity; // فرضم بر این است که خدمات بازرگانی ۹۰٪ سود خالص دارند
            invoiceRevenue += item.price * item.quantity;
          }
        });

        const discountRatio = inv.total_amount > 0 ? (inv.discount / inv.total_amount) : 0;
        const netRevenue = invoiceRevenue * (1 - discountRatio);
        const profit = netRevenue - invoiceCost;
        totalProfit += profit;
      } catch (err) {
        // نادیده‌گیری خطای موقت اقلام فاکتور
      }
    });

    return Math.max(0, Math.round(totalProfit));
  };

  // بدست آوردن خلاصه عملکرد سهام‌دار فیزیکی
  const getShareholderStats = (shId: string, sharePercentage: number) => {
    const shTxs = shareholderTxs.filter(tx => tx.shareholderId === shId);
    
    const totalCapital = shTxs.filter(tx => tx.type === 'Capital').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalWithdrawnProfit = shTxs.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalAllocatedProfit = shTxs.filter(tx => tx.type === 'Profit').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    
    const systemProfitThisMonth = calculateStoreProfit(true);
    const systemProfitAllTime = calculateStoreProfit(false);

    const shareOfThisMonthProfit = Math.round(systemProfitThisMonth * (sharePercentage / 100));
    const shareOfAllTimeProfit = Math.round(systemProfitAllTime * (sharePercentage / 100));

    // مانده تراز از دیدگاه سهام‌داری (سرمایه کل + سود مصوب - برداشت‌ها)
    const shareholderEquity = totalCapital + totalAllocatedProfit - totalWithdrawnProfit;

    return {
      totalCapital,
      totalWithdrawnProfit,
      totalAllocatedProfit,
      systemProfitThisMonth,
      systemProfitAllTime,
      shareOfThisMonthProfit,
      shareOfAllTimeProfit,
      shareholderEquity,
      txCount: shTxs.length
    };
  };

  const selectedPersonStats = selectedPerson ? getPersonStats(selectedPerson.id) : null;
  const selectedPersonExchangedItems = selectedPerson ? getPersonExchangedItems(selectedPerson.id) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50" id="persons-tab-container">
      
      {/* بخش راست: کاتالوگ و لیست کامل اشخاص */}
      <div className="w-full lg:w-[60%] flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" id="persons-list-pane">
        
        {/* هدر بالایی لیست همراه فیلتر و دکمه جدید */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4" id="persons-list-header">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                دفتر مدیریت اشخاص و تراز حساب‌ها
              </h2>
              <p className="text-xs text-slate-400 mt-1">مدیریت، تراز مالی، معین و تسهیم سود مشتریان، همکاران، تامین‌کنندگان و شرکا</p>
            </div>
            
            <button
              id="open-create-person-modal"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              ثبت شخص جدید
            </button>
          </div>

          {/* نوار جستجو و تنظیم حساب‌های سیستمی */}
          <div className="flex flex-col md:flex-row md:items-center gap-3" id="search-and-systems-toggle">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                id="search-persons-catalog"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی سریع نام، فامیل، کد ملی یا تلفن همراه..."
                className="w-full text-xs pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap self-start">
              <input
                type="checkbox"
                checked={showSystemAccounts}
                onChange={e => setShowSystemAccounts(e.target.checked)}
                className="accent-emerald-600 h-4 w-4 rounded border-slate-300"
              />
              نمایش حساب‌های سیستمی (مشتری عمومی)
            </label>
          </div>

          {/* دسته‌بندی نقش‌ها و وضعیت بدهی جهت تصفیه آسان */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-xl" id="persons-narrow-filters">
            {([
              { key: 'All', title: 'همه افراد' },
              { key: 'Customer', title: 'مشتریان (خریدار)' },
              { key: 'Supplier', title: 'تامین‌کنندگان (پخش)' },
              { key: 'Shareholder', title: 'سهام‌داران (شرکا)' },
              { key: 'Employee', title: 'کارمندان و پرسنل' },
              { key: 'Salesperson', title: 'فروشندگان' },
              { key: 'Debtors', title: 'بدهکاران سیستم' },
              { key: 'Creditors', title: 'بستانکاران سیستم' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                id={`filter-tab-${tab.key}`}
                onClick={() => setFilterType(tab.key)}
                className={`text-[10px] sm:text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                  filterType === tab.key 
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* بدنه لیست کاتالوگ اشخاص */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/20" id="persons-items-viewport">
          {filteredPersons.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16 text-slate-400">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">هیچ دفتری متناسب با فیلترها یافت نگردید</p>
              <button onClick={() => { setSearchQuery(''); setFilterType('All'); }} className="text-emerald-600 text-xs font-bold mt-2 hover:underline">
                پاک‌کردن فیلترها و جستجو
              </button>
            </div>
          ) : (
            filteredPersons.map(p => {
              const works = getPersonStats(p.id);
              const isSelected = selectedPerson?.id === p.id;
              
              return (
                <div
                  key={p.id}
                  id={`person-row-${p.id}`}
                  onClick={() => setSelectedPerson(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' 
                      : 'border-slate-200/60 hover:border-slate-300 hover:bg-white bg-slate-50/20'
                  }`}
                >
                  {/* اطلاعات اول شخص */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold font-mono text-white ${
                      p.type === 'Customer' ? 'bg-gradient-to-tr from-sky-500 to-indigo-500' :
                      p.type === 'Supplier' ? 'bg-gradient-to-tr from-purple-500 to-fuchsia-500' :
                      p.type === 'Shareholder' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500' :
                      p.type === 'Employee' ? 'bg-gradient-to-tr from-amber-500 to-orange-500' :
                      'bg-gradient-to-tr from-slate-400 to-slate-500'
                    }`}>
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm">{p.name}</h4>
                        <div className="flex flex-wrap gap-1">
                          {p.roles && p.roles.length > 0 ? (
                            p.roles.map(role => (
                              <span key={role} className={`text-[9.5px] py-0.5 px-1.5 rounded-md font-bold ${
                                role === 'Customer' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                role === 'Supplier' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                role === 'Shareholder' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                role === 'Employee' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                role === 'Salesperson' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {role === 'Customer' ? 'مشتری' :
                                 role === 'Supplier' ? 'تامین‌کننده' :
                                 role === 'Shareholder' ? `سهام‌دار (${p.share_percentage || 0}٪)` :
                                 role === 'Employee' ? 'کارمند' :
                                 role === 'Salesperson' ? 'فروشنده' : 'متفرقه'}
                              </span>
                            ))
                          ) : (
                            <span className={`text-[9.5px] py-0.5 px-2 rounded-md font-bold ${
                              p.type === 'Customer' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                              p.type === 'Supplier' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              p.type === 'Shareholder' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              p.type === 'Employee' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              p.type === 'Salesperson' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {p.type === 'Customer' ? 'مشتری' :
                               p.type === 'Supplier' ? 'تامین‌کننده' :
                               p.type === 'Shareholder' ? `سهام‌دار (${p.share_percentage || 0}٪)` :
                               p.type === 'Employee' ? 'کارمند' :
                               p.type === 'Salesperson' ? 'فروشنده' : p.type}
                            </span>
                          )}
                        </div>
                        {p.id === 'general_customer' && (
                          <span className="text-[9px] bg-red-50 text-red-500 border border-red-100 py-0.5 px-1.5 rounded">نقدی سریع</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          {p.phone !== '0' ? p.phone : 'تلفن ثبت نشده'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-300" />
                          {works.totalInvoices} فاکتور
                        </span>
                        {p.type === 'Customer' && works.totalSales > 0 && (
                          <span className="text-indigo-600 bg-indigo-50/50 px-1 py-0.2 rounded font-sans">
                            فروش کل: {formatToman(works.totalSales)}
                          </span>
                        )}
                        {p.type === 'Supplier' && works.totalPurchases > 0 && (
                          <span className="text-purple-600 bg-purple-50/50 px-1 py-0.2 rounded font-sans">
                            خرید کل: {formatToman(works.totalPurchases)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* وضعیت تراز و ابزار ویرایش */}
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-2.5 md:pt-0 border-t border-slate-100 md:border-t-0">
                    <div className="text-right flex flex-col items-start md:items-end">
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5">وضعیت حساب:</span>
                      <span className={`text-xs font-black py-1 px-3 rounded-xl border ${
                        p.balance > 0 
                          ? 'bg-amber-50 text-amber-600 border-amber-200/60' 
                          : p.balance < 0 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {p.balance === 0 ? 'تسویه بی‌حساب' : formatToman(p.balance)}
                      </span>
                    </div>

                    {/* دکمه‌های کنترلی حذف و ویرایش */}
                    <div className="flex gap-2.5">
                      <button
                        title="ویرایش حساب شخص"
                        id={`edit-person-shortcut-${p.id}`}
                        onClick={(e) => handleOpenEditModal(p, e)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl bg-slate-50 border border-slate-200/80 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {p.id !== 'general_customer' && (
                        <button
                          title="حذف حساب شخص"
                          id={`delete-person-shortcut-${p.id}`}
                          onClick={(e) => handleDelete(p.id, e)}
                          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl bg-slate-50 border border-slate-200/80 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* بخش چپ: کارت معین تفصیلی، فاکتورها، اقلام و محاسبات سهام‌داری */}
      <div className="w-full lg:w-[40%] bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden" id="person-ledger-details">
        {selectedPerson ? (
          <>
            {/* هدر بالایی تراز کل شخص */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50" id="ledger-header">
              <div>
                <span className={`text-[10px] py-1 px-2 rounded-lg font-bold ${
                  selectedPerson.type === 'Customer' ? 'bg-sky-50 text-sky-700' :
                  selectedPerson.type === 'Supplier' ? 'bg-purple-50 text-purple-700' :
                  selectedPerson.type === 'Shareholder' ? 'bg-emerald-50 text-emerald-700' :
                  selectedPerson.type === 'Employee' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {selectedPerson.type === 'Customer' && 'کارت معین مشتری'}
                  {selectedPerson.type === 'Supplier' && 'تراز حساب تامین‌کننده'}
                  {selectedPerson.type === 'Shareholder' && 'کارت حساب سهام‌دار'}
                  {selectedPerson.type === 'Employee' && 'سوابق مالی پرسنل'}
                  {selectedPerson.type === 'Other' && 'حساب متفرقه'}
                </span>
                <h3 className="font-extrabold text-base text-slate-800 mt-2">{selectedPerson.name}</h3>
                <span className="text-xs text-slate-400 font-mono block mt-1">{selectedPerson.phone !== '0' ? selectedPerson.phone : 'بدون شماره تماس'}</span>
              </div>

              {/* مانده کل تراز ست‌شده */}
              <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${getBalanceStatus(selectedPerson.balance).color}`}>
                <span className="text-[10px] font-bold opacity-80">مانده حساب جاری:</span>
                <span className="text-sm font-black font-mono">
                  {selectedPerson.balance === 0 ? '۰ تومان' : formatToman(selectedPerson.balance)}
                </span>
                <span className="text-[9px] font-semibold opacity-75">
                  {getBalanceStatus(selectedPerson.balance).text}
                </span>
              </div>
            </div>

            {/* نوار جابجایی بین تب‌های معین */}
            <div className="p-3 border-b border-slate-100 flex gap-2" id="ledger-tab-navigator">
              <button
                onClick={() => setLedgerTab('invoices')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  ledgerTab === 'invoices' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 bg-slate-50'
                }`}
              >
                فاکتورها ({personInvoices.length})
              </button>
              
              <button
                onClick={() => setLedgerTab('items')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  ledgerTab === 'items' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 bg-slate-50'
                }`}
              >
                اقلام مبادله شده ({selectedPersonExchangedItems.length})
              </button>

              <button
                onClick={() => setLedgerTab('analytics')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  ledgerTab === 'analytics' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 bg-slate-50'
                }`}
              >
                {selectedPerson.type === 'Shareholder' ? 'محاسبات سهام' : 'خلاصه تراز سود'}
              </button>
            </div>

            {/* تفکیک تب‌ها و فاکتو‌رهای زیرمجموعه */}
            <div className="flex-1 overflow-y-auto p-5" id="ledger-tab-contents-viewport">
              
              {/* ۱. تب فاکتورها */}
              {ledgerTab === 'invoices' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-700 mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    تاریخچه فاکتورها و خریدهای ثبت‌شده
                  </h4>
                  
                  {personInvoices.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-xs text-slate-400">هیچ فاکتوری برای این شخص صادر نشده است.</span>
                    </div>
                  ) : (
                    personInvoices.map(inv => (
                      <div key={inv.id} className="p-3.5 border border-slate-200 shadow-3xs rounded-xl hover:bg-slate-50/50 transition">
                        <div className="flex justify-between items-center mb-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              inv.type === 'Purchase' ? 'bg-purple-400' : 'bg-green-400'
                            }`}></span>
                            <span className="font-bold text-slate-800">فاکتور شماره {inv.invoice_number}</span>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                              {inv.type === 'Sale' ? 'فروش' : inv.type === 'Quick Sale' ? 'فروش پوز سریع' : 'فاکتور خرید'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(inv.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 mt-2 border-t border-slate-100 text-[10.5px] text-slate-500">
                          <div>
                            <span className="block opacity-75">جمع کل قبل تخفیف:</span>
                            <span className="font-bold text-slate-700">{formatToman(inv.total_amount)}</span>
                          </div>
                          <div>
                            <span className="block opacity-75 text-rose-600">تخفیف فاکتور:</span>
                            <span className="font-bold text-rose-500">{formatToman(inv.discount)}</span>
                          </div>
                          <div className="text-left">
                            <span className="block opacity-75">نحوه پرداخت:</span>
                            <span className="font-bold text-slate-800">
                              {inv.payment_method === 'POS' ? 'کارتخوان' : inv.payment_method === 'Cash' ? 'نقدی' : 'ترکیبی'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">وضعیت تصفیه:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              inv.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                              inv.payment_status === 'Unpaid' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {inv.payment_status === 'Paid' ? 'تصفیه کامل' : inv.payment_status === 'Unpaid' ? 'نسیه / پرداخت نشده' : 'علی‌الحساب'}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">جمع نهایی:</span>
                            <span className="font-black text-emerald-600 font-mono text-sm">{formatToman(inv.final_amount)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ۲. تب اقلام مبادله شده */}
              {ledgerTab === 'items' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-700 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    کالاها و خدمات معامله شده
                  </h4>
                  
                  {selectedPersonExchangedItems.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-xs text-slate-400">هیچ قلم کالا یا خدمتی با این شخص مبادله نشده است.</span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white" id="ledger-items-list-table">
                      <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2 text-[10px] font-bold text-slate-500">
                        <span className="col-span-5">شرح کالا / خدمات</span>
                        <span className="col-span-2 text-center">نوع</span>
                        <span className="col-span-2 text-center">تعداد</span>
                        <span className="col-span-3 text-left">مجموع کل</span>
                      </div>
                      
                      {selectedPersonExchangedItems.map(item => (
                        <div key={item.itemId} className="grid grid-cols-12 gap-2 p-2.5 text-xs items-center hover:bg-slate-50/50 transition">
                          <div className="col-span-5 font-bold text-slate-800 truncate" title={item.title}>
                            {item.title}
                          </div>
                          <span className="col-span-2 text-center text-[10px] font-bold">
                            {Array.from(item.invoiceTypes).join(' و ')}
                          </span>
                          <span className="col-span-2 text-center font-bold font-mono text-slate-700 bg-slate-100 rounded-lg py-0.5">
                            {item.totalQty}
                          </span>
                          <span className="col-span-3 text-left font-black font-mono text-slate-800">
                            {formatToman(item.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ۳. عملکرد مالی و اشتراکات سهام غنی */}
              {ledgerTab === 'analytics' && (
                <div className="space-y-4">
                  
                  {selectedPerson.type === 'Shareholder' ? (
                    (() => {
                      const shStats = getShareholderStats(selectedPerson.id, selectedPerson.share_percentage || 0);
                      
                      return (
                        <div className="space-y-4" id="ledger-shareholder-panel">
                          
                          {/* سهم تراز شراکت */}
                          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-xs">
                            <span className="text-[10px] uppercase font-bold text-emerald-100 block">درصد مالکیت از کل دپوی آریا</span>
                            <h5 className="font-extrabold text-2xl mt-1 flex items-baseline gap-1 font-mono">
                              {selectedPerson.share_percentage || 0}
                              <span className="text-sm font-sans font-medium">درصد از سهم کل</span>
                            </h5>
                            <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
                              این درصد ملاک تسهیم سودهای تخصیصی این ماه و دارایی‌های نقدینگی فروشگاه می‌باشد.
                            </p>
                          </div>

                          {/* کارت‌های آماری سود و برداشت شرکا */}
                          <div className="grid grid-cols-2 gap-3" id="shareholder-quick-widgets">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 block">کل سرمایه ثبتی پرداخت‌شده:</span>
                              <span className="font-black text-slate-800 font-mono text-xs block mt-1">{formatToman(shStats.totalCapital)}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 block">کل سود مصوب برداشتی:</span>
                              <span className="font-black text-slate-800 font-mono text-xs block mt-1">{formatToman(shStats.totalWithdrawnProfit)}</span>
                            </div>
                          </div>

                          {/* کارت توزیع سود تئوریک حقیقی */}
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3.5">
                            <h5 className="font-black text-emerald-800 text-xs flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                              سهم سود محاسباتی لایو (بر اساس حاشیه سود فاکتورها)
                            </h5>

                            <div className="flex justify-between items-center text-xs pb-2.5 border-b border-emerald-200/50">
                              <div>
                                <span className="text-slate-500 font-semibold block">سود ناخالص دپو در این ماه:</span>
                                <span className="text-[10px] text-slate-400">فاکتورهای فروش خرداد ۱۴۰۵</span>
                              </div>
                              <span className="font-black text-slate-800 font-mono">{formatToman(shStats.systemProfitThisMonth)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs font-bold text-emerald-800 pb-2.5 border-b border-emerald-200/50">
                              <span>سهم سود این ماه سهام‌دار ({selectedPerson.share_percentage || 0}٪):</span>
                              <span className="font-black font-mono text-sm">{formatToman(shStats.shareOfThisMonthProfit)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-200/50">
                              <span className="text-slate-500 font-semibold">سود کل دوران کارکرد دپو:</span>
                              <span className="font-black text-slate-700 font-mono">{formatToman(shStats.systemProfitAllTime)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                              <span>سهم سود دوره کل سهام‌دار ({selectedPerson.share_percentage || 0}٪):</span>
                              <span className="font-black font-mono text-sm">{formatToman(shStats.shareOfAllTimeProfit)}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200/50 p-3 rounded-xl leading-relaxed flex items-start gap-2">
                            <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              جهت واریز سود، تخصیص وجه جدید یا ثبت برداشت‌های نقدی این سهام‌دار، می‌توانید به 
                              <strong> بخش امور سهام‌داران</strong> در منوی اصلی مراجعه نمایید.
                            </span>
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-3" id="ledger-non-shareholder-analytics">
                      
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                        <h5 className="font-extrabold text-slate-700 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          عملکرد تفکیکی مبادلات
                        </h5>

                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2 mt-1">
                          <span className="font-medium text-slate-500">حجم خرید کالا از وی:</span>
                          <span className="font-bold font-mono text-slate-700">{formatToman(selectedPersonStats?.totalPurchases || 0)}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="font-medium text-slate-500">حجم کل فروش‌های ما به وی:</span>
                          <span className="font-bold font-mono text-indigo-600">{formatToman(selectedPersonStats?.totalSales || 0)}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 font-bold text-slate-800">
                          <span>کل تراکنش‌های ثبت‌شده:</span>
                          <span className="font-mono">{selectedPersonStats?.totalInvoices || 0} فاکتور</span>
                        </div>
                      </div>

                      <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-xs space-y-2">
                        <h5 className="font-bold text-sky-800 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-sky-500" />
                          نحوه ارتباط ترازنامه فروش
                        </h5>
                        <p className="text-sky-700 leading-relaxed font-medium">
                          تمام خریدهای معوق یا فروش‌های نسیه به صورت خودکار مانده تراز این شخص را افزایش یا کاهش می‌دهند تا در هر لحظه مانده نهایی طلب وی منعکس گردد.
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8">
            <Users className="w-12 h-12 text-slate-300 mb-2 mt-4 animate-pulse" />
            <p className="text-xs font-bold text-slate-500">شخص یا حسابی را جهت بررسی و معین تفصیلی انتخاب کنید</p>
          </div>
        )}
      </div>

      {/* ۱. مودال پاپ‌آپ ایجاد و ویرایش تفصیلی شخص جدید */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="person-form-modal">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* هدر بالایی مودال */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                {personId ? 'ویرایش حساب و اطلاعات تکمیلی شخص' : 'ثبت شخص / مشتری / تامین‌کننده جدید'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بدنه فرم مودال */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                <div>
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">شناسه حساب / کد شخص (همتا):</label>
                  <input
                    id="modal-person-custom-id"
                    type="text"
                    required
                    disabled={!!personId && persons.some(p => p.id === personId)}
                    value={personId}
                    onChange={e => setPersonId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold font-mono text-left disabled:opacity-65"
                    placeholder="مثال: PER-1001"
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">نام و نام خانوادگی:</label>
                  <input
                    id="modal-person-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    placeholder="مثال: علیرضا حسینی"
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">شماره همراه تماس:</label>
                  <input
                    id="modal-person-phone"
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="09123456789"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                  <label className="block text-[11px] mb-2.5 font-black text-slate-700">تعیین نقش‌های تجاری و پرسنلی (امکان انتخاب همزمان چند گزینه):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {([
                      { key: 'Customer', label: 'مشتری (خریدار)', desc: 'خریدار کالا و خدمات صنف' },
                      { key: 'Supplier', label: 'تامین‌کننده (پخش)', desc: 'مرجع فاکتور خرید و دپو' },
                      { key: 'Shareholder', label: 'سهام‌دار (شریک)', desc: 'سرمایه‌گذار و شریک مالی' },
                      { key: 'Employee', label: 'کارمند (پرسنل)', desc: 'شاغلین حقوق‌بگیر واحد' },
                      { key: 'Salesperson', label: 'فروشنده (صندوق)', desc: 'اپراتور فروش معین POS' }
                    ] as const).map(role => {
                      const isChecked = selectedRoles.includes(role.key);
                      return (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => toggleRole(role.key)}
                          id={`role-btn-${role.key}`}
                          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 cursor-pointer select-none ${
                            isChecked 
                              ? 'border-emerald-600 bg-emerald-50/35 shadow-2xs' 
                              : 'border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[11px] font-black ${isChecked ? 'text-emerald-700' : 'text-slate-700'}`}>{role.label}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}>
                              {isChecked && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold leading-tight mt-1">{role.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">تراز حساب جاری اولیه (تومان):</label>
                  <input
                    id="modal-person-balance"
                    type="number"
                    value={balance}
                    onChange={e => setBalance(Number(e.target.value))}
                    disabled={!!personId} // تراز اولیه فقط هنگام ثبت مجاز است و بعداً توسط فاکتورها کنترل می‌شود
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono disabled:opacity-60"
                    placeholder="بدهکاری شخص مثبت، طلبکاری ما منفی"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">مقادیر مثبت یعنی شخص بدهکار است (خرید نسیه) و منفی یعنی بستانکار است (بیعانه یا تراز اولیه تامین‌کننده)</span>
                </div>
              </div>

              {/* درصد شراکت مخصوص سهام دار */}
              {selectedRoles.includes('Shareholder') && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center animate-slide-down">
                  <div className="w-full sm:w-[150px]">
                    <label className="block text-[11px] mb-1 font-bold text-emerald-800">درصد شراکت (۰-۱۰۰):</label>
                    <input
                      id="modal-share-percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={sharePercentage || ''}
                      onChange={e => setSharePercentage(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono font-bold text-emerald-700"
                      placeholder="۴۰"
                    />
                  </div>
                  <div className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                    درصد شراکت جهت تقسیم سود و زیان تجاری در پایان دوره مالی محاسبه و مدلسازی می‌شود.
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <h5 className="font-extrabold text-xs text-slate-700 mb-3">مشخصات تکمیلی و کدهای ثبتی</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] mb-1.5 font-bold text-slate-500">کد ملی / شناسه ملی ۱۰ رقمی:</label>
                    <input
                      id="modal-national-code"
                      type="text"
                      value={nationalCode}
                      onChange={e => setNationalCode(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="۰۰۱۲۳۴۵۶۷۸"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1.5 font-bold text-slate-500">کد اقتصادی:</label>
                    <input
                      id="modal-economic-code"
                      type="text"
                      value={economicCode}
                      onChange={e => setEconomicCode(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="کد اقتصادی شرکت"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-[11px] mb-1.5 font-bold text-slate-500">تلفن ثابت دفتر یا محل:</label>
                    <input
                      id="modal-landline"
                      type="text"
                      value={landline}
                      onChange={e => setLandline(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="۰۲۱xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1.5 font-bold text-slate-500">کد پستی ۱۰ رقمی:</label>
                    <input
                      id="modal-postal-code"
                      type="text"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="کد پستی ده رقمی"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">آدرس پست الکترونیک (ایمیل):</label>
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-left font-mono"
                    placeholder="name@email.com"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">آدرس پستی ثبتی یا محل سکونت:</label>
                  <textarea
                    id="modal-address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-sans resize-none"
                    placeholder="استان، شهر، خیابان اصلی، پلاک، واحد..."
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] mb-1.5 font-bold text-slate-500">یادداشت‌ها و توضیحات حساب:</label>
                  <textarea
                    id="modal-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-sans resize-none"
                    placeholder="نکات اعتباری، چک‌های برگشتی، تضامین و..."
                  />
                </div>
              </div>
            </form>

            {/* پابرگ دکمه‌های تایید مودال */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                انصراف و خروج
              </button>
              <button
                type="button"
                id="modal-submit-btn"
                onClick={handleSubmit}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/10 transition"
              >
                {personId ? 'ذخیره اصلاحات شخص' : 'ثبت قطعی شخص'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
