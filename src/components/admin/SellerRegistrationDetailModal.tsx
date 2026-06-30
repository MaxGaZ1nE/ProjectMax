import { useState } from 'react';
import { adminAPI } from '@services/backend-api';

interface SellerRegistration {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  addressLine?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  mapAddress?: string;
  idCardNumber?: string;
  hasIdFrontImage?: boolean;
  hasIdBackImage?: boolean;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  status: string;
  rejectReason?: string;
}

interface DetailModalProps {
  seller: SellerRegistration;
  onClose: () => void;
  onApprovalComplete: () => void;
}

export default function SellerRegistrationDetailModal({
  seller,
  onClose,
  onApprovalComplete,
}: DetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'view' | 'reject'>('view');

  const maskIDCard = (id?: string) => {
    if (!id) return '-';
    const d = id.replace(/\D/g, '');
    if (d.length < 13) return d;
    return `${d[0]}-****-*****-${d.slice(10, 12)}-${d[12]}`;
  };

  const handleApprove = async () => {
    if (!confirm('ยืนยันการอนุมัติสำหรับ ' + seller.shopName + ' ใช่ไหม?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      await adminAPI.approveRegistration(seller.id);
      alert('อนุมัติการสมัครสำเร็จ!');
      onApprovalComplete();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('กรุณาระบุเหตุผลการปฏิเสธ');
      return;
    }

    if (!confirm('ยืนยันการปฏิเสธการสมัครใช่ไหม?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      await adminAPI.rejectRegistration(seller.id, rejectReason);
      alert('ปฏิเสธการสมัครสำเร็จ!');
      onApprovalComplete();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">{seller.shopName}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              สถานะ: <strong>{seller.status}</strong>
            </p>
            {seller.rejectReason && (
              <p className="text-sm text-blue-800 mt-2">
                เหตุผลการปฏิเสธ: {seller.rejectReason}
              </p>
            )}
          </div>

          {/* Shop Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">📋 ข้อมูลร้านค้า</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">ชื่อร้าน</p>
                <p className="font-medium text-neutral-900">{seller.shopName}</p>
              </div>
              <div>
                <p className="text-neutral-500">เจ้าของ</p>
                <p className="font-medium text-neutral-900">{seller.ownerName}</p>
              </div>
              <div>
                <p className="text-neutral-500">อีเมล</p>
                <p className="font-medium text-neutral-900 break-all">{seller.email}</p>
              </div>
              <div>
                <p className="text-neutral-500">เบอร์โทร</p>
                <p className="font-medium text-neutral-900">{seller.phone}</p>
              </div>
              {seller.addressLine && (
                <div className="col-span-2">
                  <p className="text-neutral-500">ที่อยู่</p>
                  <p className="font-medium text-neutral-900">{seller.addressLine}</p>
                </div>
              )}
              {seller.province && (
                <div>
                  <p className="text-neutral-500">จังหวัด</p>
                  <p className="font-medium text-neutral-900">{seller.province}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(seller.latitude || seller.mapAddress) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900">📍 ตำแหน่งร้านค้า</h3>
              {seller.mapAddress && (
                <p className="text-sm text-neutral-700">{seller.mapAddress}</p>
              )}
              {seller.latitude && seller.longitude && (
                <p className="text-xs font-mono text-neutral-600">
                  {seller.latitude.toFixed(6)}, {seller.longitude.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* ID Card */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">🆔 ยืนยันตัวตน</h3>
            <div className="text-sm">
              <p className="text-neutral-500">เลขประจำตัวประชาชน</p>
              <p className="font-mono font-medium text-neutral-900">{maskIDCard(seller.idCardNumber)}</p>
            </div>

            {/* Images */}
            {(seller.idCardFrontImage || seller.idCardBackImage) && (
              <div className="grid grid-cols-2 gap-4">
                {seller.idCardFrontImage && (
                  <div>
                    <p className="text-xs text-neutral-600 mb-2">บัตรหน้า</p>
                    <img
                      src={seller.idCardFrontImage}
                      alt="ID Front"
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50"
                    />
                  </div>
                )}
                {seller.idCardBackImage && (
                  <div>
                    <p className="text-xs text-neutral-600 mb-2">บัตรหลัง</p>
                    <img
                      src={seller.idCardBackImage}
                      alt="ID Back"
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">⚠️ {error}</p>
            </div>
          )}

          {/* Reject Form */}
          {mode === 'reject' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <label className="block text-sm font-medium text-amber-900">
                เหตุผลการปฏิเสธ *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="กรุณาบอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition"
              disabled={isProcessing}
            >
              ปิด
            </button>

            {seller.status === 'pending_approval' && (
              <>
                <button
                  onClick={() => {
                    if (mode === 'reject') {
                      handleReject();
                    } else {
                      setMode('reject');
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition disabled:opacity-60"
                  disabled={isProcessing}
                >
                  {mode === 'reject' ? '✓ ยืนยันปฏิเสธ' : 'ปฏิเสธ'}
                </button>

                <button
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    '✓ อนุมัติ'
                  )}
                </button>
              </>
            )}

            {seller.status !== 'pending_approval' && mode === 'view' && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-neutral-600">
                  {seller.status === 'approved' ? '✓ อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
