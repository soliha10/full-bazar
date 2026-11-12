import type { KeyboardEvent } from 'react';
import { AuthError } from '../../contexts/AuthContext';
import { AuthErrorCode, formatPhoneLocal } from '../../utils/authValidation';
import { FIELD_ORDER, CODE_LENGTH, type FieldName, type FieldErrors } from './constants';
import type { AuthFormState } from './useAuthFormState';

/** Maydon/xato boshqaruvi: tozalash, yopish, rejim almashtirish, server xatolari, klaviatura */
export function createFormActions(f: AuthFormState) {
  const {
    ids, isRegister, activeMethod, info, serverErrors, formError, visibleError, inputs, sheetRef,
    setStep, setShowPass, setName, setEmail, setPhone, setPassword, setMethod, setCode,
    setSentTo, setResendLeft, setAttemptsLeft, setInfo, setVerified, setTouched, setSubmitted,
    setServerErrors, setFormError, setRetryLeft, setPreferredBrands, setPreferredCategories,
  } = f;
  const { closeAuth, openLogin, openRegister } = f.auth;

  const resetErrors = () => {
    setTouched({}); setSubmitted(false); setServerErrors({}); setFormError(null); setRetryLeft(0); setInfo(null);
  };
  const resetCode = () => {
    setCode(''); setSentTo(null); setResendLeft(0); setAttemptsLeft(0); setVerified(null);
  };

  const handleClose = () => {
    resetErrors(); resetCode();
    setStep('credentials'); setName(''); setEmail(''); setPhone(''); setPassword(''); setShowPass(false);
    setMethod('email'); setPreferredBrands([]); setPreferredCategories([]);
    closeAuth();
  };

  // Rejim almashganda email saqlanadi — "Shu email bilan kirish" shu uchun.
  const switchMode = (mode?: 'login' | 'register') => {
    resetErrors(); resetCode();
    setStep('credentials'); setPassword(''); setShowPass(false);
    const target = mode ?? (isRegister ? 'login' : 'register');
    target === 'login' ? openLogin() : openRegister();
  };

  const onFieldChange = (f: FieldName, value: string) => {
    if (f === 'phone') value = formatPhoneLocal(value);
    if (f === 'code') value = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    ({ name: setName, email: setEmail, phone: setPhone, password: setPassword, code: setCode })[f](value);
    if (info) setInfo(null);
    if (serverErrors[f]) setServerErrors(prev => ({ ...prev, [f]: undefined }));
    if (formError && formError !== 'too_many_attempts' && formError !== 'rate_limited') setFormError(null);
  };

  const focusFirstInvalid = (errors: FieldErrors) => {
    const first = FIELD_ORDER.find(f => errors[f]);
    if (first) inputs[first].current?.focus();
  };

  const applyError = (err: unknown) => {
    if (!(err instanceof AuthError)) { setFormError('server'); return; }
    // Server "target"/"identifier" deb qaytaradigan maydonni ekrandagisiga moslash
    const raw = err.fields as Partial<Record<string, AuthErrorCode>>;
    const fields: FieldErrors = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = k === 'target' ? activeMethod : k === 'identifier' ? 'email' : k;
      if (FIELD_ORDER.includes(key as FieldName)) fields[key as FieldName] = v;
    }
    if (fields.code) {
      setServerErrors({ code: fields.code });
      setAttemptsLeft(err.attemptsLeft);
      setCode('');
      setTimeout(() => inputs.code.current?.focus());
      return;
    }
    if (Object.keys(fields).length > 0) {
      setServerErrors(fields);
      setStep('credentials');
      setTimeout(() => focusFirstInvalid(fields));
      if (err.code === 'validation') setFormError('validation');
      return;
    }
    setFormError(err.code);
    if (err.retryAfter) setRetryLeft(err.retryAfter);
    if (err.code === 'invalid_credentials') {
      // Parol tozalanadi; "Parolni kiriting" ikkinchi xato bo'lib chiqmasin
      setPassword('');
      setSubmitted(false);
      setTouched(p => ({ ...p, password: false }));
      setTimeout(() => inputs.password.current?.focus());
    }
  };

  // Tab fokusni oyna ichida aylantiradi — orqadagi sahifaga "qochib" ketmaydi
  const onSheetKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.stopPropagation(); handleClose(); return; }
    if (e.key !== 'Tab' || !sheetRef.current) return;
    const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )];
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const describedBy = (f: FieldName, extra?: string) =>
    [visibleError(f) ? `${ids[f]}-error` : null, extra].filter(Boolean).join(' ') || undefined;

  return {
    resetErrors, resetCode, handleClose, switchMode, onFieldChange, focusFirstInvalid, applyError,
    onSheetKeyDown, describedBy,
  };
}

export type FormActions = ReturnType<typeof createFormActions>;
