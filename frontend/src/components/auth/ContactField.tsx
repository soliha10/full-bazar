import { Mail, Phone } from 'lucide-react';
import { EMAIL_MAX } from '../../utils/authValidation';
import { FormField, inputClass } from './FormField';
import type { AuthForm } from './useAuthForm';

/* Aloqa maydoni: ro'yxatdan o'tishda telefon yoki email, kirishda email/telefon (identifier) */
export function ContactField({ f }: { f: AuthForm }) {
  const {
    a, ids, inputs, isRegister, usePhone, loginByIdentifier, isLoading, serverErrors, emailSuggestion,
    email, phone, setEmail, setTouched, visibleError, errorText, describedBy, onFieldChange, switchMode,
  } = f;
  if (usePhone) {
    return (
      <FormField
        id={ids.phone} label={a.phone} icon={<Phone className="w-4 h-4" />}
        error={errorText(visibleError('phone'))}
        hint={serverErrors.phone === 'phone_taken' && (
          <button type="button" onClick={() => { setEmail(`+998 ${phone}`); switchMode('login'); }}
            className="mt-1 text-[11px] font-black text-violet-600 dark:text-violet-400 hover:underline">
            {a.loginInstead} →
          </button>
        )}
      >
        <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">+998</span>
        <input
          ref={inputs.phone}
          id={ids.phone} name="tel" type="tel" inputMode="tel"
          autoComplete="tel-national" enterKeyHint="next"
          value={phone} maxLength={20}
          onChange={e => onFieldChange('phone', e.target.value)}
          onBlur={() => setTouched(p => ({ ...p, phone: true }))}
          placeholder={a.phonePlaceholder}
          aria-invalid={Boolean(visibleError('phone'))}
          aria-describedby={describedBy('phone')}
          disabled={isLoading}
          className={`${inputClass(Boolean(visibleError('phone')))} !pl-[5.25rem] tracking-wide`}
        />
      </FormField>
    );
  }
  return (
    <FormField
      id={ids.email} label={loginByIdentifier ? a.identifier : a.email} icon={<Mail className="w-4 h-4" />}
      error={errorText(visibleError('email'))}
      hint={<>
        {serverErrors.email === 'email_taken' && (
          <button type="button" onClick={() => switchMode('login')}
            className="mt-1 text-[11px] font-black text-violet-600 dark:text-violet-400 hover:underline">
            {a.loginInstead} →
          </button>
        )}
        {emailSuggestion && (
          <p className="mt-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {a.didYouMean.replace('{{email}}', emailSuggestion)}{' '}
            <button type="button" onClick={() => onFieldChange('email', emailSuggestion)}
              className="font-black text-violet-600 dark:text-violet-400 hover:underline">
              {a.useSuggestion}
            </button>
          </p>
        )}
      </>}
    >
      <input
        ref={inputs.email}
        id={ids.email} name={loginByIdentifier ? 'username' : 'email'}
        type={loginByIdentifier ? 'text' : 'email'} inputMode={loginByIdentifier ? 'text' : 'email'}
        autoComplete={isRegister ? 'email' : 'username'}
        autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next"
        value={email} maxLength={EMAIL_MAX}
        onChange={e => onFieldChange('email', e.target.value)}
        onBlur={() => { setTouched(p => ({ ...p, email: true })); setEmail(v => v.trim()); }}
        placeholder={loginByIdentifier ? a.identifierPlaceholder : 'email@example.com'}
        aria-invalid={Boolean(visibleError('email'))}
        aria-describedby={describedBy('email')}
        disabled={isLoading}
        className={inputClass(Boolean(visibleError('email')))}
      />
    </FormField>
  );
}
