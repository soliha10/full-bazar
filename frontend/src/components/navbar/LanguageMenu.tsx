import { useState } from 'react';
import { Globe } from 'lucide-react';
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
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl
          hover:bg-violet-50 dark:hover:bg-violet-900/30
          text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400
          font-semibold text-sm transition-all"
      >
        <Globe className="w-4 h-4" />
        <span className="font-black text-xs uppercase tracking-wider hidden xl:block">{language}</span>
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
  );
}
