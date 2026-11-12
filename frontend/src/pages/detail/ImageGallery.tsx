import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatSum } from "../../utils/productMapper";
import { FALLBACK_IMAGE, type Gallery } from "./useImageGallery";

/**
 * Mahsulot rasmlari: mobil ko'rinishda gorizontal karusel (nuqtalar va
 * strelkalar bilan), desktopda bitta katta rasm va yon tomonda miniatyuralar.
 */
export function ImageGallery({ gallery, productName, savings, liked, onToggleLike }: {
  gallery: Gallery;
  productName: string;
  savings: number;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const { images, selectedImage, setSelectedImage, goToImage, scrollContainerRef, imageRefs } = gallery;

  return (
    <div className="md:flex md:flex-row-reverse md:items-start gap-3">
    <div className="relative flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Savings badge */}
      {savings > 0 && (
        <div className="absolute top-4 right-14 md:right-4 z-10">
          <span className="bg-white/90 dark:bg-gray-900/90 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-xs font-medium">
            -{formatSum(savings)}
          </span>
        </div>
      )}

      {/* Like on image (mobile overlay) */}
      <div className="md:hidden absolute top-4 right-4 z-10">
        <button
          onClick={onToggleLike}
          className="w-9 h-9 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>
      </div>

      {/* Image carousel */}
      <div
        ref={scrollContainerRef}
        className="flex md:block overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            ref={el => { imageRefs.current[idx] = el; }}
            className="min-w-full md:min-w-0 snap-center"
          >
            <img
              src={img}
              alt={productName}
              className={`w-full aspect-square object-contain p-8 md:p-12 transition-opacity duration-500 ${
                selectedImage === idx ? 'opacity-100' : 'md:hidden'
              }`}
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
          </div>
        ))}
      </div>

      {/* Carousel arrows (mobile only — desktop uses the side thumbnail rail) */}
      {images.length > 3 && (
        <>
          <button
            onClick={() => goToImage(selectedImage - 1)}
            className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md hover:bg-white dark:hover:bg-gray-800 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => goToImage(selectedImage + 1)}
            className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md hover:bg-white dark:hover:bg-gray-800 active:scale-90 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </>
      )}

      {/* Dot indicators (mobile) */}
      {images.length > 1 && (
        <div className="md:hidden flex justify-center gap-1.5 pb-5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`rounded-full transition-all duration-300 ${
                selectedImage === idx
                  ? 'w-5 h-1.5 bg-violet-600'
                  : 'w-1.5 h-1.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>

    {/* Thumbnails — desktop, vertical rail */}
    <div
      className={`hidden md:flex md:flex-col gap-3 w-20 lg:w-24 shrink-0 ${
        images.length > 4
          ? "max-h-[480px] lg:max-h-[560px] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : ""
      }`}
    >
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => goToImage(idx)}
          className={`w-full aspect-square shrink-0 bg-white dark:bg-gray-900 rounded-2xl p-2 border-2 transition-all ${
            selectedImage === idx
              ? "border-violet-600"
              : "border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700"
          }`}
        >
          <img
            src={img}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
          />
        </button>
      ))}
    </div>
    </div>
  );
}
