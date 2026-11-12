import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-gray-950 text-white mt-24 overflow-hidden">
      {/* Purple gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
      {/* Subtle purple glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-40 bg-violet-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="space-y-5 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-linear-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-violet-500/30">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none">
                  BAZAR<span className="text-violet-400">COM</span>
                </h2>
                <p className="text-[9px] font-bold text-violet-500 tracking-widest uppercase leading-none mt-0.5">
                  Price Compare
                </p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              {t.footer.tagline}
            </p>
          </div>

          {/* Har bir havola mavjud sahifaga olib boradi. Ilgari ko'pchiligi
              href="#" edi va bosilganda shunchaki sahifa tepasiga qaytardi;
              hali sahifasi yo'q bo'limlar (kompaniya, huquqiy, ijtimoiy
              tarmoqlar) sahifalari tayyor bo'lgunicha ko'rsatilmaydi. */}
          {/* Shop */}
          <div className="text-center md:text-left">
            <h3 className="font-black text-sm text-white uppercase tracking-widest mb-5">{t.footer.shop}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-violet-400 transition-colors">{t.footer.allProducts}</Link></li>
              <li><Link to="/trends" className="hover:text-violet-400 transition-colors">{t.footer.priceTrends}</Link></li>
              <li><Link to="/compare" className="hover:text-violet-400 transition-colors">{t.footer.compare}</Link></li>
            </ul>
          </div>

          {/* Customer */}
          <div className="text-center md:text-left">
            <h3 className="font-black text-sm text-white uppercase tracking-widest mb-5">{t.footer.customer}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/profile" className="hover:text-violet-400 transition-colors">{t.footer.account}</Link></li>
              <li><Link to="/wishlist" className="hover:text-violet-400 transition-colors">{t.footer.wishlist}</Link></li>
              <li><Link to="/watchlist" className="hover:text-violet-400 transition-colors">{t.footer.priceAlerts}</Link></li>
              <li><Link to="/feedback" className="hover:text-violet-400 transition-colors">{t.footer.help}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-14 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs font-medium">
              &copy; 2026 Bazarcom. {t.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
