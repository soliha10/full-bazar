import { Search, Smartphone, Shirt, Home, ShoppingBag, Sparkles, CreditCard, Shield, Truck, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { CategoryCard } from '../components/CategoryCard';
import { FeatureCard } from '../components/FeatureCard';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useProducts } from '../hooks/useProducts';

interface LandingProps {}

export function Landing({}: LandingProps) {
  const { t } = useLanguage();
  const { products: allProducts, loading } = useProducts(1, 8);
  const featuredProducts = allProducts.slice(0, 8);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in">
      {/* ATTENTION - Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary/5 via-background to-secondary/30 py-12 md:py-24">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-slide-up">
                <Sparkles className="w-4 h-4" />
                <span>{t.landing.trending.title}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {t.landing.hero.title.split(' ').slice(0, -2).join(' ')} <span className="text-gradient">{t.landing.hero.title.split(' ').slice(-2).join(' ')}</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {t.landing.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link to="/products">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-10 py-6 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95">
                    {t.landing.hero.cta}
                  </Button>
                </Link>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                   <input
                    type="text"
                    placeholder={t.nav.searchPlaceholder}
                    className="w-full sm:w-80 pl-12 pr-4 py-4 bg-card/50 backdrop-blur-sm border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base transition-all hover:bg-card"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8 border-t border-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">50K+</p>
                  <p className="text-muted-foreground text-sm font-medium">{t.landing.hero.topDeals}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">10K+</p>
                  <p className="text-muted-foreground text-sm font-medium">{t.footer.customer}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">4.8★</p>
                  <p className="text-muted-foreground text-sm font-medium">{t.listing.rating}</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl -rotate-6 translate-x-4 opacity-30" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-card/10">
                <img
                  src="https://images.unsplash.com/photo-1758526213717-9ae81ab43743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMGxpZmVzdHlsZXxlbnwxfHx8fDE3Njg5MTA4NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Shopping lifestyle"
                  className="w-full object-cover aspect-4/3 scale-105 hover:scale-110 transition-transform duration-700"
                />
              </div>
              
              <div className="absolute -bottom-8 -left-8 glass rounded-2xl p-5 shadow-xl border border-white/20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t.landing.features.secure.title}</p>
                    <p className="text-sm text-muted-foreground font-medium">{t.landing.features.secure.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEREST - Categories Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.landing.categories.title}</h2>
              <p className="text-muted-foreground text-lg">{t.landing.hero.subtitle}</p>
            </div>
            <Link to="/products" className="text-primary font-bold hover:underline mb-2">
              {t.landing.trending.viewAll} →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            <CategoryCard
              icon={Smartphone}
              title={t.landing.categories.electronics}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1717996563514-e3519f9ef9f7?w=600"
              link="/products?category=Electronics"
            />
            <CategoryCard
              icon={Shirt}
              title={t.landing.categories.fashion}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1599012307530-d163bd04ecab?w=600"
              link="/products?category=Fashion"
            />
            <CategoryCard
              icon={Home}
              title={t.landing.categories.home}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1621960144410-36da870e29b6?w=600"
              link="/products?category=Home"
            />
            <CategoryCard
              icon={ShoppingBag}
              title={t.footer.shop}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"
              link="/products?category=Grocery"
            />
            <CategoryCard
              icon={Sparkles}
              title={t.landing.categories.beauty}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600"
              link="/products?category=Beauty"
            />
          </div>
        </div>
      </section>

      {/* INTEREST - Why Choose Us */}
      <section className="py-24 bg-muted/50 rounded-[3rem] mx-4 sm:mx-8 mb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t.landing.features.title}</h2>
            <p className="text-muted-foreground text-lg">{t.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={CreditCard}
              title={t.landing.features.secure.title}
              description={t.landing.features.secure.desc}
            />
            <FeatureCard
              icon={Shield}
              title={t.landing.features.returns.title}
              description={t.landing.features.returns.desc}
            />
            <FeatureCard
              icon={Truck}
              title={t.landing.features.shipping.title}
              description={t.landing.features.shipping.desc}
            />
            <FeatureCard
              icon={Headphones}
              title={t.landing.features.support.title}
              description={t.landing.features.support.desc}
            />
          </div>
        </div>
      </section>

      {/* DESIRE - Featured Products */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-16">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.landing.trending.title}</h2>
              <p className="text-muted-foreground text-lg">{t.landing.hero.topDeals}</p>
            </div>
            <Link to="/products">
              <Button variant="outline" size="lg" className="rounded-2xl border-2 px-8 py-6 font-bold hover:bg-primary hover:text-white transition-all">
                {t.landing.trending.viewAll}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading && featuredProducts.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl aspect-3/4 animate-pulse border border-border shadow-sm" />
              ))
            ) : (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary skew-y-3 translate-y-24 scale-125" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-7xl font-extrabold">{t.landing.hero.title}</h2>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">{t.landing.hero.subtitle}</p>
          <Link to="/products" className="inline-block">
            <Button className="bg-white text-primary hover:bg-white/90 text-2xl font-bold px-12 py-8 rounded-3xl transition-transform active:scale-95 shadow-2xl">
              {t.landing.hero.cta}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}