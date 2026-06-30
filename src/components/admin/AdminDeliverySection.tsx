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
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  rejectReason?: string;
}

export default function AdminDeliverySection() {
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
      } else {
        setRiders([]);
      }
    } catch (err) {
      console.error('Error loading riders:', err);
      setError('ไม่สามารถโหลดข้อมูลคนส่งได้');
      setRiders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (rider: DeliveryRegistration) => {
    setSelectedRider(rider);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRider(null);
  };

  const handleApprovalComplete = () => {
    loadRiders();
    closeModal();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending_approval: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
      approved: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
      rejected: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      draft: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200',
    };
    const labels = {
      pending_approval: '⏳ รอการอนุมัติ',
      approved: '✅ อนุมัติแล้ว',
      rejected: '❌ ปฏิเสธ',
      draft: '📝 ฉบับร่าง',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || ''}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">🚚 ยืนยันการลงทะเบียนคนส่ง</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ตรวจสอบและอนุมัติการลงทะเบียนพนักงานจัดส่งใหม่</p>
        </div>
        
        <div>
          <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
            สถานะการลงทะเบียน
          </label>
          <select
            className="w-full md:w-64 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:border-primary-500 dark:focus:ring-primary-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending_approval">รอการอนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="draft">ฉบับร่าง</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Riders Table */}
      {!isLoading && riders.length === 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">ไม่พบข้อมูลคนส่ง</p>
        </div>
      )}

      {!isLoading && riders.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">อีเมล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ประเภทรถ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">วันที่สมัคร</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{rider.firstName} {rider.lastName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{rider.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{rider.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{rider.vehicleType || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(rider.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(rider.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openModal(rider)}
                        className="px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedRider && (
        <DeliveryRegistrationDetailModal
          rider={selectedRider}
          onClose={closeModal}
          onApprovalComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
