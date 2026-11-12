import { useState, useEffect, useRef, useId, ReactNode, KeyboardEvent } from 'react';
import {
  X, User, Mail, Lock, Eye, EyeOff, ShoppingBag,
  ChevronRight, Check, Sparkles, AlertCircle, Info, Circle, Phone, ShieldCheck, ArrowLeft, RotateCw,
} from 'lucide-react';
import { useAuth, RegisterData, AuthError, Channel } from '../contexts/AuthContext';
import { useBrands, BRAND_COLORS } from '../hooks/useBrands';
import { useLanguage } from '../contexts/LanguageContext';
import {
  AuthErrorCode, nameError, emailError, newPasswordError, loginPasswordError,
  passwordChecks, passwordScore, suggestEmail, normalizeEmail, normalizeName,
  phoneError, normalizePhone, formatPhoneLocal, identifierError,
  NAME_MAX, EMAIL_MAX,
} from '../utils/authValidation';

// Qiymatlar profilga shu ko'rinishda saqlanadi — ekranda esa tarjimasi chiqadi.
const CATEGORIES = ['Telefonlar', 'Noutbuklar', 'Planshetlar', 'Aksessuarlar', 'Audio', 'TV'] as const;

const AGE_GROUPS: { value: RegisterData['ageGroup']; label: string }[] = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45+',   label: '45+' },
];

const BUDGET_LEVELS: { value: RegisterData['budgetLevel']; desc: string }[] = [
  { value: 'budget',  desc: '< 3 mln' },
  { value: 'mid',     desc: '3–8 mln' },
  { value: 'premium', desc: '> 8 mln' },
];

// verify — kod bosqichi; faqat tanlangan kanal serverda yoqilgan bo'lsa
type Step = 'credentials' | 'verify' | 'profile';
type FieldName = 'name' | 'email' | 'phone' | 'password' | 'code';
type FieldErrors = Partial<Record<FieldName, AuthErrorCode>>;

const FIELD_ORDER: FieldName[] = ['name', 'email', 'phone', 'password', 'code'];
const CODE_LENGTH = 6;

