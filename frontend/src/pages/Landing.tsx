import { Search, Smartphone, Shirt, Home, ShoppingBag, Sparkles, CreditCard, Shield, Truck, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { CategoryCard } from '../components/CategoryCard';
import { FeatureCard } from '../components/FeatureCard';
import { ProductCard } from '../components/ProductCard';
import { products } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
  onAddToCart: (product: any) => void;
}

export function Landing({ onAddToCart }: LandingProps) {
  const { t } = useLanguage();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* ATTENTION - Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FFF5EB] dark:from-[#2A1810] to-background py-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                {t.landing.hero.title.split(' ').slice(0, -2).join(' ')} <span className="text-[#FF7A00]">{t.landing.hero.title.split(' ').slice(-2).join(' ')}</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t.landing.hero.subtitle}
              </p>

              {/* Large Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                <input
                  type="text"
                  placeholder={t.nav.searchPlaceholder}
                  className="w-full pl-14 pr-4 py-4 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent text-lg transition-colors"
                />
              </div>

              <Link to="/products">
                <Button variant="primary" className="text-lg px-8 py-4">
                  {t.landing.hero.cta}
                </Button>
              </Link>

              {/* Stats */}
              <div className="flex gap-8 mt-10">
                <div>
                  <p className="text-3xl font-bold text-[#FF7A00]">50K+</p>
                  <p className="text-muted-foreground text-sm">{t.landing.hero.topDeals}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#FF7A00]">10K+</p>
                  <p className="text-muted-foreground text-sm">{t.footer.customer}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#FF7A00]">4.8★</p>
                  <p className="text-muted-foreground text-sm">{t.listing.rating}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1758526213717-9ae81ab43743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMGxpZmVzdHlsZXxlbnwxfHx8fDE3Njg5MTA4NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Shopping lifestyle"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#2ECC71] rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.landing.features.secure.title}</p>
                    <p className="text-sm text-muted-foreground">{t.landing.features.secure.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEREST - Categories Section */}
      <section className="py-16 bg-muted/30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">{t.landing.categories.title}</h2>
            <p className="text-muted-foreground text-lg">{t.landing.hero.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <CategoryCard
              icon={Smartphone}
              title={t.landing.categories.electronics}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1717996563514-e3519f9ef9f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGdhZGdldHN8ZW58MXx8fHwxNzY4OTA3NTcyfDA&ixlib=rb-4.1.0&q=80&w=1080"
              link="/products?category=Electronics"
            />
            <CategoryCard
              icon={Shirt}
              title={t.landing.categories.fashion}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBzdG9yZXxlbnwxfHx8fDE3Njg4NzA5NTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
              link="/products?category=Fashion"
            />
            <CategoryCard
              icon={Home}
              title={t.landing.categories.home}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1621960144410-36da870e29b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njg4NDI2MTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
              link="/products?category=Home"
            />
            <CategoryCard
              icon={ShoppingBag}
              title={t.footer.shop}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
              link="/products?category=Grocery"
            />
            <CategoryCard
              icon={Sparkles}
              title={t.landing.categories.beauty}
              description={t.landing.hero.topDeals}
              image="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800"
              link="/products?category=Beauty"
            />
          </div>
        </div>
      </section>

      {/* INTEREST - Why Choose Bazaarcom */}
      <section className="py-16 bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">{t.landing.features.title}</h2>
            <p className="text-muted-foreground text-lg">{t.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-16 bg-muted/30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">{t.landing.trending.title}</h2>
              <p className="text-muted-foreground text-lg">{t.landing.hero.topDeals}</p>
            </div>
            <Link to="/products">
              <Button variant="outline">{t.landing.trending.viewAll}</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-background border-t border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center text-center">
            <div>
              <Shield className="w-12 h-12 text-[#FF7A00] mx-auto mb-2" />
              <p className="font-semibold text-foreground">{t.landing.features.secure.title}</p>
              <p className="text-sm text-muted-foreground">{t.landing.features.secure.desc}</p>
            </div>
            <div>
              <Truck className="w-12 h-12 text-[#FF7A00] mx-auto mb-2" />
              <p className="font-semibold text-foreground">{t.landing.features.shipping.title}</p>
              <p className="text-sm text-muted-foreground">{t.landing.features.shipping.desc}</p>
            </div>
            <div>
              <Shield className="w-12 h-12 text-[#FF7A00] mx-auto mb-2" />
              <p className="font-semibold text-foreground">{t.landing.features.returns.title}</p>
              <p className="text-sm text-muted-foreground">{t.landing.features.returns.desc}</p>
            </div>
            <div>
              <Headphones className="w-12 h-12 text-[#FF7A00] mx-auto mb-2" />
              <p className="font-semibold text-foreground">{t.landing.features.support.title}</p>
              <p className="text-sm text-muted-foreground">{t.landing.features.support.desc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}