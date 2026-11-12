import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

// ── Maydon ────────────────────────────────────────────────────────────────────

export function FormField({
  id, label, icon, error, hint, children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative mt-1">
        <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`}>
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-red-500 font-semibold">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {error}
        </p>
      )}
      {hint}
    </div>
  );
}

export const inputClass = (invalid: boolean, padRight = false) =>
  `w-full pl-10 ${padRight ? 'pr-11' : 'pr-4'} py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition disabled:opacity-60 ${
    invalid
      ? 'border-red-300 dark:border-red-700 focus:ring-red-400/30 focus:border-red-400'
      : 'border-gray-200 dark:border-gray-700 focus:ring-violet-400/40 focus:border-violet-400'
  }`;

export const spinner = <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />;
