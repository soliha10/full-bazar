import { CheckCircle, Package, Mail, ArrowRight, Truck, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export function OrderSuccess() {
  const { t } = useLanguage();
  const orderNumber = `BZR${Math.floor(Math.random() * 1000000)}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] -z-10 animate-pulse-slow" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="bg-card rounded-[3rem] p-12 text-center border border-border shadow-2xl relative overflow-hidden mb-10 group">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-accent/5 opacity-50" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce-subtle">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              {t.success.title}
            </h1>
            <p className="text-xl text-muted-foreground font-medium mb-2">
              {t.success.message}
            </p>
            <p className="text-muted-foreground font-bold">
              {t.success.email}
            </p>
          </div>
        </div>

        {/* Order Info Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
           <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm group hover:border-primary/30 transition-all">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{t.success.orderNumber}</p>
              <p className="text-2xl font-black text-foreground italic tracking-tighter">{orderNumber}</p>
           </div>
           <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm group hover:border-primary/30 transition-all">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Delivery Date</p>
              <p className="text-2xl font-black text-foreground">
                {estimatedDelivery.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
           </div>
        </div>

        {/* Delivery Timeline */}
        <div className="bg-card rounded-[3rem] p-10 border border-border shadow-sm mb-10">
          <h2 className="text-2xl font-black text-foreground mb-12 flex items-center gap-3">
             <Package className="w-8 h-8 text-primary" />
             Track Progress
          </h2>
          
          <div className="relative">
            <div className="flex items-center justify-between">
              {[
                { icon: CheckCircle, label: t.checkout.placeOrder, done: true },
                { icon: Package, label: t.checkout.processing, done: false },
                { icon: Truck, label: "On the way", done: false },
                { icon: Shield, label: "Delivered", done: false },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                    step.done ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className={`text-[10px] uppercase font-black tracking-widest text-center ${
                    step.done ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                  {/* Progress Line */}
                  {idx < arr.length - 1 && (
                    <div className="absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-0.5 bg-muted -z-10">
                       <div className={`h-full bg-primary transition-all duration-1000 ${step.done ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Steps List */}
        <div className="bg-card rounded-[3rem] p-10 border border-border shadow-sm mb-10 space-y-8">
           <h2 className="text-2xl font-black text-foreground">Next Phases</h2>
           <div className="grid gap-6">
              {[
                { icon: Mail, title: t.checkout.email, desc: t.success.email, color: 'bg-primary' },
                { icon: Package, title: t.success.trackOrder, desc: "Real-time updates via SMS and App notifications", color: 'bg-accent' },
                { icon: Shield, title: "Order Warranty", desc: "Premium protection included for 24 months", color: 'bg-emerald-500' }
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                   <div className={`w-14 h-14 rounded-2xl ${step.color}/10 flex items-center justify-center shrink-0`}>
                      <step.icon className={`w-6 h-6 ${step.color.replace('bg-', 'text-')}`} />
                   </div>
                   <div>
                      <h3 className="font-black text-lg text-foreground mb-1 italic">{step.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{step.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Action Controls */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <Link to="/products">
            <Button variant="primary" size="lg" fullWidth className="h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 group">
              {t.success.continueShopping}
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" fullWidth className="h-16 rounded-2xl text-lg font-black bg-background">
            {t.success.trackOrder}
          </Button>
        </div>

        {/* Premium Support Banner */}
        <div className="p-10 rounded-[3rem] bg-linear-to-br from-primary/10 to-accent/10 border border-primary/20 text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/50 backdrop-blur-md rounded-full border border-white/50 mb-2">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Priority Support Access</span>
           </div>
           <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">{t.footer.help}</p>
           <p className="text-2xl font-black text-foreground tracking-tight">
              {t.landing.features.support.title}: <span className="text-primary italic">support@bazaarcom.com</span>
           </p>
        </div>
      </div>
    </div>
  );
}