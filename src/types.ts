export interface Product {
  id: string;
  name: string;
  image: string;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minStockLevel: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'telegram' | 'manual' | 'storefront';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  source: OrderSource;
  createdAt: string;
  telegramMsgId?: number;
}

export type AppLanguage = 'ar' | 'fr' | 'en';
export type AppTheme = 'light' | 'dark';

export interface Settings {
  storeName: string;
  primaryLanguage: AppLanguage;
  theme: AppTheme;
  telegramBotToken: string;
  telegramChatId: string;
  currency: string;
}

export type SubscriptionPlan = 'trial' | 'basic' | 'professional' | 'enterprise';

export interface Subscription {
  plan: SubscriptionPlan;
  trialStartDate: string;
  activationKey: string;
  deviceId: string;
  status: 'active' | 'expired';
}

export type UserRole = 'admin' | 'employee';

export interface AppState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  settings: Settings;
  subscription: Subscription;
  role: UserRole;
  isLoggedIn: boolean;
}
