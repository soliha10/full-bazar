import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';

/* ══ CTA ══ — pastki matn faqat solishtirsa bo'ladigan modellar soni kelganda chiqadi */
export function CtaSection({ subtitle }: { subtitle: string | null }) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} className="px-4 pt-14 pb-6 md:pt-24 md:pb-10 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] bg-violet-600 px-7 py-10 md:px-14 md:py-14 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0
          bg-[radial-gradient(40rem_20rem_at_50%_-20%,rgba(255,255,255,0.22),transparent_70%)]" />
        <h2 className="relative text-white font-semibold text-2xl md:text-4xl tracking-tight">{h.ctaTitle}</h2>
        {subtitle !== null && <p className="relative mt-3 text-violet-100 text-sm md:text-base max-w-xl mx-auto">{subtitle}</p>}
        <Link to="/products"
          className="relative mt-7 inline-flex items-center justify-center rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-medium px-7 py-3 text-sm transition-colors">
          {h.ctaButton}
        </Link>
      </div>
    </m.section>
  );
}
