import { Bell, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useAuth } from '../contexts/AuthContext';
import { SEO, SITE_URL } from '../components/SEO';
import { useLanguage } from '../contexts/LanguageContext';
import { TelegramPanel } from './watchlist/TelegramPanel';
import { WatchItem } from './watchlist/WatchItem';

export function Watchlist() {
  const { watched, toggle } = usePriceWatch();
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen pb-28 flex flex-col">
        <SEO
          title={t.watchlist.title}
          description={t.watchlist.seoDescription}
          noindex
          canonicalUrl={`${SITE_URL}/watchlist`}
        />
        <div className="sticky top-0 z-40 glass-bar border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl glass-soft active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-base font-semibold text-gray-900 dark:text-white">{t.watchlist.title}</span>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t.watchlist.loginTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {t.watchlist.loginSubtitle}
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
            onClick={openLogin}
            className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm active:scale-95 transition-all"
          >
            {t.auth.login}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28">
      <SEO
        title={t.watchlist.title}
        description={t.watchlist.seoDescription}
        noindex
        canonicalUrl={`${SITE_URL}/watchlist`}
      />

      {/* Mobile header */}
      <div className="sticky top-0 z-40 glass-bar border-b border-gray-100 dark:border-gray-800 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl glass-soft active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base font-semibold text-gray-900 dark:text-white">{t.watchlist.title}</span>
            {watched.length > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
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
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{t.watchlist.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.watchlist.trackingCount.replace('{{count}}', String(watched.length))}</p>
            </div>
          </div>
          {watched.length > 0 && (
            <button
              onClick={() => watched.forEach(p => toggle(p))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.watchlist.clearAll}
            </button>
          )}
        </div>

        {/* Telegram panel */}
        <TelegramPanel token={user.token} />

        {/* Info banner */}
        <div className="glass-soft rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {t.watchlist.infoBefore}<strong>{t.watchlist.infoBell}</strong>{t.watchlist.infoAfter}
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
                className="w-20 h-20 rounded-3xl glass-soft flex items-center justify-center mb-5"
              >
                <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
              </motion.div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.watchlist.emptyTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                {t.watchlist.emptySubtitle}
              </p>
              <Link
                to="/products"
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-3 rounded-2xl active:scale-95 transition-all"
              >
                {t.watchlist.browseProducts}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watched list */}
        {watched.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {watched.map((product, i) => (
                <WatchItem key={product.id} product={product} index={i} onRemove={toggle} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
