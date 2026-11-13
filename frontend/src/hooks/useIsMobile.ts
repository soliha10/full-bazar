import { useEffect, useState } from 'react';

// Tailwind `sm` dan tor — telefon
const QUERY = '(max-width: 639px)';

/** Ekran telefon kengligidami (matnni qisqartirish kabi CSS qila olmaydigan holatlar uchun) */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}
