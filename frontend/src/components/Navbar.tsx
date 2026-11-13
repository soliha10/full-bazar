import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { useCompare } from '../contexts/CompareContext';
import { useNavbarSearch } from './navbar/useNavbarSearch';
import { NavLogo } from './navbar/NavLogo';
import { DesktopNavLinks } from './navbar/DesktopNavLinks';
import { DesktopSearch, MobileSearch } from './navbar/SearchForms';
import { useHeroSearchVisible } from '../utils/heroSearch';
import { LanguageMenu } from './navbar/LanguageMenu';
import { NavIconLinks } from './navbar/NavIconLinks';
import { DesktopAuth, MobileAuth } from './navbar/AuthButtons';
import { MobileDrawer } from './navbar/MobileDrawer';
import { ProfileSheet } from './navbar/ProfileSheet';

interface NavbarProps {
  onSearchChange?: (value: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const { favorites } = useFavorites();
  const { user, openLogin, openRegister, logout } = useAuth();
  const { watched } = usePriceWatch();
  const { compareIds } = useCompare();
  const search = useNavbarSearch(onSearchChange);
  // Bosh sahifada hero qidiruvi ko'rinib turganda navbardagisi yashirin
  const heroSearchVisible = useHeroSearchVisible();
  const concealSearch = location.pathname === '/' && heroSearchVisible;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  /* close drawer on route change */
  useEffect(() => { closeMenu(); }, [location.pathname, closeMenu]);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* body scroll lock */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <>
      {/* ════════════════════════════════════ NAV BAR ════════════════════════════════════ */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300
        glass-bar
        border-b border-white/60 dark:border-white/[0.06]
        ${scrolled ? 'shadow-sm shadow-black/5 dark:shadow-black/20' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-5">

          {/* ── Top row ── */}
          <div className="flex items-center justify-between h-14 md:h-16 gap-2">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label={t.nav.openMenu}
              aria-expanded={isMenuOpen}
              className="md:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-xl
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                active:scale-90 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            <NavLogo />
            <DesktopNavLinks />
            <DesktopSearch search={search} concealed={concealSearch} />

            {/* Spacer (mobile) */}
            <div className="flex-1 md:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">

              <LanguageMenu />
              <NavIconLinks
                compareCount={compareIds.length} favoritesCount={favorites.length}
                watchedCount={user ? watched.length : null}
                isDark={isDark} toggleTheme={toggleTheme}
              />
              <DesktopAuth user={user} openLogin={openLogin} logout={logout} />
              <MobileAuth user={user} openLogin={openLogin} onOpenProfile={() => setIsProfileSheetOpen(true)} />
            </div>
          </div>

          <MobileSearch search={search} concealed={concealSearch} />

        </div>
      </nav>

      {/* ════════════════════════════════════ DRAWER ════════════════════════════════════
          Rendered outside <nav> so it covers the full viewport without clipping.
      ═══════════════════════════════════════════════════════════════════════════════════ */}
      <MobileDrawer
        isMenuOpen={isMenuOpen} closeMenu={closeMenu}
        user={user} logout={logout} openLogin={openLogin} openRegister={openRegister}
        isDark={isDark} toggleTheme={toggleTheme}
        compareCount={compareIds.length} favoritesCount={favorites.length}
      />

      {isProfileSheetOpen && user && (
        <ProfileSheet user={user} logout={logout} onClose={() => setIsProfileSheetOpen(false)} />
      )}
    </>
  );
}
