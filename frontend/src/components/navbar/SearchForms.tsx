import { Search, Mic, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { NavbarSearch } from './useNavbarSearch';

/* Desktop qidiruv satri (md+) */
export function DesktopSearch({ search }: { search: NavbarSearch }) {
  const { t } = useLanguage();
  const { searchValue, setSearchValue, isListening, handleSubmit, startVoice, clearSearch } = search;
  return (
    <div className="hidden md:flex flex-1 max-w-2xl">
      <form onSubmit={handleSubmit} className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          placeholder={t.nav.searchPlaceholder}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-11 pr-[104px] py-2.5
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
            <button type="button" onClick={clearSearch}
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
          {/* Belgi ko'rinishidagi tugma — matnli variant maydonning
              128px ini egallab, qidiruv satrini siqib turardi. */}
          <button type="submit" title={t.nav.search} aria-label={t.nav.search}
            className="w-8 h-8 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all active:scale-90">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/* Mobil qidiruv qatori (< md) */
export function MobileSearch({ search }: { search: NavbarSearch }) {
  const { t } = useLanguage();
  const { searchValue, setSearchValue, isListening, handleSubmit, startVoice, clearSearch } = search;
  return (
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
              onClick={clearSearch}
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
  );
}
