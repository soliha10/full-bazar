import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
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
      <div className="min-h-screen bg-muted/30 py-16 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-xl p-12 text-center border border-border">
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.cart.empty}</h2>
            <p className="text-muted-foreground mb-6">{t.landing.hero.subtitle}</p>
            <Link to="/products">
              <Button variant="primary">{t.cart.continueShopping}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">{t.cart.title}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-32 h-32 object-cover rounded-lg border border-border"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-semibold text-lg text-foreground hover:text-[#FF7A00] transition-colors mb-1">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-8 h-8 border border-border bg-background rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.cartQuantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 border border-border bg-background rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {formatSum(item.price * item.cartQuantity)}
                          </p>
                          {item.originalPrice && (
                            <p className="text-sm text-muted-foreground line-through">
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

            <Link to="/products" className="inline-block mt-6">
              <button className="text-[#FF7A00] hover:underline font-medium">
                ← {t.cart.continueShopping}
              </button>
            </Link>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-6">{t.checkout.orderSummary}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.subtotal} ({cartItems.reduce((sum, item) => sum + item.cartQuantity, 0)} {t.cart.items})</span>
                  <span>{formatSum(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.shipping}</span>
                  <span>{shipping === 0 ? t.cart.shippingFree : formatSum(shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.checkout.tax}</span>
                  <span>{formatSum(tax)}</span>
                </div>
                {subtotal < 50 && shipping > 0 && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {t.landing.features.shipping.desc}
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-foreground">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#FF7A00]">{formatSum(total)}</span>
                </div>
              </div>

              <Link to="/checkout">
                <Button variant="primary" fullWidth className="mb-3">
                  {t.cart.proceedToCheckout}
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="space-y-2 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full"></div>
                  <span>{t.landing.features.secure.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full"></div>
                  <span>{t.landing.features.returns.desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full"></div>
                  <span>{t.landing.features.shipping.desc}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}