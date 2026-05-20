import { useState, useEffect, useCallback } from 'react';
import {
  Search, User, Moon, Sun, Globe, ShoppingBag, Menu, Mic, X,
  LogIn, HelpCircle, Info, Sparkles, Heart, ChevronRight,
  Home, Package, LogOut,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onSearchChange?: (value: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const { favorites } = useFavorites();
  const { user, openLogin, openRegister, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchValue, setSearchValue] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('search') || '';
  });

  const isDark = resolvedTheme === 'dark';
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  /* sync search input with url */
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setSearchValue(p.get('search') || '');
  }, [location.search]);

  /* close drawer on route change */
  useEffect(() => { closeMenu(); }, [location.pathname, closeMenu]);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* body scroll lock */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  /* debounced search */
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (searchValue.trim() === (p.get('search') || '')) return;
    const id = setTimeout(() => onSearchChange?.(searchValue.trim()), 400);
    return () => clearTimeout(id);
  }, [searchValue, location.search, onSearchChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchValue.trim());
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearchValue(text);
      onSearchChange?.(text.trim());
    };
    r.start();
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
    { code: 'en', label: 'English',   flag: '🇬🇧' },
  ];

  const navLinks = [
    { icon: Home,    label: t.nav.home,       path: '/',         count: 0               },
    { icon: Package, label: 'Katalog',         path: '/products', count: 0               },
    { icon: Heart,   label: t.footer.wishlist, path: '/wishlist', count: favorites.length },
  ];

  return (
    <>
      {/* ════════════════════════════════════ NAV BAR ════════════════════════════════════ */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300
        bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl
        border-b border-gray-100 dark:border-gray-800/60
        ${scrolled ? 'shadow-sm shadow-black/5 dark:shadow-black/20' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-5">

          {/* ── Top row ── */}
          <div className="flex items-center justify-between h-14 md:h-16 gap-2">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Menyuni ochish"
              aria-expanded={isMenuOpen}
              className="md:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-xl
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                active:scale-90 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
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

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <form onSubmit={handleSubmit} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  placeholder={t.nav.searchPlaceholder}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-11 pr-32 py-2.5
                    bg-gray-50 dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    rounded-2xl text-sm font-medium
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:outline-none focus:ring-2 focus:ring-violet-400/30
                    focus:border-violet-400 dark:focus:border-violet-500
                    focus:bg-white dark:focus:bg-gray-800
                    transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchValue && (
                    <button type="button" onClick={() => { setSearchValue(''); onSearchChange?.(''); }}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={startVoice}
                    className={`p-1.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-50 text-red-500 animate-pulse'
                        : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30'
                    }`}>
                    <Mic className="w-4 h-4" />
                  </button>
                  <button type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all">
                    {t.nav.search}
                  </button>
                </div>
              </form>
            </div>

            {/* Spacer (mobile) */}
            <div className="flex-1 md:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Language dropdown — desktop */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsLangOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                    hover:bg-violet-50 dark:hover:bg-violet-900/30
                    text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400
                    font-semibold text-sm transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-black text-xs uppercase tracking-wider">{language}</span>
                </button>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-44
                      bg-white dark:bg-gray-900
                      border border-gray-100 dark:border-gray-700
                      rounded-2xl shadow-xl shadow-black/10
                      overflow-hidden z-50">
                      {languages.map((lang) => (
                        <button key={lang.code}
                          onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                            language === lang.code
                              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-black'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                          }`}>
                          <span className="text-base">{lang.flag}</span>
                          <span className="flex-1 text-left">{lang.label}</span>
                          {language === lang.code && <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Favorites — desktop */}
              <Link to="/wishlist"
                className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-xl
                  bg-gray-50 dark:bg-gray-800
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  text-gray-500 dark:text-gray-400 hover:text-red-500
                  transition-all active:scale-90">
                <Heart className={`w-4 h-4 transition-colors ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {favorites.length > 9 ? '9+' : favorites.length}
                  </span>
                )}
              </Link>

              {/* Theme toggle — desktop */}
              <button onClick={toggleTheme} aria-label="Mavzuni o'zgartirish"
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl
                  bg-gray-50 dark:bg-gray-800
                  hover:bg-violet-50 dark:hover:bg-violet-900/30
                  text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400
                  transition-all active:scale-90">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Login / User */}
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="hidden sm:flex flex-col items-end leading-none mr-1">
                    <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 truncate max-w-[80px]">{user.name}</span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[80px]">{user.email}</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button onClick={logout} aria-label="Chiqish"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={openLogin} className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-linear-to-r from-violet-600 to-violet-700
                  hover:from-violet-700 hover:to-violet-800
                  text-white font-black text-sm
                  shadow-md shadow-violet-500/20
                  active:scale-95 transition-all">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block tracking-wide">{t.nav.login}</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile search row ── */}
          <div className="md:hidden pb-2.5">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                placeholder={t.nav.searchPlaceholder}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-10
                  bg-gray-50 dark:bg-gray-900
                  border border-gray-200 dark:border-gray-700/80
                  pl-10 pr-26 rounded-2xl
                  text-sm text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-violet-400/30
                  focus:border-violet-400 dark:focus:border-violet-500
                  transition-all"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {searchValue ? (
                  <button type="button"
                    onClick={() => { setSearchValue(''); onSearchChange?.(''); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button type="button" onClick={startVoice}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-violet-500'
                    }`}>
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}
                <button type="submit"
                  className="bg-violet-600 active:bg-violet-700 text-white px-3 h-7 rounded-xl text-[11px] font-black tracking-wide transition-all">
                  {t.nav.search}
                </button>
              </div>
            </form>
          </div>

        </div>
      </nav>

      {/* ════════════════════════════════════ DRAWER ════════════════════════════════════
          Rendered outside <nav> so it covers the full viewport without clipping.
      ═══════════════════════════════════════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigatsiya menyusi"
        className={`fixed inset-0 z-200 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={`absolute inset-y-0 left-0 w-[300px] max-w-[88vw] flex flex-col
            bg-white dark:bg-gray-950
            border-r border-gray-100 dark:border-gray-800/60
            transition-transform duration-300
            ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ boxShadow: '6px 0 30px rgba(0,0,0,0.15)' }}
        >

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-gray-100 dark:border-gray-800/80">
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/25">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black tracking-tight text-gray-900 dark:text-white leading-none">BAZARCOM</p>
                <p className="text-[8px] font-bold text-violet-400 tracking-[0.2em] uppercase leading-none mt-0.5">Price Compare</p>
              </div>
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Menyuni yopish"
              className="w-8 h-8 flex items-center justify-center rounded-xl
                bg-gray-100 dark:bg-gray-800
                text-gray-500 dark:text-gray-400
                hover:bg-gray-200 dark:hover:bg-gray-700
                active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── User / Login card ── */}
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 to-violet-800 p-4">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5" />
              {user ? (
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-white text-base font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-white leading-none truncate">{user.name}</p>
                    <p className="text-[11px] text-white/65 font-medium leading-none mt-1 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => { logout(); closeMenu(); }}
                    className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition-transform">
                    <LogOut className="w-3 h-3" />
                    Chiqish
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-white leading-none truncate">{t.nav.welcome}</p>
                    <p className="text-[11px] text-white/65 font-medium leading-none mt-1 truncate">{t.nav.welcomeSubtitle}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => { openLogin(); closeMenu(); }}
                      className="flex items-center gap-1.5 bg-white text-violet-700 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform">
                      <LogIn className="w-3 h-3" />
                      {t.nav.login}
                    </button>
                    <button onClick={() => { openRegister(); closeMenu(); }}
                      className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
                      Ro'yxat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* Nav links */}
            <div className="px-3 pt-3">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] px-2 mb-2">
                Menyu
              </p>
              <div className="space-y-0.5">
                {navLinks.map(({ icon: Icon, label, path, count }) => {
                  const isActive = path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-violet-50 dark:bg-violet-950/70'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-violet-600 shadow-sm shadow-violet-500/40'
                          : 'bg-gray-100 dark:bg-gray-800/80'
                      }`}>
                        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <span className={`flex-1 text-sm leading-none ${
                        isActive
                          ? 'font-black text-violet-700 dark:text-violet-300'
                          : 'font-semibold text-gray-800 dark:text-gray-200'
                      }`}>
                        {label}
                      </span>
                      {count > 0 ? (
                        <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                          path === '/wishlist' ? 'bg-red-500 text-white' : 'bg-violet-600 text-white'
                        }`}>
                          {count > 9 ? '9+' : count}
                        </span>
                      ) : (
                        <ChevronRight className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-violet-400' : 'text-gray-300 dark:text-gray-700'
                        }`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 my-3 h-px bg-gray-100 dark:bg-gray-800/80" />

            {/* Settings */}
            <div className="px-3 pb-3">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] px-2 mb-2">
                Sozlamalar
              </p>

              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  hover:bg-gray-50 dark:hover:bg-gray-900/50
                  active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center shrink-0">
                  {isDark
                    ? <Sun className="w-[18px] h-[18px] text-amber-400" />
                    : <Moon className="w-[18px] h-[18px] text-slate-500" />
                  }
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none">
                  {t.nav.darkMode}
                </span>
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
                  isDark ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    isDark ? 'left-6' : 'left-1'
                  }`} />
                </div>
              </button>

              {/* Language */}
              <div className="mt-1">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center shrink-0">
                    <Globe className="w-[18px] h-[18px] text-violet-500" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none">
                    {t.nav.language}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 px-3 pb-1">
                  {languages.map(({ code, flag }) => (
                    <button
                      key={code}
                      onClick={() => { setLanguage(code); closeMenu(); }}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        language === code
                          ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-base leading-none">{flag}</span>
                      <span className="uppercase tracking-wider leading-none">{code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="px-3 py-2 shrink-0 border-t border-gray-100 dark:border-gray-800/80"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex gap-1">
              <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
                text-[12px] font-medium text-gray-500 dark:text-gray-400
                hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20
                transition-colors">
                <HelpCircle className="w-4 h-4 shrink-0" />
                {t.nav.helpCenter}
              </button>
              <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
                text-[12px] font-medium text-gray-500 dark:text-gray-400
                hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20
                transition-colors">
                <Info className="w-4 h-4 shrink-0" />
                {t.nav.about}
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-3 pt-1">
              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
              <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold tracking-[0.2em] uppercase">
                Bazarcom v2.5
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
