import { Moon, Sun, Heart, Bell, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavIconLinksProps {
  compareCount: number;
  favoritesCount: number;
  /** null — foydalanuvchi kirmagan: qo'ng'iroqcha ko'rsatilmaydi */
  watchedCount: number | null;
  isDark: boolean;
  toggleTheme: () => void;
}

/* Desktop belgilar qatori: taqqoslash, sevimlilar, narx kuzatuvi, tema */
export function NavIconLinks({ compareCount, favoritesCount, watchedCount, isDark, toggleTheme }: NavIconLinksProps) {
  const { t } = useLanguage();
  return (
    <>
      {/* Taqqoslash — desktop. Idealo, Ceneo va PriceSpy dagidek:
          tanlangan mahsulotlar soni doim ko'rinib turadi, shuning uchun
          foydalanuvchi nechta mahsulot tanlaganini eslab qolishi shart emas. */}
      <Link to="/compare"
        title={t.nav.compare}
        className="hidden md:flex relative w-8 h-8 items-center justify-center rounded-xl
          bg-gray-50 dark:bg-gray-800
          hover:bg-violet-50 dark:hover:bg-violet-900/30
          text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400
          transition-all active:scale-90">
        <Scale className={`w-4 h-4 transition-colors ${compareCount > 0 ? 'text-violet-600 dark:text-violet-400' : ''}`} />
        {compareCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">
            {compareCount}
          </span>
        )}
      </Link>

      {/* Favorites — desktop */}
      <Link to="/wishlist"
        className="hidden md:flex relative w-8 h-8 items-center justify-center rounded-xl
          bg-gray-50 dark:bg-gray-800
          hover:bg-red-50 dark:hover:bg-red-900/20
          text-gray-500 dark:text-gray-400 hover:text-red-500
          transition-all active:scale-90">
        <Heart className={`w-4 h-4 transition-colors ${favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {favoritesCount > 9 ? '9+' : favoritesCount}
          </span>
        )}
      </Link>

      {/* Bell (price watch) — desktop, auth-gated */}
      {watchedCount !== null && (
        <Link
          to="/watchlist"
          className="hidden md:flex relative w-8 h-8 items-center justify-center rounded-xl
            bg-gray-50 dark:bg-gray-800
            hover:bg-violet-50 dark:hover:bg-violet-900/30
            text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400
            transition-all active:scale-90"
          title={t.nav.priceWatch}
        >
          <Bell className={`w-4 h-4 transition-colors ${watchedCount > 0 ? 'text-violet-600 dark:text-violet-400' : ''}`} />
          {watchedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">
              {watchedCount > 9 ? '9+' : watchedCount}
            </span>
          )}
        </Link>
      )}

      {/* Theme toggle — desktop */}
      <button onClick={toggleTheme} aria-label={t.nav.toggleTheme}
        className="hidden md:flex w-8 h-8 items-center justify-center rounded-xl
          bg-gray-50 dark:bg-gray-800
          hover:bg-violet-50 dark:hover:bg-violet-900/30
          text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400
          transition-all active:scale-90">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </>
  );
}
