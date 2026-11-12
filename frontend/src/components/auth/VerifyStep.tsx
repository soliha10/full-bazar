import { AlertCircle, ShieldCheck, ArrowLeft, RotateCw, ChevronRight } from 'lucide-react';
import { CODE_LENGTH } from './constants';
import { spinner } from './FormField';
import type { AuthForm } from './useAuthForm';

/* ── Kod bosqichi ── */
export function VerifyStep({ f }: { f: AuthForm }) {
  const {
    a, ids, inputs, sentTo, code, isLoading, serverErrors, attemptsLeft, resendLeft,
    setStep, setServerErrors, setFormError, setInfo, onFieldChange, handleVerify, handleResend,
  } = f;
  if (!sentTo) return null;
  return (
    <form onSubmit={e => { e.preventDefault(); handleVerify(); }} noValidate className="space-y-4">
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
        <ShieldCheck className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-snug">
          {a.codeSentTo.replace('{{target}}', sentTo.masked)} {a.codeExpires}
          {sentTo.channel === 'email' && <> {a.checkSpam}</>}
        </p>
      </div>

      <div>
        <label htmlFor={ids.code} className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {a.codeLabel}
        </label>
        <input
          ref={inputs.code}
          id={ids.code} name="one-time-code" type="text" inputMode="numeric"
          autoComplete="one-time-code" pattern="[0-9]*" enterKeyHint="go"
          value={code} maxLength={CODE_LENGTH}
          onChange={e => {
            onFieldChange('code', e.target.value);
            const v = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
            // 6 ta raqam yig'ilishi bilan (SMS dan avtomatik to'ldirilganda ham) yuboriladi
            if (v.length === CODE_LENGTH && v !== code) handleVerify(v);
          }}
          placeholder="••••••"
          aria-invalid={Boolean(serverErrors.code)}
          aria-describedby={serverErrors.code ? `${ids.code}-error` : undefined}
          disabled={isLoading}
          className={`mt-1 w-full py-3.5 rounded-xl border bg-gray-50 dark:bg-gray-900 text-center text-2xl font-black tracking-[0.5em] text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:outline-none focus:ring-2 transition disabled:opacity-60 ${
            serverErrors.code
              ? 'border-red-300 dark:border-red-700 focus:ring-red-400/30 focus:border-red-400'
              : 'border-gray-200 dark:border-gray-700 focus:ring-violet-400/40 focus:border-violet-400'
          }`}
        />
        {serverErrors.code && (
          <p id={`${ids.code}-error`} className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-red-500 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {a.errors[serverErrors.code]}
            {attemptsLeft > 0 && <> {a.attemptsLeft.replace('{{count}}', String(attemptsLeft))}</>}
          </p>
        )}
      </div>

      <button
        type="submit" disabled={isLoading || code.length !== CODE_LENGTH} aria-busy={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
      >
        {isLoading ? spinner : <>{a.verify}<ChevronRight className="w-4 h-4" /></>}
      </button>

      <div className="flex items-center justify-between gap-2 text-xs">
        <button type="button" onClick={() => { setStep('credentials'); setServerErrors({}); setFormError(null); setInfo(null); }}
          disabled={isLoading}
          className="flex items-center gap-1 font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-60">
          <ArrowLeft className="w-3.5 h-3.5" />
          {sentTo.channel === 'email' ? a.changeEmail : a.changePhone}
        </button>
        <button type="button" onClick={handleResend} disabled={isLoading || resendLeft > 0}
          className="flex items-center gap-1 font-black text-violet-600 dark:text-violet-400 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-default">
          <RotateCw className="w-3.5 h-3.5" />
          {resendLeft > 0 ? a.resendIn.replace('{{count}}', String(resendLeft)) : a.resend}
        </button>
      </div>
    </form>
  );
}
