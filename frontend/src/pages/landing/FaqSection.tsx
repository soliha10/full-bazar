import { m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';
import { Card } from "../../components/Card";

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <Card as="details" padding="none" className="group px-5 py-4 open:pb-5">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-sm md:text-base text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
    </Card>
  );
}

/* ══ FAQ ══ — chapda sarlavha va murojaat, o'ngda savollar.
   Javoblardagi {{updated}}/{{stores}}/{{list}} — haqiqiy ma'lumot bilan to'ldiriladi */
export function FaqSection({ updated, storesCount, storeList }: {
  updated: string | null;
  storesCount: string;
  storeList: string;
}) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="faq-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto grid md:grid-cols-[1fr_1.6fr] gap-6 md:gap-12">
      <div>
        <h2 id="faq-title" className="font-semibold text-gray-900 dark:text-white text-2xl md:text-3xl tracking-tight">{h.faqTitle}</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{h.faqSubtitle}</p>
        <Link to="/feedback" className="mt-5 inline-flex glass-soft rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
          {h.faqContact}
        </Link>
      </div>
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
