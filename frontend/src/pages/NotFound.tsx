import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO, SITE_URL } from '../components/SEO';

export function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO
        title={t.notFound.title}
        description={t.notFound.seoDesc}
        noindex
        canonicalUrl={`${SITE_URL}/404`}
      />

      <div className="w-full max-w-md text-center">

        <p className="text-[13px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {t.notFound.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t.notFound.desc}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            {t.notFound.home}
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {t.notFound.catalog}
          </Link>
        </div>
      </div>
    </div>
  );
}
