import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';

/* ══ HOW IT WORKS ══ */
export function StepsSection() {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="steps-title" className="mt-12 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-10 md:py-16">
      <div className="px-4 max-w-7xl mx-auto">
        <h2 id="steps-title" className="font-black text-gray-900 dark:text-white text-xl md:text-3xl mb-6 md:mb-10 text-center tracking-tight">
          {h.stepsTitle}
        </h2>
        <ol className="grid md:grid-cols-3 gap-3 md:gap-6">
          {h.steps.map((step, idx) => (
            <li key={step.title} className="relative flex md:flex-col items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-gray-100 dark:border-gray-700 shadow-sm">
              <span className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-violet-500/30">
                {idx + 1}
              </span>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base mb-1">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </m.section>
  );
}
