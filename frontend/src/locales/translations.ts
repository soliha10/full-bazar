export type Language = 'uz' | 'ru' | 'en';

export const translations = {
  uz: {
    // Navbar
    nav: {
      searchPlaceholder: "Mahsulotlar, brendlar va boshqalarni qidirish...",
      account: "Hisob",
      cart: "Savat",
      home: "Bosh sahifa",
      search: "Qidirish",
      language: "Til",
      login: "Kirish",
      welcome: "Xush kelibsiz",
      welcomeSubtitle: "BAZARCOMga qo'shiling",
      loginSignIn: "Kirish / Ro'yxatdan o'tish",
      darkMode: "Tungi rejim",
      helpCenter: "Yordam markazi",
      about: "Bazarcom haqida"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Barcha bozolarda eng yaxshi narxni toping",
        subtitle: "AI-qo'llab-quvvatlangan kuzatuv bilan millionlab mahsulotlarni darhol solishtiring va tejang.",
        cta: "Solishtirishni boshlash",
      },
      categories: {
        title: "Mashhur toifalar",
        viewAll: "Barchasini ko'rish",
        electronics: "Elektronika",
        fashion: "Moda",
        home: "Uy",
        beauty: "Go'zallik",
        sports: "Sport"
      },
      trending: {
        title: "Mashhur mahsulotlar",
        viewAll: "Barchasini ko'rish",
        comparePrices: "Narxlarni solishtirish",
        fromPrice: "Boshlab {{price}} dan"
      },
      howItWorks: {
        title: "Bazarcom qanday ishlaydi",
        steps: [
          { title: "Qidiring yoki gapiring", desc: "Mahsulotingizni yozing yoki kerakli narsani topish uchun ovozli qidiruvdan foydalaning." },
          { title: "Tezda solishtiring", desc: "Bizning AI yuzlab bozorlarni skanerlab, eng yaxshi takliflarni topadi." },
          { title: "Aniq tejang", desc: "Eng arzon tasdiqlangan sotuvchiga yo'naltiriling va ishonch bilan xarid qiling." }
        ]
      },
      features: {
        secure: { title: "Xavfsiz", desc: "Sanoat standartlari bo'yicha to'lov shlyuzlari" },
        returns: { title: "Qaytarish", desc: "Mamnun bo'lmasangiz, oson qaytarish" },
        support: { title: "Yordam", desc: "support@bazaarcom.com" }
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
        featured: "Tavsiya etilgan",
        relevance: "Muvofiqlik"
      },
      filters: "Filtrlar",
      reset: "Tozalash",
      found: "ta mahsulot topildi",
      startingFrom: "Narxi:",
      comparePrices: "Narxlarni solishtirish",
      showFilters: "Filtrlarni ko'rsatish",
      hideFilters: "Filtrlarni yashirish",
      noMatches: "Hech narsa topilmadi",
      clearFilters: "Filtrlarni tozalash",
      grid: "Setka",
      list: "Ro'yxat",
      relevance: "Muvofiqlik",
      priceAsc: "Narx ↑",
      priceDesc: "Narx ↓",
      products: "Mahsulotlar",
      searchResults: "Qidiruv natijalari",
      comingSoon: "Tez kunda",
      productsCount: "{{count}} / {{total}} ta mahsulot",
      loading: "Yuklanmoqda...",
      loadMore: "Yana yuklash",
      noProductsFound: "Mahsulot topilmadi",
      noProductsDesc: "Qidiruv so'zini o'zgartirib ko'ring yoki filterlarni tozalang.",
      viewResults: "Natijalarni ko'rish",
      category: "Kategoriya",
      anyRating: "Istalgan reyting"
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
      youSave: "Siz tejaydingiz",
      // Additional keys
      analyzingPrices: "Narxlar tahlil qilinmoqda...",
      productNotFound: "Mahsulot topilmadi",
      backToMarketplace: "Bozorga qaytish",
      productDetails: "Mahsulot tafsilotlari",
      bestSeller: "ENG YAXSHI",
      inStockReady: "Sotuvda bor va jo'natishga tayyor",
      customerReviewsLabel: "mijoz sharhlari",
      bestPriceMarket: "Eng yaxshi narx bozori",
      lowestPrice30Days: "30 kun ichida eng arzon narx",
      pricesRealTime: "Narxlar real vaqtda yangilanadi",
      marketplace: "Bozor",
      availability: "Mavjudlik",
      price: "Narx",
      goToShop: "DO'KONGA O'TISH",
      compareStores: "Do'konlarni solishtirish",
      storesAvailable: "ta do'kon mavjud",
      shop: "DO'KON",
      aiSmartSummary: "AI aqlli sharh xulosasi",
      quickSpecifications: "Tezkor xususiyatlar",
      productStory: "Mahsulot haqida",
      mainSpecifications: "Asosiy xususiyatlar",
      technicalDetails: "Texnik tafsilotlar",
      insideBox: "Qutida nima bor",
      mostHelpfulReviews: "Eng foydali sharhlar",
      viewMoreReviews: "ta sharhni ko'rish",
      fastShipping: "Tezkor yetkazib berish",
      orderWithin: "soat ichida buyurtma bering va ertaga qo'lga oling!",
      logisticsReady: "LOGISTIKA TAYYOR",
      overview: "Umumiy",
      specs: "Xususiyatlar",
      reviewsTab: "Sharhlar",
      fromPrice: "Boshlab",
      // Spec labels (market overview)
      specLabels: {
        marketsCount: "Do'konlar soni",
        lowestPrice: "Eng arzon narx",
        highestPrice: "Eng qimmat narx",
        bestStore: "Eng yaxshi do'kon"
      },
      // AI Summary labels
      aiLabels: {
        performance: "Ishlash tezligi",
        camera: "Kamera",
        battery: "Batareya",
        display: "Ekran"
      },
      // Inside box items
      boxItems: {
        primaryProduct: "Asosiy mahsulot",
        quickStartGuide: "Boshlash qo'llanmasi",
        usbCable: "USB-C zaryadlash kabeli",
        travelCase: "Sayohat uchun qutisi",
        warrantyCard: "2 yillik kafolat kartasi"
      },
      // Time labels
      timeAgo: {
        daysAgo: "kun oldin",
        weeksAgo: "hafta oldin"
      },
      // Product story fallback
      productStoryFallback: "Nihoyatda immersiv tajriba uchun mo'ljallangan, bu mahsulot o'z toifasidagi standartni qayta belgilaydi. Ilg'or texnologiya va foydalanuvchi ergonomikasiga e'tibor bilan, u ish va o'yin uchun birdek uzluksiz tajriba taqdim etadi.",
      // Available on
      availableOn: "ta bozorda mavjud"
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
      applyCoupon: "Kuponni qo'llash",
      reviewItems: "Buyurtma berishdan oldin tovarlarni ko'rib chiqing",
      secureTransaction: "Xavfsiz shifrlangan tranzaksiya",
      inStock: "Mavjud"
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
      trackOrder: "Buyurtmani kuzatish",
      deliveryDate: "Yetkazib berish sanasi",
      trackProgress: "Jarayonni kuzatish",
      onTheWay: "Yo'lda",
      delivered: "Yetkazildi",
      nextPhases: "Keyingi bosqichlar",
      realTimeUpdates: "SMS va ilova orqali real vaqt yangilanishlari",
      orderWarranty: "Buyurtma kafolati",
      premiumProtection: "24 oy davomida premium himoya kiritilgan",
      prioritySupport: "Ustuvor yordamga kirish"
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
      cart: "Корзина",
      home: "Главная",
      search: "Поиск",
      language: "Язык",
      login: "Войти",
      welcome: "Добро пожаловать",
      welcomeSubtitle: "Присоединяйтесь к BAZARCOM",
      loginSignIn: "Вход / Регистрация",
      darkMode: "Темный режим",
      helpCenter: "Центр помощи",
      about: "О Bazarcom"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Найдите лучшую цену на всех маркетплейсах",
        subtitle: "Мгновенно сравнивайте и экономьте на миллионах товаров с отслеживанием на базе ИИ.",
        cta: "Начать сравнение",
      },
      categories: {
        title: "Популярные категории",
        viewAll: "Смотреть все",
        electronics: "Электроника",
        fashion: "Мода",
        home: "Дом",
        beauty: "Красота",
        sports: "Спорт"
      },
      trending: {
        title: "Популярные товары",
        viewAll: "Смотреть все",
        comparePrices: "Сравнить цены",
        fromPrice: "От {{price}}"
      },
      howItWorks: {
        title: "Как работает Bazarcom",
        steps: [
          { title: "Ищите или говорите", desc: "Напишите свой товар или используйте голосовой поиск, чтобы мгновенно найти то, что вам нужно." },
          { title: "Сравнивайте мгновенно", desc: "Наш ИИ сканирует сотни маркетплейсов, чтобы найти абсолютно лучшие предложения." },
          { title: "Экономьте точно", desc: "Перенаправляйтесь к самому дешевому проверенному продавцу и покупайте с уверенностью." }
        ]
      },
      features: {
        secure: { title: "Безопасно", desc: "Платежные шлюзы промышленного стандарта" },
        returns: { title: "Возврат", desc: "Легкий возврат, если не удовлетворены" },
        support: { title: "Поддержка", desc: "support@bazaarcom.com" }
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
        featured: "Рекомендуемые",
        relevance: "Релевантность"
      },
      filters: "Фильтры",
      reset: "Сбросить",
      found: "товаров найдено",
      startingFrom: "Цена:",
      comparePrices: "Сравнить цены",
      showFilters: "Показать фильтры",
      hideFilters: "Скрыть фильтры",
      noMatches: "Ничего не найдено",
      clearFilters: "Очистить все фильтры",
      grid: "Сетка",
      list: "Список",
      relevance: "Релевантность",
      priceAsc: "Цена ↑",
      priceDesc: "Цена ↓",
      products: "Товары",
      searchResults: "Результаты поиска",
      comingSoon: "Скоро",
      productsCount: "{{count}} / {{total}} товаров",
      loading: "Загрузка...",
      loadMore: "Загрузить еще",
      noProductsFound: "Товары не найдены",
      noProductsDesc: "Измените поисковый запрос или очистите фильтры.",
      viewResults: "Посмотреть результаты",
      category: "Категория",
      anyRating: "Любой рейтинг"
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
      youSave: "Вы экономите",
      // Additional keys
      analyzingPrices: "Анализ цен...",
      productNotFound: "Товар не найден",
      backToMarketplace: "Вернуться в магазин",
      productDetails: "Детали товара",
      bestSeller: "БЕСТСЕЛЛЕР",
      inStockReady: "В наличии и готов к отправке",
      customerReviewsLabel: "отзывов покупателей",
      bestPriceMarket: "Лучшая цена на рынке",
      lowestPrice30Days: "Самая низкая цена за 30 дней",
      pricesRealTime: "Цены обновляются в реальном времени",
      marketplace: "Маркетплейс",
      availability: "Наличие",
      price: "Цена",
      goToShop: "В МАГАЗИН",
      compareStores: "Сравнить магазины",
      storesAvailable: "магазинов доступно",
      shop: "МАГАЗИН",
      aiSmartSummary: "AI обзор отзывов",
      quickSpecifications: "Быстрые характеристики",
      productStory: "О товаре",
      mainSpecifications: "Основные характеристики",
      technicalDetails: "Технические детали",
      insideBox: "В коробке",
      mostHelpfulReviews: "Самые полезные отзывы",
      viewMoreReviews: "посмотреть отзывов",
      fastShipping: "Быстрая доставка",
      orderWithin: "Закажите в течение часов и получите завтра!",
      logisticsReady: "ЛОГИСТИКА ГОТОВА",
      overview: "Обзор",
      specs: "Характеристики",
      reviewsTab: "Отзывы",
      fromPrice: "От",
      // Spec labels (market overview)
      specLabels: {
        marketsCount: "Количество магазинов",
        lowestPrice: "Самая низкая цена",
        highestPrice: "Самая высокая цена",
        bestStore: "Лучший магазин"
      },
      // AI Summary labels
      aiLabels: {
        performance: "Производительность",
        camera: "Камера",
        battery: "Батарея",
        display: "Экран"
      },
      // Inside box items
      boxItems: {
        primaryProduct: "Основной товар",
        quickStartGuide: "Руководство по началу работы",
        usbCable: "USB-C кабель для зарядки",
        travelCase: "Дорожный чехол",
        warrantyCard: "Гарантийная карта на 2 года"
      },
      // Time labels
      timeAgo: {
        daysAgo: "дней назад",
        weeksAgo: "недель назад"
      },
      // Product story fallback
      productStoryFallback: "Разработан для максимального погружения, этот продукт переопределяет стандарт в своей категории. С передовыми технологиями и фокусом на эргономике пользователя, он обеспечивает бесшовный опыт как для работы, так и для развлечений.",
      // Available on
      availableOn: "магазинов доступно"
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
      applyCoupon: "Применить купон",
      reviewItems: "Проверьте товары перед оформлением заказа",
      secureTransaction: "Безопасная зашифрованная транзакция",
      inStock: "В наличии"
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
      trackOrder: "Отследить заказ",
      deliveryDate: "Дата доставки",
      trackProgress: "Отслеживание progress",
      onTheWay: "В пути",
      delivered: "Доставлено",
      nextPhases: "Следующие этапы",
      realTimeUpdates: "Обновления в реальном времени через SMS и уведомления в приложении",
      orderWarranty: "Гарантия заказа",
      premiumProtection: "Премиальная защита включена на 24 месяца",
      prioritySupport: "Приоритетный доступ к поддержке"
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
      cart: "Cart",
      home: "Home",
      search: "Search",
      language: "Language",
      login: "Login",
      welcome: "Welcome",
      welcomeSubtitle: "Join BAZARCOM today",
      loginSignIn: "Login / Sign In",
      darkMode: "Dark Mode",
      helpCenter: "Help Center",
      about: "About Bazarcom"
    },
    
    // Landing Page
    landing: {
      hero: {
        title: "Find the best price across all marketplaces",
        subtitle: "Compare and save on millions of products instantly with AI-powered tracking.",
        cta: "Start Comparing",
      },
      categories: {
        title: "Popular Categories",
        viewAll: "View All",
        electronics: "Electronics",
        fashion: "Fashion",
        home: "Home",
        beauty: "Beauty",
        sports: "Sports"
      },
      trending: {
        title: "Trending Products",
        viewAll: "View All",
        comparePrices: "Compare Prices",
        fromPrice: "From {{price}}"
      },
      howItWorks: {
        title: "How Bazarcom Works",
        steps: [
          { title: "Search or speak", desc: "Type your product or use voice search to find what you need instantly." },
          { title: "Compare instantly", desc: "Our AI scans hundreds of marketplaces to find the absolute best deals." },
          { title: "Save exactly", desc: "Get redirected to the cheapest verified seller and buy with confidence." }
        ]
      },
      features: {
        secure: { title: "Secure", desc: "Payment handled by industry standard gateways" },
        returns: { title: "Returns", desc: "Easy returns if not satisfied" },
        support: { title: "Support", desc: "support@bazaarcom.com" }
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
        featured: "Featured",
        relevance: "Relevance"
      },
      filters: "Filters",
      reset: "Reset",
      found: "products found",
      startingFrom: "Starting from",
      comparePrices: "Compare Prices",
      showFilters: "Show Filters",
      hideFilters: "Hide Filters",
      noMatches: "No matches found",
      clearFilters: "Clear all filters",
      grid: "Grid",
      list: "List",
      relevance: "Relevance",
      priceAsc: "Price ↑",
      priceDesc: "Price ↓",
      products: "Products",
      searchResults: "Search Results",
      comingSoon: "Coming Soon",
      productsCount: "{{count}} / {{total}} products",
      loading: "Loading...",
      loadMore: "Load More",
      noProductsFound: "No products found",
      noProductsDesc: "Try changing your search or clearing filters.",
      viewResults: "View Results",
      category: "Category",
      anyRating: "Any rating"
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
      youSave: "You save",
      // Additional keys
      analyzingPrices: "Analyzing market prices...",
      productNotFound: "Product Not Found",
      backToMarketplace: "Back to Marketplace",
      productDetails: "Product Details",
      bestSeller: "BEST SELLER",
      inStockReady: "In Stock & Ready to ship",
      customerReviewsLabel: "customer reviews",
      bestPriceMarket: "Best Price Market",
      lowestPrice30Days: "Lowest price in 30 days",
      pricesRealTime: "Prices curated in real-time",
      marketplace: "Marketplace",
      availability: "Availability",
      price: "Price",
      goToShop: "GO TO SHOP",
      compareStores: "Compare Stores",
      storesAvailable: "stores available",
      shop: "SHOP",
      aiSmartSummary: "AI Smart Review Summary",
      quickSpecifications: "Quick Specifications",
      productStory: "Product Story",
      mainSpecifications: "Main Specifications",
      technicalDetails: "Technical Details",
      insideBox: "Inside the Box",
      mostHelpfulReviews: "Most Helpful Reviews",
      viewMoreReviews: "View more reviews",
      fastShipping: "Fast Shipping",
      orderWithin: "Order within hours and get it by tomorrow!",
      logisticsReady: "LOGISTICS READY",
      overview: "Overview",
      specs: "Specs",
      reviewsTab: "Reviews",
      fromPrice: "From",
      // Spec labels (market overview)
      specLabels: {
        marketsCount: "Markets Available",
        lowestPrice: "Lowest Price",
        highestPrice: "Highest Price",
        bestStore: "Best Store"
      },
      // AI Summary labels
      aiLabels: {
        performance: "Performance",
        camera: "Camera",
        battery: "Battery",
        display: "Display"
      },
      // Inside box items
      boxItems: {
        primaryProduct: "Primary Product",
        quickStartGuide: "Quick Start Guide",
        usbCable: "USB-C Charging Cable",
        travelCase: "Travel Case",
        warrantyCard: "2-Year Warranty Card"
      },
      // Time labels
      timeAgo: {
        daysAgo: "days ago",
        weeksAgo: "weeks ago"
      },
      // Product story fallback
      productStoryFallback: "Designed for ultimate immersion, this product redefines the standard in its category. With cutting-edge technology and a focus on user ergonomics, it provides a seamless experience whether for work or play.",
      // Available on
      availableOn: "marketplaces available"
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
      applyCoupon: "Apply Coupon",
      reviewItems: "Review items before placing your order",
      secureTransaction: "Secure encrypted transaction",
      inStock: "In Stock"
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
      trackOrder: "Track Order",
      deliveryDate: "Delivery Date",
      trackProgress: "Track Progress",
      onTheWay: "On the way",
      delivered: "Delivered",
      nextPhases: "Next Phases",
      realTimeUpdates: "Real-time updates via SMS and App notifications",
      orderWarranty: "Order Warranty",
      premiumProtection: "Premium protection included for 24 months",
      prioritySupport: "Priority Support Access"
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
