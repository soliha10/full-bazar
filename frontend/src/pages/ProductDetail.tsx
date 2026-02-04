import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Share2, Truck, RotateCcw, Shield, ChevronLeft, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { fetchProductById } from '../services/api';
import { mapProduct, formatSum } from '../utils/productMapper';
import { Product } from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductDetailProps {
  onAddToCart: (product: Product) => void;
}

export function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const getProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(mapProduct(data));
      } catch (err) {
        setError('Product not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FF7A00] animate-spin mb-4" />
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1E1E1E] mb-4">{error || 'Product not found'}</h2>
          <Link to="/products">
            <Button variant="primary">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mock additional images (in real app, these would come from product data)
  const images = [product.image, product.image, product.image];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/products" className="flex items-center gap-2 text-gray-600 hover:text-[#FF7A00] transition-colors w-fit">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-xl overflow-hidden mb-4 border border-gray-200">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-[#FF7A00]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              <h1 className="text-3xl font-bold text-[#1E1E1E] mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-[#FF7A00] text-[#FF7A00]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="font-semibold">{product.rating}</span>
                </div>
                <span className="text-gray-500">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-[#1E1E1E]">{formatSum(product.price)}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-400 line-through">{formatSum(product.originalPrice)}</span>
                      <span className="bg-[#2ECC71] text-white px-3 py-1 rounded-md font-semibold">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% {t.product.off}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes</p>
              </div>

              {/* Marketplace Comparison */}
              {product.markets && product.markets.length > 0 && (
                <div className="mb-8 border-t border-b border-gray-100 py-6">
                  <h3 className="text-lg font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF7A00]" />
                    Marketplace Comparison
                  </h3>
                  <div className="space-y-3">
                    {product.markets
                      .sort((a, b) => a.price - b.price)
                      .map((market, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            market.price === product.price 
                              ? 'bg-[#FFF5EB] border-[#FF7A00] shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center font-bold text-gray-400 uppercase text-[10px]">
                              {market.source.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{market.source}</p>
                              {market.price === product.price && (
                                <span className="text-[10px] text-[#FF7A00] font-bold uppercase">Best Price</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{formatSum(market.price)}</p>
                            <a 
                              href={market.url.startsWith('/') ? `https://uzum.uz${market.url}` : market.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-[#FF7A00] hover:underline flex items-center gap-1 justify-end"
                            >
                              Go to store <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <p className="text-[#2ECC71] font-medium">✓ In Stock - Ready to Ship</p>
                ) : (
                  <p className="text-red-500 font-medium">✗ Out of Stock</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-[#1E1E1E] mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  Experience premium quality with this exceptional product. Carefully crafted with attention to detail,
                  it combines functionality with style to meet your everyday needs. Whether you're looking for performance,
                  durability, or aesthetic appeal, this product delivers on all fronts.
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="font-semibold text-[#1E1E1E] mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant="primary" onClick={handleAddToCart} disabled={!product.inStock} className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
                <Link to="/checkout">
                  <Button variant="secondary" fullWidth disabled={!product.inStock}>
                    Buy Now
                  </Button>
                </Link>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3 mb-8">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-[#FF7A00]" />
                  <span className="text-gray-700">Free shipping on orders over 500 000 so'm</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <RotateCcw className="w-5 h-5 text-[#FF7A00]" />
                  <span className="text-gray-700">30-day return policy</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-5 h-5 text-[#FF7A00]" />
                  <span className="text-gray-700">Secure payment guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Features */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-[#1E1E1E] mb-6">Product Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#1E1E1E] mb-2">Specifications</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Premium quality materials</li>
                <li>• Durable and long-lasting</li>
                <li>• Easy to use and maintain</li>
                <li>• Suitable for daily use</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1E1E1E] mb-2">What's Included</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 1x {product.name}</li>
                <li>• User manual</li>
                <li>• Warranty card</li>
                <li>• Original packaging</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-[#1E1E1E] mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((review) => (
              <div key={review} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold">
                    {review === 1 ? 'JS' : review === 2 ? 'AM' : 'RK'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E1E1E]">
                      {review === 1 ? 'John Smith' : review === 2 ? 'Anna Martinez' : 'Robert Kim'}
                    </p>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#FF7A00] text-[#FF7A00]" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">
                  {review === 1
                    ? 'Excellent product! Exceeded my expectations in terms of quality and performance.'
                    : review === 2
                    ? 'Very satisfied with this purchase. Great value for money and fast delivery.'
                    : 'Highly recommend! The product is exactly as described and works perfectly.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
