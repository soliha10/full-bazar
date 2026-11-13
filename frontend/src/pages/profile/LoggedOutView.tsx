import { Moon, Sun, Globe, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SEO, SITE_URL } from '../../components/SEO';
import { LANGUAGES as languages } from './languages';
import { Card } from "../../components/Card";

// ── Not logged in ──────────────────────────────────────────────────────────
export function LoggedOutView() {
  const { openLogin, openRegister } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      <SEO
        title={t.nav.profile}
        description={t.profile.seoDescription}
        noindex
        canonicalUrl={`${SITE_URL}/profile`}
      />

      {/* Mobile header */}
      <div className="sticky top-0 z-40 glass-bar border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl glass-soft active:scale-90 transition-all">
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-white">{t.nav.profile}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-24 h-24 rounded-3xl bg-violet-600 flex items-center justify-center"
        >
          <User className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.profile.loginTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {t.profile.loginSubtitle}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={openLogin}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm active:scale-95 transition-all"
          >
            {t.auth.login}
          </button>
          <button
            onClick={openRegister}
            className="w-full py-3.5 rounded-2xl border-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 font-semibold text-sm active:scale-95 transition-all"
          >
            {t.auth.register}
          </button>
        </motion.div>

        {/* Settings even without login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-xs mt-2"
        >
          <Card padding="none" className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Dark mode */}
            <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 rounded-t-2xl transition-colors">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-4 h-4 text-violet-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.darkMode}</span>
              </div>
              <div className={`w-10 h-5.5 rounded-full relative transition-colors ${isDark ? 'bg-violet-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isDark ? 'left-5.5' : 'left-0.5'}`} />
              </div>
            </button>
            {/* Language */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-2.5">
                <Globe className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.nav.language}</span>
              </div>
              <div className="flex gap-2">
                {languages.map(({ code, flag, label }) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      language === code
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'glass-soft text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
