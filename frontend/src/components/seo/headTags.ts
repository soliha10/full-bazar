/**
 * <head> teglarini yozuvchi yordamchilar. `owned` — shu komponent yaratgan
 * teglar ro'yxati: unmount'da faqat ular olib tashlanadi.
 */
export function makeHeadWriters(owned: Element[]) {
  const setMeta = (name: string, value: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
      owned.push(el);
    }
    el.setAttribute('content', value);
  };

  const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
    const selector = extra?.hreflang
      ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
      : `link[rel="${rel}"]`;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
      document.head.appendChild(el);
      owned.push(el);
    }
    el.setAttribute('href', href);
  };

  return { setMeta, setLink };
}
