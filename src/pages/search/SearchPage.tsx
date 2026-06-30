import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getHomeProducts } from '@/features/products/home-catalog';
import type { Product } from '@/mockItem/listProduct';

const categoryImageMap: Record<string, string> = {
  popular: '/category/popular.jpg',
  seasonal: '/category/seasonal.jpg',
  imported: '/category/imported.jpg',
  rare: '/category/rare.jpg',
  processed: '/category/processed.jpg',
  byproduct: '/category/byproduct.jpg',
};

const categoryLabelMap: Record<string, Record<string, string>> = {
  popular: {
    en: 'Popular Fruits',
    th: 'ผลไม้ยอดนิยม',
  },
  seasonal: {
    en: 'Seasonal Fruits',
    th: 'ผลไม้ตามฤดูกาลในประเทศ',
  },
  imported: {
    en: 'Imported Fruits',
    th: 'ผลไม้นำเข้าจากต่างประเทศ',
  },
  rare: {
    en: 'Rare Fruits',
    th: 'ผลไม้พื้นถิ่นหายาก',
  },
  processed: {
    en: 'Processed Fruits',
    th: 'ผลไม้แปรรูป',
  },
  byproduct: {
    en: 'Fruit Byproducts',
    th: 'เศษผลไม้เพื่อนำไปแปรรูป',
  },
};

export default function SearchPage() {
  const { i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Map category ID -> Slug just like HomeContent
  const [categoryIdToSlug, setCategoryIdToSlug] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchSearchProducts = async () => {
      try {
        const { productAPI } = await import('@services/backend-api');
        
        let catMap: Record<number, string> = {};
        try {
          const catRes = await productAPI.getCategories();
          const cats = catRes.data?.data || [];
          const slugs = ['popular', 'seasonal', 'imported', 'rare', 'processed', 'byproduct'];
          cats.forEach((c: any, index: number) => {
            catMap[c.id] = c.slug || slugs[index] || 'popular';
          });
          setCategoryIdToSlug(catMap);
        } catch (e) {
          console.warn('Failed to fetch categories');
        }

        const res = await productAPI.getProducts();
        const backendProducts = res.data?.data || [];
        
        const formattedProducts: Product[] = backendProducts.map((p: any) => {
          const catSlug = catMap[p.category_id] || p.category_id || 'popular';
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

        setAllProducts(formattedProducts);
      } catch (err) {
        console.error('Failed to load search products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(allProducts.map((p: Product) => p.categoryId).filter((c): c is string => Boolean(c)));
    return Array.from(cats);
  }, [allProducts]);

  const results = useMemo(() => {
    if (!activeCategory) return allProducts;
    return allProducts.filter((p: Product) => p.categoryId === activeCategory);
  }, [activeCategory, allProducts]);

  const getCategoryLabel = (catId: string) => {
    return categoryLabelMap[catId]?.[i18n.language as 'en' | 'th'] || catId;
  };

  const allProductsLabel = i18n.language === 'th' ? 'ทั้งหมด' : 'All';
  const allProductsTitle = i18n.language === 'th' ? 'สินค้าทั้งหมด' : 'All Products';
  const showAllTitle = i18n.language === 'th' ? 'แสดงสินค้าทั้งหมด' : 'Show all products';
  const backToHome = i18n.language === 'th' ? 'กลับหน้าแรก' : 'Back to Home';
  const noProducts = i18n.language === 'th' ? 'ไม่พบสินค้าในหมวดหมู่นี้' : 'No products in this category';

  return (
    <div className="py-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xl font-semibold">{allProductsTitle}</div>
            <div className="text-sm text-neutral-500">
              {activeCategory ? getCategoryLabel(activeCategory) : showAllTitle}
            </div>
          </div>

          <Link to="/" className="text-emerald-700 underline underline-offset-4">
            {backToHome}
          </Link>
        </div>

        {/* Category Filter with Images */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {/* All Products */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`relative rounded-lg overflow-hidden h-24 flex items-center justify-center transition ${
                activeCategory === null ? 'ring-2 ring-emerald-600' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
              <div className="relative z-10 text-center">
                <div className="font-semibold text-sm">{allProductsLabel}</div>
              </div>
            </button>

            {/* Category Buttons */}
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative rounded-lg overflow-hidden h-24 transition ${
                  activeCategory === cat ? 'ring-2 ring-emerald-600' : ''
                }`}
              >
                <img
                  src={categoryImageMap[cat] || '/category/popular.jpg'}
                  alt={getCategoryLabel(cat)}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 hover:opacity-90 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="relative z-10 h-full flex items-end justify-center pb-2">
                  <div className="text-white text-center text-xs sm:text-sm font-semibold">
                    {getCategoryLabel(cat)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          {results.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              {noProducts}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((p: Product) => (
                <Link
                  key={p.id}
                  to={`/details/${p.id}`}
                  className="rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-lg transition"
                >
                  {p.image?.[0] && (
                    <div className="w-full h-48 overflow-hidden bg-gray-100">
                      <img
                        src={p.image[0]}
                        alt={p.name}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="font-semibold line-clamp-2">{p.name}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-600">฿{p.price}</span>
                      <span className="text-sm text-neutral-500 line-through">฿{p.originalPrice}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold">{p.rating}</span>
                      <span className="text-xs text-neutral-500">({p.reviews} {i18n.language === 'th' ? 'รีวิว' : 'reviews'})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}