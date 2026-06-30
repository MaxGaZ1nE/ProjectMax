import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { fetchSellerProfile } from '@slices/seller-slice';

/**
 * ✅ useInitializeSeller Hook (No Polling)
 * ดึง seller profile จาก Backend หลังจาก login สำเร็จ
 * - ถ้า user ยังไม่มี seller profile → สาธารณะ (ไม่เป็น seller)
 * - ถ้า user เป็น seller → ดึง profile มาเก็บใน Redux state
 * 
 * ✅ NO POLLING: Fetch ครั้งแรกเมื่อ login + user manual refresh ถ้าต้องการ
 */
export function useInitializeSeller() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const sellerProfile = useAppSelector((s) => s.seller.profile);

  useEffect(() => {
    // ✅ ต้องเป็น authenticated
    if (!isAuthenticated) {
      return;
    }

    // ✅ ถ้าเป็น seller แล้ว ไม่ต้อง fetch ใหม่
    if (sellerProfile?.isSeller) {
      return;
    }

    // ✅ Fetch ครั้งแรก เมื่อ user login
    dispatch(fetchSellerProfile()).catch(() => {
      // ไม่ได้เป็น seller เป็นเรื่องปกติ
    });
  }, [isAuthenticated, dispatch, sellerProfile?.isSeller]);
}