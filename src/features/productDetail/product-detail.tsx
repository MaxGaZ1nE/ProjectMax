import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import products from '@/mockItem/listProduct';
import { categoryById } from '@/mockItem/categories';
import { shopById } from '@/mockItem/shops';
import { productDetailByProductId } from '@/mockItem/productDetail';
import type { Shop } from '@/mockItem/shops';
import productReviews from '@/mockItem/productReviews';
import { Pagination } from '@components/core/pagination';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/slices/cart-slice';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex text-orange-500 text-sm gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i}>{rating >= i + 1 ? '★' : '☆'}</span>
    ))}
  </div>
);

const ProductDetail: FC = () => {
  const { id } = useParams();

  console.log('ProductDetail render', id);
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);

  const product = useMemo(
    () => products.find((p) => p.id === Number(id)),
    [id]
  );

  if (!product) return <div className="text-center py-20">ไม่พบสินค้า</div>;

  // ✅ ดึงรายละเอียดแยก (ถ้ามี)
  const detail = productDetailByProductId?.[product.id];

  // ✅ หมวดหมู่เป็น title
  const categoryTitle = product.categoryId
    ? categoryById[product.categoryId]?.title ?? product.categoryId
    : 'ไม่ระบุหมวดหมู่';


  // ✅ ร้านค้าที่ขายสินค้านี้
  const shop = shopById?.[product.shopId];


  const images: string[] = Array.isArray(product.image)
    ? product.image
    : Array.isArray(product.image)
      ? product.image
      : [product.image].filter(Boolean) as string[];


  const [activeIndex, setActiveIndex] = useState(0);

  const prevImage = () => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setActiveIndex((i) => (i + 1) % images.length);
  };

  // ===== drag / swipe =====
  const [dragX, setDragX] = useState<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => setDragX(e.clientX);

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX === null || images.length <= 1) return;

    const diff = e.clientX - dragX;
    setDragX(null);

    if (Math.abs(diff) < 40) return; // threshold
    diff > 0 ? prevImage() : nextImage();
  };
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    if (images.length <= 1) return;

    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, 3000);

    return () => window.clearInterval(t);
  }, [isPaused, images.length]);



  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
      {/* ===== SINGLE CARD ===== */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ===== LEFT : IMAGE + THUMBS ===== */}
          <div className="lg:col-span-6">
            <img
              src={images[activeIndex]}
              alt={product.name}
              onPointerDown={(e) => {
                setIsPaused(true);
                onPointerDown(e);
              }}
              onPointerUp={(e) => {
                onPointerUp(e);
                setIsPaused(false);
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-full h-[340px] object-cover rounded-xl border border-neutral-200 dark:border-neutral-700"
            />



            {/* thumbs row (with arrows) */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:shadow-sm disabled:opacity-40"
                aria-label="prev"
                onClick={prevImage}
                disabled={images.length <= 1}
              >
                ‹
              </button>

              <div className="flex gap-2 overflow-hidden">
                {images.map((img, i) => (
                  <img
                    key={`${img}-${i}`}
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    onClick={() => setActiveIndex(i)}
                    className={[
                      'h-16 w-16 object-cover rounded-lg border cursor-pointer',
                      'border-neutral-200 dark:border-neutral-700',
                      'hover:ring-2 hover:ring-emerald-500',
                      i === activeIndex ? 'ring-2 ring-emerald-600' : '',
                    ].join(' ')}
                  />
                ))}
              </div>

              <button
                type="button"
                className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:shadow-sm disabled:opacity-40"
                aria-label="next"
                onClick={nextImage}
                disabled={images.length <= 1}
              >
                ›
              </button>
            </div>
          </div>


          {/* ===== RIGHT : INFO ===== */}
          <div className="lg:col-span-6">
            {/* rating row */}
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                คะแนน {product.rating} ดาว
              </span>
              <span className="text-sm text-neutral-500">
                ({product.reviews?.toLocaleString?.() ?? product.reviews} รีวิว)
              </span>
            </div>

            <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {product.name}
            </h1>

            {/* small meta rows (เหมือนในรูป) */}
            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex gap-2">
                <span className="text-neutral-500">รหัสสินค้า:</span>
                <span className="font-medium">
                  {detail?.sku ?? `A:${product.id}`}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-neutral-500">หมวดหมู่:</span>
                <span className="font-medium">
                  {categoryTitle}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-neutral-500">มีสินค้าในสต็อก:</span>
                <span className="font-medium text-emerald-600">
                  {detail?.stockText ?? 'ในสต็อก'}
                </span>
              </div>
            </div>

            {/* price row */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-emerald-700">
                ${product.price}
                <span className="text-sm font-medium text-neutral-500">/kg</span>
              </span>

              {product.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  ${product.originalPrice}
                </span>
              )}

              {!!product.badge && (
                <span
                  className={[
                    'text-black px-2 py-1 text-xs font-semibold rounde',
                    product.badgeBg ?? '',
                  ].join(' ')}
                >
                  {product.badge}
                </span>
              )}
            </div>

            {/* shipping note */}
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              การจัดส่ง <span className="text-red-500 font-medium">ฟรีค่าจัดส่ง</span>{' '}
              (จัดส่งใน 30 วัน) <span className="text-neutral-400">*เงื่อนไขอาจเปลี่ยนแปลง</span>
            </div>

            {/* weight / unit (เหมือนในรูป) */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">น้ำหนัก</p>
                <input
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  defaultValue={detail?.weightDefault ?? '100'}
                />
              </div>

              <div className="w-full sm:w-44">
                <p className="text-xs text-neutral-500 mb-1">หน่วย</p>
                <select
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  defaultValue="kg"
                >
                  <option value="kg">กิโลกรัม</option>
                  <option value="g">กรัม</option>
                  <option value="box">กล่อง</option>
                </select>
              </div>
            </div>

            {/* qty row */}
            <div className="mt-5 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">จำนวน</span>
                <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <button
                    className="px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    type="button"
                  >
                    −
                  </button>
                  <div className="px-4 py-2 text-sm">{qty}</div>
                  <button
                    className="px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => setQty(qty + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className="text-sm text-neutral-500">
                สินค้าพร้อมส่ง
              </span>
            </div>

            {/* actions row */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
  className="sm:flex-1 border border-emerald-700 text-emerald-700 rounded-lg py-3 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center gap-2"
  type="button"
  onClick={() => {
    dispatch(
      addToCart({
        id: String(product.id),
        name: product.name,
        price: product.price,
        image: images[0],
        qty: qty,
        shopId: product.shopId,
        shopName: shop?.name ?? 'ไม่ทราบชื่อร้าน',
      })
    );
  }}
>
  🛒 เพิ่มไปยังรถเข็น
</button>
              <button
                className="sm:flex-1 bg-emerald-700 text-white rounded-lg py-3 font-medium hover:bg-emerald-800"
                type="button"
              >
                ซื้อสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ===== END SINGLE CARD ===== */}

      {/* ===== SHOP CARD (ใต้การ์ดสินค้า) ===== */}
      <div className="mt-6">
        <ShopCard shop={shop ?? fallbackShop()} />
      </div>

      {/* ===== BELOW SHOP: LEFT (Info+Reviews) + RIGHT (Suggested) ===== */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-9 space-y-6">
          <ProductInfoCard product={product} detail={detail} />
          <ProductReviewsCard productId={product.id} />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3">
          <SuggestedProductsCard currentProductId={product.id} />
        </div>
      </div>


    </div>
  );
};

/* ====== SHOP UI ของคุณ (เหมือนเดิม) ====== */
const StatInline = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-1">
    <span className="text-sm text-neutral-500">{label}</span>
    <span className="text-sm font-semibold text-emerald-700">{value}</span>
  </div>
);

const ShopCard = ({ shop }: { shop: Shop }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl">
      <div className="flex items-center">
        {/* LEFT: avatar + name + button */}
        <div className="flex items-center gap-4 px-5 py-4 min-w-[260px]">
          <img
            src={shop.avatar}
            alt={shop.name}
            className="h-14 w-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
              {shop.name}
            </p>
            <button
              type="button"
              className="mt-2 text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700
                         text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              ดูร้านค้า
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-l border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-2 gap-x-1 gap-y-2">
            <StatInline label="คะแนน" value={shop.score} />
            <StatInline label="เปิดร้านมาแล้ว" value={shop.activeText} />
            <StatInline label="รายการสินค้า" value={shop.products} />
            <StatInline label="ผู้ติดตาม" value={shop.followers.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductInfoCard = ({
  product,
  detail,
}: {
  product: any;
  detail?: any;
}) => {
  if (!detail) return null;

  // ✅ guard category (รองรับบาง product ไม่มี category)
  const categoryTitle = product.categoryId
    ? categoryById[product.categoryId]?.title ?? product.categoryId
    : 'ไม่ระบุหมวดหมู่';

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h3 className="font-semibold mb-4">ข้อมูลจำเพาะของสินค้า</h3>

      <InfoRow label="หมวดหมู่" value={categoryTitle} />
      <InfoRow label="คลัง" value={detail.stockText} />
      <InfoRow label="ประเภทผลไม้" value={detail.fruitType} />
      <InfoRow label="ประเทศต้นทาง" value={detail.originCountry} />
      <InfoRow label="อายุการเก็บรักษา" value={detail.shelfLife} />
      <InfoRow label="น้ำหนักสินค้า" value={detail.weightText} />
      <InfoRow label="ส่งจาก" value={detail.shipFrom} />

      <h3 className="font-semibold mt-6 mb-2">รายละเอียดสินค้า</h3>
      <p className="whitespace-pre-line text-sm text-neutral-700">
        {detail.description}
      </p>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex items-start gap-6 text-sm py-1">
    <span className="text-neutral-500 min-w-[120px]">
      {label}
    </span>
    <span className="font-medium text-neutral-900">
      {value ?? '-'}
    </span>
  </div>
);



// fallback กันพัง (mock-only)
const fallbackShop = (): Shop => ({
  id: 0,
  name: 'ร้านค้า',
  avatar: '/shop/shop1.png',
  score: 0,
  products: 0,
  followers: 0,
  activeText: '-',
});


const ReviewRow = ({ r }: { r: any }) => (
  <div className="py-6">
    <div className="flex gap-4">
      {/* avatar */}
      <img
        src={r.avatar}
        alt={r.username}
        className="h-10 w-10 rounded-full object-cover"
      />

      {/* content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-neutral-900">{r.username}</p>

            <StarRating rating={r.rating} />
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-neutral-400">{r.createdAt}</span>
              {r.variantText && (
                <span className="text-xs text-neutral-400">{r.variantText}</span>
              )}
            </div>
          </div>

          {/* review image on right */}
          {r.image && (
            <img
              src={r.image}
              alt="review"
              className="h-20 w-20 object-cover rounded border border-neutral-200"
            />
          )}
        </div>
        {/* รีวิวคุณภาพ / รสชาติ */}
        <div className="mt-2 text-xs text-neutral-600">
          {r.qualityText && (
            <div>
              <span className="font-medium text-neutral-700">คุณภาพ:</span>{' '}
              {r.qualityText}
            </div>
          )}
          {r.tasteText && (
            <div>
              <span className="font-medium text-neutral-700">รสชาติ:</span>{' '}
              {r.tasteText}
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-neutral-700 leading-6">
          {r.body}
        </p>
      </div>
    </div>
  </div>
);

const ProductReviewsCard = ({ productId }: { productId: number }) => {
  const reviews = useMemo(
    () => productReviews.filter((x) => x.productId === productId),
    [productId]
  );

  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const current = reviews.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <p className="font-semibold text-neutral-900 mb-2">คะแนนสินค้า</p>

      {/* list */}
      <div className="divide-y divide-neutral-200">
        {current.map((r) => (
          <ReviewRow key={r.id} r={r} />
        ))}
      </div>

      {/* pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          siblingCount={1}
          showFirstLast
        />
      </div>
    </div>
  );
};


const SmallStarRating = ({ rating }: { rating: number }) => (
  <div className="flex text-orange-500 text-xs gap-0.5 leading-none">
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i}>{rating >= i + 1 ? '★' : '☆'}</span>
    ))}
  </div>
);

const SuggestedProductsCard = ({
  currentProductId,
}: {
  currentProductId: number;
}) => {
  const items = useMemo(() => {
    const list = products.filter((p) => p.id !== currentProductId);
    return list.slice(0, 5);
  }, [currentProductId]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
      <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
        สินค้ายอดนิยม
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/details/${item.id}`}
            className="block border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-sm transition"
          >
            <div className="relative">
              {!!item.badge && (
                <span
                  className={[
                    'absolute left-2 top-2 text-[10px] font-semibold px-2 py-0.5 rounded',
                    item.badgeBg ?? 'bg-yellow-300 text-black',
                  ].join(' ')}
                >
                  {item.badge}
                </span>
              )}

              <img
                src={item.image?.[0] ?? item.image}
                alt={item.name}
                className="h-28 w-full object-cover"
              />
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2">
                <SmallStarRating rating={item.rating} />
                <span className="text-xs text-neutral-500">
                  ({item.reviews?.toLocaleString?.() ?? item.reviews})
                </span>
              </div>

              <p className="mt-2 text-xs text-neutral-800 dark:text-neutral-200 line-clamp-2">
                {item.name}
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                {item.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through">
                    ${item.originalPrice}
                  </span>
                )}
                <span className="text-sm font-semibold text-blue-600">
                  ${item.price}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};




export default ProductDetail;
