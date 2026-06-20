import React, { useState } from 'react';
import { Send, CheckCircle, HelpCircle, Shield, AlertCircle, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { AppState, Settings } from '../types';
import { translations } from '../translations';
import { encryptData, decryptData } from '../utils';

interface TelegramConfigProps {
  state: AppState;
  t: typeof translations['ar' | 'fr' | 'en'];
  onSaveSettings: (settings: Partial<Settings>) => void;
}

export default function TelegramConfig({ state, t, onSaveSettings }: TelegramConfigProps) {
  const [botToken, setBotToken] = useState(state.settings.telegramBotToken || '');
  const [chatId, setChatId] = useState(state.settings.telegramChatId || '');
  const [testing, setTesting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAutoDetectChatId = async () => {
    if (!botToken) {
      alert(state.settings.primaryLanguage === 'ar' ? 'الرجاء إدخال الـ Bot Token أولاً!' : 'Please enter the Bot Token first!');
      return;
    }
    setDetecting(true);
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = data.result || [];
        // Find latest interaction with message chat
        const lastMsgUpdate = [...results].reverse().find(u => u.message && u.message.chat);
        if (lastMsgUpdate && lastMsgUpdate.message.chat.id) {
          const foundId = String(lastMsgUpdate.message.chat.id);
          setChatId(foundId);
          setTestResult({
            success: true,
            message: state.settings.primaryLanguage === 'ar' 
              ? `تم رصد معرف الدردشة الخاص بك تلقائياً: ${foundId}` 
              : `Successfully detected your Chat ID: ${foundId}`,
          });
        } else {
          alert(
            state.settings.primaryLanguage === 'ar'
              ? 'لم يتم العثور على أي رسائل نشطة. يرجى البحث عن البوت في تيليجرام والضغط على "بدء" (Start) أو إرسال أي رسالة، ثم إعادة المحاولة!'
              : 'No messages found. Please find your bot on Telegram, press "/start" or send any message, and try again!'
          );
        }
      } else {
        alert(
          state.settings.primaryLanguage === 'ar'
            ? 'فشل الاتصال بالبوت لجلب التحديثات. تأكد من صحة الرمز.'
            : 'Failed to access Telegram updates. Please check your Bot Token.'
        );
      }
    } catch {
      alert(
        state.settings.primaryLanguage === 'ar'
          ? 'حدث خطأ غير متوقع أثناء معالجة البيانات.'
          : 'An unexpected error occurred while detecting Chat ID.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      telegramBotToken: botToken,
      telegramChatId: chatId,
    });
  };

  const handleTestConnection = async () => {
    if (!botToken || !chatId) {
      setTestResult({
        success: false,
        message: 'يرجى إدخال الرمز ومعرف الدردشة أولاً بساحة الكتابة',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const textMessage = `🛎️ *اختبار اتصال Smart Commerce Manager*
----------------------------------------
تم ربط بوت تيليجرام بنجاح ببرنامج الإدارة الذكي!
معرف الدردشة للمسؤول: \`${chatId}\`
الوقت الحالي: ${new Date().toLocaleTimeString()}
----------------------------------------
أنت الآن جاهز لاستقبال طلبيات الزبائن مباشرة على شاشتك.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMessage,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: t.testSuccessMsg,
        });
      } else {
        const errData = await response.json();
        setTestResult({
          success: false,
          message: `${t.testFailedMsg}: ${errData.description || 'رمز غير معروف'}`,
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: t.testFailedMsg,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.telegramSettingsTitle}</h1>
        <p className="text-slate-400 text-xs">{t.telegramExplanation}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form Column */}
        <div className="lg:col-span-7 bg-white border border-slate-100 shadow-xs rounded-3xl p-6 space-y-5">
          <form onSubmit={handleSave} className="space-y-4" dir="rtl">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">تأمين وتشفير سري للرموز</p>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                  يتم تخزين الـ Token ومعرف الدردشة بشكل مشفر ومعزول في متصفحك بشكل آمن من فحص الأطراف الخارجية لضمان خصوصيتك.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">{t.botTokenLabel}</label>
              <div className="relative">
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="7194857210:AAHzNdf_..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">{t.chatIdLabel}</label>
              <div className="relative">
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={handleAutoDetectChatId}
                disabled={detecting}
                className="mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${detecting ? 'animate-pulse' : ''}`} />
                <span>{state.settings.primaryLanguage === 'ar' ? 'رصد معرف الدردشة تلقائياً ✨' : 'Auto Detect Chat ID ✨'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 font-bold text-slate-700 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{t.testTelegramConnection}</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>

        {/* Guided bot instructions Column */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4" dir="rtl">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>{t.botInstructions}</span>
            </h2>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-medium">
              <p>{t.step1}</p>
              <p>{t.step2}</p>
              <p>{t.step3}</p>
              <p>{t.step4}</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2" dir="rtl">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <p className="text-[10px] text-slate-400 font-semibold leading-snug">
              بمجرد ربطه، ستعمل سحابة التاجر على كشط الرسائل وتحويلها تلقائياً لطلبات تجارية مع النواقص والمقاييس.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
