import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Cb({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex w-4 h-4 shrink-0 rounded border transition-colors ${
      on ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
    }`}>
      {on && (
        <svg viewBox="0 0 10 10" className="m-auto w-2.5 h-2.5 text-white" fill="none" aria-hidden="true">
          <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{children}</p>;
}

export function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="text-xs text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
      {label}
    </button>
  );
}

/**
 * Filtr bo'limi. Desktopda yig'iladi: ilgari barcha bo'limlar doim ochiq
 * edi va panel 2300 px ga cho'zilib, ekrandan uch barobar uzun bo'lardi.
 * Mobil oynada bo'limlar tab bilan almashadi — u yerda yig'ish kerak emas.
 */
export function Section({ title, action, isMobile, defaultOpen = true, children }: {
  title: string;
  action?: React.ReactNode;
  isMobile: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (isMobile) {
    return (
      <div className="py-1">
        <div className="flex items-center justify-between mb-2.5">
          <SLabel>{title}</SLabel>
          {action}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="py-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="flex-1 flex items-center justify-between text-left text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
          <ChevronDown aria-hidden="true"
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {action}
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** RAM / xotira / batareya qiymati uchun ixcham tugma */
export function Chip({ on, onClick, children, title }: {
  on: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={title}
      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
        on ? 'bg-violet-600 border-violet-600 text-white'
           : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
      }`}>
      {children}
    </button>
  );
}
