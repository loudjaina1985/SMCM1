import React from 'react';
import { Package, ShoppingBag, DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import { AppLanguage, AppState } from '../types';
import { translations } from '../translations';
import { formatCurrency } from '../utils';

interface DashboardProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onNavigate: (view: string) => void;
  onSyncTelegram: () => void;
  isSyncing: boolean;
}

export default function Dashboard({ state, t, onNavigate, onSyncTelegram, isSyncing }: DashboardProps) {
  const { products, orders, settings } = state;

  // Calculate stats
  const totalProductsCount = products.length;
  const totalOrdersCount = orders.length;

  const totalSalesVal = orders
    .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Calculate actual profit
  let totalProfitVal = 0;
  orders
    .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
    .forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const itemProfit = (prod.sellPrice - prod.buyPrice) * item.quantity;
          totalProfitVal += itemProfit;
        } else {
          totalProfitVal += item.price * 0.4 * item.quantity;
        }
      });
    });

  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.minStockLevel && p.quantity > 0
  );
  const outOfStockProducts = products.filter((p) => p.quantity === 0);

  // Prepare simple dynamic SVG data points for sales chart
  const recentDaysSales = [320, 410, 290, 680, 520, 890, totalSalesVal > 0 ? totalSalesVal : 450];
  const maxSale = Math.max(...recentDaysSales);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Stats */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-indigo-950">
        <div className="absolute right-0 top-0 opacity-5 translate-x-12 -translate-y-6">
          <TrendingUp className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-2.5 py-1 rounded border border-indigo-400/10">
              {t.appName} - {state.role === 'admin' ? t.admin : t.employee}
            </span>
            <h1 className="text-xl md:text-2xl font-bold mt-2 tracking-tight">
              {settings.storeName || 'Smart Commerce Manager'}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {t.protectSensitiveData}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{t.syncStatus}</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {settings.telegramBotToken ? t.connected : t.disconnected}
              </span>
            </div>
            {settings.telegramBotToken && (
              <button
                onClick={onSyncTelegram}
                disabled={isSyncing}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700/50 rounded-lg transition duration-200 cursor-pointer"
                title={t.syncNow}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 4 main metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalProducts}</span>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalProductsCount}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalOrders}</span>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalOrdersCount}</p>
          </div>
          <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalSales}</span>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalSalesVal, settings.currency, settings.primaryLanguage)}
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalProfit}</span>
            <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalProfitVal, settings.currency, settings.primaryLanguage)}
            </p>
          </div>
          <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>



      {/* Main Stats: Stock Alerts & Interactive Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
        {/* Sales Chart block */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{t.salesAnalysis}</h2>
          <div className="h-48 relative flex items-end justify-between px-2 pt-6">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-150 dark:bg-slate-800"></div>

            {recentDaysSales.map((val, idx) => {
              const heightPercent = maxSale > 0 ? (val / maxSale) * 75 : 40;
              return (
                <div key={idx} className="flex-grow flex flex-col items-center group relative cursor-pointer mx-1.5">
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-1 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white rounded text-[10px] whitespace-nowrap transition duration-200">
                    {formatCurrency(val, settings.currency, settings.primaryLanguage)}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-md group-hover:bg-indigo-700 dark:group-hover:bg-indigo-400 transition-all duration-300"
                  ></div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">
                    D{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts Box */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{t.lowStockAlerts}</span>
            </h2>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {lowStockProducts.length + outOfStockProducts.length}
            </span>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {outOfStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-150 dark:border-red-950/50">
                <div className="min-w-0 flex-grow pr-2 text-right">
                  <p className="text-xs font-bold text-red-900 dark:text-red-300 truncate">{p.name}</p>
                  <p className="text-[10px] text-red-500 font-medium">{t.outOfStock}</p>
                </div>
                <span className="bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[10px] font-black px-2 py-1 rounded">0</span>
              </div>
            ))}

            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-950/50">
                <div className="min-w-0 flex-grow pr-2 text-right">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300 truncate">{p.name}</p>
                  <p className="text-[10px] text-amber-500 font-medium">
                    {t.lowStock} (حد: {p.minStockLevel})
                  </p>
                </div>
                <span className="bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-1 rounded">
                  {p.quantity}
                </span>
              </div>
            ))}

            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">المستودع آمن ومكتمل! لا تتوفر نواقص حالية</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders block & Sync Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t.recentOrders}</h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهدة كل السجلات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-right">{t.orderId}</th>
                <th className="px-4 py-3 text-right">{t.customers}</th>
                <th className="px-4 py-3 text-right">{t.date}</th>
                <th className="px-4 py-3 text-right">{t.total}</th>
                <th className="px-4 py-3 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {orders.slice(0, 4).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{order.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{order.customerName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.totalAmount, settings.currency, settings.primaryLanguage)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'confirmed'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                          : order.status === 'delivered'
                          ? 'bg-emerald-55 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : order.status === 'cancelled'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                      }`}
                    >
                      {order.status === 'confirmed'
                        ? t.orderStatusConfirmed
                        : order.status === 'delivered'
                        ? t.orderStatusDelivered
                        : order.status === 'cancelled'
                        ? t.orderStatusCancelled
                        : t.orderStatusPending}
                    </span>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {t.noRecentOrders}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
