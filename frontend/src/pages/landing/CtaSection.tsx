import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-indigo-900 p-7 md:p-14 shadow-xl shadow-violet-500/20">
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-white/[0.06] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-white font-black text-2xl md:text-4xl tracking-tight mb-2">{h.ctaTitle}</h2>
            {subtitle !== null && <p className="text-white/75 text-sm md:text-base max-w-xl">{subtitle}</p>}
          </div>
          <Link to="/products"
            className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-4 text-sm md:text-base shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all shrink-0">
            {h.ctaButton}
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </m.section>
  );
}
