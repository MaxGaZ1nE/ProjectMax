import { useAppSelector, useAppDispatch } from '@stores/index';
import { useState, useEffect } from 'react';
import { sellerAPI } from '@services/backend-api';
import { fetchSellerProfile } from '@slices/seller-slice';

export default function SellerRegistrationPendingApproval() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const sellerProfile = useAppSelector((s) => s.seller.profile);
  
  const [statusData, setStatusData] = useState<{
    status: string;
    submittedAt?: string;
    estimatedApprovalDate?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    checkRegistrationStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkRegistrationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      setIsChecking(true);
      setCheckError(null);
      const response = await sellerAPI.getRegistrationStatus();
      const data = (response?.data as any)?.data ?? response?.data;
      
      setStatusData({
        status: data?.status || 'pending_approval',
        submittedAt: data?.submittedAt || data?.createdAt,
        estimatedApprovalDate: data?.estimatedApprovalDate,
      });

      // If already approved, refresh seller profile and redirect
      if (data?.status === 'approved') {
        // ✅ Refresh seller profile to sync Redux state
        await (dispatch(fetchSellerProfile()) as any);
        
        setTimeout(() => {
          window.location.href = '/seller/products';
        }, 1500);
      }
    } catch (err: unknown) {
      console.error('Error checking status:', err);
      setCheckError('ไม่สามารถตรวจสอบสถานะได้');
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="py-10 bg-gradient-to-b from-neutral-50 to-white min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6">
        {/* Main Card */}
        <div className="card p-8 space-y-8">
          {/* Icon & Header */}
          <div className="text-center space-y-4">
            <div className="inline-block relative">
              <div className="text-6xl animate-bounce">⏳</div>
              <div className="absolute inset-0 bg-amber-200 blur-xl opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                รอการอนุมัติจากแอดมิน
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                ข้อมูลของคุณกำลังอยู่ในกระบวนการตรวจสอบ
              </p>
            </div>
          </div>

          {/* Shop Info Summary */}
          {(sellerProfile?.shopName || statusData?.submittedAt) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <span>📋</span> ข้อมูลที่ส่งให้ตรวจสอบ
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {sellerProfile?.shopName && (
                  <div>
                    <p className="text-neutral-600 text-xs">ชื่อร้านค้า</p>
                    <p className="font-semibold text-neutral-900">{sellerProfile.shopName}</p>
                  </div>
                )}
                {user?.email && (
                  <div>
                    <p className="text-neutral-600 text-xs">อีเมล</p>
                    <p className="font-semibold text-neutral-900 break-all text-sm">{user.email}</p>
                  </div>
                )}
                {statusData?.submittedAt && (
                  <div className="col-span-2">
                    <p className="text-neutral-600 text-xs">วันที่ส่งคำขอ</p>
                    <p className="font-semibold text-neutral-900">
                      {formatDate(statusData.submittedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <span>⏱️</span> กำหนดเวลา
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 items-start">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-neutral-900">ส่งคำขอแล้ว</p>
                  <p className="text-neutral-600 text-xs">
                    {statusData?.submittedAt 
                      ? formatDate(statusData.submittedAt)
                      : 'เมื่อ 1-2 นาทีที่แล้ว'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold shrink-0 animate-pulse">
                  ⏳
                </div>
                <div>
                  <p className="font-medium text-neutral-900">ตรวจสอบข้อมูล</p>
                  <p className="text-neutral-600 text-xs">
                    ทำการตรวจสอบ 1-3 วันทำการ
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-300 text-white text-xs font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-neutral-900">อนุมัติแล้ว</p>
                  <p className="text-neutral-600 text-xs">
                    ประมาณ{' '}
                    {statusData?.estimatedApprovalDate
                      ? formatDate(statusData.estimatedApprovalDate)
                      : 'ภายใน 3 วันทำการ'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
            <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
              <span>📌</span> ขั้นตอนถัดไป
            </h3>
            <ol className="space-y-2 text-sm text-emerald-900">
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">1️⃣</span>
                <span>ตรวจสอบอีเมล - ระบบจะแจ้งเตือนผลการอนุมัติทางอีเมล</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">2️⃣</span>
                <span>อนุมัติแล้ว - เข้าสู่ระบบใหม่เพื่ออัปเดตข้อมูล</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">3️⃣</span>
                <span>เริ่มลงสินค้า - เพิ่มสินค้าของคุณและเริ่มขาย</span>
              </li>
            </ol>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>❓ มีคำถาม?</strong> ติดต่อทีมสนับสนุน ได้ที่ support@example.com หรือโทร 1234-567-890
            </p>
          </div>

          {/* Error */}
          {checkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{checkError}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 border-t border-neutral-200 pt-6">
            <button
              onClick={checkRegistrationStatus}
              disabled={isChecking}
              className="flex-1 px-4 py-3 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ตรวจสอบ...
                </>
              ) : (
                <>
                  🔄 เช็คสถานะ
                </>
              )}
            </button>

            <a
              href="/"
              className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition text-center"
            >
              🏠 กลับหน้าหลัก
            </a>
          </div>

          {/* Auto-refresh note */}
          <p className="text-center text-xs text-neutral-400">
            💡 ระบบตรวจสอบสถานะโดยอัตโนมัติทุก 30 วินาที
          </p>
        </div>
      </div>
    </div>
  );
}