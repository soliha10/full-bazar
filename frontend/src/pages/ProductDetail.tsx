import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  Heart,
  Share2,
  Shield,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/Button";
import { fetchProductById } from "../services/api";
import { mapProduct, formatSum } from "../utils/productMapper";
import { Product } from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext";

interface ProductDetailProps {
  onAddToCart?: (product: Product) => void;
}

export function ProductDetail({}: ProductDetailProps) {
  const { id } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);

  useEffect(() => {
    const getProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        const mapped = mapProduct(data);
        setProduct(mapped);
        if (mapped.markets && mapped.markets.length > 0) {
          const sorted = [...mapped.markets].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          const index = mapped.markets.findIndex(
            (m) => m.source === cheapest.source && m.price === cheapest.price,
          );
          setSelectedMarketIndex(index !== -1 ? index : 0);
        }
      } catch (err) {
        setError("Product not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-bounce-subtle">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-bold mt-4">
          Bozor narxlari tahlil qilinmoqda...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-[2.5rem] p-12 text-center shadow-xl border border-border/50 max-w-lg w-full">
          <h2 className="text-3xl font-black text-foreground mb-6">
            {error || "Mahsulot topilmadi"}
          </h2>
          <Link to="/products">
            <Button variant="primary" size="lg" className="rounded-2xl px-12">
              Kolleksiyalarga qaytish
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images.filter((img) => img && img !== "")
      : [product.image];

  const selectedMarket = product.markets?.[selectedMarketIndex];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            to="/products"
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all w-fit font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span>Boshqa mahsulotlarni ko'rish</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="space-y-6">
            <div className="bg-card rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl relative group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("placeholder")) {
                    target.src =
                      "https://via.placeholder.com/600x600?text=Rasm+topilmadi";
                  }
                }}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {product.originalPrice &&
                product.price < product.originalPrice && (
                  <div className="absolute top-6 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-2xl font-black shadow-lg">
                    {Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100,
                    )}
                    % {t.product.off}
                  </div>
                )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-card rounded-2xl overflow-hidden border-2 transition-all aspect-square ${
                    selectedImage === idx
                      ? "border-primary ring-4 ring-primary/10"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("placeholder")) {
                        target.src =
                          "https://via.placeholder.com/600x600?text=Rasm+topilmadi";
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                  {product.category}
                </span>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Tasdiqlangan eng yaxshi narx
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-black text-lg">
                    {product.rating}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground font-bold">
                  {product.reviews} ta tahlil natijasi
                </span>
              </div>
            </div>
            <div className="bg-muted/30 rounded-4xl p-8 border border-border/50 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Joriy tanlov: {selectedMarket?.source}
                </span>
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                  Jonli narxlar
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-foreground tracking-tighter italic">
                  {formatSum(selectedMarket?.price || product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl text-muted-foreground line-through decoration-primary/30 decoration-4">
                    {formatSum(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {product.markets && product.markets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Mavjud variantlar
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Solishtiring va tanlang
                  </span>
                </div>
                <div className="grid gap-3">
                  {product.markets
                    .sort((a, b) => a.price - b.price)
                    .map((market, idx) => {
                      const isSelected =
                        selectedMarketIndex ===
                        product.markets?.indexOf(market);
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setSelectedMarketIndex(
                              product.markets?.indexOf(market) ?? 0,
                            )
                          }
                          className={`group w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left ${
                            isSelected
                              ? "bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                              : "bg-card border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black uppercase text-xs transition-colors ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {market.source.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-lg">
                                {market.source}
                              </p>
                              {idx === 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                                    Eng arzon variant
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xl text-foreground mb-1">
                              {formatSum(market.price)}
                            </p>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                              Do'konni tanlash
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-border/50">
              <div className="flex flex-col gap-4">
                <a
                  href={
                    selectedMarket?.url.startsWith("/")
                      ? `https://uzum.uz${selectedMarket.url}`
                      : selectedMarket?.url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="rounded-4xl h-20 text-xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    {selectedMarket?.source.toUpperCase()} DO'KONIGA O'TISH
                    <ExternalLink className="ml-3 w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </a>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all font-black text-xs uppercase tracking-widest">
                    <Heart className="w-5 h-5 text-primary" />
                    Tahlilni saqlash
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all font-black text-xs uppercase tracking-widest">
                    <Share2 className="w-5 h-5 text-primary" />
                    Narxni ulashish
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border/50">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground uppercase">
                    Tashqi do'konga havola
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Xavfsiz va shifrlangan
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground uppercase">
                    Narx himoyasi
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Har 15 daqiqada yangilanadi
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground uppercase">
                    Tasdiqlangan sotuvchi
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Faqat ishonchli do'konlar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-card rounded-[3rem] p-12 border border-border/50 shadow-sm space-y-6">
              <h2 className="text-3xl font-black text-foreground flex items-center gap-4">
                <div className="w-2 h-8 bg-primary rounded-full" />
                Product Story
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  {product.description ||
                    "Experience premium quality with this exceptional product. Carefully crafted with attention to detail, it combines functionality with style to meet your everyday needs. Whether you're looking for performance, durability, or aesthetic appeal, this product delivers on all fronts."}
                </p>
              </div>
            </section>

            <section className="bg-card rounded-[3rem] p-12 border border-border/50 shadow-sm space-y-8">
              <h2 className="text-3xl font-black text-foreground">
                Specifications
              </h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-primary uppercase text-sm tracking-widest">
                    Key Features
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Premium sifatli materiallar",
                      "Uzoq vaqt xizmat qiladi",
                      "Zamonaviy minimalist dizayn",
                      "Foydalanish va saqlash oson",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-foreground font-medium"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-primary uppercase text-sm tracking-widest">
                    What's in the Box
                  </h3>
                  <ul className="space-y-3">
                    {[
                      `1x ${product.name}`,
                      "Qo'llanma",
                      "Premium qadoq",
                      "Kafolat kartasi",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-foreground font-medium"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-[3rem] p-8 border border-border/50 shadow-sm">
              <h2 className="text-2xl font-black text-foreground mb-8">
                Tasdiqlangan sharhlar
              </h2>
              <div className="space-y-10">
                {[
                  {
                    name: "John Smith",
                    initials: "JS",
                    text: "Yaxshi maxsulot ",
                    rating: 5,
                  },
                  {
                    name: "Anna Martinez",
                    initials: "AM",
                    text: " Ajoyib maxsulot ",
                    rating: 5,
                  },
                  {
                    name: "Robert Kim",
                    initials: "RK",
                    text: "Tavsiya qilaman",
                    rating: 4,
                  },
                ].map((review, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-sm">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {review.name}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, starI) => (
                            <Star
                              key={starI}
                              className={`w-3 h-3 ${starI < review.rating ? "fill-primary text-primary" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                      "{review.text}"
                    </p>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-10 font-bold text-primary hover:bg-primary/10 rounded-2xl"
              >
                Barcha sharhlarni o'qish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
