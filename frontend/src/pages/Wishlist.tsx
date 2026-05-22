import { Heart, Bell, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../hooks/useFavorites';
import { usePriceWatch } from '../hooks/usePriceWatch';
import { ProductCard, Product } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

export function Wishlist() {
  const { favorites, toggle } = useFavorites();
  const { watched, toggle: toggleWatch } = usePriceWatch();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'watch' ? 'watch' : 'favorites';

  const products: Product[] = activeTab === 'favorites' ? favorites : watched;
  const removeItem = (p: Product) => activeTab === 'favorites' ? toggle(p) : toggleWatch(p);
  const removeAll = () => products.forEach(removeItem);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSearchParams({})}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all ${
              activeTab === 'favorites'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-red-500' : ''}`} />
            {t.footer.wishlist}
            {favorites.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'favorites' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {favorites.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'watch' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all ${
              activeTab === 'watch'
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Bell className={`w-4 h-4 ${activeTab === 'watch' ? 'fill-violet-200 dark:fill-violet-800' : ''}`} />
            Narx kuzatuv
            {watched.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'watch' ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {watched.length}
              </span>
            )}
          </button>

          {products.length > 0 && (
            <button
              onClick={removeAll}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Barchasini o'chirish
            </button>
          )}
        </div>

        {/* Watch tab description */}
        {activeTab === 'watch' && watched.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-violet-400" />
            Qo'shilgan mahsulotlar narxi o'zgarganda xabar olasiz
          </p>
        )}

        {/* Empty state */}
        <AnimatePresence>
          {products.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-5"
              >
                {activeTab === 'favorites'
                  ? <Heart className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                  : <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                }
              </motion.div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                {activeTab === 'favorites' ? 'Sevimlilar bo\'sh' : 'Kuzatuv ro\'yxati bo\'sh'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                {activeTab === 'favorites'
                  ? 'Mahsulot kartasidagi yurak tugmasini bosib sevimlilar ro\'yxatiga qo\'shing'
                  : 'Mahsulot kartasidagi qo\'ng\'iroq tugmasini bosib narxini kuzating'}
              </p>
              <Link
                to="/products"
                className="bg-violet-600 hover:bg-violet-700 text-white font-black text-sm px-6 py-3 rounded-2xl transition-all active:scale-95"
              >
                Mahsulotlarni ko'rish
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.82, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: Math.min(i, 11) * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
