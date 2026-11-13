import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { PAGE_CONTAINER } from './layout';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-950 text-white mt-12 border-t border-gray-800">

      <div className={`${PAGE_CONTAINER} py-12`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="space-y-5 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Bazarcom</h2>
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
            <h3 className="font-medium text-sm text-white mb-4">{t.footer.shop}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">{t.footer.allProducts}</Link></li>
              <li><Link to="/trends" className="hover:text-white transition-colors">{t.footer.priceTrends}</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">{t.footer.compare}</Link></li>
            </ul>
          </div>

          {/* Customer */}
          <div className="text-center md:text-left">
            <h3 className="font-medium text-sm text-white mb-4">{t.footer.customer}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/profile" className="hover:text-white transition-colors">{t.footer.account}</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">{t.footer.wishlist}</Link></li>
              <li><Link to="/watchlist" className="hover:text-white transition-colors">{t.footer.priceAlerts}</Link></li>
              <li><Link to="/feedback" className="hover:text-white transition-colors">{t.footer.help}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs font-medium">
              &copy; {new Date().getFullYear()} Bazarcom. {t.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
