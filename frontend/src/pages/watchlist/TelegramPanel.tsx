import { useState, useEffect } from 'react';
import { Send, CheckCircle, X, Link2Off } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext';

export function TelegramPanel({ token }: { token: string }) {
  const { t } = useLanguage();
  const [linked, setLinked]     = useState<boolean | null>(null);
  const [chatId, setChatId]     = useState('');
  const [input, setInput]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [step, setStep]         = useState<'idle' | 'instructions' | 'input'>('idle');

  useEffect(() => {
    axios.get(`/api/users/me/telegram`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      setLinked(r.data.linked);
      if (r.data.chat_id) setChatId(String(r.data.chat_id));
    }).catch(() => setLinked(false));
  }, [token]);

  const handleSave = async () => {
    const parsed = parseInt(input.trim(), 10);
    if (!parsed || isNaN(parsed)) { setError(t.watchlist.telegram.invalidChatId); return; }
    setSaving(true); setError('');
    try {
      await axios.post(`/api/users/me/telegram`, { chat_id: parsed }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLinked(true);
      setChatId(String(parsed));
      setStep('idle');
    } catch { setError(t.watchlist.telegram.saveError); }
    finally { setSaving(false); }
  };

  const handleUnlink = async () => {
    await axios.delete(`/api/users/me/telegram`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLinked(false); setChatId(''); setStep('idle');
  };

  if (linked === null) return null;

  if (linked) return (
    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t.watchlist.telegram.linked}</p>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-500">{t.watchlist.telegram.linkedInfo.replace('{{chatId}}', chatId)}</p>
        </div>
      </div>
      <button onClick={handleUnlink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
        <Link2Off className="w-3.5 h-3.5" />
        {t.watchlist.telegram.unlink}
      </button>
    </div>
  );

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl px-4 py-4 mb-4">
      {step === 'idle' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t.watchlist.telegram.title}</p>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400">{t.watchlist.telegram.subtitle}</p>
            </div>
          </div>
          <button onClick={() => setStep('instructions')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shrink-0">
            {t.watchlist.telegram.connect}
          </button>
        </div>
      )}

      {step === 'instructions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t.watchlist.telegram.connectTitle}</p>
            <button onClick={() => setStep('idle')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
            <li className="flex gap-2"><span className="font-semibold shrink-0">1.</span><span>{t.watchlist.telegram.step1Before}<strong>@BazarcomPriceBot</strong>{t.watchlist.telegram.step1After}</span></li>
            <li className="flex gap-2"><span className="font-semibold shrink-0">2.</span><span>{t.watchlist.telegram.step2Before}<strong>/start</strong>{t.watchlist.telegram.step2After}</span></li>
            <li className="flex gap-2"><span className="font-semibold shrink-0">3.</span><span>{t.watchlist.telegram.step3Before}<strong>Chat ID</strong>{t.watchlist.telegram.step3After}</span></li>
          </ol>
          <button onClick={() => setStep('input')}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all">
            {t.watchlist.telegram.enterChatId}
          </button>
        </div>
      )}

      {step === 'input' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t.watchlist.telegram.enterChatId}</p>
            <button onClick={() => setStep('instructions')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="number"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder={t.watchlist.telegram.placeholder}
            className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-700
              glass-soft text-sm font-bold
              text-gray-900 dark:text-white placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all">
            {saving ? t.watchlist.telegram.saving : t.watchlist.telegram.confirm}
          </button>
        </div>
      )}
    </div>
  );
}
