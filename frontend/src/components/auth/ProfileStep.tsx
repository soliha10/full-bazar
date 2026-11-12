import { Check, Sparkles } from 'lucide-react';
import { BRAND_COLORS } from '../../hooks/useBrands';
import { AGE_GROUPS, BUDGET_LEVELS, CATEGORIES } from './constants';
import { spinner } from './FormField';
import type { AuthForm } from './useAuthForm';

const toggle = <T extends string>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

/* ── STEP 2: Profile (register only) ── */
export function ProfileStep({ f }: { f: AuthForm }) {
  const {
    a, isLoading, brands, ageGroup, setAgeGroup, budgetLevel, setBudgetLevel,
    preferredBrands, setPreferredBrands, preferredCategories, setPreferredCategories,
    setStep, setFormError, handleRegister,
  } = f;
  return (
    <div className="space-y-5">

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
        <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-snug">
          {a.profileHintBefore}<b>{a.profileHintBold}</b>{a.profileHintAfter}
        </p>
      </div>

      {/* Yosh */}
      <div role="radiogroup" aria-label={a.ageGroup}>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.ageGroup}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {AGE_GROUPS.map(({ value, label }) => (
            <button key={value} type="button" role="radio" aria-checked={ageGroup === value}
              onClick={() => setAgeGroup(value)}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                ageGroup === value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Byudjet */}
      <div role="radiogroup" aria-label={a.budgetLevel}>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{a.budgetLevel}</p>
        <div className="grid grid-cols-3 gap-2">
          {BUDGET_LEVELS.map(({ value, desc }) => (
            <button key={value} type="button" role="radio" aria-checked={budgetLevel === value}
              onClick={() => setBudgetLevel(value)}
              className={`flex flex-col items-center py-3 px-2 rounded-xl text-center transition-all active:scale-95 border ${
                budgetLevel === value
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
              }`}>
              <span className={`text-xs font-semibold ${budgetLevel === value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>{a.budgetLevels[value]}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brendlar */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60">
          {isLoading ? spinner : <><Sparkles className="w-4 h-4" /> {a.start}</>}
        </button>
      </div>
    </div>
  );
}
