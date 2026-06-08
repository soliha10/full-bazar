import { useState, useEffect } from 'react';
import { Bell, Trash2, ArrowLeft, TrendingDown, TrendingUp, ExternalLink, Minus, Send, CheckCircle, X, Link2Off } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useAuth } from '../contexts/AuthContext';
import { formatSum } from '../utils/productMapper';

function TelegramPanel({ token }: { token: string }) {
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
    if (!parsed || isNaN(parsed)) { setError("Noto'g'ri chat ID"); return; }
    setSaving(true); setError('');
    try {
      await axios.post(`/api/users/me/telegram`, { chat_id: parsed }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLinked(true);
      setChatId(String(parsed));
      setStep('idle');
    } catch { setError('Saqlashda xatolik'); }
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
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">Telegram ulangan</p>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-500">Chat ID: {chatId} — narx tushsa xabar keladi</p>
        </div>
      </div>
      <button onClick={handleUnlink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
        <Link2Off className="w-3.5 h-3.5" />
        Uzish
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
              <p className="text-sm font-black text-blue-700 dark:text-blue-300">Telegram orqali ogohlantirish</p>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400">Narx tushganda Telegram xabar olasiz</p>
            </div>
          </div>
          <button onClick={() => setStep('instructions')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all shrink-0">
            Ulash
          </button>
        </div>
      )}

      {step === 'instructions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-blue-700 dark:text-blue-300">Telegram ulash</p>
            <button onClick={() => setStep('idle')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
            <li className="flex gap-2"><span className="font-black shrink-0">1.</span><span>Telegramda <strong>@BazarcomPriceBot</strong> ni oching</span></li>
            <li className="flex gap-2"><span className="font-black shrink-0">2.</span><span><strong>/start</strong> buyrug'ini yuboring</span></li>
            <li className="flex gap-2"><span className="font-black shrink-0">3.</span><span>Bot sizga <strong>Chat ID</strong> raqamini beradi — uni pastga kiriting</span></li>
          </ol>
          <button onClick={() => setStep('input')}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all">
            Chat ID kiriting
          </button>
        </div>
      )}

      {step === 'input' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-blue-700 dark:text-blue-300">Chat ID kiriting</p>
            <button onClick={() => setStep('instructions')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="number"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="Masalan: 123456789"
            className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-700
              bg-white dark:bg-gray-900 text-sm font-bold
              text-gray-900 dark:text-white placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 disabled:opacity-60 transition-all">
            {saving ? 'Saqlanmoqda...' : 'Tasdiqlash'}
          </button>
        </div>
      )}
    </div>
  );
}

export function Watchlist() {
  const { watched, toggle } = usePriceWatch();
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 pb-28 flex flex-col">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-base font-black text-gray-900 dark:text-white">Narx kuzatuvi</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"
          >
            <Bell className="w-10 h-10 text-violet-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1">Narx kuzatuviga kiring</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Mahsulotlarni kuzating va narx o'zgarishlarini kuzatib boring
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
            onClick={openLogin}
            className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all"
          >
            Kirish
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">

      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Bell className="w-4 h-4 text-violet-600" />
            <span className="text-base font-black text-gray-900 dark:text-white">Narx kuzatuvi</span>
            {watched.length > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {watched.length}
              </span>
            )}
          </div>
          {watched.length > 0 && (
            <button
              onClick={() => watched.forEach(p => toggle(p))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8">

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Narx kuzatuvi</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{watched.length} ta mahsulot kuzatilmoqda</p>
            </div>
          </div>
          {watched.length > 0 && (
            <button
              onClick={() => watched.forEach(p => toggle(p))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Barchasini o'chirish
            </button>
          )}
        </div>

        {/* Telegram panel */}
        <TelegramPanel token={user.token} />

        {/* Info banner */}
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <Bell className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Mahsulot kartasidagi <strong>qo'ng'iroq tugmasi</strong> orqali qo'shiladi.
            Qo'shilgan narxingiz bilan hozirgi narxni avtomatik taqqoslaydi.
          </p>
        </div>

        {/* Empty state */}
        <AnimatePresence>
          {watched.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-5"
              >
                <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
              </motion.div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Kuzatuv ro'yxati bo'sh</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Mahsulot kartasidagi 🔔 tugmasini bosib kuzatuvga qo'shing
              </p>
              <Link
                to="/products"
                className="bg-violet-600 hover:bg-violet-700 text-white font-black text-sm px-6 py-3 rounded-2xl active:scale-95 transition-all"
              >
                Mahsulotlarni ko'rish
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watched list */}
        {watched.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {watched.map((product, i) => {
                const savedPrice = product.price;
                const currentMarkets = product.current_markets ?? product.markets ?? [];
                const sortedCurrentMarkets = [...currentMarkets].sort((a, b) => a.price - b.price);
                const currentBestPrice = product.current_price ?? sortedCurrentMarkets[0]?.price ?? savedPrice;
                const bestMarket = sortedCurrentMarkets[0];

                const priceDiff = currentBestPrice - savedPrice;
                const pricePct = savedPrice > 0 ? (priceDiff / savedPrice) * 100 : 0;
                const dropped = pricePct < -1;
                const rose    = pricePct > 1;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-violet-500/8 hover:border-violet-200/70 dark:hover:border-violet-800/50 transition-all"
                  >
                    {/* Price change banner */}
                    {(dropped || rose) && (
                      <div className={`px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-black ${
                        dropped
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        {dropped ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {dropped
                          ? `Narx tushdi! ${Math.abs(pricePct).toFixed(0)}% arzonladi — ${formatSum(Math.abs(priceDiff))} tejaysiz`
                          : `Narx oshdi — ${pricePct.toFixed(0)}% qimmatlashdi`
                        }
                      </div>
                    )}

                    <div className="p-3.5 flex gap-3">
                      {/* Image */}
                      <Link to={`/product/${product.id}`} className="shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="text-[13px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Prices */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-black text-gray-900 dark:text-white">
                            {formatSum(currentBestPrice)}
                          </span>
                          {Math.abs(priceDiff) > 1000 && (
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatSum(savedPrice)}
                            </span>
                          )}
                        </div>

                        {/* Saved price label */}
                        <div className="flex items-center gap-1">
                          {dropped && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                              -{formatSum(Math.abs(priceDiff))} arzon
                            </span>
                          )}
                          {rose && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                              +{formatSum(priceDiff)} qimmat
                            </span>
                          )}
                          {!dropped && !rose && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                              <Minus className="w-2.5 h-2.5" />
                              Narx o'zgarmagan
                            </span>
                          )}
                        </div>

                        {/* Best market + actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {bestMarket && (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px]">
                                  {bestMarket.source}
                                </span>
                                {bestMarket.url && bestMarket.url !== '#' && (
                                  <a
                                    href={bestMarket.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-violet-500 hover:text-violet-700 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {sortedCurrentMarkets.length > 1 && (
                                  <span className="text-[10px] text-gray-400">+{sortedCurrentMarkets.length - 1} ta do'kon</span>
                                )}
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => toggle(product)}
                            className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-all active:scale-90"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Olib tashlash
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
