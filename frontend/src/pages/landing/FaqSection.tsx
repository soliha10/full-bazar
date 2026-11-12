import { m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 open:shadow-sm">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-sm md:text-base text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
    </details>
  );
}

/* ══ FAQ ══ */
// Javoblardagi {{updated}}/{{stores}}/{{list}} — haqiqiy ma'lumot bilan to'ldiriladi
export function FaqSection({ updated, storesCount, storeList }: {
  updated: string | null;
  storesCount: string;
  storeList: string;
}) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="faq-title" className="mt-12 md:mt-16 px-4 max-w-3xl mx-auto">
      <h2 id="faq-title" className="font-black text-gray-900 dark:text-white text-xl md:text-3xl mb-6 text-center tracking-tight">
        {h.faqTitle}
      </h2>
      <div className="space-y-2.5">
        {h.faq.map(item => (
          <FaqItem key={item.q} q={item.q}
            a={item.a
              .replace('{{updated}}', updated ?? '—')
              .replace('{{stores}}', storesCount)
              .replace('{{list}}', storeList || '—')} />
        ))}
      </div>
    </m.section>
  );
}
