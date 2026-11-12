import type { KeyboardEvent } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { FormField, inputClass } from './FormField';
import { PasswordHints } from './PasswordHints';
import type { AuthForm } from './useAuthForm';

/* Parol maydoni: ko'rsatish/yashirish, Caps Lock ogohlantirishi va talablar */
export function PasswordField({ f }: { f: AuthForm }) {
  const {
    a, ids, inputs, isRegister, isLoading, password, showPass, setShowPass, capsLock, setCapsLock,
    setTouched, visibleError, errorText, describedBy, onFieldChange,
  } = f;
  const trackCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  return (
    <FormField
      id={ids.password} label={a.password} icon={<Lock className="w-4 h-4" />}
      error={errorText(visibleError('password'))}
      hint={<>
        {capsLock && (
          <p className="mt-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">⇪ {a.capsLock}</p>
        )}
        {isRegister && <PasswordHints f={f} />}
      </>}
    >
      <input
        ref={inputs.password}
        id={ids.password} name="password" type={showPass ? 'text' : 'password'}
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go"
        value={password} maxLength={128}
        onChange={e => onFieldChange('password', e.target.value)}
        onBlur={() => { setTouched(p => ({ ...p, password: true })); setCapsLock(false); }}
        onKeyDown={trackCaps} onKeyUp={trackCaps}
        placeholder="••••••••"
        aria-invalid={Boolean(visibleError('password'))}
        aria-describedby={describedBy('password', isRegister ? `${ids.password}-reqs` : undefined)}
        disabled={isLoading}
        className={inputClass(Boolean(visibleError('password')), true)}
      />
      <button
        type="button" onClick={() => setShowPass(v => !v)}
        aria-label={showPass ? a.hidePassword : a.showPassword}
        aria-pressed={showPass} aria-controls={ids.password}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </FormField>
  );
}
