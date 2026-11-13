import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { FALLBACK_IMAGE, type Gallery } from "./useImageGallery";

/**
 * Mahsulot rasmlari: mobil ko'rinishda gorizontal karusel (nuqtalar va
 * strelkalar bilan), desktopda bitta katta rasm va yon tomonda miniatyuralar.
 */
export function ImageGallery({ gallery, productName }: {
  gallery: Gallery;
  productName: string;
}) {
  const { images, selectedImage, setSelectedImage, goToImage, scrollContainerRef, imageRefs } = gallery;
  const d = useLanguage().t.detailPage;

  return (
    <div className="md:flex md:flex-row-reverse md:items-start gap-3">
    <div className="relative flex-1 glass rounded-2xl overflow-hidden">
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
              className={`w-full aspect-square object-contain p-5 md:p-8 transition-opacity duration-500 ${
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
            title={d.prevImage} aria-label={d.prevImage}
            className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md hover:bg-white dark:hover:bg-gray-800 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => goToImage(selectedImage + 1)}
            title={d.nextImage} aria-label={d.nextImage}
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
              title={d.imageN.replace('{{n}}', String(idx + 1))} aria-label={d.imageN.replace('{{n}}', String(idx + 1))}
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
      className={`hidden md:flex md:flex-col gap-3 w-16 shrink-0 ${
        images.length > 4
          ? "max-h-[480px] lg:max-h-[560px] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : ""
      }`}
    >
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => goToImage(idx)}
          title={d.imageN.replace('{{n}}', String(idx + 1))} aria-label={d.imageN.replace('{{n}}', String(idx + 1))}
          className={`w-full aspect-square shrink-0 bg-white dark:bg-gray-900 rounded-xl p-1.5 border-2 transition-all ${
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
