import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1E1E1E] dark:bg-[#0a0a0a] text-white mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-[#FF7A00] mb-4">Bazaarcom</h2>
            <p className="text-gray-400 text-sm">
              {t.footer.tagline}
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="hover:text-[#FF7A00] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#FF7A00] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#FF7A00] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#FF7A00] transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.shop}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-[#FF7A00] transition-colors">{t.footer.allProducts}</Link></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.categories}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.deals}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.newArrivals}</a></li>
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.customer}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.account}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.orders}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.wishlist}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.help}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.company}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.about}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.careers}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.press}</a></li>
              <li><a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.blog}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">&copy; 2026 Bazaarcom. {t.footer.rights}</p>
            <div className="flex gap-4 text-sm text-gray-400">
              <a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.terms}</a>
              <a href="#" className="hover:text-[#FF7A00] transition-colors">{t.footer.cookies}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}