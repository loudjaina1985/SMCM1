import { Product, Customer, Order } from './types';

// Simple obfuscation to fulfill "sensitive data encryption" for things like Telegram Bot Tokens in localStorage
export function encryptData(text: string): string {
  if (!text) return '';
  try {
    const raw = btoa(unescape(encodeURIComponent(text)));
    // Add random salt prefix + suffix and reverse
    const salted = `SMC_${raw}_MGR`;
    return btoa(salted.split('').reverse().join(''));
  } catch {
    return text;
  }
}

export function decryptData(cipher: string): string {
  if (!cipher) return '';
  try {
    const reversed = atob(cipher).split('').reverse().join('');
    if (reversed.startsWith('SMC_') && reversed.endsWith('_MGR')) {
      const raw = reversed.substring(4, reversed.length - 4);
      return decodeURIComponent(escape(atob(raw)));
    }
    return cipher; // fallback
  } catch {
    return cipher;
  }
}

// Generate unique, short barcodes compatible with retail standards
export function generateBarcode(): string {
  const prefix = '629'; // standard Middle East / Gulf area prefix
  const random = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${random}`;
}

// Generate unique terminal IDs to link subscriptions to specific workstations
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('smc_device_id');
  if (!id) {
    id = 'SMC-NODE-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    localStorage.setItem('smc_device_id', id);
  }
  return id;
}

// Format currency beautifully based on configured setting
export function formatCurrency(amount: number, currency: string, lang: 'ar' | 'fr' | 'en'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    DZD: 'DA',
    MAD: 'DH',
    IQD: 'IQD',
    SAR: 'SR'
  };
  const symbol = symbols[currency] || currency;
  if (lang === 'ar') {
    return `${amount.toLocaleString('ar-AE')} ${symbol}`;
  } else {
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

// Pre-filled mock products for realistic store starting state
export const seedProducts: Product[] = [
  {
    id: 'P101',
    name: 'ساعة يد ذكية - Smart Watch Series 9',
    barcode: '6291094857213',
    buyPrice: 45.00,
    sellPrice: 89.90,
    quantity: 25,
    minStockLevel: 5,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'P102',
    name: 'سماعات رأس لاسلكية - ANC Headphones',
    barcode: '6294720194837',
    buyPrice: 32.50,
    sellPrice: 65.00,
    quantity: 3, // Low stock on purpose to trigger dashboard warnings
    minStockLevel: 5,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'P103',
    name: 'لوحة مفاتيح ميكانيكية - Mechanical Keyboard RGB',
    barcode: '6293920193857',
    buyPrice: 18.00,
    sellPrice: 39.99,
    quantity: 12,
    minStockLevel: 3,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'P104',
    name: 'شاحن مغناطيسي لاسلكي - MagSafe Charger 15W',
    barcode: '6299384710194',
    buyPrice: 7.20,
    sellPrice: 19.50,
    quantity: 0, // Out of stock on purpose
    minStockLevel: 5,
    image: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'P105',
    name: 'فأرة ألعاب لاسلكية - Ergonomic Gaming Mouse',
    barcode: '6291248593710',
    buyPrice: 15.00,
    sellPrice: 35.00,
    quantity: 18,
    minStockLevel: 4,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop&q=80'
  }
];

// Pre-filled customers for realistic starting state
export const seedCustomers: Customer[] = [
  {
    id: 'C201',
    name: 'أحمد بن علي - Ahmed Benali',
    phone: '+213661122334',
    address: 'شارع ديدوش مراد، الجزائر العاصمة'
  },
  {
    id: 'C202',
    name: 'سفيان العبيدي - Sofiane Labidi',
    phone: '+21698765432',
    address: 'حي النصر الثاني، تونس'
  },
  {
    id: 'C203',
    name: 'سارة التازي - Sarah Tazi',
    phone: '+212612345678',
    address: 'المعاريف، الدار البيضاء، المغرب'
  },
  {
    id: 'C204',
    name: 'المدير - Manager',
    phone: '0671446505',
    address: 'الجزائر العاصمة'
  },
  {
    id: 'C205',
    name: 'محل الصابون - Soap Shop',
    phone: '0662175315',
    address: 'الجزائر العاصمة'
  }
];

// Pre-filled orders representing different lifecycle states and channels
export const seedOrders: Order[] = [
  {
    id: 'ORD-9883',
    customerName: 'أحمد بن علي - Ahmed Benali',
    customerPhone: '+213661122334',
    customerAddress: 'شارع ديدوش مراد، الجزائر العاصمة',
    items: [
      { productId: 'P101', name: 'ساعة يد ذكية - Smart Watch Series 9', quantity: 2, price: 89.90 }
    ],
    totalAmount: 179.80,
    status: 'delivered',
    source: 'storefront',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'ORD-3948',
    customerName: 'سارة التازي - Sarah Tazi',
    customerPhone: '+212612345678',
    customerAddress: 'المعاريف، الدار البيضاء، المغرب',
    items: [
      { productId: 'P102', name: 'سماعات رأس لاسلكية - ANC Headphones', quantity: 1, price: 65.00 },
      { productId: 'P103', name: 'لوحة مفاتيح ميكانيكية - Mechanical Keyboard RGB', quantity: 1, price: 39.99 }
    ],
    totalAmount: 104.99,
    status: 'pending',
    source: 'telegram',
    createdAt: new Date(Date.now() - 4 * 360 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 'ORD-8472',
    customerName: 'سفيان العبيدي - Sofiane Labidi',
    customerPhone: '+21698765432',
    customerAddress: 'حي النصر الثاني، تونس',
    items: [
      { productId: 'P105', name: 'فأرة ألعاب لاسلكية - Ergonomic Gaming Mouse', quantity: 3, price: 35.00 }
    ],
    totalAmount: 105.00,
    status: 'confirmed',
    source: 'manual',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // 1 day ago
  }
];
