/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { categoryById, type Category } from '@/mockItem/categories';

import { Pagination } from '@components/core/pagination';

import { useDispatch } from 'react-redux';
import { addToCart } from '@/slices/cart-slice';
// Follow API is dynamically imported in ShopCard
import { pushNotification } from '@/slices/notification-slice';
import { useAppSelector } from '@stores/index';
import type { RootState } from '@stores/root-reducer';
// follow-shop-slice no longer needed (using Backend API)

// followShopStorage no longer needed (using Backend API)

import { productAPI, shopAPI } from '@services/backend-api';

import type { Review } from '@/slices/reviews-slice';

type UnitType = 'Kg' | 'Ton';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex text-orange-500 text-sm gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i}>{rating >= i + 1 ? '★' : '☆'}</span>
    ))}
  </div>
);

const unitLabel = (u: UnitType) => {
  return u;
};

function clampInt(value: unknown, fallback = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

const ProductDetail: FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((s: RootState) => ({ isAuthenticated: s.auth.isAuthenticated }));
  
  const [product, setProduct] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [weight, setWeight] = useState<number>(100);
  const [unit, setUnit] = useState<UnitType>('Kg');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await productAPI.getProduct(id);
        const productData = (res as any)?.data?.data ?? (res as any)?.data;
        setProduct(productData);
        if (productData?.weight) {
          setWeight(Number(productData.weight));
        }
        
        const shopId = productData.shop_id;
        if (shopId) {
          try {
            const shopRes = await shopAPI.getShop(shopId);
            const shopData = (shopRes as any)?.data?.data ?? (shopRes as any)?.data;
            setShop(shopData);
          } catch (e) {
            console.error('Shop fetch error:', e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (isPaused || !product || !product.images || product.images.length <= 1) return;
    const t = window.setInterval(() => setActiveIndex((i) => (i + 1) % product.images.length), 3000);
    return () => window.clearInterval(t);
  }, [isPaused, product]);

  if (isLoading) {
    return (
      <div className="text-center py-20 min-h-[500px] flex items-center justify-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">📦 กำลังประมวลผลข้อมูลจากคลังสินค้า...</div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20">ไม่พบสินค้าในคลังข้อมูล</div>;

  const categoryTitle = product.category_id
    ? (categoryById as Record<string, Category>)?.[product.category_id as string]?.title ?? product.category_id
    : 'ไม่ระบุหมวดหมู่';

  const images: string[] = Array.isArray(product.images) && product.images.length > 0 ? product.images : ['/no-image.png'];

  const prevImage = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveIndex((i) => (i + 1) % images.length);

  const onPointerDown = (e: React.PointerEvent) => setDragX(e.clientX);
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX === null || images.length <= 1) return;
    const diff = e.clientX - dragX;
    setDragX(null);
    if (Math.abs(diff) < 40) return;
    if (diff > 0) prevImage();
    else nextImage();
  };

  const addCurrentToCart = async () => {
    // Debug: log product structure
    console.log('🛒 ProductDetail - addCurrentToCart called');
    console.log('📍 product object:', product);
    console.log('📍 product.id:', product.id);
    console.log('📍 product.product_id:', product.product_id);
    
    // Determine correct product ID
    const productId = Number(product.id ?? product.product_id ?? 0);
    console.log('🔍 Resolved productId:', productId);
    
    if (!productId || productId <= 0) {
      console.error('❌ Invalid product ID:', productId);
      alert('Invalid product ID');
      return;
    }
    
    // Always update Redux for immediate UI feedback
    dispatch(
      addToCart({
        id: String(productId),
        name: product.name,
        price: Number(product.price ?? 0),
        image: images[0],
        qty: 1,
        shopId: Number(product.shop_id ?? 0),
        shopName: shop?.name ?? `ร้าน ${product.shop_id ?? '-'}`,
        unit,
        weight,
      })
    );
    dispatch(
      pushNotification({
        type: 'system',
        title: 'เพิ่มสินค้าในตะกร้าแล้ว',
        message: `${product.name} (${weight} ${unit})`,
      })
    );

    // Also sync with Backend cart API (fire-and-forget, don't block UI)
    try {
      const { cartAPI } = await import('@services/backend-api');
      console.log('📤 Sending to API - productId:', productId, 'qty:', 1, 'weight:', weight);
      await cartAPI.addToCart(productId, 1, weight);
      console.log('✅ Cart API sync successful');
    } catch (e: any) {
      // Silently fail - Redux state is the fallback
      console.error('❌ Cart API sync failed:', e?.response?.data || e?.message || e);
    }
  };

  const onBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: location.pathname + location.search } });
      return;
    }
    addCurrentToCart();
    navigate('/cart');
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: IMAGE */}
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
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:shadow-sm disabled:opacity-40"
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
                      'h-16 w-16 object-cover rounded-lg border cursor-pointer border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-emerald-500',
                      i === activeIndex ? 'ring-2 ring-emerald-600' : '',
                    ].join(' ')}
                  />
                ))}
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:shadow-sm disabled:opacity-40"
                onClick={nextImage}
                disabled={images.length <= 1}
              >
                ›
              </button>
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2">
              <StarRating rating={Number(product.rating ?? 0)} />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                คะแนน {Number(product.rating ?? 0)} ดาว
              </span>
              <span className="text-sm text-neutral-500">({Number(product.reviews ?? 0)} รีวิว)</span>
            </div>

            <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h1>

            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex gap-2">
                <span className="text-neutral-500">รหัสสินค้า:</span>
                <span className="font-medium text-neutral-800">{product.sku ?? `FR-${product.id}`}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-neutral-500">หมวดหมู่:</span>
                <span className="font-medium text-neutral-800">{categoryTitle}</span>
              </div>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#1a6e40]">
                ฿{unit === 'Ton' ? Number(product.price) * 1000 : product.price}
                <span className="text-sm font-medium text-neutral-500">/{unit}</span>
              </span>
              {product.original_price && (
                <span className="text-sm text-neutral-400 line-through">
                  ฿{unit === 'Ton' ? Number(product.original_price) * 1000 : product.original_price}
                </span>
              )}
              {!!product.badge && (
                <span
                  className={['text-black px-2 py-1 text-xs font-semibold rounded', product.badge_bg ?? ''].join(
                    ' '
                  )}
                >
                  {product.badge}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="block text-[13px] text-neutral-500 mb-1">น้ำหนัก</p>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow bg-white"
                  value={weight}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWeight(Number.isNaN(v) ? 0.1 : v);
                  }}
                  inputMode="decimal"
                />
              </div>
              <div className="w-full sm:w-44">
                <p className="block text-[13px] text-neutral-500 mb-1">หน่วย</p>
                <select
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow bg-white"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'Kg' | 'Ton')}
                >
                  <option value="Kg">Kg</option>
                  <option value="Ton">Ton</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                className="sm:flex-1 border-2 border-[#1a6e40] text-[#1a6e40] rounded-lg py-3 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center gap-2 transition"
                type="button"
                onClick={addCurrentToCart}
              >
                🛒 เพิ่มไปยังรถเข็น
              </button>
              <button
                className="sm:flex-1 bg-[#1a6e40] text-white rounded-lg py-3 font-medium hover:bg-[#166534] transition shadow-md hover:shadow-lg"
                type="button"
                onClick={onBuyNow}
              >
                ซื้อสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ShopCard shop={shop ?? { 
          id: product.shop_id, 
          name: product.shop_name || product.shopName || 'ร้านค้าที่จัดจำหน่าย', 
          avatar: `/shop-pofiles/shop${(Number(product.shop_id || product.id || 1) % 5) + 1}.jpg`, 
          score: 5, 
          products: 30, 
          followers: 15 
        }} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <ProductInfoCard product={product} categoryTitle={categoryTitle} shop={shop} />
          <ProductReviewsCard productKey={`base:${product.id}`} />
        </div>
        <div className="lg:col-span-3">
          <SuggestedProductsCard currentProductId={Number(product.id)} />
        </div>
      </div>
    </div>
  );
};

