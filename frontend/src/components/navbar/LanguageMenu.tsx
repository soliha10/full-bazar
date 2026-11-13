import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { languages } from './languages';

/* Language dropdown — desktop */
export function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  return (
    <div className="relative hidden lg:block">
      <button
        onClick={() => setIsLangOpen(v => !v)}
        aria-label={language.toUpperCase()}
        aria-expanded={isLangOpen}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium uppercase
          text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
          hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {language}
      </button>
      {isLangOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44
            glass glass-solid
            rounded-xl shadow-lg shadow-black/5
            overflow-hidden z-50">
            {languages.map((lang) => (
              <button key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                  language === lang.code
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium'
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
  );
}
