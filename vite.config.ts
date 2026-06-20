import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { createRequire } from 'module';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'sqlite-desktop-http-bridge',
        configureServer(server) {
          // وارد کردن داینامیک دیتابیس فقط در حالت سرور توسعه مجلی برای جلوگیری از خطای بایندینگ ریلیز لینوکس کلود
          const requireLocal = createRequire(import.meta.url);
          let dbService: any = null;
          
          try {
            dbService = requireLocal('./electron/dbService.js');
            dbService.initDatabase();
            console.log('✅ [VITE BACKEND]: هسته تراکنشی SQLite3 با موفقیت روی سرور ویت پورت ۳۰۰۰ متصل و آماده گردید.');
          } catch (e: any) {
            console.warn('⚠️ [VITE BACKEND]: امکان راه‌اندازی ارتباط مستقیم SQLite3 وجود ندارد (سیستم فاقد پکیج کامپایل شده یا در حال بیلد پروداکشن است):', e.message);
          }

          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            
            // ۱. مسیر بازیابی (Load) داده‌ها از SQLite3 واقعی
            if (url.pathname === '/api/db/load') {
              const key = url.searchParams.get('key');
              if (!key) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing key parameter' }));
                return;
              }
              try {
                let data: any = null;
                if (dbService) {
                  const table = dbService.getTableForKey(key);
                  if (table) {
                    const rows = await dbService.readTableRows(table);
                    if (rows && rows.length > 0) {
                      data = rows;
                    }
                  }
                  if (data === null) {
                    data = await dbService.readFallback(key);
                  }
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, key, data }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            // ۲. مسیر همگام‌سازی و ذخیره‌سازی داده جدید با تراکنش‌ها در shop.db
            if (url.pathname === '/api/db/save' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: any) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const { key, data } = payload;
                  if (!key) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing key parameter' }));
                    return;
                  }
                  
                  if (dbService) {
                    const table = dbService.getTableForKey(key);
                    if (table) {
                      await dbService.writeTable(table, data);
                    } else {
                      await dbService.writeFallback(key, data);
                    }
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // ۳. مسیر دریافت موقعیت دیتابیس بومی
            if (url.pathname === '/api/db/get-path') {
              const currentPath = dbService ? dbService.getDbPath() : 'shop.db';
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, dbPath: currentPath }));
              return;
            }

            // ۴. مسیر تغییر و راه‌اندازی دیتابیس جدید
            if (url.pathname === '/api/db/reconnect' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: any) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const { dbPath } = payload;
                  if (!dbPath) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing dbPath argument' }));
                    return;
                  }
                  
                  let finalPath = dbPath;
                  if (dbService) {
                    finalPath = await dbService.reconnectDatabase(dbPath);
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, dbPath: finalPath }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // ۵. اجرای مستقیم دستورات SQL بومی برای ماژول‌ها و مخازن داده نظیر Products
            if (url.pathname === '/api/db/query' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: any) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const { sql, params } = payload;
                  if (!sql) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing sql parameter' }));
                    return;
                  }
                  
                  let result: any = null;
                  if (dbService && dbService.executeQuery) {
                    result = await dbService.executeQuery(sql, params || []);
                  } else {
                    throw new Error('Database service query runner is not available on top-level host of backend');
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, result }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
