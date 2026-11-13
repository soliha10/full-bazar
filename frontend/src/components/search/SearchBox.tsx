import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Mic, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchSuggest } from '../../hooks/useSearchSuggest';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { SuggestList, toItems, type SuggestItem } from './SuggestList';

const VARIANTS = {
  // Telefonda boshidagi lupa yashirin — tugmaning o'zida lupa bor, joy namunaga qolsin
  hero:   { box: 'glass rounded-2xl p-1.5 gap-2', input: 'py-3 pl-2 sm:pl-1 text-sm md:text-base', icon: 'hidden sm:block w-5 h-5 ml-2.5' },
  nav:    { box: 'rounded-2xl border border-gray-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur p-1 gap-1.5', input: 'py-1.5 text-sm', icon: 'w-4 h-4 ml-3' },
  mobile: { box: 'rounded-2xl border border-gray-900/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] p-1 gap-1', input: 'py-1.5 text-sm', icon: 'w-4 h-4 ml-2.5' },
} as const;

/**
 * Yagona qidiruv maydoni (hero, navbar, mobil): yozish paytida takliflar
 * (Elasticsearch), klaviatura bilan tanlash (↑ ↓ Enter Esc), tozalash va
 * ovozli qidiruv. Yozayotganda sahifa o'zi almashmaydi — faqat Enter,
 * tugma yoki taklif tanlanganda.
 */
export function SearchBox({ variant, value = '', placeholder, onSubmit, globalShortcut = false, formRef }: {
  variant: keyof typeof VARIANTS;
  value?: string;
  placeholder: string;
  onSubmit: (query: string) => void;
  globalShortcut?: boolean;
  formRef?: React.Ref<HTMLFormElement>;
}) {
  const { t, language } = useLanguage();
  const s = t.searchBox;
  const v = VARIANTS[variant];
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => { setText(value); }, [value]);

  const { data, loading, query } = useSearchSuggest(text, open);
  const items = open ? toItems(data, query) : [];
  useEffect(() => { setActive(-1); }, [query]);

  const submit = (q: string) => {
    setOpen(false);
    inputRef.current?.blur();
    onSubmit(q.trim());
  };
  const voice = useVoiceSearch({ language, onInterim: setText, onFinal: (q) => { setText(q); submit(q); } });

  // Xato xabari 6 soniyadan keyin o'zi yo'qoladi
  useEffect(() => {
    if (!voice.error) return;
    const id = window.setTimeout(voice.clearError, 6000);
    return () => window.clearTimeout(id);
  }, [voice.error, voice.clearError]);

  const pick = (item: SuggestItem) => { setOpen(false); setText(item.kind === 'product' ? text : item.kind === 'all' ? item.label : ''); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // -1 — hech biri tanlanmagan (matn maydoni); ro'yxat ikki uchidan aylanadi
      setActive(i => {
        const next = i + step;
        if (next < -1) return items.length - 1;
        return next >= items.length ? -1 : next;
      });
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      pick(items[active]);
      navigate(items[active].href);
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setOpen(false); } else inputRef.current?.blur();
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { inputRef.current?.focus(); return; }
    submit(text);
  };

  const errorText = voice.error && {
    denied: s.voiceDenied, mic: s.voiceMic, 'no-speech': s.voiceNoSpeech, network: s.voiceNetwork, generic: s.voiceError,
  }[voice.error];

  return (
    <form ref={formRef} role="search" onSubmit={onFormSubmit} className="relative w-full"
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <div ref={boxRef} className={`flex items-center transition-shadow focus-within:ring-2 focus-within:ring-violet-500/30 ${v.box}`}>
        <Search className={`${v.icon} text-gray-400 shrink-0`} aria-hidden="true" />
        <input
          ref={inputRef} type="search" value={text} enterKeyHint="search" autoComplete="off" spellCheck={false}
          placeholder={voice.listening ? s.listening : placeholder} aria-label={placeholder}
          role="combobox" aria-expanded={items.length > 0} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          data-global-search={globalShortcut || undefined} aria-keyshortcuts={globalShortcut ? '/' : undefined}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
          className={`flex-1 min-w-0 bg-transparent px-1 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden ${v.input}`}
        />
        {text && !voice.listening && (
          <button type="button" aria-label={s.clear} title={s.clear}
            onClick={() => { setText(''); inputRef.current?.focus(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {voice.supported && (
          <button type="button" onClick={voice.toggle} aria-pressed={voice.listening}
            aria-label={voice.listening ? s.voiceStop : s.voiceStart} title={voice.listening ? s.voiceStop : s.voiceStart}
            className={`relative p-1.5 rounded-lg transition-colors ${voice.listening
              ? 'text-white bg-red-500' : 'text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'}`}>
            {voice.listening && <span className="absolute inset-0 rounded-lg bg-red-500 animate-ping opacity-40" aria-hidden="true" />}
            <Mic className="relative w-4 h-4" />
          </button>
        )}
        {variant === 'hero' ? (
          // Eng tor telefonda (<380px) — faqat ikonka: matnli tugma namunani kesib qo'yardi
          <button type="submit" aria-label={t.home.searchButton}
            className="shrink-0 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-xl px-3.5 min-[380px]:px-5 md:px-6 py-3 transition-colors">
            <Search className="w-4 h-4 min-[380px]:hidden" aria-hidden="true" />
            <span className="hidden min-[380px]:inline">{t.home.searchButton}</span>
          </button>
        ) : (
          <button type="submit" aria-label={t.nav.search} title={t.nav.search}
            className="w-8 h-8 shrink-0 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors">
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className={errorText ? 'absolute left-2 top-full mt-1.5 z-50 text-xs text-red-600 dark:text-red-400' : 'sr-only'}>
        {errorText || (voice.listening ? s.listening : '')}
      </p>
      {items.length > 0 && !voice.listening && (
        <SuggestList listId={listId} items={items} active={active} loading={loading} onPick={pick} onHover={setActive}
          fixedTop={variant === 'mobile' ? (boxRef.current?.getBoundingClientRect().bottom ?? 0) + 8 : undefined} />
      )}
    </form>
  );
}
