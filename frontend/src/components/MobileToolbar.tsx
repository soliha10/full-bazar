import { Home, Search, Heart, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useAuth } from '../contexts/AuthContext';

export function MobileToolbar() {
  const location = useLocation();
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const { watched } = usePriceWatch();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const guestItems = [
    { key: 'home',     icon: Heart,  label: t.nav.home,       path: '/',         count: 0               },
    { key: 'search',   icon: Search, label: t.nav.search,     path: '/products', count: 0               },
    { key: 'wishlist', icon: Heart,  label: t.footer.wishlist, path: '/wishlist', count: favorites.length },
    { key: 'profile',  icon: User,   label: t.nav.account,    path: '/profile',  count: 0               },
  ];

  const loggedInItems = [
    { key: 'home',      icon: Home,   label: t.nav.home,       path: '/',          count: 0               },
    { key: 'search',    icon: Search, label: t.nav.search,     path: '/products',  count: 0               },
    { key: 'wishlist',  icon: Heart,  label: t.footer.wishlist, path: '/wishlist', count: favorites.length },
    { key: 'watchlist', icon: Bell,   label: t.common.watchShort, path: '/watchlist', count: watched.length  },
    { key: 'profile',   icon: User,   label: t.nav.account,    path: '/profile',   count: 0               },
  ];

  const items = user ? loggedInItems : guestItems;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bar border-t border-white/60 dark:border-white/[0.06]"
      style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04), 0 -8px 40px rgba(109,40,217,0.06)' }}
    >
      <div
        className="flex items-center justify-around px-1 pt-2"
        style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item) => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath === item.path || currentPath.startsWith(item.path + '/');

          const isProfile   = item.key === 'profile';
          const isWatchlist = item.key === 'watchlist';
          const isWishlist  = item.key === 'wishlist';

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 flex-1 min-h-[48px] justify-center"
            >
              <div className={`relative flex items-center justify-center w-10 h-8`}>

                {/* Profile: show user initial when logged in */}
                {isProfile && user ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium bg-violet-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <item.icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                )}

                {/* Count badge — red for favorites, violet for watchlist */}
                {item.count > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center leading-none ${
                    isWishlist || isWatchlist ? 'bg-violet-600' : 'bg-gray-500'
                  }`}>
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-medium leading-none transition-colors ${
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'
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
