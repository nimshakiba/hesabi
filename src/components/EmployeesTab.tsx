import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person } from '../types';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Plus, 
  Trash2, 
  PenSquare, 
  CheckCircle,
  AlertCircle,
  Calendar,
  X,
  Building,
  GraduationCap,
  History,
  Coins,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';

interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "خرداد ۱۴۰۵"
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  notes: string;
  paymentMethod: 'Cash' | 'Card' | 'BankTransfer'; // نقدی، کارتخوان، حواله شبا
}

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<Person[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);

  // Sub Tab Navigation
  const [activeSubView, setActiveSubView] = useState<'roster' | 'payments_history'>('roster');

  // Employee Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Person | null>(null);
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empNationalCode, setEmpNationalCode] = useState('');
  const [empNotes, setEmpNotes] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  
  // Custom Extended Employee metadata
  const [empDepartment, setEmpDepartment] = useState<'Sales' | 'Finance' | 'Storage' | 'Delivery' | 'Admin'>('Sales');
  const [empRole, setEmpRole] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empStatus, setEmpStatus] = useState<'Active' | 'OnLeave' | 'Terminated'>('Active');
  const [empDateHired, setEmpDateHired] = useState(new Date().toISOString().split('T')[0]);

  // Salary payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState('خرداد ۱۴۰۵');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Card' | 'BankTransfer'>('BankTransfer');
  const [payNotes, setPayNotes] = useState('');

  // Roster Filter / Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<'All' | 'Sales' | 'Finance' | 'Storage' | 'Delivery' | 'Admin'>('All');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allPersons = OfflineDatabase.getPersons();
    const empList = allPersons.filter(p => p.type === 'Employee');

    // Seed default team members if empty to make it highly finished right out of the box!
    if (empList.length === 0) {
      const e1 = OfflineDatabase.savePerson({
        name: 'امین کریمیان (مسئول ارشد انبارکالا)',
        phone: '09127778899',
        type: 'Employee',
        balance: 0,
        national_code: '0015556677',
        address: 'شهرک غرب خیابان ایثار',
        notes: 'انباردار نمونه، ماهر در فرآیندهای لجستیک و انبارگردانی فیزیکی آریا. استخدام رسمی.'
      });

      const e2 = OfflineDatabase.savePerson({
        name: 'زینب ناطقی (صندوق‌دار شیفت صبح)',
        phone: '09123334455',
        type: 'Employee',
        balance: 0,
        national_code: '0259998811',
        address: 'صادقیه، مجتمع پردیس',
        notes: 'صندوق‌دار و مسئول حسابرسی کارت خوان‌های بستر سیستم POS.'
      });

      const seeded = [e1, e2];
      setEmployees(seeded);
      
      // Save initial metadata
      const defaultMetadata = {
        [e1.id]: { department: 'Storage', role: 'مدیر لجستیک دپو', salary: 14500000, status: 'Active', hireDate: '2026-01-10' },
        [e2.id]: { department: 'Sales', role: 'صندوق‌دار مجرب شیفت صبح', salary: 11200000, status: 'Active', hireDate: '2026-03-01' }
      };
      localStorage.setItem('shop_accounting_employee_metadata', JSON.stringify(defaultMetadata));

      // Seeds initial payment records
      seedInitPayments([e1, e2]);
    } else {
      setEmployees(empList);
      loadPaymentsHistory();
    }
  };

  const seedInitPayments = (emps: Person[]) => {
    const initPay: SalaryPayment[] = [
      {
        id: 'pay_seed_1',
        employeeId: emps[0].id,
        employeeName: emps[0].name,
        month: 'اردیبهشت ۱۴۰۵',
        amount: 14500000,
        paymentDate: '2026-05-30',
        paymentMethod: 'BankTransfer',
        notes: 'پرداخت حقوق کامل ماهانه اردیبهشت‌ماه به شماره شبای امین کریمیان کلاسه ۶۰۵'
      },
      {
        id: 'pay_seed_2',
        employeeId: emps[1].id,
        employeeName: emps[1].name,
        month: 'اردیبهشت ۱۴۰۵',
        amount: 11200000,
        paymentDate: '2026-05-30',
        paymentMethod: 'BankTransfer',
        notes: 'حواله حقوق و مزایای صندوق‌دار زینب ناطقی بدون کسر تاخیر'
      }
    ];
    localStorage.setItem('shop_accounting_employee_payouts', JSON.stringify(initPay));
    setPayments(initPay);
  };

  const loadPaymentsHistory = () => {
    const rawPay = localStorage.getItem('shop_accounting_employee_payouts');
    if (rawPay) {
      setPayments(JSON.parse(rawPay));
    } else {
      setPayments([]);
    }
  };

  // Helper inside loop to fetch meta
  const getEmployeeMeta = (id: string) => {
    const raw = localStorage.getItem('shop_accounting_employee_metadata');
    const meta = raw ? JSON.parse(raw) : {};
    return meta[id] || {
      department: 'Sales',
      role: 'کارمند عادی',
      salary: 9500000,
      status: 'Active',
      hireDate: '2026-04-12'
    };
  };

  const saveEmployeeMeta = (id: string, data: any) => {
    const raw = localStorage.getItem('shop_accounting_employee_metadata');
    const meta = raw ? JSON.parse(raw) : {};
    meta[id] = data;
    localStorage.setItem('shop_accounting_employee_metadata', JSON.stringify(meta));
  };

  // Submit Handler for Employee Creation/Edition
  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;

    const baseSalary = Number(empSalary);
    if (isNaN(baseSalary) || baseSalary < 0) {
      alert('مبلغ حقوق معتبر نمی‌باشد.');
      return;
    }

    // Save Person object in main DB
    const savedPerson = OfflineDatabase.savePerson({
      id: editingEmployee?.id || undefined,
      name: empName,
      phone: empPhone || '0',
      type: 'Employee',
      balance: editingEmployee?.balance || 0,
      national_code: empNationalCode,
      notes: empNotes,
      address: empAddress
    });

    // Save custom employee fields in metadata bucket
    saveEmployeeMeta(savedPerson.id, {
      department: empDepartment,
      role: empRole || 'سمت پیش‌فرض',
      salary: baseSalary,
      status: empStatus,
      hireDate: empDateHired
    });

    // Reset Form
    setEditingEmployee(null);
    setEmpName('');
    setEmpPhone('');
    setEmpNationalCode('');
    setEmpNotes('');
    setEmpAddress('');
    setEmpRole('');
    setEmpSalary('');
    setEmpStatus('Active');
    setShowFormModal(false);
    refreshData();
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  };

  // Start Editing Employee
  const startEditEmployee = (emp: Person) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpPhone(emp.phone);
    setEmpNationalCode(emp.national_code || '');
    setEmpNotes(emp.notes || '');
    setEmpAddress(emp.address || '');

    const meta = getEmployeeMeta(emp.id);
    setEmpDepartment(meta.department);
    setEmpRole(meta.role);
    setEmpSalary(meta.salary.toString());
    setEmpStatus(meta.status);
    setEmpDateHired(meta.hireDate);
    
    setShowFormModal(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('آیا از حذف این ردیف پرسنلی اطمینان دارید؟ تمامی متمم‌های پرداخت حقوق همراه آن منقضی خواهند شد.')) {
      OfflineDatabase.deletePerson(id);
      
      // Clean metadata
      const raw = localStorage.getItem('shop_accounting_employee_metadata');
      if (raw) {
        const meta = JSON.parse(raw);
        delete meta[id];
        localStorage.setItem('shop_accounting_employee_metadata', JSON.stringify(meta));
      }

      // Clean payments of this employee
      const cleanedPayments = payments.filter(p => p.employeeId !== id);
      localStorage.setItem('shop_accounting_employee_payouts', JSON.stringify(cleanedPayments));
      setPayments(cleanedPayments);

      refreshData();
      window.dispatchEvent(new Event('cofeclick_settings_updated'));
    }
  };

  // Submit salary payout
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId || !payAmount) {
      alert('لطفاً مبلغ حقوق و کارمند را مشخص کنید.');
      return;
    }

    const payVal = Number(payAmount);
    if (payVal <= 0 || isNaN(payVal)) {
      alert('مبلغ حقوق معتبر نیست.');
      return;
    }

    const matchedEmp = employees.find(emp => emp.id === payEmpId);
    if (!matchedEmp) return;

    const newPayment: SalaryPayment = {
      id: 'pay_tx_' + Date.now(),
      employeeId: payEmpId,
      employeeName: matchedEmp.name,
      month: payMonth,
      amount: payVal,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      notes: payNotes || 'مساعده/تسویه حساب روتین دوره'
    };

    const updatedPayments = [newPayment, ...payments];
    localStorage.setItem('shop_accounting_employee_payouts', JSON.stringify(updatedPayments));
    setPayments(updatedPayments);

    // salary payout is recorded.
    setShowPaymentModal(false);
    setPayNotes('');
    setPayAmount('');
    refreshData();
  };

  // Delete payment record
  const handleDeletePayment = (paymentId: string) => {
    if (confirm('آیا از حذف دائمی این فیش حقوقی ثبت‌شده مطمئن هستید؟')) {
      const updated = payments.filter(p => p.id !== paymentId);
      localStorage.setItem('shop_accounting_employee_payouts', JSON.stringify(updated));
      setPayments(updated);
      refreshData();
    }
  };

  const getFarsiDept = (dept: string) => {
    const list: any = {
      Sales: 'صندوق و فروش',
      Finance: 'امور مالی و حسابداری',
      Storage: 'لجستیک و انبارداری',
      Delivery: 'حمل‌و‌نقل و پیک',
      Admin: 'اداری و پشتیبانی عمومی'
    };
    return list[dept] || dept;
  };

  // Filter roster
  const filteredRoster = employees.filter(emp => {
    const matchesSearch = emp.name.includes(searchQuery) || emp.phone.includes(searchQuery);
    if (!matchesSearch) return false;

    const meta = getEmployeeMeta(emp.id);
    if (filterDept !== 'All' && meta.department !== filterDept) return false;

    return true;
  });

  const activeEmployeesCount = employees.filter(e => getEmployeeMeta(e.id).status === 'Active').length;
  const totalRosterSalarySum = employees
    .filter(e => getEmployeeMeta(e.id).status === 'Active')
    .reduce((sum, e) => sum + getEmployeeMeta(e.id).salary, 0);

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 select-none bg-slate-50" id="employees-view-pane">
      
      {/* هدر صفحه */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="emp-header">
        <div className="space-y-1.5 text-right">
          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1 font-mono">
            <Briefcase className="w-3.5 h-3.5" /> Human Capital System
          </span>
          <h2 className="text-lg font-black text-slate-800">سامانه پرسنلی و مدیریت کارمندان فروشگاهی آریا</h2>
          <p className="text-xs text-slate-500 font-sans font-medium">
            سازماندهی دستمزدها، تفکیک دپارتمانی پرسنل صنف، صدور فیش‌های تسویه حقوق و ثبت سوابق مساعده
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-stretch md:self-auto">
          <button
            onClick={() => {
              setEditingEmployee(null);
              setEmpName('');
              setEmpPhone('');
              setEmpNationalCode('');
              setEmpNotes('');
              setEmpAddress('');
              setEmpRole('');
              setEmpSalary('');
              setEmpStatus('Active');
              setEmpDateHired(new Date().toISOString().split('T')[0]);
              setShowFormModal(true);
            }}
            className="flex-1 md:flex-initial py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            افزودن نام کارمند جدید
          </button>
          
          <button
            onClick={() => {
              if (employees.length === 0) {
                alert('لطفاً ابتدا پرسنل ثبت نمایید.');
                return;
              }
              setPayEmpId(employees[0].id);
              setShowPaymentModal(true);
            }}
            className="flex-1 md:flex-initial py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            صدور فیش و پرداخت حقوق
          </button>
        </div>
      </div>

      {/* ناوبری داخلی تب */}
      <div className="flex border-b border-slate-205 pb-0.5 gap-2" id="emp-sections-navigation">
        <button
          onClick={() => setActiveSubView('roster')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubView === 'roster' 
              ? 'border-emerald-500 text-emerald-600 bg-white shadow-3xs' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            لیست پرسنل و کارگزینی فعال ({filteredRoster.length} نفر)
          </div>
        </button>
        <button
          onClick={() => setActiveSubView('payments_history')}
          className={`px-5 py-2.5 font-extrabold text-xs transition border-b-2 rounded-t-lg ${
            activeSubView === 'payments_history' 
              ? 'border-emerald-500 text-emerald-600 bg-white shadow-3xs' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            آرشیو فیش‌های حقوقی و واریزی‌ها ({payments.length} فیش)
          </div>
        </button>
      </div>

      {/* ۱. زبانه اول: کارگزینی و بررسی تخصیص نقش‌ها */}
      {activeSubView === 'roster' && (
        <div className="space-y-6" id="emp-subview-roster">
          
          {/* کارت‌های تجمیعی کارگزینی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="emp-aggregate-cards-row">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">کارمندان فعال حاضر به کار:</span>
                <strong className="text-base font-black text-emerald-600 block font-sans">
                  {activeEmployeesCount} کادر تخصصی فعال
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">کل همکاران در بخش‌های عملیاتی انبار و صندوق</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">حقوق ماهانه مستمر کل فعالین:</span>
                <strong className="text-base font-black text-indigo-650 block font-mono">
                  {totalRosterSalarySum.toLocaleString('fa-IR')} تومان
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">برآورد بودجه جاری بر پایه ارشدیت</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-50 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-3xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">میانگین واریزی‌های آرشیو شده:</span>
                <strong className="text-base font-black text-amber-500 block font-mono">
                  {(payments.length > 0 ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length) : 0).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} تومان
                </strong>
                <span className="text-[9px] text-slate-450 block font-normal">بر مبنای واریز حواله‌جات پوز یا شبا</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                <History className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ابزارهای فیلترینگ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="emp-search-layout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* کادر سرچ متنی */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">جستجوی کارمندان بر اساس نام یا تلفن:</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="نام کارمند، سمت یا تلفن وی..."
                    className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* تفکیک دپارتمان */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">دپارتمان و حوزه سازمانی:</label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 font-bold"
                >
                  <option value="All">نمایش تمام بخش‌ها</option>
                  <option value="Sales">صندوق و فروش</option>
                  <option value="Finance">امور مالی و حسابداری</option>
                  <option value="Storage">لجستیک و انبارداری</option>
                  <option value="Delivery">حمل‌و‌نقل و پیک</option>
                  <option value="Admin">اداری و پشتیبانی عمومی</option>
                </select>
              </div>
            </div>
          </div>

          {/* کادر بزرگ گرید کارمندان */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="emp-roster-cards-wrapper">
            {filteredRoster.map(emp => {
              const meta = getEmployeeMeta(emp.id);
              const payTotal = payments.filter(p => p.employeeId === emp.id).reduce((sum, p) => sum + p.amount, 0);

              return (
                <div
                  key={emp.id}
                  className="border border-slate-200 rounded-2xl p-5 bg-white hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Status Indicator inside Roster Card */}
                  <span className={`absolute left-4 top-4 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    meta.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                      : meta.status === 'OnLeave' 
                        ? 'bg-amber-50 text-amber-700 border-amber-250' 
                        : 'bg-rose-50 text-rose-700 border-rose-250'
                  }`}>
                    {meta.status === 'Active' ? 'شاغل فعال 🟢' : meta.status === 'OnLeave' ? 'مرخصی معلق 🟡' : 'قطع همکاری 🔴'}
                  </span>

                  {/* بدنه اطلاعات */}
                  <div className="space-y-1 shadow-3xs pt-1">
                    <span className="text-[10px] font-bold text-emerald-600 block">{getFarsiDept(meta.department)}</span>
                    <h3 className="font-extrabold text-sm text-slate-800">{emp.name}</h3>
                    <p className="text-[10px] text-slate-400 font-sans font-medium">سمت سازمانی: <strong>{meta.role || 'کارمند ساده'}</strong></p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-slate-100 flex flex-col gap-2 text-[10.5px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>حقوق پایه ماهیانه ثبتی:</span>
                      <strong className="text-slate-800 font-mono text-xs">{meta.salary.toLocaleString('fa-IR')} تومان</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>کد ملی پرسنلی:</span>
                      <strong className="text-slate-800 font-mono text-xs">{emp.national_code || '---'}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>مجموع دریافتی تایید شده:</span>
                      <strong className="text-teal-650 font-mono text-xs">{payTotal.toLocaleString('fa-IR')} تومان</strong>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2 rounded-xl text-[9.5px] text-slate-500 font-sans leading-relaxed">
                    <strong>تلفن تماس:</strong> {emp.phone || 'فاقد موبایل'}
                    <div className="mt-0.5"><strong>توضیحات اداری:</strong> {emp.notes || '---'}</div>
                  </div>

                  {/* اقدامات */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px]">
                    <button
                      onClick={() => startEditEmployee(emp)}
                      className="px-3 py-1.5 border border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 rounded-lg cursor-pointer bg-white flex items-center gap-1 font-bold shadow-3xs"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                      اصلاح و ویرایش پرونده
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-1.5 border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer bg-white shadow-3xs"
                      title="حذف پرسنل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ۲. زبانه دوم: آرشیو جامع فیش‌های حقوقی معلق پرداخت شده */}
      {activeSubView === 'payments_history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="payments-vault">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-xs text-slate-800">لیست کل واریزهای حقوق و مساعده‌های ثبتی</h3>
          </div>

          <div className="overflow-x-auto text-[11px]" id="emp-payments-tbl">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 h-9">
                  <th className="p-2 w-12 text-center">ردیف</th>
                  <th className="p-2">نام همکار</th>
                  <th className="p-2 text-center">بابت ماه کارکرد</th>
                  <th className="p-2 text-left">مبلغ خالص (تومان)</th>
                  <th className="p-2 text-center">متد پرداخت حقوق</th>
                  <th className="p-2 text-center">تاریخ تراکنش مالی</th>
                  <th className="p-2">توضیحات و مستندات پرداخت</th>
                  <th className="p-2 text-center w-12">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 h-9">
                    <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-extrabold text-slate-700">{p.employeeName}</td>
                    <td className="p-2 text-center font-bold text-slate-600">{p.month}</td>
                    <td className="p-2 text-left font-mono font-bold text-teal-650">
                      {p.amount.toLocaleString('fa-IR')} T
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {p.paymentMethod === 'BankTransfer' ? 'حواله پایا/شبا بانک' : p.paymentMethod === 'Card' ? 'کارت به کارت' : 'نقدی صندوق'}
                      </span>
                    </td>
                    <td className="p-2 text-center font-mono text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="p-2 text-slate-400 italic text-[10px]">{p.notes}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        ابطال فیش
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-sans italic border-dashed">
                      هنوز هیچ سند تسویه حقوق یا فیش مساعده‌ای صادر نگردیده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال اول: ویرایش یا ثبت کارمند */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in" id="emp-roster-form-overlay">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative space-y-4 text-right" id="emp-form-box">
            
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              {editingEmployee ? 'ویرایش پرونده کارگزینی پرسنل متمم' : 'افزودن نام پرسنل و استخدام جدید'}
            </h3>

            <form onSubmit={handleSaveEmployeeSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    placeholder="مثلا علیرضا رضایی..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">موبایل تماس:</label>
                  <input
                    type="text"
                    required
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">کد ملی کارمند:</label>
                  <input
                    type="text"
                    value={empNationalCode}
                    onChange={e => setEmpNationalCode(e.target.value)}
                    placeholder="کد ملی ده‌رقمی..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 font-sans">بخش سازمانی (دپارتمان):</label>
                  <select
                    value={empDepartment}
                    onChange={e => setEmpDepartment(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  >
                    <option value="Sales">صندوق و فروش (صندوقدار)</option>
                    <option value="Finance">امور مالی و ممیزی حسابداری</option>
                    <option value="Storage">لجستیک و انبارداری (انباردار)</option>
                    <option value="Delivery">حمل‌و‌نقل بومی و پیک موتوری</option>
                    <option value="Admin">اداری، پشتیبانی و نظافت</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 font-sans">سمت دقیق تخصصی:</label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    placeholder="مثلا صندوقدار شیفت عصر یا کارپرداز..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">حقوق پایه ماهیانه (تومان):</label>
                  <input
                    type="number"
                    required
                    value={empSalary}
                    onChange={e => setEmpSalary(e.target.value)}
                    placeholder="مثلا ۱۰,۰۰۰,۰۰۰ تومان..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">تاریخ استخدام رسمی:</label>
                  <input
                    type="date"
                    required
                    value={empDateHired}
                    onChange={e => setEmpDateHired(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">وضعیت کنونی پرسنل:</label>
                  <select
                    value={empStatus}
                    onChange={e => setEmpStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  >
                    <option value="Active">شاغل فعال ممتد 🟢</option>
                    <option value="OnLeave">مرخصی بلندمدت استعلاجی 🟡</option>
                    <option value="Terminated">قطع همکاری / اتمام قرارداد 🔴</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">نشانی سکونت:</label>
                <input
                  type="text"
                  value={empAddress}
                  onChange={e => setEmpAddress(e.target.value)}
                  placeholder="آدرس دقیق و شماره پلاک..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">توضیحات اداری متمم:</label>
                <textarea
                  value={empNotes}
                  onChange={e => setEmpNotes(e.target.value)}
                  placeholder="مشخصات بانکی، تاربخچه مساعده‌گیری، تضامین سپرده..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  ذخیره پرونده در کارتابل 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="py-2.5 px-4 bg-slate-150 text-slate-600 text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال دوم: ثبت فیش حقوقی */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in" id="pay-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative space-y-4 text-right" id="pay-modal">
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-emerald-500" />
              صدور سند تسویه حقوق و کارکرد پرسنل
            </h3>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">انتخاب همکار مستحق دریافت:</label>
                <select
                  value={payEmpId}
                  onChange={e => {
                    setPayEmpId(e.target.value);
                    const matched = employees.find(emp => emp.id === e.target.value);
                    if (matched) {
                      setPayAmount(getEmployeeMeta(matched.id).salary.toString());
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">ماه کارکرد پرداخت حقوق:</label>
                  <input
                    type="text"
                    required
                    value={payMonth}
                    onChange={e => setPayMonth(e.target.value)}
                    placeholder="مثلا خرداد ۱۴۰۵..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">طریقه واریز مادی:</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  >
                    <option value="BankTransfer">انتقال شبا پایا 🏦</option>
                    <option value="Card">کارت به کارت شتاب 💳</option>
                    <option value="Cash">نقدی از صندوق مرکزی 💵</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">مبلغ واریزی نهائی (تومان):</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="حقوق دریافتی خالص..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono text-left"
                  />
                  <span className="absolute left-3 top-3 text-[10px] text-slate-400 font-sans font-bold">تومان</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">توضیحات و اسناد حواله:</label>
                <textarea
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="شماره پیگیری بانک، تعداد روزهای غیبت یا مساعده‌ها..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  ثبت قطعی حواله مالی حقوق 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
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
