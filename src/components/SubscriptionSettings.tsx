import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Timer, Award, Check, Cpu, AlertCircle } from 'lucide-react';
import { AppState, Subscription, SubscriptionPlan } from '../types';
import { translations } from '../translations';

interface SubscriptionSettingsProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onActivateLicense: (key: string, plan: SubscriptionPlan) => void;
}

export default function SubscriptionSettings({ state, t, onActivateLicense }: SubscriptionSettingsProps) {
  const [activationKey, setActivationKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { subscription } = state;

  // Calculate dynamic trial remaining days
  const trialStart = new Date(subscription.trialStartDate).getTime();
  const now = Date.now();
  const daysDiff = Math.ceil((trialStart + (15 * 24 * 3600 * 1000) - now) / (1000 * 3600 * 24));
  const remainingDays = Math.max(0, daysDiff);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const keyCleaned = activationKey.trim().toUpperCase();

    if (keyCleaned === 'PRO-2026-ACTIVE') {
      onActivateLicense(keyCleaned, 'professional');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
    } else if (keyCleaned === 'BASIC-2026') {
      onActivateLicense(keyCleaned, 'basic');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
    } else if (keyCleaned === 'ENTERPRISE-2026') {
      onActivateLicense(keyCleaned, 'enterprise');
      setSuccessMsg(t.activationSuccess);
      setActivationKey('');
    } else {
      setErrorMsg(t.invalidLicenseKey);
    }
  };

  const planTiers = [
    {
      name: t.basicPlan,
      price: '$19 / Mo',
      features: ['تتبع المنتجات المحدودة', 'ربط بوت تيليجرام واحد', 'شحن الإيصالات واتساب', 'مستخدم موظف واحد'],
      level: 'basic',
    },
    {
      name: t.proPlan,
      price: '$49 / Mo',
      features: ['أعداد غير محدودة للمنتجات', 'مزامنة تيليجرام فورية مكررة', 'مولد الفواتير الاحترافية المدمج', 'مستويات وصول المدير والموظفين', 'تقارير أرباح متقدمة'],
      level: 'professional',
      popular: true,
    },
    {
      name: t.enterprisePlan,
      price: '$99 / Mo',
      features: ['خيارات نسخ احتياطي سحابي تلقائي', 'تعدد مستخدمي الفروع بالاتصال المباشر', 'مزامنة لعدة بوتات قنوات شحن في وقت واحد', 'طاقم دعم مالي مخصص 24/7'],
      level: 'enterprise',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.subscriptionStatus}</h1>
        <p className="text-slate-400 text-xs">مراجعة رخصة ترخيص هذه المحطة وتفعيل المزايا التجارية الكاملة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Card and Activation key panel */}
        <div className="lg:col-span-6 bg-white border border-slate-100 shadow-xs rounded-3xl p-6 space-y-6" dir="rtl">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.subscriptionStatus}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-lg font-black text-slate-900">
                {subscription.plan === 'trial' ? t.trialActive : `${t.activatedWithLicense} ${subscription.plan.toUpperCase()}`}
              </p>
            </div>
          </div>

          {subscription.plan === 'trial' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
              <Timer className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">{t.trialDaysRemaining}</p>
                <p className="text-xl font-black text-amber-800 font-mono mt-0.5">{remainingDays} يوم متبقي</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-slate-500 flex-shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{t.yourDeviceId}</span>
              <span className="font-mono text-xs font-bold text-slate-700">{subscription.deviceId}</span>
            </div>
          </div>

          {/* Activation Key Form */}
          <form onSubmit={handleActivate} className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500">{t.enterLicenseKey}</h3>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="PRO-XXXXX-XXXXX"
                className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
              />
              <button
                type="submit"
                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.activateBtn}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 text-right">
              <p className="text-[10px] text-indigo-950 font-black">{t.demoLicensePrompt}</p>
            </div>
          </form>
        </div>

        {/* Plan tiers comparisons Column */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-100 shadow-xs rounded-3xl p-5 space-y-4" dir="rtl">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>فئات الترخيص ومزايا الخصائص</span>
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            {planTiers.map((tier) => {
              const matchesCurrent = state.subscription.plan === tier.level;
              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    matchesCurrent
                      ? 'bg-indigo-900 text-white border-indigo-950'
                      : tier.popular
                      ? 'bg-white border-indigo-200 shadow-xs'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm">{tier.name}</h3>
                      <p className={`text-[10px] font-semibold mt-0.5 ${matchesCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                        مزايا الفئة الفعالة والمقاييس المتميزة
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        matchesCurrent ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {tier.price}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 ${matchesCurrent ? 'text-indigo-300' : 'text-indigo-600'}`} />
                        <span className={matchesCurrent ? 'text-slate-200' : 'text-slate-600'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
