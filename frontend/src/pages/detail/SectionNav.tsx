import { useEffect, useState } from "react";

/**
 * Bo'limlar menyusi — yopishqoq, joriy bo'lim belgilanadi (PriceRunner, Idealo
 * kabi). Ilgari mobilda tablar kontentni yashirardi; endi hamma bo'lim
 * ketma-ket ko'rinadi, menyu faqat tez o'tish uchun.
 */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(entries => {
      const seen = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen[0]) setActive(seen[0].target.id);
    }, { rootMargin: '-140px 0px -55% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-[64px] z-30 -mx-4 sm:mx-0 mt-8 md:mt-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <ul className="flex gap-1 overflow-x-auto px-4 sm:px-0 [scrollbar-width:none]">
        {items.map(i => (
          <li key={i.id} className="shrink-0">
            <a href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}
              className={`block px-3 py-3 -mb-px border-b-2 text-sm font-medium transition-colors ${
                active === i.id
                  ? 'border-violet-600 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
