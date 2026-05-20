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
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-t border-gray-100/80 dark:border-gray-800/60"
      style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04), 0 -8px 40px rgba(109,40,217,0.06)' }}
    >
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item, i) => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath === item.path || currentPath.startsWith(item.path + '/');

          return (
            <Link
              key={i}
              to={item.path}
              className="relative flex flex-col items-center gap-1 flex-1 min-h-[48px] justify-center"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-violet-600" />
              )}
              <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-all duration-200 ${
                isActive ? 'bg-violet-100 dark:bg-violet-900/50 scale-110' : ''
              }`}>
                <item.icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-bold leading-none transition-all duration-200 ${
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
