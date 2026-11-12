import { useState, useEffect, useRef, useId } from 'react';
import { useAuth, RegisterData, Channel } from '../../contexts/AuthContext';
import { useBrands } from '../../hooks/useBrands';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  AuthErrorCode, nameError, emailError, newPasswordError, loginPasswordError,
  suggestEmail, normalizeEmail, phoneError, normalizePhone, identifierError,
} from '../../utils/authValidation';
import type { Step, FieldName, FieldErrors } from './constants';

/** AuthModal holati: maydonlar, xatolar, kod bosqichi va modal effektlari */
export function useAuthFormState() {
  const auth = useAuth();
  const { isAuthOpen, authMode, channels } = auth;
  const { t, language } = useLanguage();
  const a = t.auth;
  const uid = useId();
  const ids = {
    title: `${uid}-title`, name: `${uid}-name`, email: `${uid}-email`,
    phone: `${uid}-phone`, password: `${uid}-password`, code: `${uid}-code`,
  };

  const [step, setStep]           = useState<Step>('credentials');
  const [showPass, setShowPass]   = useState(false);
  const [capsLock, setCapsLock]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName]         = useState('');
  // Kirish rejimida bu maydon "email yoki telefon" (identifier) vazifasida
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod]     = useState<Channel>('email');

  // ── Kod bosqichi ──
  const [code, setCode]               = useState('');
  const [sentTo, setSentTo]           = useState<{ channel: Channel; target: string; masked: string } | null>(null);
  const [resendLeft, setResendLeft]   = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [info, setInfo]               = useState<'codeResent' | null>(null);
  // Tasdiqlangan manzil: foydalanuvchi profil bosqichidan orqaga qaytsa,
  // manzilni o'zgartirmagan bo'lsa, kodni qayta so'ramaymiz.
  const [verified, setVerified] = useState<{ channel: Channel; target: string; token: string } | null>(null);

  // Xato maydonni tark etgandan (blur) yoki yuborishga urinishdan keyin
  // ko'rsatiladi — yozish boshlanishi bilan qizil matn chiqib ketmasin.
  const [touched, setTouched]           = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted]       = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError]       = useState<AuthErrorCode | null>(null);
  const [retryLeft, setRetryLeft]       = useState(0);

  const [ageGroup,            setAgeGroup]            = useState<RegisterData['ageGroup']>('25-34');
  const [budgetLevel,         setBudgetLevel]         = useState<RegisterData['budgetLevel']>('mid');
  const [preferredBrands,     setPreferredBrands]     = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  // Katalog filtri bilan AYNAN bir xil ro'yxat — bazadagi haqiqiy brendlar.
  const brands = useBrands();

  const sheetRef = useRef<HTMLDivElement>(null);
  const inputs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    code: useRef<HTMLInputElement>(null),
  };
  const isRegister = authMode === 'register';
  // Telefon varianti faqat SMS kanali serverda yoqilgan bo'lsa ko'rinadi
  const activeMethod: Channel = isRegister && channels.phone ? method : 'email';
  const usePhone = isRegister && activeMethod === 'phone';
  const target = usePhone ? normalizePhone(phone) : normalizeEmail(email);
  const needsCode = isRegister && channels[activeMethod];
  const steps: Step[] = needsCode ? ['credentials', 'verify', 'profile'] : ['credentials', 'profile'];
  const loginByIdentifier = !isRegister && channels.phone;

  // ── Tekshiruv ──
  const clientErrors: FieldErrors = {
    name: isRegister ? nameError(name) ?? undefined : undefined,
    email: (!isRegister
      ? (loginByIdentifier ? identifierError(email) : emailError(email))
      : usePhone ? null : emailError(email)) ?? undefined,
    phone: usePhone ? phoneError(phone) ?? undefined : undefined,
    password: (isRegister
      ? newPasswordError(password, usePhone ? '' : email, name)
      : loginPasswordError(password)) ?? undefined,
  };
  // "...ni kiriting" (bo'sh maydon) faqat yuborishga urinilganda chiqadi:
  // Tab bilan bo'sh maydondan o'tib ketish xato emas.
  const visibleError = (f: FieldName): AuthErrorCode | null => {
    if (serverErrors[f]) return serverErrors[f]!;
    const code = clientErrors[f] ?? null;
    if (!code || submitted) return code;
    return touched[f] && !code.endsWith('_required') ? code : null;
  };
  const errorText = (code: AuthErrorCode | null) => (code ? a.errors[code] : null);
  const emailSuggestion = !visibleError('email') && touched.email && email.includes('@') ? suggestEmail(email) : null;

  // ── Modal xatti-harakati: fokus, Escape, skroll ──
  useEffect(() => {
    if (!isAuthOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isAuthOpen]);

  useEffect(() => {
    if (!isAuthOpen) return;
    if (step === 'verify') { inputs.code.current?.focus(); return; }
    if (step !== 'credentials') return;
    (isRegister ? inputs.name : email ? inputs.password : inputs.email).current?.focus();
    // faqat oyna ochilganda / rejim almashganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthOpen, authMode, step]);

  // "N soniyadan keyin urinib ko'ring" — teskari sanoq, shu vaqtgacha
  // yuborish tugmasi o'chiq turadi.
  useEffect(() => {
    if (retryLeft <= 0) return;
    const id = setInterval(() => setRetryLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [retryLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resendLeft <= 0) return;
    const id = setInterval(() => setResendLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    auth, t, language, a, ids,
    step, setStep, showPass, setShowPass, capsLock, setCapsLock, isLoading, setIsLoading,
    name, setName, email, setEmail, phone, setPhone, password, setPassword, method, setMethod,
    code, setCode, sentTo, setSentTo, resendLeft, setResendLeft, attemptsLeft, setAttemptsLeft,
    info, setInfo, verified, setVerified,
    touched, setTouched, submitted, setSubmitted, serverErrors, setServerErrors,
    formError, setFormError, retryLeft, setRetryLeft,
    ageGroup, setAgeGroup, budgetLevel, setBudgetLevel,
    preferredBrands, setPreferredBrands, preferredCategories, setPreferredCategories, brands,
    sheetRef, inputs, isRegister, activeMethod, usePhone, target, needsCode, steps, loginByIdentifier,
    clientErrors, visibleError, errorText, emailSuggestion,
  };
}

export type AuthFormState = ReturnType<typeof useAuthFormState>;
