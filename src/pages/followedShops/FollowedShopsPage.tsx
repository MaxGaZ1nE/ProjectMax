import { useState } from 'react';
import { useShopFollowManager, useFollowShopNotifications } from '@/hooks/use-follow-shop';
import { useAppDispatch } from '@stores/index';
import { resetNotificationCount } from '@/slices/follow-shop-slice';
import { removeFollowedShopFromStorage } from '@/utils/followShopStorage';
import { unfollowShop } from '@/slices/follow-shop-slice';
import { Link } from 'react-router-dom';

export default function FollowedShopsPage() {
  useFollowShopNotifications(); // ✅ เฝ้าระวังการแจ้งเตือน
  
  const dispatch = useAppDispatch();
  const { followedShops, totalNotifications, getFollowedShopsWithNotifications } = useShopFollowManager();
  const sortedShops = getFollowedShopsWithNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleRemoveFollow = (shopId: number) => {
    removeFollowedShopFromStorage(shopId);
    dispatch(unfollowShop(shopId));
  };

  const handleResetNotifications = (shopId: number) => {
    dispatch(resetNotificationCount(shopId));
  };

  const filteredShops =
    filter === 'unread' ? sortedShops.filter((s) => s.notificationCount > 0) : sortedShops;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">ร้านค้าที่ติดตาม</h1>
      <p className="text-neutral-600 mb-6">
        รวม {followedShops.length} ร้าน • {totalNotifications} การแจ้งเตือนใหม่
      </p>

      {followedShops.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-8 text-center">
          <p className="text-neutral-600">คุณยังไม่ได้ติดตามร้านค้าใด</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              ทั้งหมด ({followedShops.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              มีการแจ้งเตือน ({sortedShops.filter((s) => s.notificationCount > 0).length})
              {totalNotifications > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                  {totalNotifications}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {filteredShops.map((shop) => (
              <div
                key={shop.shopId}
                className={`border rounded-lg p-4 transition ${
                  shop.notificationCount > 0
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{shop.shopName}</h3>
                      {shop.notificationCount > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                          {shop.notificationCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      ติดตามตั้งแต่:{' '}
                      {new Date(shop.lastNotificationAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {shop.notificationCount > 0 && (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        📢 มีการแจ้งเตือนใหม่ {shop.notificationCount} รายการ
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/shop/${shop.shopId}`}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium"
                    >
                      ไปร้านค้า
                    </Link>
                    {shop.notificationCount > 0 && (
                      <button
                        onClick={() => handleResetNotifications(shop.shopId)}
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium"
                      >
                        ทำเครื่องหมายว่าอ่านแล้ว
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveFollow(shop.shopId)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium"
                    >
                      เลิกติดตาม
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
