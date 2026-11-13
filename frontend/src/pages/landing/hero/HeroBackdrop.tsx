/**
 * Hero foni: sekin suzuvchi uchta "aurora" nuri (sayt aksenti — binafsha,
 * fuksiya, osmon rang) va chetlarga qarab so'nadigan nozik setka. Faqat CSS
 * (index.css: .aurora, .hero-grid); "kamroq harakat" sozlamasida to'xtaydi.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-grid absolute inset-0" />
      <div className="aurora absolute -top-32 left-[8%] h-[26rem] w-[26rem] rounded-full bg-violet-500/25 blur-3xl dark:bg-violet-600/25" />
      <div className="aurora absolute top-10 right-[6%] h-[22rem] w-[22rem] rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15"
        style={{ animationDelay: '-6s' }} />
      <div className="aurora absolute -bottom-40 left-[35%] h-[24rem] w-[24rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
        style={{ animationDelay: '-12s' }} />
    </div>
  );
}
