import { AuthError } from '../../contexts/AuthContext';
import { normalizeEmail, normalizeName, normalizePhone } from '../../utils/authValidation';
import { CODE_LENGTH, type FieldErrors } from './constants';
import type { AuthFormState } from './useAuthFormState';
import type { FormActions } from './formActions';

/** Yuborish bosqichlari: kirish / kod so'rash / kodni tasdiqlash / ro'yxatdan o'tish */
export function createSubmitActions(f: AuthFormState, fa: FormActions) {
  const {
    language, isLoading, retryLeft, isRegister, email, password, name, code, verified, activeMethod,
    target, needsCode, usePhone, sentTo, resendLeft, clientErrors, serverErrors, inputs,
    ageGroup, budgetLevel, preferredBrands, preferredCategories,
    setIsLoading, setSubmitted, setFormError, setStep, setServerErrors, setSentTo, setResendLeft,
    setCode, setAttemptsLeft, setInfo, setVerified,
  } = f;
  const { login, register, checkEmailAvailable, sendCode, verifyCode } = f.auth;
  const { handleClose, focusFirstInvalid, applyError, resetCode } = fa;

  const handleCredentials = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (isLoading || retryLeft > 0) return;
    setSubmitted(true);
    setFormError(null);

    const errors = Object.fromEntries(
      Object.entries({ ...clientErrors, ...serverErrors }).filter(([, v]) => v),
    ) as FieldErrors;
    if (Object.keys(errors).length > 0) { focusFirstInvalid(errors); return; }

    setIsLoading(true);
    try {
      if (!isRegister) {
        await login(email.includes('@') ? normalizeEmail(email) : normalizePhone(email), password);
        handleClose();
        return;
      }
      if (verified && verified.channel === activeMethod && verified.target === target) {
        setStep('profile');
        return;
      }
      if (needsCode) {
        await requestCode(false);
        return;
      }
      // Kanal o'chiq (kalit yo'q): email bandligini 2-qadamdan OLDIN bilamiz
      const available = await checkEmailAvailable(normalizeEmail(email));
      if (!available) {
        setServerErrors({ email: 'email_taken' });
        inputs.email.current?.focus();
        return;
      }
      setStep('profile');
    } catch (err) {
      applyError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Kod yuborish (1-marta ham, "qayta yuborish" ham). Xato chaqiruvchiga qaytadi. */
  const requestCode = async (isResend: boolean) => {
    try {
      const res = await sendCode(activeMethod, target, language);
      setSentTo({ channel: activeMethod, target, masked: res.maskedTarget });
      setResendLeft(res.resendIn);
      setCode(''); setAttemptsLeft(0);
      setServerErrors(p => ({ ...p, code: undefined }));
      setFormError(null);
      setInfo(isResend ? 'codeResent' : null);
      setStep('verify');
      if (isResend) inputs.code.current?.focus();
    } catch (err) {
      // Kod hozirgina shu manzilga yuborilgan (masalan, "Orqaga" bosib qaytdi) —
      // yangisini kutmasdan o'sha kodni kiritish bosqichiga qaytamiz.
      if (err instanceof AuthError && err.code === 'resend_cooldown'
          && sentTo?.channel === activeMethod && sentTo.target === target) {
        setResendLeft(err.retryAfter);
        setStep('verify');
        return;
      }
      throw err;
    }
  };

  const handleResend = async () => {
    if (isLoading || resendLeft > 0) return;
    setIsLoading(true);
    try { await requestCode(true); } catch (err) { applyError(err); } finally { setIsLoading(false); }
  };

  const handleVerify = async (value = code) => {
    if (isLoading) return;
    setSubmitted(true);
    if (value.length !== CODE_LENGTH) {
      setServerErrors({ code: 'code_invalid' });
      inputs.code.current?.focus();
      return;
    }
    setIsLoading(true);
    setFormError(null); setInfo(null);
    try {
      const token = await verifyCode(activeMethod, target, value);
      setVerified({ channel: activeMethod, target, token });
      setServerErrors({});
      setSubmitted(false);
      setStep('profile');
    } catch (err) {
      applyError(err);
      if (err instanceof AuthError && (err.code === 'code_expired' || err.code === 'code_attempts_exceeded')) {
        setCode(''); setResendLeft(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setFormError(null);
    try {
      await register({
        name: normalizeName(name),
        ...(usePhone ? { phone: target } : { email: target }),
        verificationToken: verified?.token,
        password, ageGroup, budgetLevel, preferredBrands, preferredCategories,
      });
      handleClose();
    } catch (err) {
      // Tasdiqlash tokeni 30 daqiqada eskiradi — kodni qaytadan so'raymiz
      if (err instanceof AuthError && err.code === 'verification_required') {
        setVerified(null); resetCode();
        setStep('credentials');
      }
      applyError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleCredentials, requestCode, handleResend, handleVerify, handleRegister };
}
