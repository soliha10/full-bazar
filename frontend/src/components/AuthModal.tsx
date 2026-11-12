import { useAuthForm } from './auth/useAuthForm';
import { AuthHeader } from './auth/AuthHeader';
import { AuthAlerts } from './auth/AuthAlerts';
import { CredentialsStep } from './auth/CredentialsStep';
import { VerifyStep } from './auth/VerifyStep';
import { ProfileStep } from './auth/ProfileStep';

// Kirish / ro'yxatdan o'tish oynasi: credentials → (verify) → profile.
// Mantiq auth/useAuthForm da, har bir bosqich o'z komponentida.
export function AuthModal() {
  const f = useAuthForm();
  const { a, ids, step, isRegister, sheetRef, handleClose, onSheetKeyDown, switchMode } = f;

  if (!f.auth.isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        onKeyDown={onSheetKeyDown}
        // overflow-clip (hidden emas): bezak doirasi o'ngga chiqib turadi va
        // hidden bo'lsa, fokus X/ko'z tugmasiga o'tganda brauzer oynani
        // yon tomonga 24px suradi — butun tarkib chapga siljib qolardi.
        className="relative w-full sm:max-w-md bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-clip"
      >

        <AuthHeader f={f} />

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">

          <AuthAlerts f={f} />

          {step === 'credentials' && <CredentialsStep f={f} />}

          {step === 'verify' && <VerifyStep f={f} />}

          {step === 'profile' && <ProfileStep f={f} />}

          {/* Switch mode */}
          {step === 'credentials' && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              {isRegister ? a.haveAccount : a.noAccount}{' '}
              <button type="button" onClick={() => switchMode()} className="font-black text-violet-600 dark:text-violet-400 hover:underline">
                {isRegister ? a.login : a.register}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
