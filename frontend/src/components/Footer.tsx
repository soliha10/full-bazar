import { Globe, Camera, MessageCircle, Mail, ShoppingBag } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

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
            <div className="flex gap-3 justify-center md:justify-start">
              {[Globe, Camera, MessageCircle, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-violet-600 hover:border-violet-600 text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="text-center md:text-left">
            <h3 className="font-black text-sm text-white uppercase tracking-widest mb-5">{t.footer.shop}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-violet-400 transition-colors">{t.footer.allProducts}</Link></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.categories}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.deals}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.newArrivals}</a></li>
            </ul>
          </div>

          {/* Customer */}
          <div className="text-center md:text-left">
            <h3 className="font-black text-sm text-white uppercase tracking-widest mb-5">{t.footer.customer}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.account}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.orders}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.wishlist}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.help}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="text-center md:text-left">
            <h3 className="font-black text-sm text-white uppercase tracking-widest mb-5">{t.footer.company}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.about}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.careers}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.press}</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">{t.footer.blog}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-14 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs font-medium">
              &copy; 2026 Bazarcom. {t.footer.rights}
            </p>
            <div className="flex gap-6 text-xs font-medium text-gray-500">
              <a href="#" className="hover:text-violet-400 transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-violet-400 transition-colors">{t.footer.terms}</a>
              <a href="#" className="hover:text-violet-400 transition-colors">{t.footer.cookies}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
