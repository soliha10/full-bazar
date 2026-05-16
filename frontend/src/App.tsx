import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { MobileToolbar } from "./components/MobileToolbar";
import { Landing } from "./pages/Landing";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderSuccess } from "./pages/OrderSuccess";
import { Product } from "./components/ProductCard";

type CartItem = Product & { cartQuantity: number };

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const isSearchPage  = location.pathname === '/products';
  const isDetailPage  = location.pathname.startsWith('/product/');

  const hideNavbarOnMobile = isSearchPage || isDetailPage;

  const hideFooter =
    isSearchPage ||
    isDetailPage ||
    location.pathname === '/cart' ||
    location.pathname === '/checkout' ||
    location.pathname === '/order-success';

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/products?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate("/products", { replace: true });
    }
  };

  const handleUpdateQuantity = (productId: string | number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i => i.id === productId ? { ...i, cartQuantity: i.cartQuantity + delta } : i)
        .filter(i => i.cartQuantity > 0)
    );
  };

  const handleRemoveItem = (productId: string | number) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <div className={hideNavbarOnMobile ? 'hidden md:block' : 'block'}>
        <Navbar onSearchChange={handleSearch} />
      </div>

      <main className="flex-1 md:mt-[70px]">
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/products"      element={<ProductListing />} />
          <Route path="/product/:id"   element={<ProductDetail />} />
          <Route path="/cart"          element={
            <Cart
              cartItems={cartItems as any}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          } />
          <Route path="/checkout"      element={<Checkout cartItems={cartItems as any} />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
      <MobileToolbar />
    </div>
  );
}
