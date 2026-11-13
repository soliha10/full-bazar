import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { reveal, SectionHeader } from './shared';
import { Card } from "../../components/Card";

/* ══ HOW IT WORKS ══ — uch qadam, desktopda bir chiziq bilan bog'langan */
export function StepsSection() {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="steps-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto">
      <SectionHeader id="steps-title" title={h.stepsTitle} />
      <ol className="relative grid md:grid-cols-3 gap-3 md:gap-4">
        <span aria-hidden="true"
          className="hidden md:block absolute top-[2.6rem] left-[16%] right-[16%] h-px bg-linear-to-r from-transparent via-violet-400/50 to-transparent" />
        {h.steps.map((step, idx) => (
          <Card as="li" interactive radius="3xl" padding="lg" key={step.title} className="relative card-rise md:p-6 flex gap-4 md:block"
            style={{ '--i': idx } as React.CSSProperties}>
            <span className="relative z-10 flex shrink-0 w-10 h-10 md:w-11 md:h-11 items-center justify-center rounded-2xl bg-violet-600 text-white text-sm font-semibold tabular-nums">
              {idx + 1}
            </span>
            <div><h3 className="md:mt-5 font-semibold text-gray-900 dark:text-white text-base">{step.title}</h3>
            <p className="mt-1.5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p></div>
          </Card>
        ))}
      </ol>
    </m.section>
  );
}
