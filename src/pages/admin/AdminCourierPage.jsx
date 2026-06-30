import { useEffect, useState } from 'react';
import { useAppSelector } from '@stores/index';
import { adminAPI } from '@services/backend-api';
import CourierDetailModal from '@components/admin/CourierDetailModal';

/**
 * Admin Courier Management Page
 * Approve/Reject pending delivery/courier registrations
 */
export default function AdminCourierPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [couriers, setCouriers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending_approval');

  // Load couriers on mount and when filter changes
  useEffect(() => {
    loadCouriers();
  }, [statusFilter]);

  /**
   * Load couriers with optional status filter
   */
  const loadCouriers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDeliveryRegistrations(statusFilter);
      const data = response?.data?.data ?? response?.data ?? [];
      
      if (Array.isArray(data)) {
        // Ensure all required fields are present
        const normalizedData = data.map((courier) => ({
          id: courier.id,
          fullName: courier.full_name || courier.fullName || '',
          email: courier.email || '',
          phone: courier.phone || '',
          idCardNumber: courier.id_card_number || courier.idCardNumber || '',
          vehicleType: courier.vehicle_type || courier.vehicleType || '',
          licensePlate: courier.license_plate_number || courier.licensePlate || '',
          status: courier.status || 'draft',
          currentStep: courier.current_step || courier.currentStep || 0,
          rejectReason: courier.reject_reason || courier.rejectReason || '',
          createdAt: courier.created_at || courier.createdAt || new Date().toISOString(),
          reviewedAt: courier.reviewed_at || courier.reviewedAt || null,
          otpVerified: courier.otp_verified || courier.otpVerified || false,
          // Document images
          idCardFrontImage: courier.id_card_front_image || courier.idCardFrontImage || null,
          idCardBackImage: courier.id_card_back_image || courier.idCardBackImage || null,
          drivingLicenseImage: courier.driving_license_image || courier.drivingLicenseImage || null,
          vehicleOwnershipImage: courier.vehicle_ownership_image || courier.vehicleOwnershipImage || null,
          insuranceImage: courier.insurance_image || courier.insuranceImage || null,
        }));
        setCouriers(normalizedData);
      }
    } catch (err) {
      console.error('Load couriers error:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'ไม่สามารถโหลดข้อมูลได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open detail modal for courier
   */
  const handleViewDetail = (courier) => {
    setSelectedCourier(courier);
    setIsDetailModalOpen(true);
  };

  /**
   * Open reject modal for courier
   */
  const handleOpenRejectModal = (courier) => {
    setSelectedCourier(courier);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  /**
   * Approve courier registration
   */
  const handleApproveCourier = async () => {
    if (!selectedCourier) return;

    setIsActionLoading(true);
    setActionError(null);
    try {
      await adminAPI.approveDeliveryRegistration(selectedCourier.id);
      
      // Success - reload the list
      setIsDetailModalOpen(false);
      setSelectedCourier(null);
      
      // Reload couriers
      await loadCouriers();
    } catch (err) {
      console.error('Approve courier error:', err);
      setActionError(
        err?.response?.data?.message ||
        err?.message ||
        'ไม่สามารถอนุมัติได้'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Reject courier registration with reason
   */
  const handleRejectCourier = async () => {
    if (!selectedCourier) return;

    if (!rejectReason.trim()) {
      setActionError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    try {
      await adminAPI.rejectDeliveryRegistration(selectedCourier.id, rejectReason);
      
      // Success - close modals and reload
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedCourier(null);
      setRejectReason('');
      
      // Reload couriers
      await loadCouriers();
    } catch (err) {
      console.error('Reject courier error:', err);
      setActionError(
        err?.response?.data?.message ||
        err?.message ||
        'ไม่สามารถปฏิเสธได้'
      );
    } finally {
      setIsActionLoading(false);
    }
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
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ============ RENDER ============

  // Access control
  if (!user || user.role !== 'admin') {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-semibold">⛔ Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">🚚 จัดการลงทะเบียนพนักงานส่ง</h1>
        <p className="text-neutral-600 mt-1">
          ตรวจสอบและอนุมัติ/ปฏิเสธคำขอลงทะเบียนของพนักงานส่งสินค้า
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          🔍 ฟิลเตอร์สถานะ
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'pending_approval', label: 'รอการอนุมัติ' },
            { value: 'approved', label: 'อนุมัติแล้ว' },
            { value: 'rejected', label: 'ปฏิเสธ' },
            { value: '', label: 'ทั้งหมด' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === option.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">⚠️ เกิดข้อผิดพลาด</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={loadCouriers}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            ✓ ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && couriers.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-neutral-600 font-semibold">ไม่พบข้อมูล</p>
          <p className="text-neutral-500 text-sm mt-1">
            ไม่มีพนักงานส่งที่อยู่ในสถานะนี้
          </p>
        </div>
      )}

      {/* Couriers Table */}
      {!isLoading && !error && couriers.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    โทรศัพท์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    เลขทะเบียนรถ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    วันที่สมัคร
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {couriers.map((courier) => (
                  <tr key={courier.id} className="hover:bg-neutral-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {courier.fullName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {courier.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {courier.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {courier.licensePlate || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(courier.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatDate(courier.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewDetail(courier)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          title="ดูรายละเอียด"
                        >
                          👁️ ดู
                        </button>
                        {courier.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCourier(courier);
                                handleApproveCourier();
                              }}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                              disabled={isActionLoading}
                              title="อนุมัติ"
                            >
                              ✓ อนุมัติ
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(courier)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition"
                              title="ปฏิเสธ"
                            >
                              ✕ ปฏิเสธ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedCourier && (
        <CourierDetailModal
          courier={selectedCourier}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCourier(null);
          }}
          onApprove={handleApproveCourier}
          onReject={() => {
            setIsDetailModalOpen(false);
            handleOpenRejectModal(selectedCourier);
          }}
          isLoading={isActionLoading}
          error={actionError}
        />
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedCourier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              ⚠️ ปฏิเสธคำขอลงทะเบียน
            </h2>

            <p className="text-neutral-600 mb-4">
              ชื่อ: <span className="font-medium">{selectedCourier.fullName}</span>
            </p>

            <label className="block text-sm font-medium text-neutral-700 mb-2">
              เหตุผลการปฏิเสธ <span className="text-red-600">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="กรุณาระบุเหตุผลการปฏิเสธ..."
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
            />

            {actionError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedCourier(null);
                  setRejectReason('');
                  setActionError(null);
                }}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-200 text-neutral-900 hover:bg-neutral-300 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRejectCourier}
                disabled={isActionLoading || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {isActionLoading ? '⏳ กำลังประมวลผล...' : '✓ ปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
