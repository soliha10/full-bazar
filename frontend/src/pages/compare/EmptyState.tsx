import { MAX_COMPARE } from '../../contexts/CompareContext';
import { useLanguage } from '../../contexts/LanguageContext';

/* Bo'sh holat. Taqqoslash endi headerdan ochiladi, ya'ni bu yerga hech
   narsa tanlamagan foydalanuvchi ham tushadi — shuning uchun bu ekran
   boshi berk ko'cha bo'lmasligi va davom etish yo'lini ko'rsatishi kerak. */
export function EmptyState({ onAdd, onBrowse }: { onAdd: () => void; onBrowse: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="text-center py-16 px-4">
      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
        {t.compare.emptyTitle}
      </p>
      <p className="text-sm font-semibold text-gray-400 max-w-md mx-auto mb-6">
        {t.compare.emptyDescription.replace('{{max}}', String(MAX_COMPARE))}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors"
        >
          {t.compare.addProduct}
        </button>
        <button
          onClick={onBrowse}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-colors"
        >
          {t.compare.browseCatalog}
        </button>
      </div>
    </div>
  );
}
