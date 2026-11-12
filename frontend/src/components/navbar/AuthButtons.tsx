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
      className="hidden md:flex items-center px-4 py-2 rounded-lg
        bg-violet-600 hover:bg-violet-700
        text-white font-medium text-sm transition-colors"
    >
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
        aria-label={user.name}
        className="md:hidden w-9 h-9 rounded-full bg-violet-600
          flex items-center justify-center text-white text-sm font-medium shrink-0"
      >
        {user.name.charAt(0).toUpperCase()}
      </button>
    );
  }
  return (
    <button onClick={openLogin}
      className="md:hidden px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700
        text-white font-medium text-sm transition-colors">
      {t.nav.login}
    </button>
  );
}
