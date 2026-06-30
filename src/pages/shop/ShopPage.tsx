import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';

import { shopAPI, productAPI, followAPI } from '@services/backend-api';

export default function ShopPage() {
  const { shopId } = useParams();
  const sid = Number(shopId);
  const dispatch = useAppDispatch();

  // ✅ State from Backend API
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Follow state from Backend API
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // ✅ Fetch shop info + products + follow status จาก Backend
  useEffect(() => {
    if (!sid) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop info
        const shopRes = await shopAPI.getShop(sid);
        const shopData = shopRes.data?.data ?? shopRes.data;
        setShop(shopData);

        // Fetch shop products
        const productsRes = await productAPI.getProducts({ shop_id: sid, limit: 100 });
        const productsData = productsRes.data?.data ?? productsRes.data;
        const productsList = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
        setProducts(productsList);

        // Check follow status (ไม่ต้อง login ก็ดูร้านได้ แต่ follow status ต้อง login)
        try {
          const followRes = await followAPI.checkFollowStatus(sid);
          setIsFollowing(followRes.data?.isFollowing ?? followRes.data?.data?.isFollowing ?? false);
        } catch {
          // Not logged in or error — default to not following
          setIsFollowing(false);
        }
      } catch (err: any) {
        console.error('ShopPage fetch error:', err);
        setError(err?.response?.data?.error || err?.message || 'ไม่สามารถโหลดข้อมูลร้านค้าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sid]);

  // ✅ Follow/Unfollow via Backend API
  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await followAPI.unfollowShop(sid);
        setIsFollowing(false);
        // Update follower count locally
        setShop((prev: any) => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) } : prev);
        dispatch(
          pushNotification({
            type: 'system',
            title: 'เลิกติดตามร้านค้า',
            message: `เลิกติดตาม ${shop?.shop_name || shop?.shopName || ''} แล้ว`,
          })
        );
      } else {
        await followAPI.followShop(sid);
        setIsFollowing(true);
        // Update follower count locally
        setShop((prev: any) => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev);
        dispatch(
          pushNotification({
            type: 'system',
            title: 'ติดตามร้านค้า',
            message: `ติดตาม ${shop?.shop_name || shop?.shopName || ''} แล้ว จะได้รับแจ้งเตือนเมื่อมีสินค้าใหม่`,
          })
        );
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: err?.response?.data?.message || 'กรุณาเข้าสู่ระบบก่อนติดตามร้านค้า',
        })
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p: any) =>
      String(p.name ?? '').toLowerCase().includes(query)
    );
  }, [products, q]);

  const shopName = shop?.shop_name || shop?.shopName || `ร้าน ${sid}`;
  const shopAvatar = shop?.avatar_url || shop?.avatar || '/shop/shop1.png';
  const shopScore = shop?.rating || shop?.score || '5.0';
  const shopFollowers = shop?.followers_count || shop?.followers || 0;

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">⏳ กำลังโหลดข้อมูลร้านค้า...</div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">❌ ไม่พบร้านค้า</div>
        <div className="text-sm text-neutral-500 mt-2">{error || 'อาจถูกลบหรือ ID ไม่ถูกต้อง'}</div>
        <Link className="text-primary-600 underline underline-offset-4 mt-4 inline-block" to="/">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 py-10 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            className="text-primary-600 hover:text-primary-500 underline underline-offset-4"
            to="/"
          >
            ← กลับหน้าแรก
          </Link>
          <Link
            to="/followed-shops"
            className="text-sm text-neutral-600 hover:text-emerald-700 font-medium"
            title="ดูร้านค้าที่ติดตาม"
          >
            ⭐ ร้านค้าที่ติดตาม
          </Link>
        </div>

        {/* Shop Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={shopAvatar}
              alt={shopName}
              className="h-20 w-20 rounded-full object-cover border border-neutral-200 bg-white"
            />

            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold text-neutral-900 truncate">{shopName}</div>
              <div className="mt-1 text-sm text-neutral-600">
                คะแนน:{' '}
                <span className="font-semibold text-emerald-700">{shopScore}</span> •
                ผู้ติดตาม:{' '}
                <span className="font-semibold">{Number(shopFollowers).toLocaleString()}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  type="button" 
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isFollowing
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'border border-emerald-700 text-emerald-700 hover:bg-emerald-50'
                  } ${followLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {followLoading ? '⏳...' : isFollowing ? '✓ ติดตามแล้ว' : '+ ติดตามร้านค้า'}
                </button>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
              <div className="text-neutral-600">สินค้าทั้งหมด</div>
              <div className="text-2xl font-semibold text-neutral-900">{products.length}</div>
            </div>
          </div>
        </div>

        {/* Search + Products */}
        <div className="mt-6 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="text-lg font-semibold text-neutral-900">สินค้าของร้าน</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาสินค้าในร้านนี้..."
              className="w-full sm:w-80 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="mt-5">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
                ไม่พบสินค้าในร้านนี้ (ลองค้นหาคำอื่น)
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/details/${item.id}`}
                    className="bg-white rounded-xl border border-neutral-200 hover:shadow-md transition overflow-hidden"
                  >
                    <div className="relative">
                      {!!item.badge && (
                        <span
                          className={[
                            'absolute left-2 top-2 z-10 rounded-md px-3 py-1 text-xs font-semibold',
                            item.badge_bg ?? 'bg-yellow-300 text-black',
                          ].join(' ')}
                        >
                          {item.badge}
                        </span>
                      )}
                      <img
                        src={Array.isArray(item.images) ? item.images[0] : (item.image || '/no-image.png')}
                        alt={item.name}
                        className="h-52 w-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-neutral-800 line-clamp-2">{item.name}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        {item.original_price && (
                          <span className="text-sm text-neutral-400 line-through">
                            ฿{item.original_price}
                          </span>
                        )}
                        <span className="text-blue-600 font-semibold">฿{item.price}</span>
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">กดเพื่อดูรายละเอียด</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}