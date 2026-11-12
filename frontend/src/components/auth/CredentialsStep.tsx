import { User, Mail, Phone, ChevronRight } from 'lucide-react';
import type { Channel } from '../../contexts/AuthContext';
import { normalizeName, NAME_MAX } from '../../utils/authValidation';
import { FormField, inputClass, spinner } from './FormField';
import { ContactField } from './ContactField';
import { PasswordField } from './PasswordField';
import type { AuthForm } from './useAuthForm';

/* ── STEP 1: Credentials ── */
export function CredentialsStep({ f }: { f: AuthForm }) {
  const {
    a, t, ids, inputs, isRegister, isLoading, retryLeft, activeMethod, name,
    setName, setMethod, setTouched, setServerErrors, setFormError,
    visibleError, errorText, describedBy, onFieldChange, handleCredentials,
  } = f;
  const { channels } = f.auth;
  return (
    // noValidate: brauzerning har tilda turlicha ko'rinadigan
    // pufakchalari o'rniga o'zimizning tarjima qilingan xabarlar
    <form onSubmit={handleCredentials} noValidate className="space-y-3.5">

      {isRegister && (
        <FormField id={ids.name} label={a.name} icon={<User className="w-4 h-4" />} error={errorText(visibleError('name'))}>
          <input
            ref={inputs.name}
            id={ids.name} name="name" type="text"
            autoComplete="name" autoCapitalize="words" enterKeyHint="next"
            value={name} maxLength={NAME_MAX + 20}
            onChange={e => onFieldChange('name', e.target.value)}
            onBlur={() => { setTouched(p => ({ ...p, name: true })); setName(v => normalizeName(v)); }}
            placeholder={a.namePlaceholder}
            aria-invalid={Boolean(visibleError('name'))}
            aria-describedby={describedBy('name')}
            disabled={isLoading}
            className={inputClass(Boolean(visibleError('name')))}
          />
        </FormField>
      )}

      {isRegister && channels.phone && (
        <div role="radiogroup" aria-label={`${a.methodEmail} / ${a.methodPhone}`}
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-900">
          {(['email', 'phone'] as Channel[]).map(m => (
            <button key={m} type="button" role="radio" aria-checked={activeMethod === m}
              onClick={() => { setMethod(m); setServerErrors({}); setFormError(null); }}
              disabled={isLoading}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all ${
                activeMethod === m
                  ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {m === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {m === 'email' ? a.methodEmail : a.methodPhone}
            </button>
          ))}
        </div>
      )}

      <ContactField f={f} />

      <PasswordField f={f} />

      <button
        type="submit" disabled={isLoading || retryLeft > 0}
        aria-busy={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-sm shadow-md shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
      >
        {isLoading
          ? <>{spinner}<span>{isRegister ? a.checking : t.common.loading}</span></>
          : <>{isRegister ? a.continue : a.login}<ChevronRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
