import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../locales/translations';

export type VoiceError = 'denied' | 'mic' | 'no-speech' | 'network' | 'generic';

// Brauzer nutqni aniqlash tili. Chrome o'zbek tilini qo'llaydi; qo'llamagan
// brauzerda (Safari) rus tiliga o'tiladi — do'kon nomlari baribir lotincha.
const LANGS: Record<Language, string[]> = { uz: ['uz-UZ', 'ru-RU'], ru: ['ru-RU'], en: ['en-US'] };
const MAX_LISTEN_MS = 10_000;

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
};

const Ctor = (): (new () => Recognition) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => Recognition) | null;
};

/**
 * Ovozli qidiruv (Web Speech API). Bosilganda tinglaydi, yana bosilsa
 * to'xtaydi; aytilayotgan matn `onInterim` ga jonli keladi, gap tugaganda
 * `onFinal` chaqiriladi. Brauzer qo'llamasa `supported = false` — tugma
 * umuman ko'rsatilmaydi.
 */
export function useVoiceSearch({ language, onInterim, onFinal }: {
  language: Language;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
}) {
  const supported = Ctor() !== null;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const handlers = useRef({ onInterim, onFinal });
  handlers.current = { onInterim, onFinal };

  const listen = useCallback((langIndex: number) => {
    const SR = Ctor();
    if (!SR) return;
    const r = new SR();
    r.lang = LANGS[language][langIndex] ?? LANGS[language][0];
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let finalText = '';
    let retryLang = false;
    let timer = 0;

    r.onstart = () => { setListening(true); timer = window.setTimeout(() => r.stop(), MAX_LISTEN_MS); };
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += piece; else interim += piece;
      }
      handlers.current.onInterim(`${finalText}${interim}`.trim());
    };
    r.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'language-not-supported' && langIndex + 1 < LANGS[language].length) { retryLang = true; return; }
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied'
        : e.error === 'audio-capture' ? 'mic'
        : e.error === 'no-speech' ? 'no-speech'
        : e.error === 'network' ? 'network' : 'generic');
    };
    r.onend = () => {
      window.clearTimeout(timer);
      recRef.current = null;
      setListening(false);
      if (retryLang) { listen(langIndex + 1); return; }
      const text = finalText.trim();
      if (text) handlers.current.onFinal(text);
    };
    recRef.current = r;
    try { r.start(); } catch { recRef.current = null; setError('generic'); }
  }, [language]);

  const toggle = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); return; }
    setError(null);
    listen(0);
  }, [listen]);

  // Sahifadan chiqilganda mikrofon yoniq qolib ketmasin
  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, error, toggle, clearError: () => setError(null) };
}
