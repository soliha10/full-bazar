import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Landing } from './pages/Landing';
import { ProductListing } from './pages/ProductListing';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Product } from './components/ProductCard';

interface CartItem extends Product {
  cartQuantity: number;
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bazaarcom_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bazaarcom_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, cartQuantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string | number, delta: number) => {
    setCartItems(prevItems => {
      return prevItems
        .map(item =>
          item.id === productId
            ? { ...item, cartQuantity: item.cartQuantity + delta }
            : item
        )
        .filter(item => item.cartQuantity > 0);
    });
  };

  const handleRemoveItem = (productId: string | number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AppContent 
            cartCount={cartCount} 
            handleAddToCart={handleAddToCart}
            handleUpdateQuantity={handleUpdateQuantity}
            handleRemoveItem={handleRemoveItem}
            cartItems={cartItems}
          />
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent({ cartCount, handleAddToCart, handleUpdateQuantity, handleRemoveItem, cartItems }: any) {
  const navigate = useNavigate();
  
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/products?search=${encodeURIComponent(value)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar cartCount={cartCount} onSearchChange={handleSearch} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing onAddToCart={handleAddToCart} />} />
          <Route path="/products" element={<ProductListing onAddToCart={handleAddToCart} />} />
          <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
          <Route 
            path="/cart" 
            element={
              <Cart 
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            } 
          />
          <Route path="/checkout" element={<Checkout cartItems={cartItems} />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}