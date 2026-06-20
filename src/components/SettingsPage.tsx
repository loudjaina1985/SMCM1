import React, { useRef, useState } from 'react';
import { Settings, AppTheme, AppLanguage, AppState } from '../types';
import { translations } from '../translations';
import { RefreshCw, Download, Upload, Shield, BadgeAlert, CheckCircle, Moon, Sun } from 'lucide-react';

interface SettingsPageProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onSaveGeneralSettings: (settings: Partial<Settings>) => void;
  onImportBackup: (backupData: any) => boolean;
  onExportBackup: () => void;
  onToggleTheme: (theme: AppTheme) => void;
}

export default function SettingsPage({
  state,
  t,
  onSaveGeneralSettings,
  onImportBackup,
  onExportBackup,
  onToggleTheme
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState(state.settings.storeName || '');
  const [currency, setCurrency] = useState(state.settings.currency || 'USD');
  const [lang, setLang] = useState<AppLanguage>(state.settings.primaryLanguage || 'ar');
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGeneralSettings({
      storeName,
      currency,
      primaryLanguage: lang,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = onImportBackup(json);
        if (ok) {
          setImportStatus({ success: true, msg: t.restoreSuccess });
        } else {
          setImportStatus({ success: false, msg: t.restoreFailed });
        }
      } catch {
        setImportStatus({ success: false, msg: t.restoreFailed });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.settings}</h1>
        <p className="text-slate-400 text-xs">تكوين المتطلبات العامة واللغات وتبديل الخلفيات واسترداد البيانات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
        {/* General Options Forms Column */}
        <div className="lg:col-span-7 bg-white border border-slate-100 shadow-xs rounded-3xl p-6 space-y-5">
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-dashed pb-1">
              الخيارات التجارية وإعدادات الهوية
            </h2>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">اسم المتجر أو الكيان التجاري *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: البوتيك الذكي للإلكترونيات"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">العملة الافتراضية للفواتير</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                >
                  <option value="DZD">DZD - الدينار الجزائري</option>
                  <option value="SAR">SAR - الريال السعودي</option>
                  <option value="MAD">MAD - الدرهم المغربي</option>
                  <option value="USD">USD - الدولار الأمريكي ($)</option>
                  <option value="EUR">EUR - اليورو (€)</option>
                  <option value="IQD">IQD - الدينار العراقي</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">لغة واجهة المستخدم الرئيسية</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as AppLanguage)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="fr">Français (French)</option>
                  <option value="en">English (English)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </form>

          {/* Theme custom triggers Block */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 font-black">مظهر الواجهة الفعالة</h3>
            <div className="flex gap-3">
              <button
                onClick={() => onToggleTheme('light')}
                className={`flex-1 py-3 border rounded-2xl flex items-center justify-center gap-1.5 transition ${
                  state.settings.theme === 'light'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الوضع النهاري (Light)</span>
              </button>
              <button
                onClick={() => onToggleTheme('dark')}
                className={`flex-1 py-3 border rounded-2xl flex items-center justify-center gap-1.5 transition ${
                  state.settings.theme === 'dark'
                    ? 'bg-indigo-950 border-indigo-900 text-white font-bold'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>الوضع الليلي (Dark)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database backup restoration Column */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>النسخ الاحتياطي وإمكانية الترحيل</span>
            </h2>
            <p className="text-[11px] text-slate-500 leading-snug font-medium">
              تضمن هذه الخاصية أمان سجل أعمالك، حمل البيانات كملف JSON مشفر، أو أدرج الملف القديم لبذرة المستودعات والمبيعات مجدداً.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={onExportBackup}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportBackup}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold rounded-xl border border-indigo-100 text-indigo-700 flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{t.importBackup}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-[10px] font-bold ${
                  importStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <BadgeAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{importStatus.msg}</span>
              </div>
            )}
          </div>

          <div className="py-2.5 border-t border-dashed border-slate-200 flex items-center gap-2">
            <div className="p-1 w-2 h-2 rounded-full bg-indigo-500"></div>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              يعتمد التخزين الداخلي الفعلي على IndexedDB للتكامل الأمثل بدون خوادم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
