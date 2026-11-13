import { Moon, Sun, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANGUAGES as languages } from './languages';
import { Card } from "../../components/Card";

/* Settings: tungi rejim, til va foydali havolalar */
export function SettingsBlock() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isDark = resolvedTheme === 'dark';
  return (
    <Card as={motion.div} padding="none"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.21, duration: 0.4 }}
      className="divide-y divide-gray-100 dark:divide-gray-800">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-4 pb-2">{t.profile.settings}</p>

      {/* Dark mode */}
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isDark
            ? <Moon className="w-4 h-4 text-violet-500" />
            : <Sun className="w-4 h-4 text-amber-500" />
          }
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.darkMode}</span>
        </div>
        <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${isDark ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${isDark ? 'left-6' : 'left-1'}`} />
        </div>
      </button>

      {/* Language */}
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.language}</span>
        </div>
        <div className="flex gap-2">
          {languages.map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                language === code
                  ? 'bg-violet-600 text-white'
                  : 'glass-soft text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* All products link */}
      <Link
        to="/products"
        className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.footer.allProducts}</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </Link>

      {/* Feedback link */}
      <Link
        to="/feedback"
        className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 rounded-b-2xl transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.feedback.leaveFeedback}</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </Link>
    </Card>
  );
}
