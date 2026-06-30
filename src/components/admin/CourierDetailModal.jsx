import { useState } from 'react';

/**
 * Courier Detail Modal Component
 * Display courier registration details with approve/reject actions
 */
export default function CourierDetailModal({
  courier,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
  error = null,
}) {
  const [showImages, setShowImages] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  /**
   * Mask ID card for privacy
   */
  const maskIDCard = (id) => {
    if (!id) return '-';
    const d = id.replace(/\D/g, '');
    if (d.length < 13) return d;
    return `${d[0]}-****-*****-${d.slice(10, 12)}-${d[12]}`;
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-amber-100 text-amber-900',
      approved: 'bg-emerald-100 text-emerald-900',
      rejected: 'bg-red-100 text-red-900',
    };
    const labels = {
      draft: 'ร่างคำขอ',
      pending_approval: 'รอการอนุมัติ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธ',
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              👤 {courier.fullName || 'ไม่ระบุชื่อ'}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              ID: {courier.id}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-400 hover:text-neutral-600 text-2xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase">สถานะ</p>
                <p className="mt-1">{getStatusBadge(courier.status)}</p>
              </div>
              {courier.rejectReason && (
                <div className="flex-1 ml-4">
                  <p className="text-xs font-medium text-red-600 uppercase">เหตุผลการปฏิเสธ</p>
                  <p className="text-sm text-red-700 mt-1">{courier.rejectReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">📋 ข้อมูลส่วนตัว</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-600 font-medium">ชื่อ-นามสกุล</p>
                <p className="text-neutral-900 mt-1">{courier.fullName || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-600 font-medium">อีเมล</p>
                <p className="text-neutral-900 mt-1 break-all">{courier.email || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-600 font-medium">เบอร์โทรศัพท์</p>
                <p className="text-neutral-900 mt-1">{courier.phone || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-600 font-medium">เลขประจำตัวประชาชน</p>
                <p className="font-mono text-neutral-900 mt-1">{maskIDCard(courier.idCardNumber)}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">🚗 ข้อมูลยานพาหนะ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-600 font-medium">ประเภทยานพาหนะ</p>
                <p className="text-neutral-900 mt-1">{courier.vehicleType || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-600 font-medium">เลขทะเบียนรถ</p>
                <p className="text-neutral-900 mt-1">{courier.licensePlate || '-'}</p>
              </div>
            </div>
          </div>

          {/* Registration Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">📅 ไทม์ไลน์</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">วันที่สมัคร</span>
                <span className="text-neutral-900 font-medium">{formatDate(courier.createdAt)}</span>
              </div>
              {courier.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">วันที่ตรวจสอบ</span>
                  <span className="text-neutral-900 font-medium">{formatDate(courier.reviewedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">ขั้นตอนปัจจุบัน</span>
                <span className="text-neutral-900 font-medium">ขั้นตอนที่ {courier.currentStep || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">ยืนยัน OTP</span>
                <span className={`font-medium ${courier.otpVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {courier.otpVerified ? '✓ ยืนยันแล้ว' : '○ ยังไม่ยืนยัน'}
                </span>
              </div>
            </div>
          </div>

          {/* Documents Toggle */}
          <button
            onClick={() => setShowImages(!showImages)}
            className="w-full px-4 py-2 text-sm font-medium text-left bg-neutral-100 hover:bg-neutral-200 rounded-lg transition flex items-center justify-between"
          >
            <span>📸 ดูเอกสารประกอบการลงทะเบียน</span>
            <span className="text-neutral-600">{showImages ? '▼' : '▶'}</span>
          </button>

          {/* Documents */}
          {showImages && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courier.idCardFrontImage && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">🆔 บัตรประชาชนหน้า</p>
                    <img
                      src={courier.idCardFrontImage}
                      alt="ID Front"
                      onClick={() => setEnlargedImage({ src: courier.idCardFrontImage, title: 'บัตรประชาชนหน้า' })}
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50 cursor-pointer hover:opacity-80 transition"
                      onError={() => console.warn('Image failed to load: idCardFrontImage')}
                    />
                  </div>
                )}
                {courier.idCardBackImage && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">🆔 บัตรประชาชนหลัง</p>
                    <img
                      src={courier.idCardBackImage}
                      alt="ID Back"
                      onClick={() => setEnlargedImage({ src: courier.idCardBackImage, title: 'บัตรประชาชนหลัง' })}
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50 cursor-pointer hover:opacity-80 transition"
                      onError={() => console.warn('Image failed to load: idCardBackImage')}
                    />
                  </div>
                )}
                {courier.drivingLicenseImage && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">🚗 ใบขับขี่</p>
                    <img
                      src={courier.drivingLicenseImage}
                      alt="Driving License"
                      onClick={() => setEnlargedImage({ src: courier.drivingLicenseImage, title: 'ใบขับขี่' })}
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50 cursor-pointer hover:opacity-80 transition"
                      onError={() => console.warn('Image failed to load: drivingLicenseImage')}
                    />
                  </div>
                )}
                {courier.vehicleOwnershipImage && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">📄 เอกสารสิทธิ์ยานพาหนะ</p>
                    <img
                      src={courier.vehicleOwnershipImage}
                      alt="Vehicle Ownership"
                      onClick={() => setEnlargedImage({ src: courier.vehicleOwnershipImage, title: 'เอกสารสิทธิ์ยานพาหนะ' })}
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50 cursor-pointer hover:opacity-80 transition"
                      onError={() => console.warn('Image failed to load: vehicleOwnershipImage')}
                    />
                  </div>
                )}
                {courier.insuranceImage && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">🛡️ ประกันภัย</p>
                    <img
                      src={courier.insuranceImage}
                      alt="Insurance"
                      onClick={() => setEnlargedImage({ src: courier.insuranceImage, title: 'ประกันภัย' })}
                      className="w-full max-h-48 object-contain rounded border border-neutral-200 bg-neutral-50 cursor-pointer hover:opacity-80 transition"
                      onError={() => console.warn('Image failed to load: insuranceImage')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enlarged Image Viewer Modal */}
          {enlargedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900">{enlargedImage.title}</h3>
                  <button
                    onClick={() => setEnlargedImage(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                {/* Image */}
                <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50">
                  <img
                    src={enlargedImage.src}
                    alt={enlargedImage.title}
                    className="max-w-full max-h-[calc(90vh-150px)] object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        {courier.status === 'pending_approval' && (
          <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-200 text-neutral-900 hover:bg-neutral-300 transition disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              {isLoading ? '⏳ ...' : '✕ ปฏิเสธ'}
            </button>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isLoading ? '⏳ ...' : '✓ อนุมัติ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
