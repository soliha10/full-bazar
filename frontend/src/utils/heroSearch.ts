import { useSyncExternalStore } from 'react';

/*
 * Bosh sahifada bir vaqtda faqat BITTA qidiruv ko'rinsin: hero qidiruvi
 * ekranda bo'lsa navbar qidiruvi yashiriladi, hero ekrandan chiqqach
 * navbardagisi paydo bo'ladi. Hero holatni shu yerga yozadi, Navbar o'qiydi.
 */
let visible = false;
const listeners = new Set<() => void>();

export function setHeroSearchVisible(next: boolean) {
  if (next === visible) return;
  visible = next;
  listeners.forEach(fn => fn());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export function useHeroSearchVisible() {
  return useSyncExternalStore(subscribe, () => visible, () => false);
}
