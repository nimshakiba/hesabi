/**
 * CofeClick Licensing & Security System
 * Handles unique machine footprinting, WordPress integration with cofeclick.ir, and state checkups.
 */

// Generate a unique stable device fingerprint for licensing
export function generateMachineCode(): string {
  let existingId = localStorage.getItem('cofeclick_secure_machine_id');
  if (existingId) {
    return existingId;
  }

  // Create a fingerprint hash using browser traits to be highly tamper-resistant
  const userAgent = navigator.userAgent || '';
  const screenSpec = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const language = navigator.language || 'fa';
  const concurrency = navigator.hardwareConcurrency || 4;
  
  // Combine traits to build a mock hardware hash
  let rawHash = 0;
  const combinedStr = `${userAgent}|${screenSpec}|${language}|${concurrency}`;
  for (let i = 0; i < combinedStr.length; i++) {
    const char = combinedStr.charCodeAt(i);
    rawHash = (rawHash << 5) - rawHash + char;
    rawHash |= 0; // Convert to 32bit integer
  }

  const hexHash = Math.abs(rawHash).toString(16).toUpperCase().padStart(8, '0');
  
  // Generate random padding to ensure unique instance safety
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
  const machineCode = `CC-SYS-${hexHash}-${randomPart}`;
  
  localStorage.setItem('cofeclick_secure_machine_id', machineCode);
  return machineCode;
}

export interface LicenseStatusResponse {
  isRegistered: boolean;
  status: 'pending' | 'active' | 'expired' | 'blocked' | 'not_registered';
  expiryDate?: string;
  fullName?: string;
  username?: string;
  licenseKey?: string;
  serverMessage?: string;
}

const WP_API_BASE = 'https://cofeclick.ir/wp-json/cofeclick/v1';

export async function checkLicenseStatus(machineCode: string): Promise<LicenseStatusResponse> {
  // If simulated mock mode is active, return that state
  const mockActive = localStorage.getItem('cofeclick_license_mock_active') === 'true';
  if (mockActive) {
    const mockStatus = localStorage.getItem('cofeclick_license_mock_status') || 'active';
    const mockExpiry = localStorage.getItem('cofeclick_license_mock_expiry') || '2027-06-12 12:00:00';
    return {
      isRegistered: mockStatus !== 'not_registered',
      status: mockStatus as any,
      expiryDate: mockExpiry,
      fullName: 'کاربر آزمایشی شبیه‌ساز',
      username: 'mock_user',
      licenseKey: 'CC-MOCK-LICENSE-KEY',
      serverMessage: 'تایید پاسخ شبیه‌ساز آفلاین به صورت لوکال'
    };
  }

  try {
    const response = await fetch(`${WP_API_BASE}/check-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineCode }),
    });

    if (!response.ok) {
      throw new Error('WordPress API error');
    }

    const data = await response.json();
    if (data.status === 'not_registered') {
      return { isRegistered: false, status: 'not_registered' };
    }

    return {
      isRegistered: true,
      status: data.license_status,
      expiryDate: data.expiry_date,
      fullName: data.fullname,
      username: data.username,
      licenseKey: data.license_key,
    };
  } catch (err) {
    console.warn('Could not contact live cofeclick.ir WordPress server, checking local caching...', err);
    
    // Check if we have cached license details locally
    const cachedLicenseInfo = localStorage.getItem('cofeclick_cached_license');
    if (cachedLicenseInfo) {
      try {
        const cached = JSON.parse(cachedLicenseInfo);
        // Compare with today
        if (cached.expiryDate && new Date(cached.expiryDate) < new Date()) {
          cached.status = 'expired';
        }
        return {
          isRegistered: true,
          ...cached,
          serverMessage: 'بارگذاری امن از حافظه آفلاین کش دستگاه (ارتباط با سایت ناموفق بود)'
        };
      } catch (e) {
        // failed parse
      }
    }

    // Default return or toggle to pending/not_registered
    return {
      isRegistered: false,
      status: 'not_registered',
      serverMessage: 'برای برقراری تست اینترنت قطع است یا پلاگین روی سایت cofeclick.ir نصب نیست. می‌توانید حالت شبیه‌ساز را از دکمه پورتال فعال کنید.'
    };
  }
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  phone: string;
  password?: string;
  machineCode: string;
}

export async function registerAppLicense(payload: RegisterPayload): Promise<LicenseStatusResponse> {
  const mockActive = localStorage.getItem('cofeclick_license_mock_active') === 'true';
  if (mockActive) {
    const mockExpiry = dateAddMonths(new Date(), 1); // 1 month trial
    const mockData = {
      isRegistered: true,
      status: 'active' as const,
      expiryDate: mockExpiry,
      fullName: payload.fullName,
      username: payload.username,
      licenseKey: 'CC-MOCK-' + Math.random().toString(36).substring(3, 10).toUpperCase()
    };
    localStorage.setItem('cofeclick_cached_license', JSON.stringify(mockData));
    localStorage.setItem('cofeclick_license_mock_status', 'active');
    return mockData;
  }

  try {
    const response = await fetch(`${WP_API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 'success' || data.status === 'exists') {
      const licenseData: LicenseStatusResponse = {
        isRegistered: true,
        status: data.license_status,
        expiryDate: data.expiry_date,
        fullName: payload.fullName,
        username: payload.username,
        licenseKey: data.license_key || 'CC-PENDING'
      };
      
      // Cache this locally in key-value store
      localStorage.setItem('cofeclick_cached_license', JSON.stringify(licenseData));
      
      return licenseData;
    } else {
      throw new Error(data.message || 'ثبت نام موفقیت آمیز نبود.');
    }
  } catch (err: any) {
    console.error('WordPress registration failure:', err);
    throw new Error(err.message || 'خطا در برقراری ارتباط با وب‌سایت cofeclick.ir. لطفاً شبکه خود را بازبینی کنید.');
  }
}

function dateAddMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}
