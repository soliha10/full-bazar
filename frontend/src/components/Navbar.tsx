import { useState, useEffect } from 'react';
import {
  Search, User, Moon, Sun, Globe, ShoppingBag, Menu, Mic, X,
  LogIn, ChevronRight, HelpCircle, Info, ChevronDown, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onSearchChange?: (value: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [searchValue, setSearchValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get('search') || '');
  }, [location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (searchValue.trim() === (params.get('search') || '')) return;
    const timer = setTimeout(() => onSearchChange?.(searchValue.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchValue, location.search, onSearchChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchValue.trim());
  };

  const startVoiceSearch = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearchValue(text);
      onSearchChange?.(text.trim());
    };
    r.start();
  };

  const langLabels: Record<Language, string> = {
    uz: "O'zbekcha",
    ru: 'Русский',
    en: 'English',
  };
  const languages: { code: Language; label: string }[] = [
    { code: 'uz', label: "O'zbekcha" },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ];
  const isDark = resolvedTheme === 'dark';

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 bg-white/96 dark:bg-gray-950/96 backdrop-blur-xl border-b border-gray-100/70 dark:border-gray-800/60 ${
      scrolled ? 'shadow-sm shadow-black/5 dark:shadow-black/20' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main row ── */}
        <div className="flex items-center justify-between h-14 md:h-16 gap-3">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300 transition-all active:scale-90"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 group mr-2 md:mr-8 shrink-0">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-violet-500 to-violet-700 rounded-xl md:rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md shadow-violet-500/25">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black tracking-tight text-gradient leading-none">BAZARCOM</p>
                <p className="text-[8px] font-bold text-violet-400 dark:text-violet-500 tracking-[0.2em] uppercase leading-none mt-0.5">
                  Price Compare
                </p>
              </div>
              {/* Mobile-only brand name */}
              <span className="sm:hidden text-sm font-black text-gray-900 dark:text-white tracking-tight">
                BAZARCOM
              </span>
            </Link>
          </div>

          {/* Center: search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <form onSubmit={handleSubmit} className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                value={searchValue}
                placeholder={t.nav.searchPlaceholder}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-11 pr-32 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => { setSearchValue(''); onSearchChange?.(''); }}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={`p-1.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-50 text-red-500 animate-pulse'
                      : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all"
                >
                  {t.nav.search}
                </button>
              </div>
            </form>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            {/* Language selector - desktop */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 font-semibold text-sm transition-all"
              >
                <Globe className="w-4 h-4" />
                <span className="font-black text-xs uppercase tracking-wider">{language}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-violet-500/10 overflow-hidden z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                        className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors ${
                          language === lang.code
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-black'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                        }`}
                      >
                        {lang.label}
                        {language === lang.code && <div className="w-2 h-2 rounded-full bg-violet-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/80 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 border border-transparent hover:border-violet-200/60 dark:hover:border-violet-700/40 transition-all active:scale-90"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Login */}
            <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-2xl bg-linear-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 transition-all active:scale-95 font-black text-sm">
              <User className="w-4 h-4" />
              <span className="hidden lg:block text-sm tracking-wide">{t.nav.login}</span>
            </button>
          </div>
        </div>

        {/* ── Mobile search row ── */}
        <div className="md:hidden pb-2.5">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              placeholder={t.nav.searchPlaceholder}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/80 pl-10 pr-28 py-2.5 rounded-2xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 dark:focus:border-violet-500 transition-all"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {searchValue && (
                <button
                  type="button"
                  onClick={() => { setSearchValue(''); onSearchChange?.(''); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-violet-500'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
              >
                {t.nav.search}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Mobile drawer (right side) ── */}
      <div
        className={`fixed inset-0 z-100 transition-all duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-950 flex flex-col transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-500/25">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{t.nav.welcome}</p>
                <p className="text-xs text-violet-500 font-medium leading-tight mt-0.5">{t.nav.welcomeSubtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-800 dark:text-gray-200 transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3 font-semibold text-sm">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <LogIn className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                {t.nav.loginSignIn}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              <div className="flex items-center gap-3 font-semibold text-sm text-gray-800 dark:text-gray-200">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {isDark
                    ? <Sun className="w-4.5 h-4.5 text-violet-500" />
                    : <Moon className="w-4.5 h-4.5 text-violet-500" />
                  }
                </div>
                {t.nav.darkMode}
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${isDark ? 'bg-violet-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isDark ? 'left-6' : 'left-1'}`} />
              </div>
            </button>

            {/* Language */}
            <div className="p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Globe className="w-4.5 h-4.5 text-violet-500" />
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t.nav.language}</span>
                <span className="ml-auto text-xs text-violet-600 dark:text-violet-400 font-black">
                  {langLabels[language]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pl-12">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setIsMenuOpen(false); }}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all min-h-[44px] ${
                      language === lang.code
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800/80 space-y-1">
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
              <HelpCircle className="w-4 h-4" />
              {t.nav.helpCenter}
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
              <Info className="w-4 h-4" />
              {t.nav.about}
            </button>
            <div className="flex items-center gap-2 px-3 pt-2">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold tracking-widest uppercase">Bazarcom v2.5</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
