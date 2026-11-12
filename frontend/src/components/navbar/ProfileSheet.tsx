import { LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { brandLabel } from '../../hooks/useBrands';
import { formatPhone } from '../../utils/authValidation';

interface ProfileSheetProps {
  user: AuthUser;
  logout: () => void;
  onClose: () => void;
}

/* ═══ MOBILE PROFILE SHEET ═══ */
export function ProfileSheet({ user, logout, onClose }: ProfileSheetProps) {
  const { t } = useLanguage();
  const BUDGET_LABELS: Record<string, string> = t.nav.budgetLevels;
  return (
    <div className="fixed inset-0 z-200 md:hidden">
      <button
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-950"
        style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* User header */}
        <div className="px-5 pt-3 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white font-semibold text-2xl shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email || formatPhone(user.phone)}</p>
            </div>
          </div>
        </div>

        {/* Profile stats */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t.nav.ageGroup}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{user.profile.ageGroup}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t.nav.budget}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{BUDGET_LABELS[user.profile.budgetLevel]}</p>
            </div>
          </div>
          {user.profile.preferredBrands.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">{t.nav.favoriteBrands}</p>
              <div className="flex flex-wrap gap-1.5">
                {user.profile.preferredBrands.map(b => (
                  <span key={b} className="text-xs font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full">
                    {brandLabel(b)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-5 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
              border border-red-200 dark:border-red-900/40
              text-red-500 font-semibold text-sm
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            {t.nav.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
