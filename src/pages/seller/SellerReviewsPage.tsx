import { useEffect, useMemo, useState } from 'react';
import { reviewAPI, sellerAPI } from '@services/backend-api';
import { useAppSelector } from '@stores/index';

interface ShopReview {
  id: string;
  product_id: number;
  product_name?: string;
  product_images?: string[];
  username: string;
  rating: number;
  body: string;
  quality_text?: string;
  taste_text?: string;
  created_at: string;
}

const StarDisplay = ({ rating, size = 'text-sm' }: { rating: number; size?: string }) => (
  <div className={`flex text-orange-400 ${size} gap-0.5`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s}>{s <= rating ? '★' : '☆'}</span>
    ))}
  </div>
);

export default function SellerReviewsPage() {
  const seller = useAppSelector(
    (s) => (s as { seller?: { profile?: { shopId?: number } } }).seller?.profile
  );
  const shopId = seller?.shopId;

  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0,
  });

  // Filters
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Products list for filter dropdown
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);

  // Fetch shop products for filter dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = (await sellerAPI.getMyProducts()) as { data?: Record<string, unknown> | unknown[] };
        const data = (res.data as { data?: unknown })?.data ?? res.data;
        const rawProducts = Array.isArray(data)
          ? data
          : (data as { products?: unknown[] })?.products ?? [];
        setProducts(
          rawProducts.map((p: Record<string, unknown>) => ({
            id: Number(p.id),
            name: String(p.name || ''),
          }))
        );
      } catch {
        // silently fail
      }
    };
    fetchProducts();
  }, []);

  // Fetch reviews
  const fetchReviews = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 200 };
      if (filterRating) params.rating = filterRating;

      const res = await reviewAPI.getShopReviews(shopId, params);
      const data = (res as any)?.data;
      setReviews(data?.data ?? []);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [shopId, filterRating]);

  // Client-side filtering by product & search
  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (filterProduct) {
      result = result.filter((r) => String(r.product_id) === filterProduct);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.body?.toLowerCase().includes(q) ||
          r.username?.toLowerCase().includes(q) ||
          r.product_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [reviews, filterProduct, searchQuery]);

  // Rating distribution for stats
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // index 0=1star, 4=5star
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist;
  }, [reviews]);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">
          ⏳ กำลังโหลดรีวิว...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">⭐ บทวิจารณ์สินค้า</h1>
        <p className="text-neutral-600 mt-1">ดูรีวิวจากลูกค้าที่ซื้อสินค้าในร้านของคุณ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-sm text-neutral-600">คะแนนเฉลี่ย</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="text-3xl mb-2">💬</div>
          <div className="text-sm text-neutral-600">รีวิวทั้งหมด</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{stats.totalReviews}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-sm text-neutral-600">5 ดาว</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{ratingDist[4]}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm text-neutral-600">สินค้าที่ถูกรีวิว</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {new Set(reviews.map((r) => r.product_id)).size}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">📊 กราฟคะแนน</h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDist[star - 1];
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition hover:bg-neutral-50 ${
                  filterRating === star ? 'bg-orange-50 ring-1 ring-orange-200' : ''
                }`}
              >
                <span className="text-sm font-medium text-neutral-700 w-12">{star} ดาว</span>
                <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-500 w-10 text-right">{count}</span>
              </button>
            );
          })}
        </div>
        {filterRating && (
          <button
            type="button"
            onClick={() => setFilterRating(null)}
            className="mt-3 text-xs text-emerald-600 hover:underline"
          >
            ✕ ล้างตัวกรองดาว
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="ค้นหาข้อความรีวิว / ชื่อลูกค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
          >
            <option value="">สินค้า: ทั้งหมด</option>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          รีวิวล่าสุด ({filteredReviews.length})
          {filterRating && (
            <span className="text-sm font-normal text-orange-600 ml-2">
              (กรอง: {filterRating} ดาว)
            </span>
          )}
        </h2>

        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-lg">ยังไม่มีรีวิว</p>
            <p className="text-sm mt-1">รีวิวจะปรากฏเมื่อลูกค้าซื้อและรีวิวสินค้าของคุณ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Product thumbnail */}
                    {review.product_images?.[0] ? (
                      <img
                        src={review.product_images[0]}
                        alt={review.product_name}
                        className="h-12 w-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-lg shrink-0">
                        📦
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">
                        {review.username}
                      </div>
                      <div className="text-sm text-neutral-600 truncate">
                        {review.product_name || `สินค้า #${review.product_id}`}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StarDisplay rating={review.rating} size="text-lg" />
                  </div>
                </div>

                {/* Quality / Taste tags */}
                {(review.quality_text || review.taste_text) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {review.quality_text && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        คุณภาพ: {review.quality_text}
                      </span>
                    )}
                    {review.taste_text && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        รสชาติ: {review.taste_text}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-neutral-700 text-sm leading-relaxed">{review.body}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                  <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs">
                    {review.rating} ดาว
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
