
const API_BASE_URL = '/api';

export const fetchProducts = async (page = 1, limit = 12, search = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  };
