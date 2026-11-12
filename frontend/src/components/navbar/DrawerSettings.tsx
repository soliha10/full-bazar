import { Moon, Sun, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { languages } from './languages';

interface DrawerSettingsProps {
  isDark: boolean;
  toggleTheme: () => void;
  closeMenu: () => void;
}

/* Settings — tungi rejim va til tanlash */
export function DrawerSettings({ isDark, toggleTheme, closeMenu }: DrawerSettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="px-3 pb-3">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] px-2 mb-2">
        {t.common.settings}
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
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                language === code
                  ? 'bg-violet-600 text-white'
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
  );
}
