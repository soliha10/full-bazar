import { Check, AlertCircle, Info } from 'lucide-react';
import type { AuthForm } from './useAuthForm';

/* Oyna tepasidagi xabarlar: sessiya ogohlantirishi, umumiy xato, "kod qayta yuborildi" */
export function AuthAlerts({ f }: { f: AuthForm }) {
  const { a, formError, info, retryLeft } = f;
  const { notice } = f.auth;
  const retryText = retryLeft > 0
    ? (retryLeft >= 90
        ? a.retryInMinutes.replace('{{count}}', String(Math.ceil(retryLeft / 60)))
        : a.retryInSeconds.replace('{{count}}', String(retryLeft)))
    : '';

  return (
    <>
      {notice && !formError && (
        <div role="status" className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0" /> {a.notices[notice]}
        </div>
      )}

      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{a.errors[formError]}{retryText && <> {retryText}</>}</span>
        </div>
      )}

      {info && !formError && (
        <div role="status" className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs font-semibold text-green-700 dark:text-green-300">
          <Check className="w-4 h-4 shrink-0" /> {a.codeResent}
        </div>
      )}
    </>
  );
}
