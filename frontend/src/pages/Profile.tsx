import { Heart, Bell, LogOut, Moon, Sun, Globe, ChevronRight, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';

const BUDGET_LABELS: Record<string, string> = {
  budget: 'Tejamkor',
  mid: "O'rta",
  premium: 'Premium',
};

export function Profile() {
  const { user, openLogin, openRegister, logout } = useAuth();
  const { favorites } = useFavorites();
  const { watched } = usePriceWatch();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isDark = resolvedTheme === 'dark';

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: "O'z", flag: '🇺🇿' },
    { code: 'ru', label: 'Рус', flag: '🇷🇺' },
    { code: 'en', label: 'En',  flag: '🇬🇧' },
  ];

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28 flex flex-col">

        {/* Mobile header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-base font-black text-gray-900 dark:text-white">Profil</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-24 h-24 rounded-3xl bg-linear-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-xl shadow-violet-500/30"
          >
            <User className="w-12 h-12 text-white" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">Hisobga kiring</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Sevimlilar va narx kuzatuvingizni barcha qurilmalarda saqlang
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="w-full max-w-xs flex flex-col gap-3">
            <button
              onClick={openLogin}
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all"
            >
              Kirish
            </button>
            <button
              onClick={openRegister}
              className="w-full py-3.5 rounded-2xl border-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 font-black text-sm active:scale-95 transition-all"
            >
              Ro'yxatdan o'tish
            </button>
          </motion.div>

          {/* Settings even without login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="w-full max-w-xs mt-2"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {/* Dark mode */}
              <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 rounded-t-2xl transition-colors">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon className="w-4 h-4 text-violet-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.darkMode}</span>
                </div>
                <div className={`w-10 h-5.5 rounded-full relative transition-colors ${isDark ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isDark ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>
              {/* Language */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2.5">
                  <Globe className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.language}</span>
                </div>
                <div className="flex gap-2">
                  {languages.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        language === code
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">

      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-base font-black text-gray-900 dark:text-white flex-1">Profil</span>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 active:scale-95 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Chiqish
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 p-5 shadow-xl shadow-violet-500/25"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-4 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-white leading-tight truncate">{user.name}</p>
              <p className="text-sm text-white/65 truncate mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-white/15 text-white/90 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {user.profile.ageGroup}
                </span>
                <span className="text-[10px] font-black bg-white/15 text-white/90 px-2 py-0.5 rounded-full">
                  {BUDGET_LABELS[user.profile.budgetLevel]}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick links: Favorites + Watchlist */}
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
                <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
              </div>
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </div>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">Sevimlilar</span>
          </Link>

          <Link
            to="/watchlist"
            className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-5 active:scale-95 transition-all hover:border-violet-200 dark:hover:border-violet-800 group"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                <Bell className={`w-5 h-5 ${watched.length > 0 ? 'fill-violet-200 dark:fill-violet-800 text-violet-600 dark:text-violet-400' : 'text-violet-400'}`} />
              </div>
              {watched.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-violet-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {watched.length > 99 ? '99+' : watched.length}
                </span>
              )}
            </div>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">Narx kuzatuv</span>
          </Link>
        </motion.div>

        {/* Profile details */}
        {user.profile.preferredBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
          >
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Sevimli brendlar</p>
            <div className="flex flex-wrap gap-2">
              {user.profile.preferredBrands.map(b => (
                <span key={b} className="text-xs font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21, duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800"
        >
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 pt-4 pb-2">Sozlamalar</p>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDark
                ? <Moon className="w-4 h-4 text-violet-500" />
                : <Sun className="w-4 h-4 text-amber-500" />
              }
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.darkMode}</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${isDark ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${isDark ? 'left-6' : 'left-1'}`} />
            </div>
          </button>

          {/* Language */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.language}</span>
            </div>
            <div className="flex gap-2">
              {languages.map(({ code, flag, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                    language === code
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All products link */}
          <Link
            to="/products"
            className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 rounded-b-2xl transition-colors"
          >
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Barcha mahsulotlar</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 font-black text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Hisobdan chiqish
          </button>
        </motion.div>

      </div>
    </div>
  );
}
