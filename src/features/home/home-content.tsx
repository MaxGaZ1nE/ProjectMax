import type { FC } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import ImageSlider from '@components/core/image-slider/image-silder';
import { Pagination } from '@components/core/pagination';

import { Link } from 'react-router-dom';
import { productAPI, cartAPI } from '@services/backend-api';
import { useAuth } from '@contexts/AuthContext';
import { addToCart } from '@/slices/cart-slice';

// ✅ กลับมาใช้ Mock data ชั่วคราวตามที่ผู้ใช้ต้องการ
import listProduct, { type Product } from '@/mockItem/listProduct';

type Category = {
  id: string;
  title: string;
  image: string;
};

const StarIcon = ({ variant }: { variant: 'full' | 'half' | 'empty' }) => {
  if (variant === 'half') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          opacity="0.25"
          d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.76 1.64 7.03z"
        />
        <defs>
          <clipPath id="half">
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
        <path
          clipPath="url(#half)"
          fill="currentColor"
          d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.76 1.64 7.03z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        opacity={variant === 'empty' ? 0.25 : 1}
        d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.76 1.64 7.03z"
      />
    </svg>
  );
};

const StarRating: FC<{ rating: number }> = ({ rating }) => {
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const idx = i + 1;
    if (rating >= idx) return 'full' as const;
    if (rating >= idx - 0.5) return 'half' as const;
    return 'empty' as const;
  });

  return (
    <div className="flex items-center gap-0.5 text-orange-500">
      {stars.map((v, i) => (
        <StarIcon key={i} variant={v} />
      ))}
    </div>
  );
};