const StatInline = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-1">
    <span className="text-sm text-neutral-500">{label}</span>
    <span className="text-sm font-semibold text-emerald-700">{value}</span>
  </div>
);

const ShopCard = ({ shop, onFollowChange }: { shop: Record<string, any> | null; onFollowChange?: (isFollowing: boolean) => void }) => {
  const shopId = shop?.id ?? 0;
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const dispatch = useDispatch();

  // ✅ Check follow status จาก Backend on mount
  React.useEffect(() => {
    if (!shopId) return;
    const checkStatus = async () => {
      try {
        const { followAPI } = await import('@services/backend-api');
        const res = await followAPI.checkFollowStatus(shopId);
        setIsFollowing((res as any)?.data?.isFollowing ?? (res as any)?.data?.data?.isFollowing ?? false);
      } catch {
        setIsFollowing(false);
      }
    };
    checkStatus();
  }, [shopId]);

  const handleFollowClick = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    try {
      const { followAPI } = await import('@services/backend-api');

      if (isFollowing) {
        await followAPI.unfollowShop(shopId);
        setIsFollowing(false);
        dispatch(
          pushNotification({
            type: 'system',
            title: 'เลิกติดตามร้านค้า',
            message: `เลิกติดตาม ${shop?.name ?? 'ร้านค้า'} แล้ว`,
          })
        );
      } else {
        await followAPI.followShop(shopId);
        setIsFollowing(true);
        dispatch(
          pushNotification({
            type: 'system',
            title: 'ติดตามร้านค้า',
            message: `ติดตาม ${shop?.name ?? 'ร้านค้า'} แล้ว จะได้รับแจ้งเตือนเมื่อมีสินค้าใหม่หรือเพิ่มสต็อก`,
          })
        );
      }
      onFollowChange?.(!isFollowing);
    } catch (err: unknown) {
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: (err as any)?.response?.data?.message || 'กรุณาเข้าสู่ระบบก่อนติดตามร้านค้า',
        })
      );
    } finally {
      setFollowLoading(false);
    }
  };

  if(!shop) return null;

  return (
    <div className="bg-[#f0fdf4] border border-[#e0e0e0] rounded-[10px] p-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 min-w-[260px]">
          {shop.avatar && shop.avatar !== '/shop/shop1.png' ? (
            <img src={shop.avatar} alt={shop.name} className="h-12 w-12 rounded-full object-cover border border-[#e0e0e0]" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-50 shrink-0">
              {shop.name?.[0] || 'ร'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 leading-tight truncate">{shop.name}</p>
            <div className="flex items-center gap-1 mt-1 mb-2">
              <StarRating rating={Number(shop.score ?? 5)} />
              <span className="text-xs text-neutral-500">({shop.score ?? '5.0'})</span>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/shop/${shopId}`}
                className="inline-flex text-[11px] font-medium px-3 py-1 rounded-full border border-[#e0e0e0] text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                ดูร้านค้า
              </Link>
              <button
                onClick={handleFollowClick}
                disabled={followLoading}
                className={`inline-flex text-[11px] font-medium px-3 py-1 rounded-full transition ${
                  isFollowing
                    ? 'bg-[#1a6e40] text-white hover:bg-[#166534]'
                    : 'border border-[#1a6e40] text-[#1a6e40] hover:bg-emerald-50 bg-white'
                } ${followLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {followLoading ? '⏳...' : isFollowing ? '✓ ติดตามแล้ว' : '+ ติดตาม'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 md:border-l border-emerald-100 dark:border-neutral-700 pl-0 md:pl-6 pt-4 md:pt-0 mt-2 md:mt-0">
          <div className="flex gap-8 md:justify-end">
            <div className="flex flex-col">
              <span className="text-[11px] text-neutral-500">คะแนนร้าน</span>
              <span className="text-sm font-semibold text-[#1a6e40]">{shop.score ?? '5.0'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-neutral-500">รายการสินค้า</span>
              <span className="text-sm font-semibold text-[#1a6e40]">{shop.products ?? '20'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-neutral-500">ผู้ติดตาม</span>
              <span className="text-sm font-semibold text-[#1a6e40]">{Number(shop.followers ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductInfoCard = ({ product, categoryTitle, shop }: { product: Record<string, any>; categoryTitle: string; shop?: Record<string, any> }) => {
  const shopLocation = shop 
    ? `สวนอยู่ที่ ${shop.province || 'ไม่ระบุ'} ${shop.latitude && shop.longitude ? '(📍 มีพิกัด GPS)' : ''}`
    : 'ประเทศไทย';

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-emerald-900 border-b pb-2">📌 ข้อมูลจำเพาะของสินค้า</h3>
      <InfoRow label="หมวดหมู่" value={categoryTitle} />
      <InfoRow label="คลังสินค้า" value={product.stock_text ?? 'มีอยู่ในคลัง'} />
      <InfoRow label="แหล่งผลิต" value={
        shop?.latitude && shop?.longitude ? (
          <span className="flex items-center gap-2">
            สวนอยู่ที่ {shop.province || 'ไม่ระบุ'}
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">📍 มีพิกัด GPS</span>
          </span>
        ) : shopLocation
      } />
      <InfoRow label="อายุการเก็บรักษา" value={product.shelf_life ?? 'ตรวจสอบข้อมูลบรรจุภัณฑ์'} />
      <h3 className="font-bold text-lg mt-8 mb-4 text-emerald-900 border-b pb-2">📝 รายละเอียดสินค้า</h3>
      <p className="whitespace-pre-line text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-lg">{product.description ?? 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex items-start gap-6 text-sm py-2 border-b border-dashed border-neutral-100 last:border-0 hover:bg-neutral-50 px-2 rounded transition">
    <span className="text-neutral-500 min-w-[140px]">{label}</span>
    <span className="font-medium text-neutral-900">{value ?? '-'}</span>
  </div>
);

const ReviewRow = ({ r, currentUserId, onEdit, onDelete, onImageClick }: {
  r: Review & { user_id?: number };
  currentUserId?: string;
  onEdit?: (r: Review) => void;
  onDelete?: (id: string) => void;
  onImageClick?: (image: string) => void;
}) => (
  <div className="py-6">
    <div className="flex gap-4">
      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
        {(r.username || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-neutral-900">{r.username}</p>
            <StarRating rating={r.rating} />
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-neutral-400">{r.createdAt}</span>
              {r.variantText && <span className="text-xs text-neutral-400">{r.variantText}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {r.image && (
              <img
                src={r.image}
                alt="review"
                className="h-20 w-20 object-cover rounded border border-neutral-200 cursor-pointer hover:opacity-85 hover:shadow-md transition"
                onClick={() => r.image && onImageClick?.(r.image)}
              />
            )}
            {currentUserId && String(r.user_id) === String(currentUserId) && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEdit?.(r)}
                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(r.id)}
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  🗑️ ลบ
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-neutral-600">
          {r.qualityText && (
            <div>
              <span className="font-medium text-neutral-700">คุณภาพ:</span> {r.qualityText}
            </div>
          )}
          {r.tasteText && (
            <div>
              <span className="font-medium text-neutral-700">รสชาติ:</span> {r.tasteText}
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-neutral-700 leading-6">{r.body}</p>
      </div>
    </div>
  </div>
);

/* ─── Interactive Star Picker ──────────────────────────────────────────────── */
const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={s <= (hover || value) ? 'text-orange-400' : 'text-neutral-300'}>★</span>
        </button>
      ))}
    </div>
  );
};

const ProductReviewsCard = ({ productKey }: { productKey: string }) => {
  const productId = productKey.replace('base:', '');
  const user = useAppSelector((s: RootState) => s.auth.user);
  const { isAuthenticated } = useAppSelector((s: RootState) => ({ isAuthenticated: s.auth.isAuthenticated }));

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [backendReviews, setBackendReviews] = useState<(Review & { user_id?: number })[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Eligibility
  const [eligibility, setEligibility] = useState<{
    canReview: boolean; hasPurchased: boolean; hasReviewed: boolean; orderId: string | null; existingReviewId: string | null;
  } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<(Review & { user_id?: number }) | null>(null);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { reviewAPI } = await import('@services/backend-api');
      const response = await reviewAPI.getProductReviews(productKey, { page: 0, limit: 100 });
      const reviewsData = (response as any)?.data?.data ?? (response as any)?.data ?? [];

      const transformed = Array.isArray(reviewsData) ? reviewsData.map((r: Record<string, any>) => ({
        id: r.id,
        productKey: r.product_key || r.productKey,
        productId: r.product_id || r.productId,
        orderId: r.order_id || r.orderId || '',
        shopId: r.shop_id || r.shopId || 0,
        user_id: r.user_id,
        rating: r.rating,
        body: r.body,
        username: r.username,
        avatar: r.avatar || '/no-image.png',
        qualityText: r.quality_text || r.qualityText,
        tasteText: r.taste_text || r.tasteText,
        variantText: r.variant_text || r.variantText,
        image: r.image,
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH'),
      })) : [];

      setBackendReviews(transformed);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setBackendReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch eligibility
  const fetchEligibility = async () => {
    if (!isAuthenticated || !productId) return;
    try {
      const { reviewAPI } = await import('@services/backend-api');
      const res = await reviewAPI.checkEligibility(productId);
      setEligibility((res as any)?.data?.data ?? null);
    } catch {
      setEligibility(null);
    }
  };

  useEffect(() => { fetchReviews(); }, [productKey]);
  useEffect(() => { fetchEligibility(); }, [productKey, isAuthenticated]);

  const avgRating = useMemo(() => {
    if (!backendReviews.length) return 0;
    return backendReviews.reduce((sum, r) => sum + r.rating, 0) / backendReviews.length;
  }, [backendReviews]);

  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(backendReviews.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const current = backendReviews.slice(start, start + ITEMS_PER_PAGE);

  // Submit / update review
  const handleSubmit = async () => {
    if (!formBody.trim() || formRating < 1) return;
    setFormSubmitting(true);
    try {
      const { reviewAPI } = await import('@services/backend-api');
      if (editingReview) {
        await reviewAPI.updateReview(editingReview.id, { rating: formRating, body: formBody });
      } else {
        await reviewAPI.submitReview(eligibility?.orderId, productId, formRating, formBody, '', '');
      }
      setShowForm(false);
      setEditingReview(null);
      setFormBody('');
      setFormRating(5);
      await fetchReviews();
      await fetchEligibility();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete review
  const handleDelete = async (reviewId: string) => {
    if (!confirm('คุณต้องการลบรีวิวนี้ใช่ไหม?')) return;
    try {
      const { reviewAPI } = await import('@services/backend-api');
      await reviewAPI.deleteReview(reviewId);
      await fetchReviews();
      await fetchEligibility();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'ลบรีวิวไม่สำเร็จ');
    }
  };

  // Start editing
  const handleEdit = (r: Review) => {
    setEditingReview(r as Review & { user_id?: number });
    setFormRating(r.rating);
    setFormBody(r.body);
    setShowForm(true);
  };

  if (reviewsLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-32"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-orange-500 leading-none">{avgRating.toFixed(1)}</div>
          <div>
            <div className="flex text-orange-400 text-xl">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}>{s <= Math.round(avgRating) ? '★' : '☆'}</span>
              ))}
            </div>
            <div className="text-xs text-neutral-500 mt-1">{backendReviews.length} รีวิวทั้งหมด</div>
          </div>
        </div>

        {/* Write review button */}
        {isAuthenticated && eligibility?.canReview && !showForm && (
          <button
            type="button"
            onClick={() => { setEditingReview(null); setFormRating(5); setFormBody(''); setShowForm(true); }}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            ✍️ เขียนรีวิว
          </button>
        )}
      </div>

      {/* Info banner for non-eligible */}
      {isAuthenticated && eligibility && !eligibility.canReview && !eligibility.hasReviewed && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          📌 คุณต้องสั่งซื้อสินค้านี้และได้รับสินค้าแล้วก่อนจึงจะรีวิวได้
        </div>
      )}
      {isAuthenticated && eligibility?.hasReviewed && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          ✅ คุณได้รีวิวสินค้านี้แล้ว สามารถแก้ไขหรือลบรีวิวของคุณได้ด้านล่าง
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mb-6 bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="font-semibold text-neutral-900">
            {editingReview ? '✏️ แก้ไขรีวิว' : '✍️ เขียนรีวิวของคุณ'}
          </div>

          <div>
            <div className="text-sm text-neutral-600 mb-1">คะแนน</div>
            <StarPicker value={formRating} onChange={setFormRating} />
          </div>

          <div>
            <div className="text-sm text-neutral-600 mb-1">ข้อความรีวิว</div>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              placeholder="เล่าประสบการณ์ของคุณกับสินค้านี้..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={formSubmitting || !formBody.trim()}
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {formSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingReview ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingReview(null); }}
              className="px-5 py-2.5 text-sm font-semibold bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="divide-y divide-neutral-200">
        {current.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-500 bg-neutral-50 rounded-lg">ยังไม่มีรีวิวสำหรับสินค้านี้ มาร่วมเป็นคนแรกที่ให้คะแนน!</div>
        ) : (
          current.map((r) => (
            <ReviewRow
              key={r.id}
              r={r}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onImageClick={setSelectedImage}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} siblingCount={1} showFirstLast />
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Review full size"
              className="w-full h-auto rounded-lg object-cover max-h-[80vh]"
            />
          </div>
        </div>
      )}
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

const SuggestedProductsCard = ({ currentProductId }: { currentProductId: number }) => {
  const [items, setItems] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await productAPI.getProducts({ limit: 10 });
        const data = (res as any)?.data?.data ?? (res as any)?.data;
        const allProducts = Array.isArray(data) ? data : (data as Record<string, any>)?.products ?? [];
        const filtered = allProducts.filter((p: Record<string, any>) => p.id !== currentProductId).slice(0, 5);
        setItems(filtered);
      } catch(err) {
        console.error(err);
      }
    };
    fetchSuggested();
  }, [currentProductId]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm">
      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-3 border-b pb-2">⭐ สินค้าแนะนำที่คุณอาจชอบ</p>
      <div className="space-y-4">
        {items.map((item: Record<string, any>) => (
          <Link
            key={item.id}
            to={`/details/${item.id}`}
            className="block border border-neutral-100 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-md hover:border-emerald-200 transition"
          >
            <div className="relative">
              {!!item.badge && (
                <span
                  className={[
                    'absolute left-2 top-2 text-[10px] font-semibold px-2 py-0.5 rounded',
                    item.badge_bg ?? 'bg-yellow-300 text-black',
                  ].join(' ')}
                >
                  {item.badge}
                </span>
              )}
              <img src={(item.images as string[])?.[0] ?? '/no-image.png'} alt={item.name} className="h-32 w-full object-cover" />
            </div>
            <div className="p-3 bg-neutral-50 hover:bg-emerald-50/30">
              <div className="flex items-center gap-2">
                <SmallStarRating rating={Number(item.rating ?? 0)} />
                <span className="text-xs text-neutral-500">({Number(item.reviews ?? 0)})</span>
              </div>
              <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2">{item.name}</p>
              <div className="mt-2 flex items-baseline gap-2">
                {item.original_price && <span className="text-xs text-neutral-400 line-through">฿{item.original_price}</span>}
                <span className="text-sm font-bold text-emerald-600">฿{item.price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;