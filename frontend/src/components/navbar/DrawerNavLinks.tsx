import { Heart, ChevronRight, Home, Package, TrendingUp, MessageSquareHeart, Scale } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface DrawerNavLinksProps {
  compareCount: number;
  favoritesCount: number;
  closeMenu: () => void;
}

/* Nav links — drawer ichidagi asosiy sahifalar ro'yxati */
export function DrawerNavLinks({ compareCount, favoritesCount, closeMenu }: DrawerNavLinksProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const navLinks = [
    { icon: Home,             label: t.nav.home,       path: '/',         count: 0               },
    { icon: Package,          label: t.nav.catalog,     path: '/products', count: 0               },
    { icon: Scale,            label: t.nav.compare,     path: '/compare',  count: compareCount },
    { icon: TrendingUp,       label: t.nav.analysis,    path: '/trends',   count: 0               },
    { icon: Heart,            label: t.footer.wishlist, path: '/wishlist', count: favoritesCount },
    { icon: MessageSquareHeart, label: t.nav.feedback,    path: '/feedback', count: 0               },
  ];

  return (
    <div className="px-3 pt-3">
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] px-2 mb-2">
        {t.common.menu}
      </p>
      <div className="space-y-0.5">
        {navLinks.map(({ icon: Icon, label, path, count }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={closeMenu}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-violet-50 dark:bg-violet-950/70'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? 'bg-violet-600 shadow-sm shadow-violet-500/40'
                  : 'bg-gray-100 dark:bg-gray-800/80'
              }`}>
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <span className={`flex-1 text-sm leading-none ${
                isActive
                  ? 'font-black text-violet-700 dark:text-violet-300'
                  : 'font-semibold text-gray-800 dark:text-gray-200'
              }`}>
                {label}
              </span>
              {count > 0 ? (
                <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                  path === '/wishlist' ? 'bg-red-500 text-white' : 'bg-violet-600 text-white'
                }`}>
                  {count > 9 ? '9+' : count}
                </span>
              ) : (
                <ChevronRight className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-violet-400' : 'text-gray-300 dark:text-gray-700'
                }`} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