const STRENGTH_BAR = ['bg-gray-200 dark:bg-gray-700', 'bg-red-400', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500'];

// ── Maydon ────────────────────────────────────────────────────────────────────

function FormField({
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

const inputClass = (invalid: boolean, padRight = false) =>
  `w-full pl-10 ${padRight ? 'pr-11' : 'pr-4'} py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition disabled:opacity-60 ${
    invalid
      ? 'border-red-300 dark:border-red-700 focus:ring-red-400/30 focus:border-red-400'
      : 'border-gray-200 dark:border-gray-700 focus:ring-violet-400/40 focus:border-violet-400'
  }`;

// ── Komponent ─────────────────────────────────────────────────────────────────

export function AuthModal() {
  const {
    isAuthOpen, authMode, notice, channels, closeAuth, login, register,
    checkEmailAvailable, sendCode, verifyCode, openRegister, openLogin,
  } = useAuth();
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

  if (!isAuthOpen) return null;

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

  const trackCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  const describedBy = (f: FieldName, extra?: string) =>
    [visibleError(f) ? `${ids[f]}-error` : null, extra].filter(Boolean).join(' ') || undefined;

  const retryText = retryLeft > 0
    ? (retryLeft >= 90
        ? a.retryInMinutes.replace('{{count}}', String(Math.ceil(retryLeft / 60)))
        : a.retryInSeconds.replace('{{count}}', String(retryLeft)))
    : '';

  const checks = passwordChecks(password);
  const score = passwordScore(password);
  const scoreLabel = score <= 1 ? a.pwWeak : score === 2 ? a.pwMedium : a.pwStrong;
  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  const spinner = <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />;

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

        {/* Gradient header */}
        <div className="relative bg-linear-to-br from-violet-600 to-violet-800 px-6 pt-6 pb-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" aria-hidden="true" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />

          {/* z-10: pastdagi sarlavha qatori (relative, DOM da keyinroq) butun
              kenglikni egallaydi va tugmani yopib qo'yardi — X bosilmasdi. */}
          <button
            type="button"
            onClick={handleClose}
            aria-label={a.close}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative flex items-center gap-3 pr-10">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id={ids.title} className="text-lg font-black text-white leading-tight">
                {!isRegister ? a.login : step === 'credentials' ? a.register : step === 'verify' ? a.verifyTitle : a.yourProfile}
              </h2>
              <p className="text-xs font-medium text-white/70 mt-0.5">
                {!isRegister ? a.loginSubtitle : step === 'credentials' ? a.registerSubtitle : step === 'verify' ? a.verifySubtitle : a.profileSubtitle}
              </p>
            </div>
          </div>

          {/* Step indicator for register */}
          {isRegister && (
            <div className="relative flex items-center gap-2 mt-4" aria-hidden="true">
              {steps.map((st, i) => {
                const current = steps.indexOf(step);
                return (
                  <div key={st} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      i === current ? 'bg-white text-violet-700' : i < current ? 'bg-white/30 text-white' : 'bg-white/15 text-white/50'
                    }`}>
                      {i < current ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-0.5 w-8 bg-white/20 rounded-full">
                        <div className={`h-full bg-white rounded-full transition-all ${i < current ? 'w-full' : 'w-0'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
              <span className="ml-auto text-[10px] text-white/60 font-semibold">
                {steps.indexOf(step) + 1}/{steps.length}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">

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

          {/* ── STEP 1: Credentials ── */}
          {step === 'credentials' && (
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

              {usePhone ? (
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
              ) : (
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
              )}

              <FormField
                id={ids.password} label={a.password} icon={<Lock className="w-4 h-4" />}
                error={errorText(visibleError('password'))}
                hint={<>
                  {capsLock && (
                    <p className="mt-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">⇪ {a.capsLock}</p>
                  )}
                  {isRegister && (
                    <div id={`${ids.password}-reqs`} className="mt-2 space-y-2">
                      {password.length > 0 && (
                        <div className="flex items-center gap-2" aria-hidden="true">
                          <div className="flex flex-1 gap-1">
                            {[1, 2, 3, 4].map(n => (
                              <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${score >= n ? STRENGTH_BAR[score] : STRENGTH_BAR[0]}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-12 text-right">{scoreLabel}</span>
                        </div>
                      )}
                      <ul aria-label={a.pwRequirements} className="grid grid-cols-1 gap-0.5">
                        {([['length', a.reqLength], ['letter', a.reqLetter], ['digit', a.reqDigit]] as const).map(([key, label]) => (
                          <li key={key} className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                            checks[key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                          }`}>
                            {checks[key] ? <Check className="w-3 h-3" /> : <Circle className="w-2.5 h-2.5" />}
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
          )}

          {/* ── Kod bosqichi ── */}
          {step === 'verify' && sentTo && (
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
          )}

          {/* ── STEP 2: Profile (register only) ── */}
          {step === 'profile' && (
            <div className="space-y-5">

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-snug">
                  {a.profileHintBefore}<b>{a.profileHintBold}</b>{a.profileHintAfter}
                </p>
              </div>

              {/* Yosh */}
              <div role="radiogroup" aria-label={a.ageGroup}>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.ageGroup}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {AGE_GROUPS.map(({ value, label }) => (
                    <button key={value} type="button" role="radio" aria-checked={ageGroup === value}
                      onClick={() => setAgeGroup(value)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        ageGroup === value
                          ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Byudjet */}
              <div role="radiogroup" aria-label={a.budgetLevel}>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.budgetLevel}</p>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGET_LEVELS.map(({ value, desc }) => (
                    <button key={value} type="button" role="radio" aria-checked={budgetLevel === value}
                      onClick={() => setBudgetLevel(value)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl text-center transition-all active:scale-95 border ${
                        budgetLevel === value
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                      }`}>
                      <span className={`text-xs font-black ${budgetLevel === value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>{a.budgetLevels[value]}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brendlar */}
              <div>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {a.favoriteBrands} <span className="text-gray-300 font-medium normal-case">{a.optional}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brands.map(({ key, name: brandName }) => {
                    const on = preferredBrands.includes(key);
                    return (
                      <button key={key} type="button" aria-pressed={on}
                        onClick={() => setPreferredBrands(prev => toggle(prev, key))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          on ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                        {on
                          ? <Check className="w-3 h-3" />
                          : <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[key] ?? '#9ca3af' }} />}
                        {brandName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategoriyalar */}
              <div>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {a.interests} <span className="text-gray-300 font-medium normal-case">{a.optional}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => {
                    const on = preferredCategories.includes(c);
                    return (
                      <button key={c} type="button" aria-pressed={on}
                        onClick={() => setPreferredCategories(prev => toggle(prev, c))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          on ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                        {on && <Check className="w-3 h-3 inline mr-1" />}{a.categories[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setStep('credentials'); setFormError(null); }} disabled={isLoading}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition active:scale-[0.98] disabled:opacity-60">
                  {a.back}
                </button>
                <button type="button" onClick={handleRegister} disabled={isLoading} aria-busy={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60">
                  {isLoading ? spinner : <><Sparkles className="w-4 h-4" /> {a.start}</>}
                </button>
              </div>
            </div>
          )}

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
