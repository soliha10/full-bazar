import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PriceWatchProvider } from "./contexts/PriceWatchContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { MobileToolbar } from "./components/MobileToolbar";
import { AuthModal } from "./components/AuthModal";
import { Landing } from "./pages/Landing";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";
import { Wishlist } from "./pages/Wishlist";
import { Watchlist } from "./pages/Watchlist";
import { Profile } from "./pages/Profile";
import { Trends } from "./pages/Trends";
import { Feedback } from "./pages/Feedback";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FavoritesProvider>
            <PriceWatchProvider>
              <Router>
                <AppContent />
              </Router>
            </PriceWatchProvider>
          </FavoritesProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSearchPage    = location.pathname === '/products';
  const isDetailPage    = location.pathname.startsWith('/product/');
  const isProfilePage   = location.pathname === '/profile';
  const isWatchlistPage = location.pathname === '/watchlist';
  const isFeedbackPage  = location.pathname === '/feedback';

  const hideNavbarOnMobile = isSearchPage || isDetailPage || isProfilePage || isWatchlistPage || isFeedbackPage;
  const hideFooter = isSearchPage || isDetailPage || location.pathname === '/wishlist' || isProfilePage || isWatchlistPage || isFeedbackPage;

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/products?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate("/products", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <div className={hideNavbarOnMobile ? 'hidden md:block' : 'block'}>
        <Navbar onSearchChange={handleSearch} />
      </div>

      <main className={`flex-1 md:mt-[70px] ${!hideNavbarOnMobile ? 'mt-[108px]' : ''}`}>
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/products"    element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/wishlist"    element={<Wishlist />} />
          <Route path="/watchlist"   element={<Watchlist />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/trends"      element={<Trends />} />
          <Route path="/feedback"    element={<Feedback />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
      <MobileToolbar />
      <AuthModal />
    </div>
  );
}
