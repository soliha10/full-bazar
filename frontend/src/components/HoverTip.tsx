import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Tip { text: string; x: number; y: number; below: boolean }

const GAP = 8;
const EDGE = 8;

/**
 * Ikonka nomi — sichqoncha ustida yoki klaviatura fokusida darhol chiqadigan
 * yozuv. Elementga `data-tip="..."` qo'yiladi (ekran o'quvchi uchun aria-label
 * alohida). Brauzerning `title` yozuvi kechikib chiqadi va uslubsiz; bu esa
 * sahifa tepasida (fixed) chiziladi — overflow li konteyner ichida ham kesilmaydi.
 */
export function HoverTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    let current: Element | null = null;
    const show = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.('[data-tip]') ?? null;
      if (el === current) return;
      current = el;
      const text = el?.getAttribute('data-tip');
      if (!el || !text) return setTip(null);
      const r = el.getBoundingClientRect();
      // Tepada joy bo'lmasa — pastda
      const below = r.top < 40;
      setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + GAP : r.top - GAP, below });
    };
    const hide = () => { current = null; setTip(null); };
    document.addEventListener('pointerover', show);
    document.addEventListener('focusin', show);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('pointerover', show);
      document.removeEventListener('focusin', show);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  // Ekran chetidan chiqib ketmasin: chizilgandan keyin o'lchab, ichkariga suriladi
  useLayoutEffect(() => {
    const el = ref.current;
    if (!tip || !el) return setShift(0);
    const w = el.offsetWidth;
    const left = tip.x - w / 2, right = tip.x + w / 2;
    setShift(left < EDGE ? EDGE - left : right > window.innerWidth - EDGE ? window.innerWidth - EDGE - right : 0);
  }, [tip]);

  if (!tip) return null;
  return (
    <div ref={ref} role="tooltip" aria-hidden="true"
      className="pointer-events-none fixed z-[100] whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-gray-900"
      style={{ left: tip.x + shift, top: tip.y, transform: `translate(-50%, ${tip.below ? '0' : '-100%'})` }}>
      {tip.text}
    </div>
  );
}
