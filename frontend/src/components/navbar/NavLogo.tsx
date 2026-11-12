import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NavLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 md:mr-6">
      <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
        <ShoppingBag className="w-4 h-4 text-white" />
      </div>
      <span className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Bazarcom</span>
    </Link>
  );
}
