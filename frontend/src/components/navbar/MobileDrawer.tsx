import { ShoppingBag, X, HelpCircle, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AuthUser } from '../../contexts/AuthContext';
import { DrawerUserCard } from './DrawerUserCard';
import { DrawerNavLinks } from './DrawerNavLinks';
import { DrawerSettings } from './DrawerSettings';

interface MobileDrawerProps {
  isMenuOpen: boolean;
  closeMenu: () => void;
  user: AuthUser | null;
  logout: () => void;
  openLogin: () => void;
  openRegister: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  compareCount: number;
  favoritesCount: number;
}

/* Mobil yon menyu (< md). Har doim DOM da turadi — ochilish/yopilish
   opacity va translate bilan animatsiya qilinadi. */
export function MobileDrawer(props: MobileDrawerProps) {
  const { isMenuOpen, closeMenu, isDark, toggleTheme, compareCount, favoritesCount } = props;
  const { t } = useLanguage();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.menu}
      className={`fixed inset-0 z-200 md:hidden transition-opacity duration-300 ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`absolute inset-y-0 left-0 w-[300px] max-w-[88vw] flex flex-col
          bg-white dark:bg-gray-950
          border-r border-gray-100 dark:border-gray-800/60
          transition-transform duration-300
          ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ boxShadow: '6px 0 30px rgba(0,0,0,0.15)' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-gray-100 dark:border-gray-800/80">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-gray-900 dark:text-white leading-none">BAZARCOM</p>
              <p className="text-[8px] font-bold text-violet-400 tracking-[0.2em] uppercase leading-none mt-0.5">Price Compare</p>
            </div>
          </Link>
          <button
            onClick={closeMenu}
            aria-label={t.nav.closeMenu}
            className="w-8 h-8 flex items-center justify-center rounded-xl
              bg-gray-100 dark:bg-gray-800
              text-gray-500 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700
              active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <DrawerUserCard user={props.user} logout={props.logout} openLogin={props.openLogin}
          openRegister={props.openRegister} closeMenu={closeMenu} />

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          <DrawerNavLinks compareCount={compareCount} favoritesCount={favoritesCount} closeMenu={closeMenu} />

          {/* Divider */}
          <div className="mx-4 my-3 h-px bg-gray-100 dark:bg-gray-800/80" />

          <DrawerSettings isDark={isDark} toggleTheme={toggleTheme} closeMenu={closeMenu} />
        </div>

        {/* ── Footer ── */}
        <div
          className="px-3 py-2 shrink-0 border-t border-gray-100 dark:border-gray-800/80"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-1">
            <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
              text-[12px] font-medium text-gray-500 dark:text-gray-400
              hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20
              transition-colors">
              <HelpCircle className="w-4 h-4 shrink-0" />
              {t.nav.helpCenter}
            </button>
            <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
              text-[12px] font-medium text-gray-500 dark:text-gray-400
              hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20
              transition-colors">
              <Info className="w-4 h-4 shrink-0" />
              {t.nav.about}
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 pt-1">
            <Sparkles className="w-2.5 h-2.5 text-violet-400" />
            <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold tracking-[0.2em] uppercase">
              Bazarcom v2.5
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
