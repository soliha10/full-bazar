import { useEffect, useState } from 'react';

/** CSS media so'rovi hozir mos keladimi (matnni almashtirish kabi CSS qila olmaydigan holatlar uchun) */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Tailwind `sm` dan tor — telefon */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}
