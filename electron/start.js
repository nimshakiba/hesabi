/**
 * start.js - اسکریپت اجرای همزمان و یکپارچه سرور توسعه Vite و محیط دسکتاپ الکترون
 * این فایل از ایجاد باگ‌های تخصیص حافظه در هنگام کامپایل تولیدی جلوگیری می‌کند 
 * و برنامه را مستقیماً از روی سورس‌کد لایو لود می‌کند.
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('🚀 در حال راه‌اندازی شبیه‌ساز دسکتاپ ویندوز برای نرم‌افزار حسابداری آریا...');

// ۱. اجرای سرور توسعه Vite روی پورت ۳۰۰۰
const viteProcess = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (err) => {
  console.error('❌ خطا در راه‌اندازی سرور توسعه Vite:', err);
});

// تابع هوشمند برای بررسی سلامت و در دسترس بودن پورت سرور توسعه
function checkViteServerReady(url, callback) {
  const req = http.get(url, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.end();
}

// گوش‌به‌زنگ شدن و پایش مداوم پورت ۳۰۰۰ جهت لود کامل و بدون خطای سفید
console.log('⏳ در حال پایش وضعیت سرور محلی ویت روی پورت ۳۰۰۰...');
const interval = setInterval(() => {
  checkViteServerReady('http://localhost:3000', (ready) => {
    if (ready) {
      clearInterval(interval);
      console.log('\n========================================================================');
      console.log('💻 سرور لود گردید!');
      console.log('👉 آدرس برنامه در مرورگر: http://localhost:3000');
      console.log('💡 مژده: به دلیل اتصال مستقیم جدید، حتی اگر به دلیل لود نشدن کدهای الکترون خطایی مواجه شوید،');
      console.log('   می‌توانید برنامه را مستقیماً در مرورگر (گوگل کروم یا ادج) باز کنید.');
      console.log('   تمام اطلاعات، کالاها، تراکنش‌ها و فاکتورها به صورت واقعی و آفلاین مستقیم درون فایل فیزیکی "shop.db"');
      console.log('   در لایه پشت صحنه ذخیره و ماندگار می‌شوند!');
      console.log('========================================================================\n');
      console.log('🚀 در حال تلاش برای باز کردن پنجره دسکتاپ الکترون...');
      
      const electronProcess = spawn('npx', ['electron', '.'], {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          ELECTRON_DEV_SERVER: 'true' // سیگنال به هسته الکترون جهت لود آدرس محلی
        }
      });

      electronProcess.on('error', (err) => {
        console.error('❌ خطا در لود فریم تفنگدار الکترون دسکتاپ:', err);
      });

      // هر زمان پنل الکترون بسته شد، پروسه وب سرور پشتیبان را نیز متوقف کن
      electronProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log('\n========================================================================');
          console.log('🚨 خطای سیستمی: پروسه الکترون با کد خطای ' + code + ' متوقف گردید.');
          console.log('💡 این خطا در اکثر مواقع به دلیل نیمه‌کاره ماندن فرآیند دانلود فریم‌ورک Electron در رایانه شماست.');
          console.log('🛠️ برای حل سریع و آسان این مورد، دستورات زیر را به ترتیب در ترمینال خود اجرا کنید:\n');
          console.log('   ۱. حذف پوشه‌ی خراب‌شده الکترون:');
          console.log('      rmdir /s /q node_modules\\electron');
          console.log('\n   ۲. دانلود و نصب مجدد با پاکسازی کامل کش:');
          console.log('      npm install electron --save-dev -f');
          console.log('\n   ۳. در صورت برطرف نشدن، اجرای اسکریپت نصب به صورت دستی:');
          console.log('      node node_modules\\electron\\install.js');
          console.log('\n   سپس مجدداً دستور اجرای برنامه یعنی "npm start" را تکرار کنید.');
          console.log('========================================================================\n');
        } else {
          console.log(`👋 پنجره دسکتاپ بسته شد. در حال خاموش کردن منابع سرور...`);
        }
        viteProcess.kill();
        process.exit(code || 0);
      });
    }
  });
}, 500);

// در صورت قطع ناگهانی اسکریپت، وب‌سرور متوقف شود
process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit();
});
