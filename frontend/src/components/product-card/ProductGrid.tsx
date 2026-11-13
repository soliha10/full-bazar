import type { ReactNode } from 'react';
import { COLUMNS_BESIDE_SIDEBAR, PAGE_COLUMNS, PAGE_GAP } from '../layout';

/**
 * Mahsulot kartalari setkasi — loyihadagi barcha mahsulot ro'yxatlari shu orqali,
 * shuning uchun karta o'lchami bosh sahifada ham, katalogda ham bir xil.
 * `besideSidebar` — katalog: filtr paneli sahifaning bitta ustunini olgan.
 */
export function ProductGrid({ children, besideSidebar = false, className = '' }: {
  children: ReactNode;
  besideSidebar?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid ${besideSidebar ? COLUMNS_BESIDE_SIDEBAR : PAGE_COLUMNS} ${PAGE_GAP} ${className}`}>
      {children}
    </div>
  );
}
