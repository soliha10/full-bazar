import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/** Klaviatura foydalanuvchisi uchun: Tab bosilganda birinchi ko'rinadigan havola. */
export function SkipLink() {
  const { t } = useLanguage();
  return (
    <a href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] glass rounded-xl px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
      {t.nav.skipToContent}
    </a>
  );
}

/**
 * "/" — qidiruvga o'tish (ko'p saytlardagi odat). Matn yozilayotgan maydonda
 * ishlamaydi, aks holda "/" belgisini yozib bo'lmay qoladi.
 */
export function useSearchShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const input = Array.from(document.querySelectorAll<HTMLInputElement>('[data-global-search]'))
        // Ko'rinib turgani: bosh sahifada navbar qidiruvi yashirin (visibility: hidden)
        .find(i => i.offsetParent !== null && getComputedStyle(i).visibility !== 'hidden');
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
