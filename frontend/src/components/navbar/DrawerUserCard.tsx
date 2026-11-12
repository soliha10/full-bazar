import { User, LogIn, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { formatPhone } from '../../utils/authValidation';

interface DrawerUserCardProps {
  user: AuthUser | null;
  logout: () => void;
  openLogin: () => void;
  openRegister: () => void;
  closeMenu: () => void;
}

/* ── User / Login card ── */
export function DrawerUserCard({ user, logout, openLogin, openRegister, closeMenu }: DrawerUserCardProps) {
  const { t } = useLanguage();
  return (
    <div className="px-3 pt-3 pb-1 shrink-0">
      <div className="relative overflow-hidden rounded-2xl bg-violet-600 p-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5" />
        {user ? (
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-white text-base font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-none truncate">{user.name}</p>
              <p className="text-[11px] text-white/65 font-medium leading-none mt-1 truncate">{user.email || formatPhone(user.phone)}</p>
            </div>
            <button onClick={() => { logout(); closeMenu(); }}
              className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition-transform">
              <LogOut className="w-3 h-3" />
              {t.nav.logout}
            </button>
          </div>
        ) : (
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-none truncate">{t.nav.welcome}</p>
              <p className="text-[11px] text-white/65 font-medium leading-none mt-1 truncate">{t.nav.welcomeSubtitle}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => { openLogin(); closeMenu(); }}
                className="flex items-center gap-1.5 bg-white text-violet-700 text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform">
                <LogIn className="w-3 h-3" />
                {t.nav.login}
              </button>
              <button onClick={() => { openRegister(); closeMenu(); }}
                className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
                {t.auth.register}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
