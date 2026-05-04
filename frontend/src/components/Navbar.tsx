import { useState, useEffect } from 'react';
import { Search, User, Moon, Sun, Globe, ShoppingBag, Menu, Mic, X, LogIn, ChevronRight, HelpCircle, Info, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/translations';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onSearchChange?: (value: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Local input value — tracks what the user is typing
  const [searchValue, setSearchValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });

  const [isListening, setIsListening] = useState(false);

  // Keep input in sync when the URL changes externally
  // (e.g. browser back/forward, or ProductListing clears search)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('search') || '';
    setSearchValue(urlQuery);
  }, [location.search]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchValue(transcript);
      onSearchChange?.(transcript); // Voice search can be immediate
    };

    recognition.start();
  };

  const handleTextChange = (value: string) => {
    setSearchValue(value);
  };

  // Debounced live-search in Navbar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('search') || '';
    
    // Don't trigger if it matches current URL (initial sync or already committed)
    if (searchValue.trim() === urlQuery) return;

    const timer = setTimeout(() => {
      onSearchChange?.(searchValue.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue, location.search, onSearchChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchValue.trim());
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' }
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Mobile Header Row */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-gray-900 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2 group mr-8">
              <div className="flex w-10 h-10 bg-[#0062FF] rounded-xl items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-blue-500/20">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-[#0062FF] ml-1">
                BAZARCOM
              </h1>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl">
            <form onSubmit={handleSubmit} className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#0062FF] transition-colors" />
              <input
                type="text"
                value={searchValue}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-14 pr-[7.5rem] py-3.5 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#0062FF]/20 focus:bg-white transition-all text-sm font-medium"
                onChange={(e) => handleTextChange(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={startVoiceSearch}
                  className={`p-1.5 rounded-full transition-all ${
                    isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#0062FF]'
                  }`}
                >
                  <Mic className="w-4 h-4 cursor-pointer" />
                </button>
                <button type="submit" className="bg-[#0062FF] hover:bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm">
                  {t.nav.search}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Desktop Icons & Mobile Quick Actions */}
          <div className="flex items-center gap-2 md:gap-6">
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <div className="relative group">
                <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 font-bold text-sm text-gray-700 hover:text-[#0062FF] transition-all">
                  <Globe className="w-4.5 h-4.5 text-gray-400" />
                  <span>{t.nav.language}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`block w-full text-left px-5 py-3 text-sm hover:bg-blue-50 hover:text-[#0062FF] transition-colors ${
                        language === lang.code ? 'text-[#0062FF] font-black' : 'text-gray-700 font-medium'
                      }`}
                    >
                      {lang.code === 'uz' ? "O'zbekcha" : lang.code === 'ru' ? 'Русский' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-[#0062FF] border border-transparent hover:border-blue-100 transition-all active:scale-95"
              >
                {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </button>

            {/* Login Button (Figma node 1-761) */}
            <button className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#0062FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95 group ml-2">
              <User className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black hidden lg:block tracking-wide">
                {t.nav.login}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row (Visible ONLY on mobile) */}
        <div className="md:hidden pb-4 mt-1">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchValue}
              placeholder={t.nav.searchPlaceholder}
              className="w-full bg-[#F3F4F6] pl-12 pr-28 py-4 rounded-full text-sm focus:outline-none placeholder-gray-400 text-gray-900 border border-transparent focus:border-blue-100 transition-all font-medium"
              onChange={(e) => handleTextChange(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                type="button"
                onClick={startVoiceSearch}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#0062FF]'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                type="submit"
                className="bg-[#0062FF] text-white px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
              >
                {t.nav.search}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu Drawer (Figma Side Menu) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-100 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          className={`absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="w-6 h-6 text-[#0062FF]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{t.nav.welcome}</p>
                <p className="text-xs text-gray-500">{t.nav.welcomeSubtitle}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-gray-900 transition-colors">
                <div className="flex items-center gap-3 font-semibold">
                  <LogIn className="w-5 h-5 text-gray-400" />
                  <span>{t.nav.loginSignIn}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <div className="h-px bg-gray-100 my-4 mx-2" />

              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 font-semibold">
                  {theme === 'light' ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
                  <span>{t.nav.darkMode}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#0062FF]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                </div>
              </button>

              <div className="relative group px-1">
                <div className="flex items-center gap-3 p-3 font-semibold text-gray-900">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span>{t.nav.language}</span>
                  <span className="ml-auto text-xs text-[#0062FF] font-bold">
                    {languages.find(l => l.code === language)?.label === 'UZ' ? "O'zbekcha" : 
                     languages.find(l => l.code === language)?.label === 'RU' ? "Русский" : "English"}
                  </span>
                </div>
                <div className="mt-1 space-y-1 pl-11">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsMenuOpen(false);
                      }}
                      className={`block w-full text-left py-2 text-sm transition-colors ${
                        language === lang.code ? 'text-[#0062FF] font-bold' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {lang.code === 'uz' ? "O'zbekcha" : lang.code === 'ru' ? 'Русский' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-gray-100 space-y-4">
            <button className="w-full flex items-center gap-3 text-sm font-semibold text-gray-500 hover:text-[#0062FF] transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span>{t.nav.helpCenter}</span>
            </button>
            <button className="w-full flex items-center gap-3 text-sm font-semibold text-gray-500 hover:text-[#0062FF] transition-colors">
              <Info className="w-5 h-5" />
              <span>{t.nav.about}</span>
            </button>
            <p className="text-[10px] text-gray-400 font-medium">VERSION 2.4.0</p>
          </div>
        </div>
      </div>
    </nav>
  );
}