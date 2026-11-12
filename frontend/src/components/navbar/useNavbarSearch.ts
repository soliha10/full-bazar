import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Language } from '../../locales/translations';

/** Qidiruv satri holati: URL bilan sinxron, desktopda debounce, ovozli qidiruv */
export function useNavbarSearch(onSearchChange: ((value: string) => void) | undefined, language: Language) {
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [searchValue, setSearchValue] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('search') || '';
  });

  /* sync search input with url */
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setSearchValue(p.get('search') || '');
  }, [location.search]);

  /* debounced search */
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const p = new URLSearchParams(location.search);
    if (searchValue.trim() === (p.get('search') || '')) return;
    const id = setTimeout(() => onSearchChange?.(searchValue.trim()), 500);
    return () => clearTimeout(id);
  }, [searchValue, location.search, onSearchChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchValue.trim());
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearchValue(text);
      onSearchChange?.(text.trim());
    };
    r.start();
  };

  const clearSearch = () => { setSearchValue(''); onSearchChange?.(''); };

  return { searchValue, setSearchValue, isListening, handleSubmit, startVoice, clearSearch };
}

export type NavbarSearch = ReturnType<typeof useNavbarSearch>;
