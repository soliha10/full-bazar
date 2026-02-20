import { useState } from 'react';
import { CreditCard, Lock, Truck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Product } from '../components/ProductCard';
import { formatSum } from '../utils/productMapper';

interface CartItem extends Product {
  cartQuantity: number;
}

interface CheckoutProps {
  cartItems: CartItem[];
}

export function Checkout({ cartItems }: CheckoutProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/order-success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
           <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Buyurtmani <span className="text-gradient">rasmiylashtirish</span></h1>
           <p className="text-muted-foreground font-medium mt-2">   </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Information */}
              <div className="bg-card rounded-[2.5rem] p-8 sm:p-10 border border-border shadow-sm space-y-10">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                   <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary" />
                   </div>
                   <h2 className="text-2xl font-black text-foreground">Yetkazib berish</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    { label: "First Name", name: "firstName", type: "text" },
                    { label: "Last Name", name: "lastName", type: "text" },
                    { label: "Email Address", name: "email", type: "email" },
                    { label: "Phone Number", name: "phone", type: "tel" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                        {field.label} *
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        required
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
                      placeholder="Street name, apartment, suite, etc."
                    />
                  </div>
                  {[
                    { label: "City", name: "city" },
                    { label: "State / Province", name: "state" },
                    { label: "ZIP Code", name: "zipCode" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                        {field.label} *
                      </label>
                      <input
                        type="text"
                        name={field.name}
                        required
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-[2.5rem] p-8 sm:p-10 border border-border shadow-sm space-y-10">
                <div className="flex items-center justify-between border-b border-border pb-6">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                     </div>
                     <h2 className="text-2xl font-black text-foreground">To'lov usuli</h2>
                   </div>
                   <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-xl">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Xavfsiz to'lov</span>
                   </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                      Karta raqami *
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        name="cardNumber"
                        required
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        maxLength={19}
                        className="w-full px-6 py-4 pl-16 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-black"
                      />
                      <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                      Karta egasining ismi *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      required
                      value={formData.cardName}
                      onChange={handleChange}
                      placeholder="FULL NAME ON CARD"
                      className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-black uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                        Karta amal qilish muddati *
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        required
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        maxLength={5}
                        className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest">
                        CVV kodi *
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        required
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={handleChange}
                        maxLength={4}
                        className="w-full px-6 py-4 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/50 rounded-2xl border border-border border-dashed flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                     <p className="text-sm font-black text-foreground uppercase tracking-wide">To'lov himoyasi</p>
                     <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                       To'lov ma'lumotlaringiz xavfsiz tarzda himoyalangan. Biz maxfiy karta ma'lumotlarini saqlamaymiz yoki qayta ishlamaymiz.
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl sticky top-28 space-y-8">
                <h2 className="text-2xl font-black text-foreground">Buyurtma</h2>

                {/* Products List - Improved UI */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-border/50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground line-clamp-2 leading-tight mb-1">
                          {item.name}
                        </p>
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] font-black text-muted-foreground uppercase">Soni: {item.cartQuantity}</span>
                           <span className="text-sm font-black text-primary italic">
                             {formatSum(item.price * item.cartQuantity)}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-muted-foreground font-bold">
                    <span className="text-sm uppercase tracking-widest italic"> Jami </span>
                    <span className="text-foreground">{formatSum(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground font-bold">
                    <span className="text-sm uppercase tracking-widest italic">Yetkazib berish</span>
                    <span className={shipping === 0 ? 'text-emerald-500 font-black' : 'text-foreground'}>
                      {shipping === 0 ? 'BEPUL' : formatSum(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground font-bold">
                    <span className="text-sm uppercase tracking-widest italic">   </span>
                    <span className="text-foreground">{formatSum(tax)}</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-foreground uppercase tracking-widest">Umumiy summa</span>
                    <span className="text-3xl font-black text-primary italic tracking-tighter">{formatSum(total)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    className="h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    BUYURTMani rasmiylashtirish
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    To'lov himoyasi
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center font-medium leading-relaxed px-4">
                  Buyurtmani rasmiylashtirish orqali siz bizning <span className="text-primary hover:underline cursor-pointer">  </span> va <span className="text-primary hover:underline cursor-pointer"></span>ga rozilik bildirasiz.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

