import { Home, Search, Heart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function MobileToolbar() {
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname;

  const items = [
    { icon: Home,   label: t.nav.home,       path: '/'         },
    { icon: Search, label: t.nav.search,      path: '/products' },
    { icon: Heart,  label: t.footer.wishlist, path: '/wishlist' },
    { icon: User,   label: t.nav.account,     path: '/profile'  },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 dark:bg-gray-950/98 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800/80 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_32px_rgba(0,0,0,0.08)]">
      <div
        className="flex items-end justify-around px-1 pt-2"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item, i) => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath === item.path || currentPath.startsWith(item.path + '/');

          return (
            <Link
              key={i}
              to={item.path}
              className="flex flex-col items-center gap-1 flex-1 min-h-[44px] justify-center transition-transform duration-100 active:scale-90"
            >
              <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200 ${
                isActive ? 'bg-violet-100 dark:bg-violet-900/50' : ''
              }`}>
                <item.icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
