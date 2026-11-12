import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ApiError, fetchProductById, fetchSimilarProducts, fetchPriceHistory, fetchProductSpecs } from "../../services/api";
import { mapProduct } from "../../utils/productMapper";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { trackEvent } from "../../services/tracking";
import { productPath, productRef } from "../../utils/slug";
import type { Specs } from "./specs";

export type PricePoint = { date: string; source: string; price: number };

/**
 * Mahsulot sahifasi uchun barcha ma'lumotlar: mahsulotning o'zi, texnik
 * xususiyatlar, o'xshash modellar va narx tarixi. Effektlar tartibi asl
 * sahifadagidek — ProductDetail buni galereya hookidan oldin chaqiradi.
 */
export function useProductDetail() {
  // URL da endi faqat nom turadi (/product/samsung-galaxy-s24-ultra-256gb).
  // API bu murojaatni slug sifatida qabul qiladi; eski, oxirida ID li
  // havolalar ham ishlayveradi — productRef ulardan ID ni ajratib beradi.
  const { id: idParam } = useParams();
  const ref = useMemo(() => productRef(idParam), [idParam]);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [specs, setSpecs] = useState<Specs | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let cancelled = false;
    const getProduct = async () => {
      if (!ref) return;
      try {
        setLoading(true);
        const data = await fetchProductById(ref);
        if (cancelled) return;
        const mapped = mapProduct(data);
        setProduct(mapped);
        // Hodisalar va narx tarixi ID bo'yicha yoziladi — manzildagi slug emas,
        // aynan mahsulotning o'zgarmas identifikatori kerak.
        trackEvent('view', String(mapped.id));
        if (mapped.markets && mapped.markets.length > 0) {
          const sorted = [...mapped.markets].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          const index = mapped.markets.findIndex(
            (m) => m.source === cheapest.source && m.price === cheapest.price
          );
          setSelectedMarketIndex(index !== -1 ? index : 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError && err.status === 404
            ? t.detail.productNotFound
            : t.detail.loadFailed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getProduct();
    return () => { cancelled = true; };
  }, [ref]);

  // Eski yoki noto'g'ri slug bilan kelingan bo'lsa, manzil satrini kanonik
  // shaklga almashtiramiz (tarixga yangi yozuv qo'shmasdan).
  useEffect(() => {
    if (!product) return;
    const canonical = productPath(product);
    if (location.pathname !== canonical) {
      navigate(canonical, { replace: true });
    }
  }, [product, location.pathname, navigate]);

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    fetchProductSpecs(ref)
      .then((data) => { if (!cancelled) setSpecs(data.matched ? data.specs : null); })
      .catch(() => { if (!cancelled) setSpecs(null); });
    return () => { cancelled = true; };
  }, [ref]);

  // Ilgari bu yerda shaxsiy tavsiyalar ko'rsatilardi (Samsung tagida iPhone).
  // Endi — shu brend va yaqin narxdagi modellar; xato bo'lsa bo'lim yashiriladi.
  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    setSimilarLoading(true);
    fetchSimilarProducts(ref, 8)
      .then((data) => { if (!cancelled) setSimilarProducts((data.products ?? []).map(mapProduct)); })
      .catch(() => { if (!cancelled) setSimilarProducts([]); })
      .finally(() => { if (!cancelled) setSimilarLoading(false); });
    return () => { cancelled = true; };
  }, [ref]);

  useEffect(() => {
    const productId = product?.id;
    if (!productId) return;
    let cancelled = false;
    fetchPriceHistory(String(productId), 30).then((data) => {
      if (!cancelled) setPriceHistory(data.history ?? []);
    });
    return () => { cancelled = true; };
  }, [product?.id]);

  return {
    navigate, product, loading, error, selectedMarketIndex, setSelectedMarketIndex,
    priceHistory, similarProducts, similarLoading, specs,
  };
}
