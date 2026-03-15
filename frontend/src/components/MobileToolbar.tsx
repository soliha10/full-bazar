import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function MobileToolbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-between items-center px-6 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {items.map((item, i) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={i}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-[#0062FF]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon 
              className="w-6 h-6" 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
