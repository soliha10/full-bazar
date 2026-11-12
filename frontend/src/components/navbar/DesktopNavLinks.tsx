import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

/* Desktop nav links.
   "Taqqoslash" ataylab yo'q: u o'ng tarafda belgi sifatida turadi
   va tanlangan mahsulotlar sonini ko'rsatadi — matnli havola
   o'sha joyning takrori edi.
   "Fikr" ham olib tashlandi: u kunda bir bosiladigan havola emas,
   lekin qidiruv maydonidan joy yeb turardi. Endi profil menyusida
   va footerda. */
export function DesktopNavLinks() {
  const { t } = useLanguage();
  const location = useLocation();
  return (
    <nav className="hidden md:flex items-center gap-0.5 mr-2 shrink-0">
      {[
        { path: '/products', label: t.nav.catalog },
        { path: '/trends',   label: t.nav.analysis },
      ].map(({ path, label }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <Link key={path} to={path}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
