import { Search, ShoppingCart, User, Moon, Sun, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';

interface NavbarProps {
  cartCount?: number;
  onSearchChange?: (value: string) => void;
}

export function Navbar({ cartCount = 0, onSearchChange }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'uz', label: 'O\'zbek' },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' }
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-[#FF7A00]">Bazaarcom</h1>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition-colors"
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-foreground hover:text-[#FF7A00] transition-colors">
                <Globe className="w-5 h-5" />
                <span className="text-sm">{languages.find(l => l.code === language)?.label}</span>
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      language === lang.code ? 'text-[#FF7A00] font-medium' : 'text-foreground'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-foreground hover:text-[#FF7A00] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-foreground hover:text-[#FF7A00] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF7A00] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <button className="flex items-center gap-2 text-foreground hover:text-[#FF7A00] transition-colors">
              <User className="w-6 h-6" />
              <span>{t.nav.account}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}