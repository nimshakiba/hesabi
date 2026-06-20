export interface AppSettings {
  theme: 'light' | 'slate' | 'amber' | 'emerald';
  productCardBg: string; // very thin light green, yellow, blue etc.
  serviceCardBg: string; // very thin purple, slate etc.
  defaultPaymentMethod: 'Cash' | 'POS' | 'Mixed';
  
  // Print Settings
  paperSize: 'A4' | 'A5' | 'thermal';
  showSignature: boolean;
  showEconomicCode: boolean;
  defaultTaxPct: number;
  blackAndWhiteInvoice?: boolean;
  
  // Store info
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEconomicCode: string;
  storeNationalId: string;
  storePostalCode: string;
  storeLogo?: string; // Base64 encoded logo image
  defaultPrinter: string;
  dbPath: string;
  currency: 'Rial' | 'Toman';

  // Prefix & Sequential Number Settings
  productPrefix: string;
  productNextNumber: number;
  servicePrefix: string;
  serviceNextNumber: number;
  personPrefix: string;
  personNextNumber: number;
  invoicePrefix: string;
  invoiceNextNumber: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'slate',
  productCardBg: '#edfcf2', // very thin soft light emerald
  serviceCardBg: '#faf5ff', // very thin soft light purple
  defaultPaymentMethod: 'POS',
  
  paperSize: 'A4',
  showSignature: true,
  showEconomicCode: true,
  defaultTaxPct: 10,
  blackAndWhiteInvoice: false,
  
  storeName: 'حسابداری فروشگاهی آریا',
  storeAddress: 'تهران، خیابان ولیعصر، تقاطع مطهری، پلاک ۱۲',
  storePhone: '02188889900',
  storeEconomicCode: '411122233344',
  storeNationalId: '10101234567',
  storePostalCode: '1432198765',
  storeLogo: '',
  defaultPrinter: '',
  dbPath: 'shop.db',
  currency: 'Toman',

  productPrefix: 'PRO-',
  productNextNumber: 1001,
  servicePrefix: 'SRV-',
  serviceNextNumber: 1001,
  personPrefix: 'PER-',
  personNextNumber: 1001,
  invoicePrefix: 'INV-',
  invoiceNextNumber: 1001,
};

export class SettingsService {
  private static KEY = 'cofeclick_app_settings_v1';

  static get(): AppSettings {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static save(settings: AppSettings): void {
    localStorage.setItem(this.KEY, JSON.stringify(settings));
    
    // dispatch a custom event to notify components that styling/settings have been updated
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  }
}

export function formatPrice(val: number): string {
  const settings = SettingsService.get();
  const label = settings.currency === 'Rial' ? 'ریال' : 'تومان';
  return val.toLocaleString('fa-IR') + ' ' + label;
}
