import { User, LogIn } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { UserMenu } from './UserMenu';

interface AuthButtonsProps {
  user: AuthUser | null;
  openLogin: () => void;
  logout: () => void;
}

/* ── Desktop auth (md+) ── */
export function DesktopAuth({ user, openLogin, logout }: AuthButtonsProps) {
  const { t } = useLanguage();
  if (user) return <UserMenu user={user} logout={logout} />;
  return (
    <button
      onClick={openLogin}
      className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl
        bg-violet-600 hover:bg-violet-700
        text-white font-black text-sm
        shadow-md shadow-violet-500/20
        active:scale-95 transition-all"
    >
      <LogIn className="w-4 h-4" />
      {t.nav.login}
    </button>
  );
}

/* ── Mobile auth (< md) ── — kirgan bo'lsa avatar profil varag'ini ochadi */
export function MobileAuth({ user, openLogin, onOpenProfile }: Omit<AuthButtonsProps, 'logout'> & { onOpenProfile: () => void }) {
  const { t } = useLanguage();
  if (user) {
    return (
      <button
        onClick={onOpenProfile}
        className="md:hidden w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-violet-700
          flex items-center justify-center text-white text-sm font-black
          shadow-sm shadow-violet-500/30 active:scale-90 transition-all shrink-0"
      >
        {user.name.charAt(0).toUpperCase()}
      </button>
    );
  }
  return (
    <button onClick={openLogin}
      className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl
        bg-linear-to-r from-violet-600 to-violet-700
        hover:from-violet-700 hover:to-violet-800
        text-white font-black text-sm
        shadow-md shadow-violet-500/20
        active:scale-95 transition-all">
      <User className="w-4 h-4" />
      <span className="hidden sm:block tracking-wide">{t.nav.login}</span>
    </button>
  );
}
