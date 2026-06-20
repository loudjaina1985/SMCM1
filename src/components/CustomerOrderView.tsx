import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, Send, CheckCircle, Smartphone } from 'lucide-react';
import { Product, OrderItem } from '../types';
import { formatCurrency } from '../utils';

interface CustomerOrderViewProps {
  merchantData: {
    storeName: string;
    botToken: string;
    chatId: string;
    currency: string;
    products: Product[];
  } | null;
}

export default function CustomerOrderView({ merchantData }: CustomerOrderViewProps) {
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Load query params on mount to automatically prefill with customer data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get('name');
    const urlPhone = params.get('phone');
    const urlAddress = params.get('address');
    if (urlName) {
      setName(urlName);
      setHasPrefilled(true);
    }
    if (urlPhone) setPhone(urlPhone);
    if (urlAddress) setAddress(urlAddress);
  }, []);

  // If there's no custom merchantData decoded from URL, fallback to prefilled defaults for demo purposes
  const storeName = merchantData?.storeName || 'Smart Commerce Boutique';
  const products = merchantData?.products || [
    {
      id: 'P101',
      name: 'ساعة يد ذكية - Smart Watch Series 9',
      barcode: '6291094857213',
      buyPrice: 45.00,
      sellPrice: 89.90,
      quantity: 15,
      minStockLevel: 2,
      image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'P102',
      name: 'سماعات رأس لاسلكية - ANC Headphones',
      barcode: '6294720194837',
      buyPrice: 32.50,
      sellPrice: 65.00,
      quantity: 12,
      minStockLevel: 2,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'P103',
      name: 'لوحة مفاتيح ميكانيكية - Mechanical Keyboard RGB',
      barcode: '6293920193857',
      buyPrice: 18.00,
      sellPrice: 39.99,
      quantity: 8,
      minStockLevel: 1,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80'
    }
  ];
  const currency = merchantData?.currency || 'USD';
  const botToken = merchantData?.botToken;
  const chatId = merchantData?.chatId;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.qty + delta;
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.sellPrice * item.qty, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !name || !phone || !address) return;

    setIsSubmitting(true);
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    // Format the items text for the Telegram / WhatsApp payload
    const itemsText = cart
      .map((item) => `- ${item.product.name} x${item.qty} (${formatCurrency(item.product.sellPrice * item.qty, currency, 'en')})`)
      .join('\n');

    const messagePayload = `🛒 *طلب جديد من متجر ${storeName}*
------------------------------
*اسم الزبون:* ${name}
*رقم الهاتف:* ${phone}
*العنوان:* ${address}
------------------------------
*المنتجات المتميزة:*
${itemsText}
------------------------------
*إجمالي السعر:* ${formatCurrency(totalCartAmount, currency, 'en')}
*رمز مرجع الطلب:* ${orderId}`;

    let telegramSent = false;

    // Send to Telegram Bot if configured
    if (botToken && chatId) {
      try {
        const confirmUrl = `${window.location.origin}${window.location.pathname}?action=confirmOrder&id=${orderId}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}`;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messagePayload,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ تأكيد واستلام الطلبية في السيستم فوراً',
                    url: confirmUrl
                  }
                ]
              ]
            }
          }),
        });
        if (res.ok) {
          telegramSent = true;
        }
      } catch (err) {
        console.error('Error dispatching to Telegram bot API', err);
      }
    }

    // Prepare WhatsApp message redirect
    const waPhone = phone.replace(/[^0-9+]/g, '');
    const encodedMsg = encodeURIComponent(messagePayload);
    const whatsappUrl = `https://wa.me/?text=${encodedMsg}`;

    setIsSubmitting(false);
    setOrderSuccess(orderId);
    setCart([]);

    // Trigger WhatsApp forwarding
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 1500);
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">تم إرسال الطلب بنجاح!</h1>
          <p className="text-slate-500 mb-6 text-sm">
            تم تسجيل طلبك برقم <span className="font-mono font-bold text-indigo-600">{orderSuccess}</span>.
            سيتم إعادة توجيهك الآن إلى واتساب لتأكيد الشحن مع التاجر.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl mb-6 text-right">
            <p className="text-xs text-slate-400 mb-1">بيانات التسليم المسجلة:</p>
            <p className="font-medium text-slate-800 text-sm">{name}</p>
            <p className="text-xs text-slate-500">{phone}</p>
            <p className="text-xs text-slate-500">{address}</p>
          </div>
          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl transition duration-200"
          >
            العودة للمتجر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{storeName}</h1>
              <p className="text-xs text-slate-400">طلب مباشر آمن وسريع</p>
            </div>
          </div>
          <div className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
            <Smartphone className="w-4 h-4" />
            <span>طلب عبر واتساب وتيليجرام</span>
          </div>
        </div>
      </header>

      {hasPrefilled && name && (
        <div className="bg-emerald-50 border-b border-emerald-150 py-3 px-4 text-center text-xs text-emerald-800 font-semibold animate-pulse flex items-center justify-center gap-2" dir="rtl">
          <span>✨ مرحباً بك يا <strong className="text-indigo-700 underline">{name}</strong>! لقد تم ملؤ بيانات الاسم، الهاتف، والعنوان تلقائياً. اختر سلعتك واضغط إرسال فوراً!</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products Catalog Grid */}
        <div className="lg:col-span-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4">كتالوج المنتجات المتاحة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition"
              >
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center text-white font-bold p-2 text-center text-sm">
                      نفذت الكمية المؤقتة
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-800 mb-1 leading-snug">{product.name}</h3>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">السعر المميز</p>
                      <p className="text-lg font-black text-indigo-600">
                        {formatCurrency(product.sellPrice, currency, 'ar')}
                      </p>
                    </div>
                    {product.quantity > 0 && (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition"
                      >
                        إضافة للسلة +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping Cart & Checkout details */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>سلة التسوق الخاصة بك</span>
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center">
                {cart.reduce((s, c) => s + c.qty, 0)}
              </span>
            </h2>

            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-sm mb-4">انقر فوق "إضافة للسلة" لتلوين سلتك بالمنتجات!</p>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-56 overflow-y-auto mb-6 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                        {formatCurrency(item.product.sellPrice, currency, 'ar')}
                      </p>
                    </div>
                    <div className="flex items-center border border-slate-100 rounded-lg">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="p-1 hover:bg-slate-50 text-slate-400"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-2 text-slate-700">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="p-1 hover:bg-slate-50 text-slate-400"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t border-slate-100 pt-4 mb-5 flex items-center justify-between">
                  <span className="font-bold text-slate-600 text-sm">إجمالي المبلغ المطلوب:</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(totalCartAmount, currency, 'ar')}
                  </span>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 mb-2 border-b border-dashed pb-1">
                    معلومات التوصيل (مطلوب)
                  </h3>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">الاسم الكامل للزبون</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="مثال: محمد سعيد"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">رقم الهاتف (واتساب)</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="مثال: +213661223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">العنوان بالتفصيل لشحن المنتج</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="مثال: الشارع الرئيسي، العمارة رقم 36، شقة 4"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-600/10"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'جاري الإرسال للتأكيد...' : 'إرسال الطلب والمتابعة وواتساب'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
