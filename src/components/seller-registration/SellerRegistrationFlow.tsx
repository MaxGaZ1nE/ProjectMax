import { useAppSelector } from '@stores/index';
import { useSellerRegistration } from '@contexts/SellerRegistrationContext';
import { useEffect, useState, useRef } from 'react';
import { sellerAPI } from '@services/backend-api';
import SellerRegistrationStep1 from './SellerRegistrationStep1';
import SellerRegistrationStep2 from './SellerRegistrationStep2';
import SellerRegistrationStep3 from './SellerRegistrationStep3';
import SellerRegistrationStep4 from './SellerRegistrationStep4';
import SellerRegistrationPendingApproval from './SellerRegistrationPendingApproval';

const STEPS = [
  { num: 1, label: 'ข้อมูลร้าน' },
  { num: 2, label: 'ตำแหน่งร้าน' },
  { num: 3, label: 'ยืนยันตัวตน' },
  { num: 4, label: 'ตรวจสอบ' },
];

export default function SellerRegistrationFlow() {
  const { step, setStep } = useSellerRegistration();

  const user = useAppSelector((s) => s.auth.user);
  const sellerProfile = useAppSelector((s) => s.seller.profile);
  const sellerLoading = useAppSelector((s) => s.seller.loading);

  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const hasRedirectedRef = useRef(false); // ✅ Prevent multiple redirects

  // Check registration status on mount (ONLY CHECK, DON'T REDIRECT HERE)
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await sellerAPI.getRegistrationStatus();
        const status = (response?.data as any)?.data?.status ?? (response?.data as any)?.status;
        setRegistrationStatus(status);

        // If already pending approval, go to step 5
        if (status === 'pending_approval') {
          setStep(5);
        } else if (status === 'rejected') {
          // If rejected, show step 1 to restart
          setStep(1);
        }
        // ✅ DON'T REDIRECT HERE - let the seller profile check handle it
      } catch (err) {
        console.log('Could not fetch registration status:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [user, setStep]);

  // ✅ Single redirect point: when seller profile indicates isSeller === true
  useEffect(() => {
    if (!hasRedirectedRef.current && sellerProfile?.isSeller === true && !sellerLoading && !isCheckingStatus) {
      hasRedirectedRef.current = true;
      // Add a small delay to ensure Redux is fully synced
      const timer = setTimeout(() => {
        window.location.href = '/seller/products';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sellerProfile?.isSeller, sellerLoading, isCheckingStatus]);

  if (sellerLoading || isCheckingStatus) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-3" />
        <p className="text-sm text-neutral-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold text-neutral-900">กรุณาเข้าสู่ระบบก่อน</div>
        <a
          href="/auth/login"
          className="text-primary-600 underline underline-offset-4 inline-block mt-2 text-sm"
        >
          ไปหน้าเข้าสู่ระบบ
        </a>
      </div>
    );
  }

  if (sellerProfile?.isSeller === true) {
    return (
      <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
        <div className="mx-auto max-w-screen-md px-4">
          <div className="card p-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-2xl font-semibold text-neutral-900">คุณเป็นผู้ขายอยู่แล้ว</div>
            <div className="text-sm text-neutral-600">
              ร้าน:{' '}
              <span className="font-semibold text-lg text-emerald-700">
                {sellerProfile.shopName}
              </span>
            </div>
            <div className="border-t border-neutral-200 pt-4">
              <button
                className="btn btn-primary w-full"
                onClick={() => (window.location.href = '/seller/products')}
              >
                📦 ไปลงสินค้า
              </button>
            </div>
            <p className="text-xs text-neutral-400">กำลังพาไปหน้าจัดการสินค้า...</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 5 = pending approval page (หลัง submit)
  if (step === 5) {
    return <SellerRegistrationPendingApproval />;
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
        <div className="card p-8">

          {/* Header - Seller Registration Title */}
          <div className="mb-8 pb-6 border-b border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🏪</span>
              <h1 className="text-3xl font-bold text-neutral-900">สมัครเป็นผู้ขาย</h1>
            </div>
            <p className="text-neutral-600">เปิดร้านค้าและเริ่มต้นธุรกิจออนไลน์ของคุณ</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="relative flex items-center justify-between">
              {/* Connector lines */}
              <div className="absolute top-5 left-0 right-0 flex px-5">
                {STEPS.slice(0, -1).map((s) => (
                  <div
                    key={s.num}
                    className={`flex-1 h-0.5 mx-0 transition-colors duration-300 ${
                      s.num < step ? 'bg-emerald-500' : 'bg-neutral-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step circles */}
              {STEPS.map((s) => (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      s.num < step
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : s.num === step
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md'
                        : 'bg-white text-neutral-400 border-2 border-neutral-200'
                    }`}
                  >
                    {s.num < step ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      s.num === step
                        ? 'text-primary-600'
                        : s.num < step
                        ? 'text-emerald-600'
                        : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-neutral-500 mt-4">
              ขั้นตอนที่ {step} จาก {STEPS.length}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8 min-h-96">
            {step === 1 && <SellerRegistrationStep1 />}
            {step === 2 && <SellerRegistrationStep2 />}
            {step === 3 && <SellerRegistrationStep3 />}
            {step === 4 && <SellerRegistrationStep4 />}
          </div>

          {/* Progress hint */}
          <p className="mt-3 text-center text-xs text-neutral-400">
            {step === 1 && '✓ กรอกข้อมูลพื้นฐาน → ปักหมุดร้าน → ยืนยันตัวตน → ส่งการขอ'}
            {step === 2 && '📍 ค้นหาหรือคลิกแผนที่เพื่อปักหมุดตำแหน่งร้านค้า'}
            {step === 3 && '🆔 ข้อมูลส่วนตัวจะถูกเข้ารหัสและลบหลังตรวจสอบ'}
            {step === 4 && '✓ กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนส่ง'}
          </p>
        </div>
      </div>
    </div>
  );
}