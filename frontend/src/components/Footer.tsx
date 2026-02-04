import { Facebook, Instagram, Twitter, Mail, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-slate-900 text-white mt-32 overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6 text-center md:text-left">
            <Link to="/" className="flex items-center gap-2 justify-center md:justify-start group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter">
                BAZAAR<span className="text-primary">COM</span>
              </h2>
            </Link>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs mx-auto md:mx-0">
              {t.footer.tagline}
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {[Facebook, Instagram, Twitter, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-6 text-white">{t.footer.shop}</h3>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><Link to="/products" className="hover:text-primary transition-colors">{t.footer.allProducts}</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.categories}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.deals}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.newArrivals}</a></li>
            </ul>
          </div>

          {/* Customer */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-6 text-white">{t.footer.customer}</h3>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.account}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.orders}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.wishlist}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.help}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-6 text-white">{t.footer.company}</h3>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.about}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.careers}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.press}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.blog}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-20 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">
              &copy; 2026 Bazaarcom. {t.footer.rights}
            </p>
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-primary transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-primary transition-colors">{t.footer.terms}</a>
              <a href="#" className="hover:text-primary transition-colors">{t.footer.cookies}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}