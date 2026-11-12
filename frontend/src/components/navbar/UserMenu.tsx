import { useState } from 'react';
import { LogOut, ChevronDown, MessageSquareHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { brandLabel } from '../../hooks/useBrands';
import { formatPhone } from '../../utils/authValidation';

/* Desktop profil menyusi (md+) — avatar tugmasi va ochiladigan panel */
export function UserMenu({ user, logout }: { user: AuthUser; logout: () => void }) {
  const { t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const BUDGET_LABELS: Record<string, string> = t.nav.budgetLevels;
  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsUserMenuOpen(v => !v)}
        className="flex items-center gap-1 p-1 rounded-xl
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-all active:scale-[0.97]"
      >
        <div className="w-8 h-8 rounded-xl bg-violet-600
          flex items-center justify-center text-white text-sm font-semibold shrink-0
         ">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
          isUserMenuOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isUserMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64
            bg-white dark:bg-gray-900
            border border-gray-100 dark:border-gray-700
            rounded-2xl shadow-xl shadow-black/10
            overflow-hidden z-50">

            {/* User header */}
            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/60
              border-b border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600
                  flex items-center justify-center text-white font-semibold text-base shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                    {user.email || formatPhone(user.phone)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile details */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{t.nav.profile}</p>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.nav.age}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{user.profile.ageGroup}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.nav.budget}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{BUDGET_LABELS[user.profile.budgetLevel]}</p>
                </div>
              </div>
              {user.profile.preferredBrands.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">{t.nav.brands}</p>
                  <div className="flex flex-wrap gap-1">
                    {user.profile.preferredBrands.slice(0, 4).map(b => (
                      <span key={b} className="text-[10px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                        {brandLabel(b)}
                      </span>
                    ))}
                    {user.profile.preferredBrands.length > 4 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">+{user.profile.preferredBrands.length - 4} ta</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Yuqoridagi navigatsiyadan olib tashlangan havolalar
                shu yerda: kam ishlatiladi, lekin yo'qolib qolmasligi kerak. */}
            <div className="p-1.5 border-b border-gray-100 dark:border-gray-800">
              <Link
                to="/feedback"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                  text-sm font-bold text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  transition-colors active:scale-[0.98]"
              >
                <MessageSquareHeart className="w-4 h-4 shrink-0" />
                {t.nav.feedback}
              </Link>
            </div>

            {/* Logout */}
            <div className="p-1.5">
              <button
                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                  text-sm font-bold text-red-500
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  transition-colors active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {t.nav.logout}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
