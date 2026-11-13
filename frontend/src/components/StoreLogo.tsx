import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';

const SIZES = {
  xs: 'w-4 h-4 rounded text-[8px]',
  sm: 'w-5 h-5 rounded-md text-[10px]',
  md: 'w-7 h-7 rounded-lg text-xs',
  lg: 'w-10 h-10 rounded-xl text-sm',
} as const;

/**
 * Do'kon logotipi. Manzil /api/markets dan keladi (API uni do'kon saytidan
 * oladi) — mijozda logotiplar ro'yxati yo'q. Logotip bo'lmasa yoki
 * yuklanmasa — do'kon nomining bosh harfi.
 */
export function StoreLogo({ name, size = 'sm', className = '' }: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { markets } = useMarkets();
  const [failed, setFailed] = useState(false);
  const logo = markets.find(m => m.key === name.toLowerCase())?.logo;
  const box = `${SIZES[size]} shrink-0 inline-flex items-center justify-center overflow-hidden ${className}`;

  if (!logo || failed) {
    return (
      <span aria-hidden="true"
        className={`${box} glass-soft text-gray-500 dark:text-gray-400 font-semibold`}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className={`${box} bg-white ring-1 ring-black/5 dark:ring-white/10`}>
      <img src={logo} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)}
        className="w-full h-full object-contain" />
    </span>
  );
}
