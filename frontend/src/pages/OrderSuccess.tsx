import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export function OrderSuccess() {
  const { t } = useLanguage();
  const orderNumber = `BZR${Math.floor(Math.random() * 1000000)}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return (
    <div className="min-h-screen bg-muted/30 py-16 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-card rounded-xl p-12 text-center border border-border mb-8">
          <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-[#2ECC71]" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{t.success.title}</h1>
          <p className="text-xl text-muted-foreground mb-2">
            {t.success.message}
          </p>
          <p className="text-muted-foreground">
            {t.success.email}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-xl p-8 border border-border mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t.checkout.orderSummary}</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t.success.orderNumber}</p>
              <p className="text-lg font-bold text-foreground">{orderNumber}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t.cart.shipping}</p>
              <p className="text-lg font-bold text-foreground">
                {estimatedDelivery.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Status Steps */}
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              {/* Step 1 - Complete */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-[#2ECC71] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-[#2ECC71]">{t.checkout.placeOrder}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 h-1 bg-border -mt-8 mx-2"></div>

              {/* Step 2 - Pending */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t.checkout.processing}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 h-1 bg-border -mt-8 mx-2"></div>

              {/* Step 3 - Pending */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t.cart.shipping}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 h-1 bg-border -mt-8 mx-2"></div>

              {/* Step 4 - Pending */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.shipping.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-card rounded-xl p-8 border border-border mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t.checkout.orderSummary}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FF7A00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t.checkout.email}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.success.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FF7A00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t.success.trackOrder}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.landing.features.shipping.desc}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FF7A00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[#FF7A00]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t.success.message}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.landing.features.support.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/products" className="flex-1">
            <Button variant="primary" fullWidth className="flex items-center justify-center gap-2">
              {t.success.continueShopping}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <button className="flex-1">
            <Button variant="outline" fullWidth>
              {t.success.trackOrder}
            </Button>
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 p-6 bg-gradient-to-br from-[#FFF5EB] dark:from-[#2A1810] to-card rounded-xl border border-border">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">{t.footer.help}</p>
            <p className="text-[#FF7A00] font-semibold">
              {t.landing.features.support.title}: support@bazaarcom.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}