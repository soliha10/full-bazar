import { sessionId } from './tracking';

const API_BASE_URL = '/api';

export const fetchProducts = async (
  page = 1,
  limit = 12,
  search = '',
  signal?: AbortSignal,
  markets: string[] = [],
  brand = '',
  category = '',
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

    const response = await fetch(`${API_BASE_URL}/products?${params}`, { signal });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async (id: string | number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
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
