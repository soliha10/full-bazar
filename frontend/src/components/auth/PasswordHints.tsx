import { Check, Circle } from 'lucide-react';
import { passwordChecks, passwordScore } from '../../utils/authValidation';
import { STRENGTH_BAR } from './constants';
import type { AuthForm } from './useAuthForm';

/* Yangi parol uchun kuch ko'rsatkichi va talablar ro'yxati (faqat ro'yxatdan o'tishda) */
export function PasswordHints({ f }: { f: AuthForm }) {
  const { a, ids, password } = f;
  const checks = passwordChecks(password);
  const score = passwordScore(password);
  const scoreLabel = score <= 1 ? a.pwWeak : score === 2 ? a.pwMedium : a.pwStrong;
  return (
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
  );
}
