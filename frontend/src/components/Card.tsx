import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode, type Ref } from 'react';

// Loyihadagi barcha kartalar — shisha sirt (index.css dagi .glass); karta
// ko'rinishi faqat shu yerda o'zgartiriladi, sahifalarda qo'lda yozilmaydi.
const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' } as const;
const RADIUS = { xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' } as const;

type OwnProps<T extends ElementType> = {
  /** Qaysi element sifatida chiziladi: section, li, details, Link, button... */
  as?: T;
  /** Zich shisha — ostidagi kontent ko'rinmasligi kerak bo'lgan joyda (tooltip, ro'yxat, dasta) */
  solid?: boolean;
  /** Bosiladigan karta — hover da biroz ko'tariladi */
  interactive?: boolean;
  padding?: keyof typeof PADDING;
  radius?: keyof typeof RADIUS;
  className?: string;
  children?: ReactNode;
};

export type CardProps<T extends ElementType = 'div'> = OwnProps<T>
  & Omit<ComponentPropsWithoutRef<T>, keyof OwnProps<T>>
  & { ref?: Ref<Element> };

/** Shisha karta. Joylashuv klasslari (flex, h-full, overflow...) className orqali. */
// forwardRef — ref (masalan, framer-motion layout uchun) ichki elementga yetib borsin;
// generic `as` turi forwardRef da yo'qoladi, shuning uchun tashqi tur qayta beriladi
export const Card = forwardRef(function Card(
  { as, solid, interactive, padding = 'md', radius = '2xl', className = '', ...rest }: CardProps<ElementType>,
  ref: Ref<Element>,
) {
  const Tag: ElementType = as ?? 'div';
  const cls = ['glass', solid && 'glass-solid', interactive && 'glass-hover', RADIUS[radius], PADDING[padding], className]
    .filter(Boolean).join(' ');
  return <Tag ref={ref} className={cls} {...rest} />;
}) as <T extends ElementType = 'div'>(props: CardProps<T>) => ReactElement | null;

/** Karta sarlavhasi: chapda nom (h2), o'ngda qisqa izoh yoki boshqaruv. */
export function CardHeader({ id, title, aside, className = 'mb-2' }: {
  id?: string;
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <h2 id={id} className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      {aside != null && <span className="text-xs text-gray-500 dark:text-gray-400">{aside}</span>}
    </div>
  );
}
