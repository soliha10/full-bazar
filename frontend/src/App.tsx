import { Suspense, lazy } from "react";
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
import { CompareProvider } from "./contexts/CompareContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { MobileToolbar } from "./components/MobileToolbar";
import { AuthModal } from "./components/AuthModal";
import { CompareBar } from "./components/CompareBar";
import { Landing } from "./pages/Landing";

// Bosh sahifa darhol kerak, qolganlari esa faqat o'sha marshrutga o'tilganda.
// Bu boshlang'ich yuklamadan recharts (~400 KB) kabi og'ir kutubxonalarni
// butunlay chiqarib tashlaydi — ular faqat Tahlil va Mahsulot sahifalarida
// ishlatiladi, lekin ilgari har bir mehmon ularni yuklab olardi.
const ProductListing = lazy(() => import("./pages/ProductListing").then(m => ({ default: m.ProductListing })));
const ProductDetail  = lazy(() => import("./pages/ProductDetail").then(m => ({ default: m.ProductDetail })));
const Wishlist       = lazy(() => import("./pages/Wishlist").then(m => ({ default: m.Wishlist })));
const Watchlist      = lazy(() => import("./pages/Watchlist").then(m => ({ default: m.Watchlist })));
const Profile        = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Trends         = lazy(() => import("./pages/Trends").then(m => ({ default: m.Trends })));
const Feedback       = lazy(() => import("./pages/Feedback").then(m => ({ default: m.Feedback })));
const Compare        = lazy(() => import("./pages/Compare").then(m => ({ default: m.Compare })));
const NotFound       = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FavoritesProvider>
            <PriceWatchProvider>
              <CompareProvider>
                <Router>
                  <AppContent />
                </Router>
              </CompareProvider>
            </PriceWatchProvider>
          </FavoritesProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

/** Marshrut bo'lagi yuklanayotgan paytdagi oraliq ekran. Balandligi ekranga
 *  yaqin qilib olindi, shunda sahifa almashganda footer yuqoriga sakramaydi. */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-violet-200 dark:border-violet-900 border-t-violet-600 animate-spin" />
      <span className="sr-only">Yuklanmoqda</span>
    </div>
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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/products"    element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist"    element={<Wishlist />} />
            <Route path="/watchlist"   element={<Watchlist />} />
            <Route path="/profile"     element={<Profile />} />
            <Route path="/trends"      element={<Trends />} />
            <Route path="/feedback"    element={<Feedback />} />
            <Route path="/compare"     element={<Compare />} />
            {/* Noma'lum URL — bo'sh sahifa o'rniga noindex 404 */}
            <Route path="*"            element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {!hideFooter && <Footer />}
      <MobileToolbar />
      <AuthModal />
      <CompareBar />
    </div>
  );
}
