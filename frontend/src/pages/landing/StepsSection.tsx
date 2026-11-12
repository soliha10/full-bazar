import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal } from './shared';

/* ══ HOW IT WORKS ══ */
export function StepsSection() {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="steps-title" className="mt-12 md:mt-20 py-10 md:py-14">
      <div className="px-4 max-w-7xl mx-auto">
        <h2 id="steps-title" className="font-semibold text-gray-900 dark:text-white text-xl md:text-2xl mb-6 md:mb-10 tracking-tight">
          {h.stepsTitle}
        </h2>
        <ol className="grid md:grid-cols-3 gap-5 md:gap-10">
          {h.steps.map((step, idx) => (
            <li key={step.title} className="glass glass-hover rounded-2xl p-5 md:p-6 flex md:flex-col items-start gap-3">
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400 tabular-nums shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-base mb-1">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </m.section>
  );
}
