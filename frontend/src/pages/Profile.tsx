import { LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO, SITE_URL } from '../components/SEO';
import { LoggedOutView } from './profile/LoggedOutView';
import { UserCard, QuickLinks, PreferredBrands } from './profile/UserCard';
import { SettingsBlock } from './profile/SettingsBlock';

export function Profile() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { watched } = usePriceWatch();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return <LoggedOutView />;

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28">
      <SEO
        title={t.nav.profile}
        description={t.profile.seoDescription}
        noindex
        canonicalUrl={`${SITE_URL}/profile`}
      />

      {/* Mobile header */}
      <div className="sticky top-0 z-40 glass-bar border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl glass-soft active:scale-90 transition-all">
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-white flex-1">{t.nav.profile}</span>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 active:scale-95 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t.nav.logout}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* User card */}
        <UserCard user={user} />

        {/* Quick links: Favorites + Watchlist */}
        <QuickLinks favoritesCount={favorites.length} watchedCount={watched.length} />

        {/* Profile details */}
        <PreferredBrands brands={user.profile.preferredBrands} />

        {/* Settings */}
        <SettingsBlock />

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t.profile.logoutAccount}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
