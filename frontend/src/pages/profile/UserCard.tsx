import { Heart, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AuthUser } from '../../contexts/AuthContext';
import { brandLabel } from '../../hooks/useBrands';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPhone } from '../../utils/authValidation';

/* User card */
export function UserCard({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-violet-600 p-5"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-10 -left-4 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white text-2xl font-semibold shrink-0 shadow-inner">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-white leading-tight truncate">{user.name}</p>
          <p className="text-sm text-white/65 truncate mt-0.5">{user.email || formatPhone(user.phone)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold bg-white/15 text-white/90 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user.profile.ageGroup}
            </span>
            <span className="text-[10px] font-semibold bg-white/15 text-white/90 px-2 py-0.5 rounded-full">
              {t.auth.budgetLevels[user.profile.budgetLevel as keyof typeof t.auth.budgetLevels] ?? user.profile.budgetLevel}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* Quick links: Favorites + Watchlist */
export function QuickLinks({ favoritesCount, watchedCount }: { favoritesCount: number; watchedCount: number }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07, duration: 0.4 }}
      className="grid grid-cols-2 gap-3"
    >
      <Link
        to="/wishlist"
        className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-5 active:scale-95 transition-all hover:border-red-200 dark:hover:border-red-800 group"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
            <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
          </div>
          {favoritesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-1">
              {favoritesCount > 99 ? '99+' : favoritesCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.profile.favorites}</span>
      </Link>

      <Link
        to="/watchlist"
        className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-5 active:scale-95 transition-all hover:border-violet-200 dark:hover:border-violet-800 group"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
            <Bell className={`w-5 h-5 ${watchedCount > 0 ? 'fill-violet-200 dark:fill-violet-800 text-violet-600 dark:text-violet-400' : 'text-violet-400'}`} />
          </div>
          {watchedCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-violet-600 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-1">
              {watchedCount > 99 ? '99+' : watchedCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.profile.priceWatch}</span>
      </Link>
    </motion.div>
  );
}

/* Profile details */
export function PreferredBrands({ brands }: { brands: string[] }) {
  const { t } = useLanguage();
  if (brands.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
    >
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t.nav.favoriteBrands}</p>
      <div className="flex flex-wrap gap-2">
        {brands.map(b => (
          <span key={b} className="text-xs font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full">
            {brandLabel(b)}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
