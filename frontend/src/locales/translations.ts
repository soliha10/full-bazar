export type Language = 'uz' | 'ru' | 'en';

export const translations = {
  uz: {
    // Navbar
    nav: {
      searchPlaceholder: "Mahsulotlar, brendlar va boshqalarni qidirish...",
      account: "Hisob",
      cart: "Savat"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Eng yaxshi takliflarni kashf eting",
        subtitle: "Sifatli mahsulotlar, ishonchli sotuvchilar va tezkor yetkazib berish bilan eng yaxshi onlayn xarid qilish tajribasi",
        cta: "Xarid qilishni boshlash",
        topDeals: "Eng yaxshi takliflar"
      },
      categories: {
        title: "Toifalar bo'yicha xarid qilish",
        electronics: "Elektronika",
        fashion: "Moda",
        home: "Uy buyumlari",
        beauty: "Go'zallik"
      },
      features: {
        title: "Nima uchun Bazaarcomni tanlaysiz?",
        shipping: {
          title: "Bepul yetkazib berish",
          desc: "500 000 so'm dan ortiq barcha buyurtmalarda"
        },
        returns: {
          title: "30 kun ichida qaytarish",
          desc: "Savolsiz pulni qaytarish"
        },
        support: {
          title: "24/7 qo'llab-quvvatlash",
          desc: "Kuniga 24 soat yordam"
        },
        secure: {
          title: "Xavfsiz to'lov",
          desc: "100% xavfsiz tranzaksiyalar"
        }
      },
      trending: {
        title: "Mashhur mahsulotlar",
        viewAll: "Barchasini ko'rish"
      }
    },
    
    // Product Card
    product: {
      reviews: "sharhlar",
      addToCart: "Savatga qo'shish",
      outOfStock: "Sotuvda yo'q",
      off: "chegirma"
    },
    
    // Product Listing
    listing: {
      title: "Barcha mahsulotlar",
      filterBy: "Filtr",
      sortBy: "Saralash",
      categories: "Toifalar",
      all: "Hammasi",
      priceRange: "Narx oralig'i",
      rating: "Reyting",
      inStock: "Sotuvda bor",
      sort: {
        popular: "Mashhur",
        priceLow: "Narx: Arzonroq",
        priceHigh: "Narx: Qimmatroq",
        rating: "Reytingi yuqori",
        featured: "Tavsiya etilgan"
      },
      filters: "Filtrlar",
      reset: "Tozalash",
      found: "ta mahsulot topildi",
      startingFrom: "Narxi:",
      comparePrices: "Narxlarni solishtirish",
      showFilters: "Filtrlarni ko'rsatish",
      hideFilters: "Filtrlarni yashirish",
      noMatches: "Hech narsa topilmadi",
      clearFilters: "Filtrlarni tozalash"
    },
    
    // Product Detail
    detail: {
      inStock: "Sotuvda bor",
      outOfStock: "Sotuvda yo'q",
      rating: "Reyting",
      reviews: "sharhlar",
      addToCart: "Savatga qo'shish",
      buyNow: "Hozir sotib olish",
      description: "Tavsif",
      specifications: "Xususiyatlar",
      customerReviews: "Mijozlar sharhlari",
      relatedProducts: "O'xshash mahsulotlar",
      youSave: "Siz tejaydingiz"
    },
    
    // Cart
    cart: {
      title: "Savatingiz",
      empty: "Savatingiz bo'sh",
      continueShopping: "Xarid qilishni davom ettiring",
      item: "mahsulot",
      items: "mahsulot",
      remove: "O'chirish",
      subtotal: "Oraliq jami",
      shipping: "Yetkazib berish",
      shippingFree: "Bepul",
      shippingPrice: "15 000 so'm",
      total: "Jami",
      proceedToCheckout: "To'lovga o'tish",
      coupon: "Kupon kodi",
      applyCoupon: "Kuponni qo'llash"
    },
    
    // Checkout
    checkout: {
      title: "To'lov",
      shippingInfo: "Yetkazib berish ma'lumotlari",
      fullName: "To'liq ism",
      email: "Elektron pochta",
      phone: "Telefon raqami",
      address: "Manzil",
      city: "Shahar",
      postalCode: "Pochta indeksi",
      paymentMethod: "To'lov usuli",
      creditCard: "Kredit/Debit karta",
      paypal: "PayPal",
      cod: "Yetkazishda to'lov",
      cardNumber: "Karta raqami",
      expiryDate: "Muddati",
      cvv: "CVV",
      orderSummary: "Buyurtma xulosasi",
      items: "mahsulotlar",
      subtotal: "Oraliq jami",
      shipping: "Yetkazib berish",
      tax: "Soliq",
      total: "Jami",
      placeOrder: "Buyurtma berish",
      processing: "Buyurtma qayta ishlanmoqda..."
    },
    
    // Order Success
    success: {
      title: "Buyurtma muvaffaqiyatli!",
      message: "Rahmat! Sizning buyurtmangiz qabul qilindi va tez orada qayta ishlanadi.",
      orderNumber: "Buyurtma raqami",
      email: "Tasdiqlash elektron pochtangizga yuborildi",
      continueShopping: "Xarid qilishni davom ettiring",
      trackOrder: "Buyurtmani kuzatish"
    },
    
    // Footer
    footer: {
      tagline: "Eng yaxshi onlayn xarid qilish tajribangiz",
      shop: "Xarid",
      allProducts: "Barcha mahsulotlar",
      categories: "Toifalar",
      deals: "Takliflar",
      newArrivals: "Yangiliklar",
      customer: "Mijozlar uchun",
      account: "Mening hisobim",
      orders: "Buyurtmalar",
      wishlist: "Sevimlilar",
      help: "Yordam",
      company: "Kompaniya",
      about: "Biz haqimizda",
      careers: "Karyera",
      press: "Matbuot",
      blog: "Blog",
      newsletter: "Yangiliklar",
      newsletterText: "Eng so'nggi takliflar va yangilanishlarni oling",
      emailPlaceholder: "Elektron pochtangizni kiriting",
      subscribe: "Obuna bo'lish",
      rights: "Barcha huquqlar himoyalangan",
      privacy: "Maxfiylik siyosati",
      terms: "Foydalanish shartlari",
      cookies: "Cookie sozlamalari"
    },
    
    // Common
    common: {
      save: "Saqlash",
      cancel: "Bekor qilish",
      confirm: "Tasdiqlash",
      back: "Orqaga",
      next: "Keyingi",
      loading: "Yuklanmoqda...",
      error: "Xatolik yuz berdi",
      success: "Muvaffaqiyatli",
      search: "Qidirish",
      filter: "Filtr",
      clear: "Tozalash",
      apply: "Qo'llash"
    }
  },
  
  ru: {
    // Navbar
    nav: {
      searchPlaceholder: "Искать товары, бренды и многое другое...",
      account: "Аккаунт",
      cart: "Корзина"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Откройте лучшие предложения",
        subtitle: "Лучший опыт онлайн-покупок с качественными товарами, надежными продавцами и быстрой доставкой",
        cta: "Начать покупки",
        topDeals: "Лучшие предложения"
      },
      categories: {
        title: "Покупки по категориям",
        electronics: "Электроника",
        fashion: "Мода",
        home: "Товары для дома",
        beauty: "Красота"
      },
      features: {
        title: "Почему выбирают Bazaarcom?",
        shipping: {
          title: "Бесплатная доставка",
          desc: "На все заказы от $50"
        },
        returns: {
          title: "Возврат в течение 30 дней",
          desc: "Возврат денег без вопросов"
        },
        support: {
          title: "Поддержка 24/7",
          desc: "Помощь круглосуточно"
        },
        secure: {
          title: "Безопасная оплата",
          desc: "100% защищенные транзакции"
        }
      },
      trending: {
        title: "Популярные товары",
        viewAll: "Смотреть все"
      }
    },
    
    // Product Card
    product: {
      reviews: "отзывов",
      addToCart: "В корзину",
      outOfStock: "Нет в наличии",
      off: "скидка"
    },
    
    // Product Listing
    listing: {
      title: "Все товары",
      filterBy: "Фильтр",
      sortBy: "Сортировка",
      categories: "Категории",
      all: "Все",
      priceRange: "Диапазон цен",
      rating: "Рейтинг",
      inStock: "В наличии",
      sort: {
        popular: "Популярные",
        priceLow: "Цена: Дешевле",
        priceHigh: "Цена: Дороже",
        rating: "Высокий рейтинг",
        featured: "Рекомендуемые"
      },
      filters: "Фильтры",
      reset: "Сбросить",
      found: "товаров найдено",
      startingFrom: "Цена:",
      comparePrices: "Сравнить цены",
      showFilters: "Показать фильтры",
      hideFilters: "Скрыть фильтры",
      noMatches: "Ничего не найдено",
      clearFilters: "Очистить все фильтры"
    },
    
    // Product Detail
    detail: {
      inStock: "В наличии",
      outOfStock: "Нет в наличии",
      rating: "Рейтинг",
      reviews: "отзывов",
      addToCart: "В корзину",
      buyNow: "Купить сейчас",
      description: "Описание",
      specifications: "Характеристики",
      customerReviews: "Отзывы покупателей",
      relatedProducts: "Похожие товары",
      youSave: "Вы экономите"
    },
    
    // Cart
    cart: {
      title: "Ваша корзина",
      empty: "Ваша корзина пуста",
      continueShopping: "Продолжить покупки",
      item: "товар",
      items: "товаров",
      remove: "Удалить",
      subtotal: "Промежуточный итог",
      shipping: "Доставка",
      shippingFree: "Бесплатно",
      shippingPrice: "$10",
      total: "Итого",
      proceedToCheckout: "Перейти к оформлению",
      coupon: "Код купона",
      applyCoupon: "Применить купон"
    },
    
    // Checkout
    checkout: {
      title: "Оформление заказа",
      shippingInfo: "Информация о доставке",
      fullName: "Полное имя",
      email: "Электронная почта",
      phone: "Номер телефона",
      address: "Адрес",
      city: "Город",
      postalCode: "Почтовый индекс",
      paymentMethod: "Способ оплаты",
      creditCard: "Кредитная/Дебетовая карта",
      paypal: "PayPal",
      cod: "Оплата при доставке",
      cardNumber: "Номер карты",
      expiryDate: "Срок действия",
      cvv: "CVV",
      orderSummary: "Сводка заказа",
      items: "товаров",
      subtotal: "Промежуточный итог",
      shipping: "Доставка",
      tax: "Налог",
      total: "Итого",
      placeOrder: "Оформить заказ",
      processing: "Обработка заказа..."
    },
    
    // Order Success
    success: {
      title: "Заказ успешно оформлен!",
      message: "Спасибо! Ваш заказ принят и скоро будет обработан.",
      orderNumber: "Номер заказа",
      email: "Подтверждение отправлено на вашу почту",
      continueShopping: "Продолжить покупки",
      trackOrder: "Отследить заказ"
    },
    
    // Footer
    footer: {
      tagline: "Ваш лучший опыт онлайн-покупок",
      shop: "Магазин",
      allProducts: "Все товары",
      categories: "Категории",
      deals: "Предложения",
      newArrivals: "Новинки",
      customer: "Для покупателей",
      account: "Мой аккаунт",
      orders: "Заказы",
      wishlist: "Избранное",
      help: "Помощь",
      company: "Компания",
      about: "О нас",
      careers: "Карьера",
      press: "Пресса",
      blog: "Блог",
      newsletter: "Новости",
      newsletterText: "Получайте последние предложения и обновления",
      emailPlaceholder: "Введите вашу почту",
      subscribe: "Подписаться",
      rights: "Все права защищены",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      cookies: "Настройки Cookie"
    },
    
    // Common
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      confirm: "Подтвердить",
      back: "Назад",
      next: "Далее",
      loading: "Загрузка...",
      error: "Произошла ошибка",
      success: "Успешно",
      search: "Поиск",
      filter: "Фильтр",
      clear: "Очистить",
      apply: "Применить"
    }
  },
  
  en: {
    // Navbar
    nav: {
      searchPlaceholder: "Search for products, brands and more...",
      account: "Account",
      cart: "Cart"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Discover the Best Deals",
        subtitle: "Your ultimate online shopping experience with quality products, trusted sellers, and fast delivery",
        cta: "Start Shopping",
        topDeals: "Top Deals"
      },
      categories: {
        title: "Shop by Category",
        electronics: "Electronics",
        fashion: "Fashion",
        home: "Home",
        beauty: "Beauty"
      },
      features: {
        title: "Why Choose Bazaarcom?",
        shipping: {
          title: "Free Shipping",
          desc: "On all orders over $50"
        },
        returns: {
          title: "30 Days Returns",
          desc: "Money back guarantee"
        },
        support: {
          title: "24/7 Support",
          desc: "Round the clock assistance"
        },
        secure: {
          title: "Secure Payment",
          desc: "100% secure transactions"
        }
      },
      trending: {
        title: "Trending Products",
        viewAll: "View All"
      }
    },
    
    // Product Card
    product: {
      reviews: "reviews",
      addToCart: "Add to Cart",
      outOfStock: "Out of Stock",
      off: "off"
    },
    
    // Product Listing
    listing: {
      title: "All Products",
      filterBy: "Filter",
      sortBy: "Sort",
      categories: "Categories",
      all: "All",
      priceRange: "Price Range",
      rating: "Rating",
      inStock: "In Stock",
      sort: {
        popular: "Popular",
        priceLow: "Price: Low to High",
        priceHigh: "Price: High to Low",
        rating: "Highest Rated",
        featured: "Featured"
      },
      filters: "Filters",
      reset: "Reset",
      found: "products found",
      startingFrom: "Starting from",
      comparePrices: "Compare Prices",
      showFilters: "Show Filters",
      hideFilters: "Hide Filters",
      noMatches: "No matches found",
      clearFilters: "Clear all filters"
    },
    
    // Product Detail
    detail: {
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      rating: "Rating",
      reviews: "reviews",
      addToCart: "Add to Cart",
      buyNow: "Buy Now",
      description: "Description",
      specifications: "Specifications",
      customerReviews: "Customer Reviews",
      relatedProducts: "Related Products",
      youSave: "You save"
    },
    
    // Cart
    cart: {
      title: "Your Cart",
      empty: "Your cart is empty",
      continueShopping: "Continue Shopping",
      item: "item",
      items: "items",
      remove: "Remove",
      subtotal: "Subtotal",
      shipping: "Shipping",
      shippingFree: "Free",
      shippingPrice: "$10",
      total: "Total",
      proceedToCheckout: "Proceed to Checkout",
      coupon: "Coupon Code",
      applyCoupon: "Apply Coupon"
    },
    
    // Checkout
    checkout: {
      title: "Checkout",
      shippingInfo: "Shipping Information",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone Number",
      address: "Address",
      city: "City",
      postalCode: "Postal Code",
      paymentMethod: "Payment Method",
      creditCard: "Credit/Debit Card",
      paypal: "PayPal",
      cod: "Cash on Delivery",
      cardNumber: "Card Number",
      expiryDate: "Expiry Date",
      cvv: "CVV",
      orderSummary: "Order Summary",
      items: "items",
      subtotal: "Subtotal",
      shipping: "Shipping",
      tax: "Tax",
      total: "Total",
      placeOrder: "Place Order",
      processing: "Processing order..."
    },
    
    // Order Success
    success: {
      title: "Order Successful!",
      message: "Thank you! Your order has been received and will be processed shortly.",
      orderNumber: "Order Number",
      email: "A confirmation has been sent to your email",
      continueShopping: "Continue Shopping",
      trackOrder: "Track Order"
    },
    
    // Footer
    footer: {
      tagline: "Your ultimate online shopping experience",
      shop: "Shop",
      allProducts: "All Products",
      categories: "Categories",
      deals: "Deals",
      newArrivals: "New Arrivals",
      customer: "Customer",
      account: "My Account",
      orders: "Orders",
      wishlist: "Wishlist",
      help: "Help",
      company: "Company",
      about: "About Us",
      careers: "Careers",
      press: "Press",
      blog: "Blog",
      newsletter: "Newsletter",
      newsletterText: "Get the latest deals and updates",
      emailPlaceholder: "Enter your email",
      subscribe: "Subscribe",
      rights: "All rights reserved",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Settings"
    },
    
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      apply: "Apply"
    }
  }
};
