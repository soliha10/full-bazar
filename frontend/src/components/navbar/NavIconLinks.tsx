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
        data-tip={t.nav.compare} aria-label={t.nav.compare}
        className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
        <Scale className={`w-4 h-4 transition-colors ${compareCount > 0 ? 'text-violet-600 dark:text-violet-400' : ''}`} />
        {compareCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-semibold flex items-center justify-center">
            {compareCount}
          </span>
        )}
      </Link>

      {/* Favorites — desktop */}
      <Link to="/wishlist" data-tip={t.profile.favorites} aria-label={t.profile.favorites}
        className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
        <Heart className={`w-4 h-4 transition-colors ${favoritesCount > 0 ? 'fill-current text-gray-900 dark:text-white' : ''}`} />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-semibold flex items-center justify-center">
            {favoritesCount > 9 ? '9+' : favoritesCount}
          </span>
        )}
      </Link>

      {/* Bell (price watch) — desktop, auth-gated */}
      {watchedCount !== null && (
        <Link
          to="/watchlist"
          className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          data-tip={t.nav.priceWatch} aria-label={t.nav.priceWatch}
        >
          <Bell className={`w-4 h-4 transition-colors ${watchedCount > 0 ? 'text-violet-600 dark:text-violet-400' : ''}`} />
          {watchedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-semibold flex items-center justify-center">
              {watchedCount > 9 ? '9+' : watchedCount}
            </span>
          )}
        </Link>
      )}

      {/* Theme toggle — desktop */}
      <button onClick={toggleTheme} aria-label={t.nav.toggleTheme} data-tip={t.nav.toggleTheme}
        className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </>
  );
}
