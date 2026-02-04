import { Trash2, Plus, Minus, ShoppingBag, Shield, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Product } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';

interface CartItem extends Product {
  cartQuantity: number;
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string | number, delta: number) => void;
  onRemoveItem: (productId: string | number) => void;
}

export function Cart({ cartItems, onUpdateQuantity, onRemoveItem }: CartProps) {
  const { t } = useLanguage();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-32 animate-fade-in">
        <div className="max-w-xl mx-auto px-4 text-center space-y-8">
          <div className="w-40 h-40 bg-primary/5 rounded-[3rem] flex items-center justify-center mx-auto border-2 border-dashed border-primary/20">
             <ShoppingBag className="w-20 h-20 text-primary animate-pulse" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-foreground tracking-tight">{t.cart.empty}</h2>
            <p className="text-muted-foreground text-lg font-medium">{t.landing.hero.subtitle}</p>
          </div>
          <Link to="/products" className="inline-block">
            <Button variant="primary" size="lg" className="rounded-2xl px-12 py-4 shadow-xl shadow-primary/20">
              {t.cart.continueShopping}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Your <span className="text-gradient">Cart</span></h1>
            <p className="text-muted-foreground font-medium">Review your items before proceeding to checkout</p>
          </div>
          <Link to="/products" className="text-primary font-bold hover:underline">
             ← {t.cart.continueShopping}
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="group bg-card rounded-[2rem] p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row gap-8">
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`} className="shrink-0">
                      <div className="w-full sm:w-40 aspect-square overflow-hidden rounded-2xl border border-border/50 group-hover:border-primary/30 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-black text-xl text-foreground hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-black uppercase tracking-widest">
                               {item.category}
                            </span>
                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full" /> In Stock
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="w-10 h-10 rounded-xl bg-muted/30 text-muted-foreground hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-10 h-10 rounded-lg hover:bg-white text-foreground font-black text-lg transition-all active:scale-90"
                          >
                            <Minus className="w-4 h-4 mx-auto" />
                          </button>
                          <span className="w-12 text-center font-black text-lg">{item.cartQuantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-10 h-10 rounded-lg hover:bg-white text-foreground font-black text-lg transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4 mx-auto" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-center sm:text-right">
                          <p className="text-2xl font-black text-foreground italic tracking-tighter">
                            {formatSum(item.price * item.cartQuantity)}
                          </p>
                          {item.originalPrice && (
                            <p className="text-sm text-muted-foreground line-through decoration-primary/30 font-bold">
                              {formatSum(item.originalPrice * item.cartQuantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl sticky top-28 space-y-8">
              <h2 className="text-2xl font-black text-foreground">{t.checkout.orderSummary}</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-muted-foreground font-bold">
                  <span className="text-sm">{t.cart.subtotal} ({cartItems.reduce((sum, item) => sum + item.cartQuantity, 0)} {t.cart.items})</span>
                  <span className="text-foreground">{formatSum(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground font-bold">
                  <span className="text-sm">{t.cart.shipping}</span>
                  <span className={shipping === 0 ? 'text-emerald-500 font-black' : 'text-foreground'}>
                    {shipping === 0 ? t.cart.shippingFree : formatSum(shipping)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground font-bold">
                  <span className="text-sm">{t.checkout.tax}</span>
                  <span className="text-foreground">{formatSum(tax)}</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                 <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-foreground">{t.cart.total}</span>
                    <span className="text-3xl font-black text-primary italic tracking-tighter">{formatSum(total)}</span>
                 </div>
              </div>

              <div className="space-y-3">
                <Link to="/checkout" className="block">
                  <Button variant="primary" size="lg" fullWidth className="rounded-2xl h-16 text-lg font-black shadow-xl shadow-primary/20">
                    {t.cart.proceedToCheckout}
                  </Button>
                </Link>
                <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                   Secure encrypted transaction
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 gap-4 pt-8 border-t border-border">
                {[
                  { icon: Shield, title: t.landing.features.secure.title, desc: "Payment handled by industry standard gateways" },
                  { icon: RotateCcw, title: t.landing.features.returns.desc, desc: "Easy returns if not satisfied" }
                ].map((badge, i) => (
                  <div key={i} className="flex gap-4">
                     <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
                        <badge.icon className="w-6 h-6 text-primary" />
                     </div>
                     <div>
                        <p className="font-black text-sm text-foreground uppercase">{badge.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight">{badge.desc}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}