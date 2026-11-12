import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';

/* ══ CTA ══ */
// Pastki matn faqat solishtirsa bo'ladigan modellar soni kelganda chiqadi
export function CtaSection({ subtitle }: { subtitle: string | null }) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} className="px-4 py-10 md:py-16 max-w-7xl mx-auto">
      <div className="glass rounded-3xl p-7 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-gray-900 dark:text-white font-semibold text-xl md:text-3xl tracking-tight mb-2">{h.ctaTitle}</h2>
            {subtitle !== null && <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-xl">{subtitle}</p>}
          </div>
          <Link to="/products"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg px-6 py-3 text-sm transition-colors shrink-0">
            {h.ctaButton}
          </Link>
        </div>
      </div>
    </m.section>
  );
}
