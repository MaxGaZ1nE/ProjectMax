import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@stores/index';
import { fetchSellerProfile } from '@slices/seller-slice';

export default function SellerRegisterGuard({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const seller = useAppSelector((s) => s.seller.profile);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncSellerProfile = async () => {
      if (seller?.isSeller === true) {
        return;
      }

      setIsSyncing(true);
      try {
        await dispatch(fetchSellerProfile()).catch(() => {
          // ไม่เป็น seller เป็นเรื่องปกติ
        });
      } finally {
        setIsSyncing(false);
      }
    };

    syncSellerProfile();
  }, [dispatch, seller?.isSeller]);

  if (isSyncing) {
    return <div className="py-10 text-center text-neutral-500">กำลังตรวจสอบสถานะ...</div>;
  }

  if (seller?.isSeller === true) {
    return <Navigate to="/seller/products" replace />;
  }

  return <>{children}</>;
}