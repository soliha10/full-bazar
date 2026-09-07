import { Link } from 'react-router-dom';
import { SearchX, Home, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO, SITE_URL } from '../components/SEO';

export function NotFound() {
  const { language } = useLanguage();
  const uz = language === 'uz';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO
        title={uz ? 'Sahifa topilmadi' : 'Страница не найдена'}
        description={
          uz
            ? "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan."
            : 'Запрашиваемая страница не существует или была перемещена.'
        }
        noindex
        canonicalUrl={`${SITE_URL}/404`}
      />

      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-900/30">
          <SearchX className="h-8 w-8 text-violet-600 dark:text-violet-400" />
        </div>

        <p className="text-[13px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          {uz ? 'Sahifa topilmadi' : 'Страница не найдена'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {uz
            ? "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin."
            : 'Запрашиваемая страница не существует или была перемещена.'}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-violet-700"
          >
            <Home className="h-4 w-4" />
            {uz ? 'Bosh sahifa' : 'На главную'}
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Smartphone className="h-4 w-4" />
            {uz ? 'Smartfonlar katalogi' : 'Каталог смартфонов'}
          </Link>
        </div>
      </div>
    </div>
  );
}
