import { useLanguage } from '../../contexts/LanguageContext';
import { SearchBox } from '../search/SearchBox';
import type { NavbarSearch } from './useNavbarSearch';

/* Desktop qidiruv satri (md+). Yashirilganda ham joyini saqlaydi — navbar
   elementlari sakrab ketmasin (bosh sahifada hero qidiruvi ko'rinib turganda). */
export function DesktopSearch({ search, concealed = false }: { search: NavbarSearch; concealed?: boolean }) {
  const { t } = useLanguage();
  return (
    <div aria-hidden={concealed || undefined}
      className={`hidden md:flex flex-1 max-w-2xl transition-all duration-300 ${concealed ? 'opacity-0 -translate-y-1 pointer-events-none invisible' : 'opacity-100'}`}>
      <SearchBox variant="nav" value={search.value} placeholder={t.nav.searchPlaceholder}
        onSubmit={search.submit} globalShortcut />
    </div>
  );
}

/* Mobil qidiruv qatori (< md) */
export function MobileSearch({ search, concealed = false }: { search: NavbarSearch; concealed?: boolean }) {
  const { t } = useLanguage();
  return (
    <div aria-hidden={concealed || undefined}
      className={`md:hidden grid transition-all duration-300 ${concealed ? 'grid-rows-[0fr] opacity-0 invisible' : 'grid-rows-[1fr] opacity-100 pb-2.5'}`}>
      {/* overflow faqat yopiq paytda — ochiq holatda takliflar ro'yxati kesilmasin */}
      <div className={concealed ? 'overflow-hidden' : ''}>
        <SearchBox variant="mobile" value={search.value} placeholder={t.nav.searchPlaceholder}
          onSubmit={search.submit} globalShortcut />
      </div>
    </div>
  );
}
