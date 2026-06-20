import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle, PhoneCall, MessageSquare, Sparkles, Share2, Copy, Check, Send } from 'lucide-react';
import { Customer, AppState } from '../types';
import { translations } from '../translations';

interface CustomersProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onSaveCustomer: (c: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function Customers({ state, t, onSaveCustomer, onDeleteCustomer }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Broadcast Wizard States
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customPromoMessage, setCustomPromoMessage] = useState('مرحباً زبوننا العزيز! يسعدنا إعلامك بوصول تشكيلة جديدة ومميزة من السلع في متجرنا. تفضل بالاطلاع والطلب مباشرة عبر رابطك الشخصي السريع بنقرة واحدة (بيانات الشحن الخاصة بك تم تعبئتها مسبقاً للتسهيل عليك!):');
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);

  const getPersonalizedLink = (customerName: string, customerPhone: string, customerAddress: string) => {
    try {
      const storePayload = {
        storeName: state.settings.storeName,
        botToken: state.settings.telegramBotToken,
        chatId: state.settings.telegramChatId,
        currency: state.settings.currency,
        products: state.products,
      };
      const base64Str = btoa(unescape(encodeURIComponent(JSON.stringify(storePayload))));
      const baseUrl = `${window.location.origin}${window.location.pathname}?merchant=${base64Str}`;
      return `${baseUrl}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}&address=${encodeURIComponent(customerAddress)}`;
    } catch (e) {
      return window.location.href;
    }
  };

  const handleCopyPersonalizedLink = (c: Customer) => {
    const link = getPersonalizedLink(c.name, c.phone, c.address);
    navigator.clipboard.writeText(link);
    setCopiedCustomerId(c.id);
    setTimeout(() => {
      setCopiedCustomerId(null);
    }, 2000);
  };

  const filteredCustomers = state.customers.filter((c) => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.phone.includes(term);
  });

  const getCustomerOrdersCount = (phone: string) => {
    return state.orders.filter((o) => o.customerPhone === phone).length;
  };

  const handleStartAdd = () => {
    setEditingCustomer({
      id: '',
      name: '',
      phone: '',
      address: '',
    });
    setValidationError(null);
  };

  const handleStartEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const { name, phone, address } = editingCustomer;

    if (!name || !phone || !address) {
      setValidationError('يرجى كتابة كافة البيانات لضمان تواصل صحيح');
      return;
    }

    const payload: Customer = {
      id: editingCustomer.id || 'C-' + Math.floor(1000 + Math.random() * 9000),
      name: name!,
      phone: phone!,
      address: address!,
    };

    onSaveCustomer(payload);
    setEditingCustomer(null);
  };

  const launchWhatsAppChat = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const greetingMsg = encodeURIComponent(
      `مرحباً ${name}، يسعدنا تواصلك مع متجرنا ${state.settings.storeName || 'الذكي للتجارة'}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${greetingMsg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir="rtl">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t.customers}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">إدارة ملفات العملاء المسجلين لمتابعة عمليات الشحن وإرسال الفواتير</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>بث عرض / سلعة جديدة 📢</span>
          </button>
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCustomer}</span>
          </button>
        </div>
      </div>

      {/* List content container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchCustomers}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-right"
            dir="rtl"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-right">{t.customerName}</th>
                <th className="px-4 py-3 text-right">{t.customerPhone}</th>
                <th className="px-4 py-3 text-right">عنوان التوصيل</th>
                <th className="px-4 py-3 text-center">{t.customerOrdersCount}</th>
                <th className="px-4 py-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredCustomers.map((c) => {
                const ordersCount = getCustomerOrdersCount(c.phone);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {c.address}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono bg-indigo-55 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded">
                        {ordersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopyPersonalizedLink(c)}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                          title="نسخ رابط الطلب المخصص السريع للعميل"
                        >
                          {copiedCustomerId === c.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => launchWhatsAppChat(c.phone, c.name)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                          title="مراسلة عبر واتساب"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(c)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    لم يتم العثور على أي عميل يوافق تعبير البحث المدخل.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Customer Dialog Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-xl flex flex-col animate-scale-up" dir="rtl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingCustomer.id ? t.editCustomer : t.addCustomer}
              </h2>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">{t.customerName} *</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="مثال: عمر الخطيب"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">{t.customerPhone} *</label>
                <input
                  type="tel"
                  required
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="مثال: +21366112233"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-left"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 text-right block">يرجى كتابة رمز الدولة للتشغيل الآلي (مثال: +213...)</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">عنوان التوصيل لمرسلات الشحن *</label>
                <textarea
                  required
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  placeholder="الشارع، البناية، المدينة، الدولة بالتفصيل"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-500 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast New Product / Offer Dialog Modal */}
      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-slate-100 shadow-xl flex flex-col p-6 text-right animate-scale-up animate-fade-in" dir="rtl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">تأكيد حذف العميل 🚨</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في حذف العميل <strong className="text-slate-800">{customerToDelete.name}</strong>؟ سيؤدي هذا للتأثير على تتبع شحن الطلبيات المرتبطة به.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(customerToDelete.id);
                  setCustomerToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-md shadow-rose-600/10"
              >
                نعم، تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden border border-slate-100 shadow-xl flex flex-col max-h-[90vh] animate-scale-up text-right animate-fade-in" dir="rtl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span>منصة بث وإعداد العروض للزبائن 📢✨</span>
              </h2>
              <button
                onClick={() => setIsBroadcastOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                يسهل عليك هذا المعالج إرسال رسالة ترويجية ذكية لزبائنك بهدف دفع المبيعات. بمجرد اختيار سلعة، نقوم بصنع **رابط مخصص لكل زبون** بحيث عندما يضغط عليه، يجد اسمه وهاتفه وعنوانه مُعبئين في استمارة تأكيد البيع تلقائياً دون الحاجة لكتابتهم!
              </p>

              {/* Step 1: Select Product */}
              <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-700">1. ربط البث بمتجرك أو سلعة جديدة (اختياري):</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    setSelectedProductId(prodId);
                    if (prodId === '') {
                      setCustomPromoMessage('مرحباً زبوننا العزيز! يسعدنا إعلامك بوصول تشكيلة جديدة ومميزة من السلع في متجرنا. تفضل بالاطلاع والطلب مباشرة عبر رابطك الشخصي السريع بنقرة واحدة (بيانات الشحن الخاصة بك تم تعبئتها مسبقاً للتسهيل عليك!):');
                    } else {
                      const prod = state.products.find(p => p.id === prodId);
                      if (prod) {
                        setCustomPromoMessage(`مرحباً زبوننا العزيز! يسعدنا إعلامك بوصول المنتج الجديد الحصري: "${prod.name}" بسعر رائع وقدره ${prod.sellPrice} ${state.settings.currency}! تفضل بطلبها مباشرة بنقرة واحدة من خلال رابطك السريع المخصص أدناه دون الحاجة لإعادة كتابة عنوانك أو هاتفك للتوصيل السريع:`);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- بث عام للمتجر بأكمله --</option>
                  {state.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sellPrice} {state.settings.currency})</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Edit Custom Promo Message */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">2. تخصيص نص الرسالة التسويقية:</label>
                <textarea
                  value={customPromoMessage}
                  onChange={(e) => setCustomPromoMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  placeholder="اكتب الترحيب والعرض هنا..."
                />
              </div>

              {/* Step 3: Customers links generator */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">3. حدد العميل لإرسال العرض المخصص والذكي له:</label>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                  {state.customers.map(c => {
                    const clientLink = getPersonalizedLink(c.name, c.phone, c.address);
                    const fullMessageWithUrl = `${customPromoMessage}\n\n👉 الرابط المخصص للشراء السريع:\n${clientLink}`;
                    
                    const handleShareMsg = () => {
                      const waPhone = c.phone.replace(/[^0-9+]/g, '');
                      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(fullMessageWithUrl)}`, '_blank');
                    };

                    const handleCopyFullMsg = () => {
                      navigator.clipboard.writeText(fullMessageWithUrl);
                      setCopiedCustomerId(c.id);
                      setTimeout(() => setCopiedCustomerId(null), 2000);
                    };

                    return (
                      <div key={c.id} className="p-3 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyFullMsg}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer text-[10px]"
                          >
                            {copiedCustomerId === c.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تم نسخ الرسالة بالرابط!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ الرسالة بالرابط المخصص 🔗</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleShareMsg}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer text-[10px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>إرسال واتساب مباشرة 💬</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {state.customers.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      الرجاء تسجيل عميل واحد على الأقل في القائمة أولاً لتتمكن من تشكيل الروابط التسويقية المخصصة لهم.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setIsBroadcastOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                إنهاء / إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