const HomeContent: FC = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  const categoryTitles = {
    popular: i18n.language === 'th' ? 'ผลไม้ยอดนิยม' : 'Popular Fruits',
    seasonal: i18n.language === 'th' ? 'ผลไม้ตามฤดูกาลในประเทศ' : 'Seasonal Fruits',
    imported: i18n.language === 'th' ? 'ผลไม้นำเข้าจากต่างประเทศ' : 'Imported Fruits',
    rare: i18n.language === 'th' ? 'ผลไม้พื้นถิ่นหายาก' : 'Rare Fruits',
    processed: i18n.language === 'th' ? 'ผลไม้แปรรูป' : 'Processed Fruits',
    byproduct: i18n.language === 'th' ? 'เศษผลไม้เพื่อนำไปแปรรูป' : 'Fruit Byproducts',
  };

  const bannerImages = [
    { src: '/banner.png', link: '/details/2' },
    { src: '/banner2.png', link: undefined },
    { src: '/banner3.png', link: undefined },
  ];

  const fruitCategories: Category[] = [
    { id: 'popular', title: categoryTitles.popular, image: '/category/popular.jpg' },
    { id: 'seasonal', title: categoryTitles.seasonal, image: '/category/seasonal.jpg' },
    { id: 'imported', title: categoryTitles.imported, image: '/category/imported.jpg' },
    { id: 'rare', title: categoryTitles.rare, image: '/category/rare.jpg' },
    { id: 'processed', title: categoryTitles.processed, image: '/category/processed.jpg' },
    { id: 'byproduct', title: categoryTitles.byproduct, image: '/category/byproduct.jpg' },
  ];

  // categoryId (int from DB) → slug map, built from API
  const [categoryIdToSlug, setCategoryIdToSlug] = useState<Record<number, string>>({});

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState<{ productId: number; message: string } | null>(null);

  const handleSelectCategory = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  const handleAddToCart = async (productId: number, productName: string) => {
    console.log('🛒 handleAddToCart called with:', { productId, productName });

    if (!isAuthenticated()) {
      alert('Please login first');
      return;
    }

    // ✅ Validate product ID
    if (!productId || productId <= 0) {
      console.error('❌ Invalid product ID:', productId);
      alert('Invalid product - ID must be greater than 0');
      return;
    }

    try {
      setAddingToCart(productId);

      // Find product details from allProducts
      const product = allProducts.find(p => p.id === productId);
      console.log('📍 Found product in allProducts:', product);

      if (!product) {
        throw new Error(`Product ${productId} not found in local cart data. Available products: ${allProducts.map(p => p.id).join(', ')}`);
      }

      // 1. Update Redux immediately (for instant UI feedback)
      dispatch(addToCart({
        id: String(productId),
        name: productName,
        price: Number(product.price ?? 0),
        image: Array.isArray(product.image) ? product.image[0] : product.image,
        qty: 1,                           // Default: 1
        shopId: product.shopId || 0,
        shopName: '',
        unit: 'kg',
        weight: 1,                        // Default: 1kg
      }));

      // 2. Sync with backend API (async, non-blocking)
      console.log('🛒 Adding to cart:', { productId, quantity: 1, weight: 1 });
      console.log('📤 Product details:', product);
      const response = await cartAPI.addToCart(productId, 1, 1);
      console.log('✅ Add to cart response:', response);

      setCartMessage({
        productId,
        message: i18n.language === 'th' ? '✅ เพิ่มลงตะกร้าแล้ว' : '✅ Added to cart',
      });
      setTimeout(() => setCartMessage(null), 2000);
    } catch (err: any) {
      console.error('Add to cart error:', err);
      const errorMsg = err?.response?.data?.message ||
        err?.response?.data?.error?.details ||
        (err instanceof Error ? err.message : 'Failed to add to cart');
      setCartMessage({
        productId,
        message: `❌ ${errorMsg}`,
      });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  // ✅ ดึงสินค้าจาก Mock Data แทน Backend ชั่วคราว
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch categories to build mapping (id -> slug)
      let catMap: Record<number, string> = {};
      try {
        const catRes = await productAPI.getCategories();
        const categories = catRes.data?.data || [];
        // Map category names to our frontend slugs (e.g., 'ผลไม้ยอดนิยม' -> 'popular')
        // Or if backend has 'slug' field, use that. For now, fallback by index if needed.
        const slugs = ['popular', 'seasonal', 'imported', 'rare', 'processed', 'byproduct'];
        categories.forEach((c: any, index: number) => {
          catMap[c.id] = c.slug || slugs[index] || 'popular';
        });
        setCategoryIdToSlug(catMap);
      } catch (err) {
        console.warn('Failed to fetch categories, using default mapping', err);
      }

      // 2. Fetch products from Backend
      const res = await productAPI.getProducts();
      const backendProducts = res.data?.data || [];
      
      const formattedProducts: Product[] = backendProducts.map((p: any) => {
        // Find mapped category slug
        const catSlug = catMap[p.category_id] || p.category_id || 'popular';
        
        // Ensure image is array
        let imgArray = ['/no-image.png'];
        if (Array.isArray(p.images) && p.images.length > 0) {
          imgArray = p.images;
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            imgArray = Array.isArray(parsed) ? parsed : [p.images];
          } catch {
            imgArray = [p.images];
          }
        } else if (p.image) {
          imgArray = Array.isArray(p.image) ? p.image : [p.image];
        }

        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          image: imgArray,
          rating: Number(p.rating || 0),
          reviews: Number(p.reviews_count || 0),
          badge: p.badge || (p.is_new ? 'NEW' : undefined),
          badgeBg: p.badge_bg || 'bg-blue-500 text-white',
          categoryId: String(catSlug),
          shopId: p.shop_id || 0,
        };
      });

      // Filter out products without images if desired (optional, but requested to keep products with images)
      // const validProducts = formattedProducts.filter(p => p.image[0] !== '/no-image.png');
      
      setAllProducts(formattedProducts);
      setFetchError(null);
    } catch (err) {
      console.error('Fetch products error:', err);
      setFetchError('Failed to load products from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return allProducts;
    return allProducts.filter((p: Product) => p.categoryId === activeCategory);
  }, [activeCategory, allProducts]);

  const ITEMS_PER_PAGE = 32;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      {/* Slider */}
      <ImageSlider images={bannerImages} height="h-[300px]" />

      {/* ===== Top info 3 items ===== */}
      <div className="mt-8">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-3">
            <div className="flex items-start gap-4 justify-center md:justify-start">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 text-xl bg-white dark:bg-neutral-800">
                📦
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {i18n.language === 'th' ? 'ผลไม้' : 'Fruits'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {i18n.language === 'th' ? 'จัดส่งภายใน 24 ชั่วโมง' : 'Delivered within 24 hours'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-center md:justify-start">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 text-xl bg-white dark:bg-neutral-800">
                🏆
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {i18n.language === 'th' ? 'คืนสินค้าได้ภายใน 24 ชั่วโมง' : 'Return within 24 hours'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {i18n.language === 'th' ? 'รับประกันคืนเงิน 100%' : '100% Money-back guarantee'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-center md:justify-start">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 text-xl bg-white dark:bg-neutral-800">
                🎧
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {i18n.language === 'th' ? 'บริการให้ความช่วยเหลือตลอด 24 ชั่วโมง' : '24/7 Support'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {i18n.language === 'th' ? 'ติดต่อ FRUIT FOR YOU' : 'Contact FRUIT FOR YOU'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY GRID */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {i18n.language === 'th' ? 'หมวดหมู่จากผลไม้ยอดนิยม' : 'Popular Categories'}
          </p>
          <Link
            to="/search"
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            {i18n.language === 'th' ? 'ดูทั้งหมด' : 'View All'}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {fruitCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={[
                  'rounded-xl border p-3 bg-white dark:bg-neutral-900',
                  'border-neutral-200 dark:border-neutral-700',
                  'hover:shadow-md transition text-left',
                  isActive ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : '',
                ].join(' ')}
              >
                <img src={cat.image} alt={cat.title} className="h-20 w-full rounded-lg object-cover" />
                <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2">
                  {cat.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {activeCategory
                ? `กำลังแสดงหมวด: ${fruitCategories.find((c) => c.id === activeCategory)?.title ?? activeCategory}`
                : 'กำลังแสดง: ทั้งหมด'}
            </p>

            {activeCategory && (
              <button
                className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                onClick={() => handleSelectCategory(null)}
              >
                {i18n.language === 'th' ? 'ล้างตัวกรอง' : 'Clear Filter'}
              </button>
            )}
          </div>

          {/* ✅ Refresh Button */}
          <button
            className={[
              'text-sm px-3 py-1.5 rounded-lg border transition',
              'border-neutral-300 text-neutral-600 hover:bg-neutral-50',
              'dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800',
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            ].join(' ')}
            onClick={fetchProducts}
            disabled={isLoading}
          >
            {isLoading ? '⏳ รอสักครู่...' : '🔄 รีเฟรช'}
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-10 text-center animate-pulse">
            <p className="text-neutral-700 dark:text-neutral-200 text-lg font-medium">
              {i18n.language === 'th' ? '📦 กำลังขนส่งผลไม้มาจากข้ามมิติ...' : '📦 Fetching fruits from backend...'}
            </p>
          </div>
        ) : fetchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
            <p className="font-semibold">{i18n.language === 'th' ? 'เกิดข้อผิดพลาดในการดึงสินค้า' : 'Failed to fetch products'}</p>
            <p className="mt-2 text-sm">{fetchError}</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-10 text-center">
            <p className="text-neutral-700 dark:text-neutral-200">
              {i18n.language === 'th'
                ? 'หมวดนี้ยังไม่มีสินค้า กรุณากด "ดูทั้งหมด" หรือเลือกหมวดหมู่อื่น'
                : 'No products in this category. Please click "View All" or select another category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {currentItems.map((item: Product) => (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition overflow-hidden flex flex-col"
              >
                <Link
                  to={`/details/${item.id}`}
                  className="block bg-white dark:bg-neutral-900 rounded-t-xl overflow-hidden flex-1"
                >
                  {/* Image */}
                  <div className="relative">
                    {!!item.badge && (
                      <span
                        className={[
                          'absolute left-2 top-2 z-10 rounded-md px-3 py-1 text-xs font-semibold',
                          item.badgeBg ?? 'bg-yellow-300 text-black',
                        ].join(' ')}
                      >
                        {item.badge}
                      </span>
                    )}

                    <img
                      src={item.image?.[0]}
                      alt={item.name}
                      className="h-52 w-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* ⭐ Rating */}
                    <div className="flex items-center gap-2">
                      <StarRating rating={Number(item.rating ?? 0)} />
                      <span className="text-sm text-neutral-500">({Number(item.reviews ?? 0)})</span>
                    </div>

                    {/* Name */}
                    <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2">
                      {item.name}
                    </p>

                    {/* Price */}
                    <div className="mt-2 flex items-center gap-2">
                      {item.originalPrice && (
                        <span className="text-sm text-neutral-400 line-through">
                          ฿{Number(item.originalPrice).toLocaleString()}
                        </span>
                      )}
                      <span className="text-blue-500 font-semibold">
                        ฿{Number(item.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Add to Cart Button */}
                <div className="px-4 pb-4 pt-0 border-t border-neutral-200 dark:border-neutral-700">
                  {cartMessage?.productId === item.id ? (
                    <div className="text-center py-2 text-sm font-medium">
                      {cartMessage.message}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item.id, item.name)}
                      disabled={addingToCart === item.id}
                      className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white rounded-lg text-sm font-medium transition"
                    >
                      {addingToCart === item.id
                        ? '...'
                        : i18n.language === 'th'
                          ? '🛒 เพิ่มลงตะกร้า'
                          : '🛒 Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              siblingCount={1}
              showFirstLast
            />
          </div>
        )}
      </div>
    </>
  );
};

export default HomeContent;