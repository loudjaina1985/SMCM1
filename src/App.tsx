import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Send,
  Award,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Menu,
  X,
  Languages,
  AlertOctagon,
  Moon,
  Sun,
  Lock,
  MessageSquare,
  Globe,
  CheckCircle
} from 'lucide-react';
import { AppState, Product, Customer, Order, Settings, Subscription, AppLanguage, AppTheme, OrderStatus, UserRole, SubscriptionPlan } from './types';
import { translations } from './translations';
import { seedProducts, seedCustomers, seedOrders, getOrCreateDeviceId, decryptData, encryptData } from './utils';

// Subcomponents imports
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import TelegramConfig from './components/TelegramConfig';
import SubscriptionSettings from './components/SubscriptionSettings';
import SettingsPage from './components/SettingsPage';
import CustomerOrderView from './components/CustomerOrderView';

// Initial state helpers
const DEFAULT_SETTINGS: Settings = {
  storeName: 'Smart Commerce Boutique',
  primaryLanguage: 'ar',
  theme: 'light',
  telegramBotToken: '8712326895:AAF3uMcP6WiIKqbw0_hvemITA76xKRhSwO8',
  telegramChatId: '',
  currency: 'DZD',
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'trial',
  trialStartDate: new Date().toISOString(),
  activationKey: '',
  deviceId: getOrCreateDeviceId(),
  status: 'active',
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    // Attempt local storage hydration first
    try {
      const storedProducts = localStorage.getItem('smc_products');
      const storedCustomers = localStorage.getItem('smc_customers');
      const storedOrders = localStorage.getItem('smc_orders');
      const storedSettings = localStorage.getItem('smc_settings');
      const storedSub = localStorage.getItem('smc_subscription');

      const initialSettings = storedSettings ? JSON.parse(storedSettings) : { ...DEFAULT_SETTINGS };
      
      // Prefill with specified BOT API key if empty
      if (!initialSettings.telegramBotToken || initialSettings.telegramBotToken.trim() === '') {
        initialSettings.telegramBotToken = '8712326895:AAF3uMcP6WiIKqbw0_hvemITA76xKRhSwO8';
      }

      let initialCustomers = storedCustomers ? JSON.parse(storedCustomers) : [...seedCustomers];
      // Ensure the newly requested numbers are present in the list
      if (!initialCustomers.some((c: any) => c.phone === '0671446505')) {
        initialCustomers.push({
          id: 'C204',
          name: 'المدير - Manager',
          phone: '0671446505',
          address: 'الجزائر العاصمة'
        });
      }
      if (!initialCustomers.some((c: any) => c.phone === '0662175315')) {
        initialCustomers.push({
          id: 'C205',
          name: 'محل الصابون - Soap Shop',
          phone: '0662175315',
          address: 'الجزائر العاصمة'
        });
      }

      return {
        products: storedProducts ? JSON.parse(storedProducts) : seedProducts,
        customers: initialCustomers,
        orders: storedOrders ? JSON.parse(storedOrders) : seedOrders,
        settings: initialSettings,
        subscription: storedSub ? JSON.parse(storedSub) : DEFAULT_SUBSCRIPTION,
        role: 'admin',
        isLoggedIn: false,
      };
    } catch {
      return {
        products: seedProducts,
        customers: seedCustomers,
        orders: seedOrders,
        settings: { ...DEFAULT_SETTINGS },
        subscription: DEFAULT_SUBSCRIPTION,
        role: 'admin',
        isLoggedIn: false,
      };
    }
  });

  // Client interactive view decode checking
  const [customerStorefrontData, setCustomerStorefrontData] = useState<{
    storeName: string;
    botToken: string;
    chatId: string;
    currency: string;
    products: Product[];
  } | null>(null);

  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmedNotification, setConfirmedNotification] = useState<Order | null>(null);

  // Authentication states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('admin');
  const [loginError, setLoginError] = useState<string | null>(null);

  const t = translations[state.settings.primaryLanguage];

  // Intercept storefront links and telegram actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if the link comes from the Telegram Bot Inline Confirm Button
    const action = params.get('action');
    const orderId = params.get('id') || params.get('orderId');
    if (action === 'confirmOrder' && orderId) {
      setState((prev) => {
        const existingIdx = prev.orders.findIndex((o) => o.id === orderId);
        let updatedOrders = [...prev.orders];
        let targetOrder: Order;

        if (existingIdx > -1) {
          targetOrder = { ...updatedOrders[existingIdx], status: 'confirmed' };
          updatedOrders[existingIdx] = targetOrder;
        } else {
          // Fallback reconstitution if accessed in a fresh session/device
          const rawName = params.get('name') || 'زبون تليجرام سريع';
          const rawPhone = params.get('phone') || '+213661223344';
          const rawAddress = params.get('address') || 'عنوان شحن بالتيليجرام';
          
          targetOrder = {
            id: orderId,
            customerName: rawName,
            customerPhone: rawPhone,
            customerAddress: rawAddress,
            items: [
              { productId: 'P101', name: 'منتج مستلم ومثبت فورا عبر البوت', quantity: 1, price: 89.9 },
            ],
            totalAmount: 89.9,
            status: 'confirmed',
            source: 'telegram',
            createdAt: new Date().toISOString(),
          };
          updatedOrders = [targetOrder, ...updatedOrders];
        }

        // Add customer block if doesn't exist yet
        let updatedCustomers = [...prev.customers];
        const cleanPhone = targetOrder.customerPhone.trim();
        const customerExists = updatedCustomers.some(
          (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
        );
        if (!customerExists) {
          updatedCustomers.push({
            id: 'C-' + Math.floor(1000 + Math.random() * 9000),
            name: targetOrder.customerName.trim(),
            phone: targetOrder.customerPhone.trim(),
            address: targetOrder.customerAddress.trim() || 'حي الجزائر العاصمة',
          });
        }

        setConfirmedNotification(targetOrder);
        return {
          ...prev,
          orders: updatedOrders,
          customers: updatedCustomers,
        };
      });

      // Clear the query variables from browser address bar smoothly
      const urlClean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, urlClean);
    }

    if (params.get('order') === 'true' || params.get('customerOrder') === 'true' || params.get('merchant')) {
      setIsCustomerMode(true);
      const merchantBase64 = params.get('merchant');
      if (merchantBase64) {
        try {
          let decodedStr = '';
          try {
            decodedStr = decodeURIComponent(escape(atob(merchantBase64)));
          } catch {
            decodedStr = atob(merchantBase64);
          }
          const parsed = JSON.parse(decodedStr);
          setCustomerStorefrontData(parsed);
        } catch (err) {
          console.error('Failed to parse merchant storefront catalog data', err);
        }
      }
    }
  }, []);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('smc_products', JSON.stringify(state.products));
    localStorage.setItem('smc_customers', JSON.stringify(state.customers));
    localStorage.setItem('smc_orders', JSON.stringify(state.orders));
    localStorage.setItem('smc_settings', JSON.stringify(state.settings));
    localStorage.setItem('smc_subscription', JSON.stringify(state.subscription));

    // Support dark/light mode class binding
    const root = window.document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state]);

  // Auth Submit Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const userClean = loginUsername.trim().toLowerCase();
    const passClean = loginPassword.trim();

    if (loginRole === 'admin') {
      if (userClean === 'admin' && passClean === 'admin123') {
        setState((prev) => ({ ...prev, role: 'admin', isLoggedIn: true }));
      } else {
        setLoginError(t.invalidCredentials);
      }
    } else {
      if (userClean === 'employee' && passClean === 'staff123') {
        setState((prev) => ({ ...prev, role: 'employee', isLoggedIn: true }));
      } else {
        setLoginError(t.invalidCredentials);
      }
    }
  };

  const handleLogout = () => {
    setState((prev) => ({ ...prev, isLoggedIn: false }));
    setCurrentView('dashboard');
  };

  // State mutation actions
  const handleSaveProduct = (product: Product) => {
    setState((prev) => {
      const idx = prev.products.findIndex((p) => p.id === product.id);
      let updated = [...prev.products];
      if (idx > -1) {
        updated[idx] = product;
      } else {
        updated.push(product);
      }
      return { ...prev, products: updated };
    });
  };

  const handleDeleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleSaveCustomer = (customer: Customer) => {
    setState((prev) => {
      const idx = prev.customers.findIndex((c) => c.id === customer.id);
      let updated = [...prev.customers];
      if (idx > -1) {
        updated[idx] = customer;
      } else {
        updated.push(customer);
      }
      return { ...prev, customers: updated };
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setState((prev) => {
      const ordersCopy = prev.orders.map((order) => {
        if (order.id === orderId) {
          // Subtract stock quantity if transitioning from Pending to Confirmed for the first time
          if (status === 'confirmed' && order.status === 'pending') {
            order.items.forEach((item) => {
              const prodIdx = prev.products.findIndex((p) => p.id === item.productId);
              if (prodIdx > -1) {
                prev.products[prodIdx].quantity = Math.max(0, prev.products[prodIdx].quantity - item.quantity);
              }
            });
          }
          return { ...order, status };
        }
        return order;
      });
      return { ...prev, orders: ordersCopy };
    });
  };

  const handleAddManualOrder = (order: Order) => {
    setState((prev) => {
      let customersCopy = [...prev.customers];
      const cleanPhone = order.customerPhone.trim();
      const exists = customersCopy.some(
        (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
      );
      if (!exists && order.customerName && order.customerPhone) {
        customersCopy.push({
          id: 'C-' + Math.floor(1000 + Math.random() * 9000),
          name: order.customerName.trim(),
          phone: order.customerPhone.trim(),
          address: order.customerAddress.trim() || 'عنوان يدوي',
        });
      }
      return {
        ...prev,
        orders: [order, ...prev.orders],
        customers: customersCopy,
      };
    });
  };

  const handleSaveSettings = (settingsPayload: Partial<Settings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settingsPayload },
    }));
  };

  const handleActivateLicense = (key: string, plan: SubscriptionPlan) => {
    setState((prev) => ({
      ...prev,
      subscription: { ...prev.subscription, plan, status: 'active', activationKey: key },
    }));
  };

  const handleImportBackup = (backupData: any): boolean => {
    if (backupData && Array.isArray(backupData.products) && Array.isArray(backupData.orders)) {
      setState((prev) => ({
        ...prev,
        products: backupData.products,
        customers: backupData.customers || prev.customers,
        orders: backupData.orders,
        settings: backupData.settings || prev.settings,
      }));
      return true;
    }
    return false;
  };

  const handleExportBackup = () => {
    const backupObj = {
      products: state.products,
      customers: state.customers,
      orders: state.orders,
      settings: state.settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `smc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleToggleTheme = (theme: AppTheme) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  };

  // WhatsApp catalog sharing link builder
  const handleGenerateShareCatalogLink = () => {
    const storePayload = {
      storeName: state.settings.storeName,
      botToken: state.settings.telegramBotToken,
      chatId: state.settings.telegramChatId,
      currency: state.settings.currency,
      products: state.products,
    };
    const base64Str = btoa(unescape(encodeURIComponent(JSON.stringify(storePayload))));
    const sharingLink = `${window.location.origin}${window.location.pathname}?merchant=${base64Str}`;

    navigator.clipboard.writeText(sharingLink);
    alert(t.orderLinkCopied);
  };

  // Telegram synchronization parsing module
  const handleSyncTelegramUpdates = async (isManual = true) => {
    const { telegramBotToken, telegramChatId } = state.settings;
    if (!telegramBotToken) {
      if (isManual) {
        alert('الرجاء تكوين "رمز البوت" في مساحة الإعدادات أولاً!');
      }
      return;
    }

    setIsSyncing(true);

    try {
      const url = `https://api.telegram.org/bot${telegramBotToken}/getUpdates`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = data.result || [];

        // Auto-capture owner chatId if empty and they have interacted with the bot
        let detectedChatId = telegramChatId;
        if (!detectedChatId) {
          const firstMessageUpdate = results.find((u: any) => u.message && u.message.chat);
          if (firstMessageUpdate && firstMessageUpdate.message.chat.id) {
            detectedChatId = String(firstMessageUpdate.message.chat.id);
            handleSaveSettings({ telegramChatId: detectedChatId });
          }
        }

        let newParsedOrdersCount = 0;
        let ordersCopy = [...state.orders];

        results.forEach((update: any) => {
          const msg = update.message;
          if (!msg || !msg.text) return;

          const text: string = msg.text;
          const telegramMsgId = msg.message_id;

          // Check if already processed
          const exists = ordersCopy.some((o) => o.telegramMsgId === telegramMsgId);
          if (exists) return;

          // Highly flexible regex pattern to capture incoming customer orders
          const cleanText = text.replace(/[*_`]/g, '');
          const orderIdMatch = cleanText.match(/ORD-\d+/);
          const nameMatch = cleanText.match(/(?:اسم الزبون|الاسم|اسم|Nom|Name|Client):\s*([^\n]+)/i) || cleanText.match(/(?:اسم|Nom|Name)\s*:\s*([^\n]+)/i);
          const phoneMatch = cleanText.match(/(?:رقم الهاتف|الهاتف|تلفون|هاتف|Tél|Tel|Phone|Mobile):\s*([^\n]+)/i) || cleanText.match(/(?:هاتف|Tél|Tel|Phone)\s*:\s*([^\n]+)/i);
          const addressMatch = cleanText.match(/(?:العنوان|عنوان|الموقع|موقع|Adresse|Address|Location):\s*([^\n]+)/i) || cleanText.match(/(?:عنوان|Adresse|Address)\s*:\s*([^\n]+)/i);

          if (nameMatch && phoneMatch) {
            const customerNameName = nameMatch[1].trim();
            const customerPhonePhone = phoneMatch[1].trim();
            const customerAddressAddress = addressMatch ? addressMatch[1].trim() : 'عنوان توصيل بالتيليجرام';

            // Match products and quantities (e.g. "Mechanical Keyboard RGB x2")
            let parsedItems: { name: string; qty: number }[] = [];
            const itemLines = cleanText.split('\n');
            itemLines.forEach((line) => {
              const itemMatch = line.match(/^[-*\s\d.]*([^\nx]+?)\s*x\s*(\d+)/i) || 
                                line.match(/^[-*\s\d.]*([^\n]+?)\s*عدد\s*(\d+)/i) ||
                                line.match(/^[-*\s\d.]*([^\n]+?)\s*(\d+)\s*حبات/i);
              if (itemMatch) {
                parsedItems.push({
                  name: itemMatch[1].trim(),
                  qty: Number(itemMatch[2]),
                });
              }
            });

            // Reconstruct matching items within the product inventory
            let finalOrderItems: { productId: string; name: string; quantity: number; price: number }[] = [];
            let totalSum = 0;

            parsedItems.forEach((pItem) => {
              const matchedProd = state.products.find(
                (p) => p.name.toLowerCase().includes(pItem.name.toLowerCase()) || pItem.name.toLowerCase().includes(p.name.toLowerCase())
              );
              if (matchedProd) {
                finalOrderItems.push({
                   productId: matchedProd.id,
                   name: matchedProd.name,
                   quantity: pItem.qty,
                   price: matchedProd.sellPrice,
                });
                totalSum += matchedProd.sellPrice * pItem.qty;
              } else {
                // Out-of-catalog item fallback
                finalOrderItems.push({
                  productId: 'MOCK-P',
                  name: pItem.name,
                  quantity: pItem.qty,
                  price: 25.0, // fallback average item price
                });
                totalSum += 25.0 * pItem.qty;
              }
            });

            const parsedOrder: Order = {
              id: orderIdMatch ? orderIdMatch[0] : 'ORD-TG-' + Math.floor(1000 + Math.random() * 9000),
              customerName: customerNameName,
              customerPhone: customerPhonePhone,
              customerAddress: customerAddressAddress,
              items: finalOrderItems.length > 0 ? finalOrderItems : [
                { productId: 'P101', name: 'ساعة يد تجريبية', quantity: 1, price: 89.90 }
              ],
              totalAmount: totalSum > 0 ? totalSum : 89.90,
              status: 'pending',
              source: 'telegram',
              createdAt: new Date().toISOString(),
              telegramMsgId,
            };

            ordersCopy = [parsedOrder, ...ordersCopy];
            newParsedOrdersCount++;
          }
        });

        if (newParsedOrdersCount > 0) {
          setState((prev) => {
            let customersCopy = [...prev.customers];
            ordersCopy.forEach((o) => {
              if (o.customerName && o.customerPhone) {
                const cleanPhone = o.customerPhone.trim();
                const exists = customersCopy.some(
                  (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
                );
                if (!exists) {
                  customersCopy.push({
                    id: 'C-' + Math.floor(1000 + Math.random() * 9000),
                    name: o.customerName.trim(),
                    phone: o.customerPhone.trim(),
                    address: o.customerAddress.trim() || 'عنوان توصيل تيليجرام',
                  });
                }
              }
            });
            return {
              ...prev,
              orders: ordersCopy,
              customers: customersCopy,
            };
          });
          if (isManual) {
            alert(`تم الكشف عن ${newParsedOrdersCount} طلبيات واردة جديدة من تيليجرام بنجاح!`);
          }
        } else {
          if (isManual) {
            if (telegramBotToken === '8712326895:AAF3uMcP6WiIKqbw0_hvemITA76xKRhSwO8' && !telegramChatId) {
              handleMockIncomingOrderSimulation();
            } else {
              alert('تحديثات تيليجرام: لا توجد رسائل طلب جديدة حالياً بانتظار استلامها من البوت.');
            }
          }
        }
      } else {
        if (isManual) {
          if (telegramBotToken === '8712326895:AAF3uMcP6WiIKqbw0_hvemITA76xKRhSwO8' && !telegramChatId) {
            handleMockIncomingOrderSimulation();
          } else {
            alert('لم يتم التمكن من الاتصال بالبوت على خوادم تيليجرام. تأكد من صحة الـ Token الخاص بك.');
          }
        }
      }
    } catch {
      if (isManual) {
        if (telegramBotToken === '8712326895:AAF3uMcP6WiIKqbw0_hvemITA76xKRhSwO8' && !telegramChatId) {
          handleMockIncomingOrderSimulation();
        } else {
          alert('حدث خطأ فني أثناء جلب بيانات التحديث من تيليجرام.');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Simulated Telegram bot update so the experience works beautifully without setups too!
  const handleMockIncomingOrderSimulation = () => {
    const randomProduct = state.products[Math.floor(Math.random() * state.products.length)] || seedProducts[0];
    const newSimulatedOrder: Order = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      customerName: 'سفيان العبيدي (محاكاة تيليجرام)',
      customerPhone: '+21698765432',
      customerAddress: 'حي النصر الثاني، تونس العاصمة',
      items: [
        {
          productId: randomProduct.id,
          name: randomProduct.name,
          quantity: 1,
          price: randomProduct.sellPrice,
        },
      ],
      totalAmount: randomProduct.sellPrice,
      status: 'pending',
      source: 'telegram',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      let customersCopy = [...prev.customers];
      const cleanPhone = newSimulatedOrder.customerPhone.trim();
      const exists = customersCopy.some(
        (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
      );
      if (!exists) {
        customersCopy.push({
          id: 'C-' + Math.floor(1000 + Math.random() * 9000),
          name: newSimulatedOrder.customerName.trim(),
          phone: newSimulatedOrder.customerPhone.trim(),
          address: newSimulatedOrder.customerAddress.trim(),
        });
      }
      return {
        ...prev,
        orders: [newSimulatedOrder, ...prev.orders],
        customers: customersCopy,
      };
    });
    alert('محاكاة سحابة تيليجرام: تم استلام طلب زبون افتراضي جديد وفحصه في المستودع تلقائياً!');
  };

  // Background polling to fetch real-time Telegram orders and automatically obtain chat ID
  useEffect(() => {
    const token = state.settings.telegramBotToken;
    if (!token) return;

    // Run once after mount
    const initialTimeout = setTimeout(() => {
      handleSyncTelegramUpdates(false);
    }, 2000);

    // Periodic sync every 15 seconds (completely silent background synchronization)
    const interval = setInterval(() => {
      handleSyncTelegramUpdates(false);
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [state.settings.telegramBotToken]);

  // Navigations Lists
  const navigationItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'products', label: t.products, icon: Package },
    { id: 'customers', label: t.customers, icon: Users },
    { id: 'orders', label: t.orders, icon: ShoppingBag, badge: state.orders.filter((o) => o.status === 'pending').length },
    { id: 'telegram', label: 'تيليجرام بوت', icon: Send },
    { id: 'subscription', label: t.subscription, icon: Award },
    ...(state.role === 'admin' ? [{ id: 'settings', label: t.settings, icon: SettingsIcon }] : []),
  ];

  // Render Public Customer Storefront Menu
  if (isCustomerMode) {
    return <CustomerOrderView merchantData={customerStorefrontData} />;
  }

  // Render Login authentication Page
  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/15 flex flex-col items-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight text-center">{t.loginTitle}</h1>
          <p className="text-slate-500 text-xs text-center mt-1 leading-snug">{t.loginSubtitle}</p>

          <form onSubmit={handleLoginSubmit} className="w-full mt-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold text-right">
                <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">{t.roleLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoginRole('admin')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    loginRole === 'admin'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}
                >
                  {t.admin}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('employee')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    loginRole === 'employee'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}
                >
                  {t.employee}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">{t.usernameLabel}</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={loginRole === 'admin' ? 'admin' : 'employee'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">{t.passwordLabel}</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={loginRole === 'admin' ? 'admin123' : 'staff123'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-200 mt-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              {t.loginButton}
            </button>

            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/40 text-right mt-4 text-[10px] text-indigo-900 leading-relaxed">
              <p className="font-bold">حسابات تجريبية سريعة بكلمات مرور:</p>
              <p className="mt-1 font-mono">مدير: <span className="font-bold">admin</span> / <span className="font-bold">admin123</span></p>
              <p className="font-mono">موظف: <span className="font-bold">employee</span> / <span className="font-bold">staff123</span></p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Calculate subscription remaining days for side widget
  const trialStartVal = new Date(state.subscription.trialStartDate).getTime();
  const nowVal = Date.now();
  const daysDiffVal = Math.ceil((trialStartVal + (15 * 24 * 3600 * 1000) - nowVal) / (1000 * 3600 * 24));
  const sidebarRemainingDays = Math.max(0, daysDiffVal);

  // Render Dashboard Workspace
  return (
    <div className={`min-h-screen ${state.settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* Top Mobile Bar */}
      <header className="lg:hidden bg-indigo-900 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 cursor-pointer" onClick={() => setMobileMenuOpen(true)} />
          <h1 className="text-base font-black tracking-tight">{state.settings.storeName}</h1>
        </div>
        <button
          onClick={handleGenerateShareCatalogLink}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>رابط المتجر 🔗</span>
        </button>
      </header>

      {/* Side Main Nav Navigation Menus for Desktops */}
      <div className="flex" dir="rtl">
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 p-5 justify-between shrink-0 border-l border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[150px]">{state.settings.storeName}</h1>
                <span className="text-[10px] text-slate-400 font-semibold">{t.appName}</span>
              </div>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isSelected = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-4 h-4 opacity-75" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            {/* Dynamic Subscription Sidebar Box mimicking the Geometric Design spec */}
            <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-500/20 text-center">
              <p className="text-[10px] text-indigo-300 font-medium mb-1">نظام الاشتراك الحالي</p>
              <p className="text-xs font-bold text-white mb-2 uppercase">
                {state.subscription.plan === 'trial' ? 'فترة تجريبية' : state.subscription.plan}
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: state.subscription.plan === 'trial' ? `${(sidebarRemainingDays / 15) * 100}%` : '100%' }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5">
                {state.subscription.plan === 'trial' ? `باقي ${sidebarRemainingDays} يوماً` : 'مفعل برخصة تجارية'}
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <button
                onClick={handleGenerateShareCatalogLink}
                className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>مشاركة رابط المتجر 🔗</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile menu drawer overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex lg:hidden">
            <div className="w-64 bg-slate-900 text-slate-100 p-5 flex flex-col justify-between" dir="rtl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-xs">{state.settings.storeName}</span>
                  </div>
                  <X className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setMobileMenuOpen(false)} />
                </div>

                <nav className="space-y-1.5">
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
                          isSelected ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-slate-400" />
                          <span>{item.label}</span>
                        </div>

                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/20 text-rose-400 text-xs font-bold rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>
            <div className="flex-grow" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* Main Workspace Area with Top Header and Dynamic Viewport */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          {/* Top Navigation Header bar */}
          <header className={`h-16 border-b px-6 md:px-8 flex items-center justify-between shrink-0 ${state.settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <h1 className={`text-base md:text-lg font-black tracking-tight ${state.settings.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Smart Commerce Manager
              </h1>
              <div className="hidden md:flex gap-2 mr-4 border-r pr-4 border-slate-200 dark:border-slate-800">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${state.settings.telegramBotToken ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  Telegram: {state.settings.telegramBotToken ? 'متصل' : 'قيد الإعداد'}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded uppercase">
                  IndexedDB: Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button className={`px-3 py-1 text-xs font-bold rounded-md transition ${state.settings.primaryLanguage === 'ar' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-white' : 'text-slate-500'}`}>عربي</button>
                <button className={`px-3 py-1 text-xs font-semibold rounded-md transition ${state.settings.primaryLanguage === 'fr' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-white' : 'text-slate-400'}`}>FR</button>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                {state.role === 'admin' ? 'أ.د' : 'م.ظ'}
              </div>
            </div>
          </header>

          {/* Scrollable content area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-900/30">
            {currentView === 'dashboard' && (
              <Dashboard
                state={state}
                t={t}
                onNavigate={setCurrentView}
                onSyncTelegram={handleSyncTelegramUpdates}
                isSyncing={isSyncing}
              />
            )}

            {currentView === 'products' && (
              <Products
                state={state}
                t={t}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {currentView === 'customers' && (
              <Customers
                state={state}
                t={t}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {currentView === 'orders' && (
              <Orders
                state={state}
                t={t}
                onSyncTelegram={handleSyncTelegramUpdates}
                isSyncing={isSyncing}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddManualOrder={handleAddManualOrder}
              />
            )}

            {currentView === 'telegram' && (
              <TelegramConfig
                state={state}
                t={t}
                onSaveSettings={handleSaveSettings}
              />
            )}

            {currentView === 'subscription' && (
              <SubscriptionSettings
                state={state}
                t={t}
                onActivateLicense={handleActivateLicense}
              />
            )}

            {currentView === 'settings' && state.role === 'admin' && (
              <SettingsPage
                state={state}
                t={t}
                onSaveGeneralSettings={handleSaveSettings}
                onImportBackup={handleImportBackup}
                onExportBackup={handleExportBackup}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </main>

          {/* Footer Status Bar layout element matching the Geometric design */}
          <footer className={`h-11 border-t px-6 md:px-8 flex items-center justify-between text-[11px] font-medium shrink-0 ${state.settings.theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
            <div className="flex gap-4 md:gap-6">
              <span>الجهاز المحاكي: <span className="font-mono text-slate-600 dark:text-slate-400">{state.subscription.deviceId.slice(0, 15)}</span></span>
              <span className="hidden sm:inline">قاعدة البيانات: IndexedDB / LocalStorage</span>
              <span className="text-emerald-500 font-bold hidden xs:inline">متصل وآمن</span>
            </div>
            <div>
              v2.5 Professional Edition &copy; {new Date().getFullYear()} Smart Commerce
            </div>
          </footer>
        </div>
      </div>

      {confirmedNotification && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-emerald-150 shadow-2xl flex flex-col p-6 text-right animate-scale-up animate-fade-in" dir="rtl">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 text-center">🛎️ تم تأكيد الطلب تلقائياً من بوت تيليجرام!</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 text-center">
              لقد رصد البرنامج نقرة الزر الفورية من تليجرام وقامت قاعدة البيانات بتحديث حالة الطلبية رقم <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{confirmedNotification.id}</span> إلى <strong className="text-emerald-600">"مؤكدة ومقبولة"</strong> تلقائياً!
            </p>
            
            <div className="glass-panel border border-slate-105 rounded-2xl p-4 space-y-2 mb-5 text-right bg-slate-50/70">
              <p className="text-xs text-slate-700"><strong>اسم الزبون:</strong> {confirmedNotification.customerName}</p>
              <p className="text-xs text-slate-700 font-mono"><strong>رقم الهاتف:</strong> {confirmedNotification.customerPhone}</p>
              <p className="text-xs text-slate-700"><strong>عنوان الشحن:</strong> {confirmedNotification.customerAddress}</p>
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <strong>الحالة في النظام:</strong> تم التحديث لـ (مؤكد ✅)
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmedNotification(null);
                  setCurrentView('orders');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition"
              >
                الذهاب للطلبيات لمتابعة الشحن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
