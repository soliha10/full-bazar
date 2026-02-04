import { Search, User, Moon, Sun, Globe, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';

interface NavbarProps {
  onSearchChange?: (value: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' }
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground">
              BAZAAR<span className="text-primary">COM</span>
            </h1>
          </Link>

          {/* Search Bar - Hidden on small mobile, visible on sm+ */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all"
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Language Selector */}
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1.5 font-bold text-sm text-foreground hover:text-primary transition-colors">
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === language)?.label}</span>
              </button>
              <div className="absolute right-0 mt-3 w-32 glass border border-border/50 rounded-2xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-primary hover:text-white transition-colors ${
                      language === lang.code ? 'text-primary font-bold' : 'text-foreground'
                    }`}
                  >
                    {lang.code === 'uz' ? 'O\'zbek' : lang.code === 'ru' ? 'Русский' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-primary/10 text-foreground hover:text-primary transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Account */}
            <button className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all active:scale-95 group">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors hidden lg:block">
                {t.nav.account}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}