import React, { useState } from 'react';
import { Search, RotateCw, Check, X, ShieldAlert, FileText, Send, AlertCircle, ShoppingBag, Plus, Sparkles, Printer } from 'lucide-react';
import { Order, OrderStatus, AppState, Product, OrderItem, Customer } from '../types';
import { translations } from '../translations';
import { formatCurrency } from '../utils';

interface OrdersProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onSyncTelegram: () => void;
  isSyncing: boolean;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAddManualOrder: (order: Order) => void;
}

export default function Orders({
  state,
  t,
  onSyncTelegram,
  isSyncing,
  onUpdateOrderStatus,
  onAddManualOrder
}: OrdersProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Manual Order Creation State
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerAddress, setManualCustomerAddress] = useState('');
  const [manualItems, setManualItems] = useState<{ productId: string; quantity: number }[]>([]);

  // Tele-parse wizard state
  const [isParsingText, setIsParsingText] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    const cleanText = pastedText.replace(/[*_`]/g, '');
    const nameMatch = cleanText.match(/(?:اسم الزبون|الاسم|اسم|Nom|Name|Client):\s*([^\n]+)/i) || cleanText.match(/(?:اسم|Nom|Name)\s*:\s*([^\n]+)/i);
    const phoneMatch = cleanText.match(/(?:رقم الهاتف|الهاتف|تلفون|هاتف|Tél|Tel|Phone|Mobile):\s*([^\n]+)/i) || cleanText.match(/(?:هاتف|Tél|Tel|Phone)\s*:\s*([^\n]+)/i);
    const addressMatch = cleanText.match(/(?:العنوان|عنوان|الموقع|موقع|Adresse|Address|Location):\s*([^\n]+)/i) || cleanText.match(/(?:عنوان|Adresse|Address)\s*:\s*([^\n]+)/i);

    if (nameMatch) setManualCustomerName(nameMatch[1].trim());
    if (phoneMatch) setManualCustomerPhone(phoneMatch[1].trim());
    if (addressMatch) setManualCustomerAddress(addressMatch[1].trim());

    // Match products and quantities (e.g. "Mechanical Keyboard RGB x2")
    let parsedItems: { productId: string; quantity: number }[] = [];
    const itemLines = cleanText.split('\n');
    itemLines.forEach((line) => {
      const itemMatch = line.match(/^[-*\s\d.]*([^\nx]+?)\s*x\s*(\d+)/i) || 
                        line.match(/^[-*\s\d.]*([^\n]+?)\s*عدد\s*(\d+)/i) ||
                        line.match(/^[-*\s\d.]*([^\n]+?)\s*(\d+)\s*حبات/i);
      if (itemMatch) {
        const prodName = itemMatch[1].trim();
        const qty = Number(itemMatch[2]);
        
        const matchedProd = state.products.find(
          (p) => p.name.toLowerCase().includes(prodName.toLowerCase()) || prodName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchedProd) {
          parsedItems.push({ productId: matchedProd.id, quantity: qty });
        } else if (state.products.length > 0) {
          parsedItems.push({ productId: state.products[0].id, quantity: qty });
        }
      }
    });

    if (parsedItems.length > 0) {
      setManualItems(parsedItems);
    } else if (state.products.length > 0) {
      setManualItems([{ productId: state.products[0].id, quantity: 1 }]);
    }

    setIsParsingText(false);
    setIsCreatingOrder(true); // pre-filled drawer view
    setPastedText('');
  };

  const filteredOrders = state.orders.filter((o) => {
    const term = search.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerPhone.includes(term);

    const matchesTab = activeTab === 'all' || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return t.orderStatusConfirmed;
      case 'delivered':
        return t.orderStatusDelivered;
      case 'cancelled':
        return t.orderStatusCancelled;
      default:
        return t.orderStatusPending;
    }
  };

  const notifyViaWhatsAppCode = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9+]/g, '');
    const itemsSummary = order.items
      .map((item) => `- ${item.name} (عدد ${item.quantity})`)
      .join('\n');

    const msg = `مرحباً ${order.customerName}،
يسعدنا إعلامك بأنه تم تأكيد طلبك رقم: ${order.id} بمتجرنا بنجاح!
تفاصيل المنتجات:
${itemsSummary}
الإجمالي الكلي: ${formatCurrency(order.totalAmount, state.settings.currency, state.settings.primaryLanguage)}
سيقوم المندوب بالشحن والاتصال بك فوراً. شكراً لثقتك بنا!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleAddManualItem = () => {
    if (state.products.length > 0) {
      setManualItems([...manualItems, { productId: state.products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, idx) => idx !== index));
  };

  const handleManualItemChange = (index: number, key: 'productId' | 'quantity', val: any) => {
    setManualItems(
      manualItems.map((item, idx) => {
        if (idx === index) {
          return { ...item, [key]: key === 'quantity' ? Number(val) : val };
        }
        return item;
      })
    );
  };

  const handleCreateManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerName || !manualCustomerPhone || !manualCustomerAddress || manualItems.length === 0) return;

    let itemsForPayload: OrderItem[] = [];
    let calculatedTotal = 0;

    manualItems.forEach((mItem) => {
      const prod = state.products.find((p) => p.id === mItem.productId);
      if (prod) {
        itemsForPayload.push({
          productId: prod.id,
          name: prod.name,
          quantity: mItem.quantity,
          price: prod.sellPrice,
        });
        calculatedTotal += prod.sellPrice * mItem.quantity;
      }
    });

    const newOrder: Order = {
      id: 'ORD-MAN-' + Math.floor(1000 + Math.random() * 9000),
      customerName: manualCustomerName,
      customerPhone: manualCustomerPhone,
      customerAddress: manualCustomerAddress,
      items: itemsForPayload,
      totalAmount: calculatedTotal,
      status: 'pending',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    onAddManualOrder(newOrder);

    // reset states
    setIsCreatingOrder(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualCustomerAddress('');
    setManualItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Printable Invoice Overlay block */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 print:shadow-none print:border-none print:rounded-none flex flex-col my-8 relative animate-scale-up" dir="rtl">
            {/* Action Bar (hidden in Print mode) */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-500">معاينة وطباعة الفاتورة</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.printButton}</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice layout */}
            <div className="p-10 text-right print:p-6" id="invoice-print-area">
              <div className="flex justify-between items-start mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {state.settings.storeName || 'المدير الذكي للتجارة'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">المدير التجاري - فاتورة ضريبة مبيعات رقمية</p>
                </div>
                <div className="text-left font-mono text-[10px] text-slate-400 space-y-0.5">
                  <p>رقم الفاتورة: <span className="text-slate-950 font-bold">{selectedOrderForInvoice.id}</span></p>
                  <p>التاريخ: <span className="text-slate-900">{new Date(selectedOrderForInvoice.createdAt).toLocaleString()}</span></p>
                  <p>المنشأ: {selectedOrderForInvoice.source === 'telegram' ? 'تيليجرام بوت' : 'المتجر الإلكتروني'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-6 mb-8">
                <div>
                  <h3 className="text-xs text-slate-400 mb-1">{t.invoiceTo}</h3>
                  <p className="font-bold text-slate-900">{selectedOrderForInvoice.customerName}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedOrderForInvoice.customerPhone}</p>
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 mb-1">جهة التسليم والشحن</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                    {selectedOrderForInvoice.customerAddress}
                  </p>
                </div>
              </div>

              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-black uppercase">
                    <th className="pb-3 text-right">{t.itemDescription}</th>
                    <th className="pb-3 text-right">{t.unitPrice}</th>
                    <th className="pb-3 text-center">{t.quantity}</th>
                    <th className="pb-3 text-left">{t.subTotal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {selectedOrderForInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-4 font-mono text-slate-500">
                        {formatCurrency(item.price, state.settings.currency, state.settings.primaryLanguage)}
                      </td>
                      <td className="py-4 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-4 text-left font-mono font-black text-slate-900">
                        {formatCurrency(item.price * item.quantity, state.settings.currency, state.settings.primaryLanguage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start pt-6 border-t border-slate-100">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 max-w-xs">
                    تعتبر هذه الفاتورة وثيقة إلكترونية مؤكدة للطلب وصالحة للاستحقاق المحاسبي. نشكركم لاختياركم متجرنا.
                  </p>
                </div>
                <div className="text-left space-y-1">
                  <div className="flex gap-4 justify-between items-center text-slate-500">
                    <span className="text-xs">{t.subTotal}:</span>
                    <span className="font-mono text-sm">
                      {formatCurrency(selectedOrderForInvoice.totalAmount, state.settings.currency, state.settings.primaryLanguage)}
                    </span>
                  </div>
                  <div className="flex gap-4 justify-between items-center text-slate-900 border-t border-dashed pt-2">
                    <span className="text-sm font-bold">{t.total}:</span>
                    <span className="font-mono text-lg font-black text-indigo-600">
                      {formatCurrency(selectedOrderForInvoice.totalAmount, state.settings.currency, state.settings.primaryLanguage)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Drawer Overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-xl flex flex-col max-h-[90vh] animate-scale-up" dir="rtl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">إنشاء طلب بيع يدوي للمتاجر</h2>
              <button
                onClick={() => setIsCreatingOrder(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">{t.customerName} *</label>
                <input
                  type="text"
                  required
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  placeholder="مثال: يوسف جاسم"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">{t.customerPhone} *</label>
                  <input
                    type="tel"
                    required
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    placeholder="مثال: +21366112233"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">عنوان التوصيل *</label>
                  <input
                    type="text"
                    required
                    value={manualCustomerAddress}
                    onChange={(e) => setManualCustomerAddress(e.target.value)}
                    placeholder="عنوان الشحن بالتفصيل"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right"
                  />
                </div>
              </div>

              {/* Items Table inside Form */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-700 pb-1 border-b border-dashed">
                  <span className="text-xs font-bold">بذرة المنتجات للشراء</span>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    + إضافة بند منتج
                  </button>
                </div>

                {manualItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={item.productId}
                      onChange={(e) => handleManualItemChange(idx, 'productId', e.target.value)}
                      className="flex-grow px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ({p.sellPrice})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleManualItemChange(idx, 'quantity', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveManualItem(idx)}
                      className="text-rose-500 text-xs px-2 py-1 hover:bg-rose-50 rounded-lg"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingOrder(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  حفظ الطلب وتأكيده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parsing text wizard overlay */}
      {isParsingText && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-xl flex flex-col max-h-[90vh] animate-scale-up text-right animate-fade-in" dir="rtl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span>مستخرج الطلبيات الذكي السريع ✨</span>
              </h2>
              <button
                onClick={() => setIsParsingText(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                في حال وجود تأخير بالتزامن التلقائي من خوادم تيليجرام، يمكنك نسخ رسالة الطلب التي وصلتك ولصقها هنا مباشرة. سيقوم النظام باستخراج الاسم، رقم الهاتف، العنوان، والمنتجات آلياً وتعبئتها في استمارة تأكيد البيع.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`أدخل نص الرسالة هنا، مثال:\n\n*اسم الزبون:* المدير\n*رقم الهاتف:* 0671446505\n*العنوان:* الجزائر العاصمة\n`}
                rows={8}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                dir="rtl"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsParsingText(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  تحليل وبدء الإنشاء السريع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.orders}</h1>
          <p className="text-slate-400 text-xs">مراجعة وتأكيد طلبات تيليجرام وشحنها مع الفاتورة مباشرة</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsParsingText(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>تحليل كود/نص الطلبية ✨</span>
          </button>
          <button
            onClick={() => setIsCreatingOrder(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل طلب يدوي</span>
          </button>
          <button
            onClick={onSyncTelegram}
            disabled={isSyncing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جاري مزامنة البوت...' : t.syncNow}</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-1">
        {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map((tab) => {
          const count = tab === 'all'
            ? state.orders.length
            : state.orders.filter((o) => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 hover:text-slate-900 text-xs font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span>{tab === 'all' ? 'الكل' : getStatusLabel(tab)}</span>
              <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH AND GRID */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث برقم الطلب، اسم العميل، برقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
            dir="rtl"
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition bg-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {order.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                        order.source === 'telegram'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : order.source === 'storefront'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {order.source === 'telegram'
                          ? t.orderSourceTelegram
                          : order.source === 'storefront'
                          ? t.orderSourceStorefront
                          : t.orderSourceManual}
                      </span>
                    </div>

                    <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Customer details info */}
                  <div className="mb-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-50 space-y-1">
                    <p className="font-bold text-xs text-slate-800">{order.customerName}</p>
                    <p className="font-mono text-[10px] text-slate-400">{order.customerPhone}</p>
                    <p className="text-[10px] text-slate-500 leading-snug truncate">
                      {order.customerAddress}
                    </p>
                  </div>

                  {/* Ordered items details */}
                  <div className="space-y-1.5 mb-4 max-h-24 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600 font-medium">
                        <span className="truncate max-w-[200px]">{item.name}</span>
                        <span className="font-mono text-slate-400">
                          x{item.quantity} ({formatCurrency(item.price * item.quantity, state.settings.currency, state.settings.primaryLanguage)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">المبلغ الإجمالي</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatCurrency(order.totalAmount, state.settings.currency, state.settings.primaryLanguage)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* State Actions triggers */}
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأكيد</span>
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>إلغاء</span>
                        </button>
                      </>
                    )}

                    {order.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تسليم</span>
                        </button>
                        <button
                          onClick={() => notifyViaWhatsAppCode(order)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>تنبيه واتساب</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="p-1.5 text-slate-500 hover:bg-slate-50 border border-slate-100 rounded-xl transition"
                      title={t.generateInvoice}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="md:col-span-2 py-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-xs">لا تتوفر طلبات شحن تناسب تصنيفات التنقيب الحالية</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
