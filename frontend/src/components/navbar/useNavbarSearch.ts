import { useLocation } from 'react-router-dom';

/**
 * Navbar qidiruvi: maydondagi qiymat katalog URL idagi `search` bilan bir xil,
 * yuborish — katalogga o'tish. Ilgari desktopda har harfdan 0.5 s keyin
 * sahifa o'zi /products ga o'tib ketardi (boshqa sahifada yozib turgan
 * odamni ham) — endi faqat Enter, tugma, ovoz yoki taklif tanlanganda.
 */
export function useNavbarSearch(onSearchChange: ((value: string) => void) | undefined) {
  const location = useLocation();
  const value = location.pathname === '/products'
    ? new URLSearchParams(location.search).get('search') || ''
    : '';
  return { value, submit: (q: string) => onSearchChange?.(q) };
}

export type NavbarSearch = ReturnType<typeof useNavbarSearch>;
