import { X, ShoppingBag, Check } from 'lucide-react';
import type { AuthForm } from './useAuthForm';

/* Gradient header: yopish tugmasi, sarlavha va (ro'yxatdan o'tishda) qadamlar */
export function AuthHeader({ f }: { f: AuthForm }) {
  const { a, ids, isRegister, step, steps, handleClose } = f;
  return (
    <div className="relative bg-violet-600 px-6 pt-6 pb-8">
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
          <h2 id={ids.title} className="text-lg font-semibold text-white leading-tight">
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
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
  );
}
