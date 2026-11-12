import { useState } from 'react';
import {
  X, User, Mail, Lock, Eye, EyeOff, ShoppingBag,
  ChevronRight, Check, Sparkles,
} from 'lucide-react';
import { useAuth, RegisterData } from '../contexts/AuthContext';
import { useBrands, BRAND_COLORS } from '../hooks/useBrands';
import { useLanguage } from '../contexts/LanguageContext';

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

type Step = 'credentials' | 'profile';

// ── Password strength ─────────────────────────────────────────────────────────

type StrengthLabels = { pwTooShort: string; pwStrong: string; pwMedium: string; pwWeak: string };

function passwordStrength(pw: string, l: StrengthLabels): { bars: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { bars: 0, label: '', color: '' };
  if (pw.length < 8) return { bars: 1, label: l.pwTooShort, color: 'bg-red-400' };
  const extras = [/[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (extras >= 2) return { bars: 3, label: l.pwStrong, color: 'bg-green-400' };
  if (extras >= 1) return { bars: 2, label: l.pwMedium, color: 'bg-yellow-400' };
  return { bars: 1, label: l.pwWeak, color: 'bg-red-400' };
}

// ── Email format check ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthModal() {
  const { isAuthOpen, authMode, closeAuth, login, register, openRegister, openLogin } = useAuth();
  const { t } = useLanguage();
  const a = t.auth;

  const [step, setStep]         = useState<Step>('credentials');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // credentials
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // profile (register step 2)
  const [ageGroup,            setAgeGroup]            = useState<RegisterData['ageGroup']>('25-34');
  const [budgetLevel,         setBudgetLevel]         = useState<RegisterData['budgetLevel']>('mid');
  const [preferredBrands,     setPreferredBrands]     = useState<string[]>([]);
  // Katalog filtri bilan AYNAN bir xil ro'yxat — bazadagi haqiqiy brendlar.
  // Ilgari bu yerda 8 ta brend qo'lda yozilgan edi va Poco, Tecno, Infinix,
  // Huawei tanlab bo'lmasdi, holbuki katalogda ular bor.
  const brands = useBrands();
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  if (!isAuthOpen) return null;

  const pwStrength    = passwordStrength(password, a);
  const emailInvalid  = emailTouched && email.length > 0 && !isValidEmail(email);
  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handleCredentials = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) { setError(a.invalidEmail); return; }

    if (authMode === 'login') {
      setIsLoading(true);
      try {
        await login(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : a.wrongCredentials);
      }
      setIsLoading(false);
    } else {
      if (!name.trim()) { setError(a.nameRequired); return; }
      if (password.length < 8) { setError(a.passwordTooShort); return; }
      setStep('profile');
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    try {
      await register({ name, email, password, ageGroup, budgetLevel, preferredBrands, preferredCategories });
    } catch (err) {
      setError(err instanceof Error ? err.message : a.registerError);
      setStep('credentials');
    }
    setIsLoading(false);
  };

  const reset = () => {
    setStep('credentials'); setError('');
    setName(''); setEmail(''); setPassword('');
    setEmailTouched(false);
    setPreferredBrands([]); setPreferredCategories([]);
  };

  const switchMode   = () => { reset(); authMode === 'login' ? openRegister() : openLogin(); };
  const handleClose  = () => { reset(); closeAuth(); };

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Gradient header */}
        <div className="relative bg-linear-to-br from-violet-600 to-violet-800 px-6 pt-6 pb-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

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

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">BAZARCOM</p>
              <h2 className="text-lg font-black text-white leading-tight">
                {authMode === 'login'
                  ? a.login
                  : step === 'credentials' ? a.register : a.yourProfile}
              </h2>
            </div>
          </div>

          {/* Step indicator for register */}
          {authMode === 'register' && (
            <div className="relative flex items-center gap-2 mt-4">
              {(['credentials', 'profile'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    step === s
                      ? 'bg-white text-violet-700'
                      : i === 0 && step === 'profile'
                        ? 'bg-white/30 text-white'
                        : 'bg-white/15 text-white/50'
                  }`}>
                    {i === 0 && step === 'profile' ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  {i === 0 && (
                    <div className="flex-1 h-0.5 w-8 bg-white/20 rounded-full">
                      <div className={`h-full bg-white rounded-full transition-all ${step === 'profile' ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              ))}
              <span className="ml-auto text-[10px] text-white/60 font-semibold">
                {step === 'credentials' ? '1/2' : '2/2'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── STEP 1: Credentials ── */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentials} className="space-y-3">

              {authMode === 'register' && (
                <div>
                  <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{a.name}</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder={a.namePlaceholder} required minLength={2} maxLength={100}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{a.email}</label>
                <div className="relative mt-1">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${emailInvalid ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="email@example.com" required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                      emailInvalid
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-400/30 focus:border-red-400'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-violet-400/40 focus:border-violet-400'
                    }`}
                  />
                </div>
                {emailInvalid && (
                  <p className="mt-1 text-[10px] text-red-500 font-semibold">{a.invalidEmailFormat}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{a.password}</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={8} maxLength={128}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength — register only */}
                {authMode === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(n => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            pwStrength.bars >= n ? pwStrength.color : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${
                      pwStrength.bars === 3 ? 'text-green-500' :
                      pwStrength.bars === 2 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {pwStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-sm shadow-md shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{authMode === 'login' ? a.login : a.continue}<ChevronRight className="w-4 h-4" /></>
                }
              </button>
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
              <div>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.ageGroup}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {AGE_GROUPS.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => setAgeGroup(value)}
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
              <div>
                <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.budgetLevel}</p>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGET_LEVELS.map(({ value, desc }) => (
                    <button key={value} type="button" onClick={() => setBudgetLevel(value)}
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
                  {brands.map(({ key, name }) => {
                    const on = preferredBrands.includes(key);
                    return (
                      <button key={key} type="button" onClick={() => setPreferredBrands(prev => toggle(prev, key))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          on ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                        {on
                          ? <Check className="w-3 h-3" />
                          : <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[key] ?? '#9ca3af' }} />}
                        {name}
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
                      <button key={c} type="button" onClick={() => setPreferredCategories(prev => toggle(prev, c))}
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
                <button type="button" onClick={() => setStep('credentials')}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition active:scale-[0.98]">
                  {a.back}
                </button>
                <button type="button" onClick={handleRegister} disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60">
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Sparkles className="w-4 h-4" /> {a.start}</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Switch mode */}
          {step === 'credentials' && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              {authMode === 'login' ? a.noAccount : a.haveAccount}{' '}
              <button onClick={switchMode} className="font-black text-violet-600 dark:text-violet-400 hover:underline">
                {authMode === 'login' ? a.register : a.login}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
