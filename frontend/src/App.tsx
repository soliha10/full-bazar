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

interface AppContentProps {}

function AppContent({}: AppContentProps) {
  const navigate = useNavigate();

  const location = useLocation();
  const isSearchPage = location.pathname === '/products';
  const isDetailPage = location.pathname.startsWith('/product/');
  const hideNavbarOnMobile = isSearchPage || isDetailPage;

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
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </main>
      {!isSearchPage && !isDetailPage && <Footer />}
      <MobileToolbar />
    </div>
  );
}
