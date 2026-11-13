import { Button } from "../../components/Button";
import { useLanguage } from "../../contexts/LanguageContext";
import { Card } from "../../components/Card";

export function DetailLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 transition-colors">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">{t.detail.analyzingPrices}</p>
    </div>
  );
}

export function DetailError({ error, onBack }: { error: string | null; onBack: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors">
      <Card radius="3xl" padding="none" className="p-10 text-center shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{error || t.detail.productNotFound}</h2>
        {error === t.detail.loadFailed && (
          <Button variant="primary" onClick={() => window.location.reload()} className="rounded-2xl px-10 mb-3 w-full">
            {t.detail.retry}
          </Button>
        )}
        <Button variant="primary" onClick={onBack} className="rounded-2xl px-10">
          {t.detail.backToMarketplace}
        </Button>
      </Card>
    </div>
  );
}
