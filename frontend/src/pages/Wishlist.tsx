import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../hooks/useFavorites';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

export function Wishlist() {
  const { favorites, toggle } = useFavorites();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {t.footer.wishlist}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {favorites.length} ta mahsulot
              </p>
            </div>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={() => favorites.forEach(p => toggle(p))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Barchasini o'chirish
            </button>
          )}
        </div>

        {/* Empty state */}
        <AnimatePresence>
          {favorites.length === 0 && (
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
                <Heart className="w-10 h-10 text-gray-200 dark:text-gray-700" />
              </motion.div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                Sevimlilar bo'sh
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Mahsulot kartasidagi yurak tugmasini bosib sevimlilar ro'yxatiga qo'shing
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
        {favorites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {favorites.map((product, i) => (
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
