import { useEffect, useState } from 'react';
import { useAppSelector } from '@stores/index';
import { adminAPI } from '@services/backend-api';
import DeliveryRegistrationDetailModal from '@components/admin/DeliveryRegistrationDetailModal';

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
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  rejectReason?: string;
}

export default function AdminDeliveryApprovalsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [riders, setRiders] = useState<DeliveryRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<DeliveryRegistration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');

  // Load riders
  useEffect(() => {
    loadRiders();
  }, [statusFilter]);

  const loadRiders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDeliveryRegistrations(statusFilter);
      const data = (response as any)?.data?.data ?? (response as any)?.data ?? [];
      if (Array.isArray(data)) {
        setRiders(data);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? 'ไม่สามารถโหลดข้อมูลได้');
      console.error('Load riders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRider = (rider: DeliveryRegistration) => {
    setSelectedRider(rider);
    setIsModalOpen(true);
  };

  const handleApprovalComplete = () => {
    setIsModalOpen(false);
    setSelectedRider(null);
    loadRiders();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-amber-100 text-amber-900',
      approved: 'bg-emerald-100 text-emerald-900',
      rejected: 'bg-red-100 text-red-900',
    };
    const labels: Record<string, string> = {
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600">⛔ Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">การจัดการการลงทะเบียนคนส่ง (Rider)</h1>
        <p className="text-neutral-600 mt-1">ตรวจสอบและอนุมัติคำขอลงทะเบียนของพนักงานส่งสินค้า</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          ฟิลเตอร์สถานะ
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-3" />
          <p className="text-neutral-600">กำลังโหลด...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && riders.length === 0 ? (
        <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <p className="text-neutral-600">ไม่มีข้อมูลการลงทะเบียน</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">อีเมล</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">เบอร์โทร</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">ประเภทรถ</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">สถานะ</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">วันลงทะเบียน</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider, idx) => (
                <tr key={rider.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{rider.firstName} {rider.lastName}</td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">{rider.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{rider.phone}</td>
                  <td className="px-4 py-3 text-neutral-700">{rider.vehicleType || '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(rider.status)}</td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">{formatDate(rider.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleApproveRider(rider)}
                      className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedRider && (
        <DeliveryRegistrationDetailModal
          rider={selectedRider}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRider(null);
          }}
          onApprovalComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
