import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NavLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 md:mr-6 group">
      <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-violet-500 to-violet-700 rounded-xl
        flex items-center justify-center shadow-md shadow-violet-500/25
        group-hover:scale-105 transition-transform duration-200">
        <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-black tracking-tight text-gray-900 dark:text-white leading-none">BAZARCOM</p>
        <p className="text-[8px] font-bold text-violet-400 dark:text-violet-500 tracking-[0.2em] uppercase leading-none mt-0.5">Price Compare</p>
      </div>
      <span className="sm:hidden text-[15px] font-black text-gray-900 dark:text-white tracking-tight">BAZARCOM</span>
    </Link>
  );
}
