
const API_BASE_URL = '/api';

export const fetchProducts = async (
  page = 1,
  limit = 12,
  search = '',
  signal?: AbortSignal,
  markets: string[] = [],
) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);
    if (markets.length > 0) params.set('market', markets.join(','));

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
