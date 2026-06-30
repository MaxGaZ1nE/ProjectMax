import { useState } from 'react';
import { adminAPI } from '@services/backend-api';

interface DeliveryRegistration {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  addressLine?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  mapAddress?: string;
  vehicleType?: string;
  licensePlate?: string;
  idCardNumber?: string;
  hasIdFrontImage?: boolean;
  hasIdBackImage?: boolean;
  hasFaceImage?: boolean;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  faceImage?: string;
  drivingLicenseImage?: string;
  vehicleOwnershipImage?: string;
  insuranceImage?: string;
  status: string;
  rejectReason?: string;
}

interface DetailModalProps {
  rider: DeliveryRegistration;
  onClose: () => void;
  onApprovalComplete: () => void;
}

export default function DeliveryRegistrationDetailModal({
  rider,
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
    if (!confirm(`ยืนยันการอนุมัติสำหรับ ${rider.firstName} ${rider.lastName} ใช่ไหม?`)) return;

    setIsProcessing(true);
    setError(null);

    try {
      await adminAPI.approveDeliveryRegistration(rider.id);
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
      await adminAPI.rejectDeliveryRegistration(rider.id, rejectReason);
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
          <h2 className="text-xl font-bold text-neutral-900">{rider.firstName} {rider.lastName}</h2>
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
              สถานะ: <strong>{rider.status}</strong>
            </p>
            {rider.rejectReason && (
              <p className="text-sm text-blue-800 mt-2">
                เหตุผลการปฏิเสธ: {rider.rejectReason}
              </p>
            )}
          </div>

          {/* Rider Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">🛵 ข้อมูลคนส่ง</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">ชื่อ-นามสกุล</p>
                <p className="font-medium text-neutral-900">{rider.firstName} {rider.lastName}</p>
              </div>
              <div>
                <p className="text-neutral-500">อีเมล</p>
                <p className="font-medium text-neutral-900 break-all">{rider.email}</p>
              </div>
              <div>
                <p className="text-neutral-500">เบอร์โทร</p>
                <p className="font-medium text-neutral-900">{rider.phone}</p>
              </div>
              <div>
                <p className="text-neutral-500">ประเภทรถ</p>
                <p className="font-medium text-neutral-900">{rider.vehicleType || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-500">ทะเบียนรถ</p>
                <p className="font-medium text-neutral-900">{rider.licensePlate || '-'}</p>
              </div>
              {rider.addressLine && (
                <div className="col-span-2">
                  <p className="text-neutral-500">ที่อยู่</p>
                  <p className="font-medium text-neutral-900">{rider.addressLine}</p>
                </div>
              )}
              {rider.province && (
                <div>
                  <p className="text-neutral-500">จังหวัด</p>
                  <p className="font-medium text-neutral-900">{rider.province}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(rider.latitude || rider.mapAddress) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900">📍 ตำแหน่งที่อยู่</h3>
              {rider.mapAddress && (
                <p className="text-sm text-neutral-700">{rider.mapAddress}</p>
              )}
              {rider.latitude && rider.longitude && (
                <p className="text-xs font-mono text-neutral-600">
                  {rider.latitude.toFixed(6)}, {rider.longitude.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* ID Card */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">🆔 ยืนยันตัวตน</h3>
            <div className="text-sm">
              <p className="text-neutral-500">เลขประจำตัวประชาชน</p>
              <p className="font-mono font-medium text-neutral-900">{maskIDCard(rider.idCardNumber)}</p>
            </div>

            {/* Images */}
            {(rider.idCardFrontImage || rider.idCardBackImage || rider.faceImage) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rider.idCardFrontImage && (
                  <div>
                    <p className="text-xs text-neutral-600 mb-2">บัตรหน้า</p>
                    <img
                      src={rider.idCardFrontImage}
                      alt="ID Front"
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50"
                    />
                  </div>
                )}
                {rider.idCardBackImage && (
                  <div>
                    <p className="text-xs text-neutral-600 mb-2">บัตรหลัง</p>
                    <img
                      src={rider.idCardBackImage}
                      alt="ID Back"
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50"
                    />
                  </div>
                )}
                {rider.faceImage && (
                  <div>
                    <p className="text-xs text-neutral-600 mb-2">รูปถ่ายหน้าตรง</p>
                    <img
                      src={rider.faceImage}
                      alt="Face"
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Documents */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">🚗 เอกสารยานพาหนะ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Driving License */}
              <div>
                <p className="text-xs font-semibold text-neutral-700 mb-2">ใบขับขี่</p>
                {rider.drivingLicenseImage ? (
                  <img
                    src={rider.drivingLicenseImage}
                    alt="ใบขับขี่"
                    className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                  />
                ) : (
                  <div className="w-full h-36 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 font-medium">ไม่มีเอกสาร</span>
                  </div>
                )}
              </div>

              {/* Vehicle Registration */}
              <div>
                <p className="text-xs font-semibold text-neutral-700 mb-2">เอกสารรถ / สมุดทะเบียนรถ</p>
                {rider.vehicleOwnershipImage ? (
                  <img
                    src={rider.vehicleOwnershipImage}
                    alt="เอกสารรถ"
                    className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                  />
                ) : (
                  <div className="w-full h-36 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 font-medium">ไม่มีเอกสาร</span>
                  </div>
                )}
              </div>

              {/* Insurance */}
              <div>
                <p className="text-xs font-semibold text-neutral-700 mb-2">ใบประกันรถ</p>
                {rider.insuranceImage ? (
                  <img
                    src={rider.insuranceImage}
                    alt="ใบประกันรถ"
                    className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                  />
                ) : (
                  <div className="w-full h-36 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 font-medium">ไม่มีเอกสาร</span>
                  </div>
                )}
              </div>
            </div>
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

            {rider.status === 'pending_approval' && (
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

            {rider.status !== 'pending_approval' && mode === 'view' && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-neutral-600">
                  {rider.status === 'approved' ? '✓ อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
