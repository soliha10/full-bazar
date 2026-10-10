import { sessionId } from './tracking';

const API_BASE_URL = '/api';

export type ServerSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

export interface ListFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: ServerSort;
}

export const fetchProducts = async (
  page = 1,
  limit = 12,
  search = '',
  signal?: AbortSignal,
  markets: string[] = [],
  brand = '',
  category = '',
  specs: { ram?: string[]; storage?: string[]; batteryMin?: number } = {},
  extra: ListFilters = {},
) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);
    if (markets.length > 0) params.set('market', markets.join(','));
    if (brand) params.set('brand', brand);
    if (category && category !== 'All') params.set('category', category);
    // Xususiyat filtrlari serverda qo'llanadi — mijozda emas. Aks holda
    // filtr faqat yuklangan sahifadagi mahsulotlarga ta'sir qilib, "total"
    // va cheksiz aylantirish noto'g'ri bo'lib qolardi.
    if (specs.ram?.length)     params.set('ram', specs.ram.join(','));
    if (specs.storage?.length) params.set('storage', specs.storage.join(','));
    if (specs.batteryMin)      params.set('battery_min', String(specs.batteryMin));
    // Narx, reyting va saralash ham serverda — butun katalogga qo'llanadi
    if (extra.minPrice)  params.set('min_price', String(extra.minPrice));
    if (extra.maxPrice)  params.set('max_price', String(extra.maxPrice));
    if (extra.minRating) params.set('min_rating', String(extra.minRating));
    if (extra.sort && extra.sort !== 'relevance') params.set('sort', extra.sort);

    const response = await fetch(`${API_BASE_URL}/products?${params}`, { signal });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error('Error fetching products:', error);
    throw error;
  }
};

/** Xususiyat filtrlari uchun mavjud qiymatlar (RAM, xotira, batareya oralig'i). */
export const fetchSpecFacets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/spec-facets`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching spec facets:', error);
    // Filtr ro'yxati kelmasa sahifa baribir ishlashi kerak — shunchaki
    // xususiyat filtrlari ko'rinmaydi.
    return { ram: [], storage: [], battery: [] };
  }
};

/** HTTP holati bilan xato — sahifa 404 ni server nosozligidan ajrata olsin */
export class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

/**
 * Mahsulotni oladi. 404 — mahsulot haqiqatan yo'q, darhol qaytariladi.
 * Server/tarmoq xatosi (baza vaqtincha band, Render uyg'onmoqda) esa
 * vaqtinchalik — ikki marta qayta urinamiz, aks holda foydalanuvchi mavjud
 * mahsulot uchun "topilmadi" ni ko'rardi.
 */
export const fetchProductById = async (id: string | number) => {
  let last: unknown;
  for (const wait of [0, 1500, 4000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (response.status === 404) throw new ApiError(404);
      if (!response.ok) {
        last = new ApiError(response.status);
        continue;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw error;
      last = error;
    }
  }
  console.error(`Error fetching product ${id}:`, last);
  throw last;
};

/**
 * Mahsulotning texnik xususiyatlari (GSMArena dan yig'ilgan).
 *
 * `ref` — slug yoki ID. Mos model topilmasa `matched: false` qaytadi va
 * sahifa xususiyatlar bo'limini ko'rsatmaydi — bo'sh jadval o'rniga hech narsa
 * ko'rsatmaslik to'g'riroq.
 */
export const fetchProductSpecs = async (ref: string | number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${ref}/specs`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching specs for ${ref}:`, error);
    return { matched: false, specs: null };
  }
};

export const fetchPersonalizedRecommendations = async (limit = 8) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/recommendations/personalized?session_id=${sessionId}&limit=${limit}`,
    );
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    throw error;
  }
};

export const fetchPriceHistory = async (productId: string, days = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/price-history?days=${days}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching price history for ${productId}:`, error);
    return { history: [] };
  }
};

export const fetchTrends = async (limit = 8) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trends?limit=${limit}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching trends:', error);
    return { dropping: [], rising: [] };
  }
};

export const fetchCompare = async (ids: (string | number)[]) => {
  const response = await fetch(`${API_BASE_URL}/compare?ids=${ids.map(String).join(',')}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

export const submitFeedback = async (
  data: { message: string; rating?: number; name?: string; email?: string },
  token?: string,
) => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};
