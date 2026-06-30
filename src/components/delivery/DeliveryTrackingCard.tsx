import { useEffect, useState } from 'react';
import { deliveryJobAPI } from '@services/api';
import type { DeliveryJob } from '@services/api/delivery-api';

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const statusMeta = (status: DeliveryJob['status']) => {
  switch (status) {
    case 'pending':
      return { text: 'รอรับสินค้า', color: 'bg-yellow-100 text-yellow-800', badge: 'border-yellow-300' };
    case 'accepted':
      return { text: 'คนส่งยืนยันแล้ว', color: 'bg-sky-100 text-sky-800', badge: 'border-sky-300' };
    case 'picked_up':
      return { text: 'รับสินค้าแล้ว', color: 'bg-orange-100 text-orange-800', badge: 'border-orange-300' };
    case 'in_delivery':
      return { text: 'กำลังจัดส่ง', color: 'bg-blue-100 text-blue-800', badge: 'border-blue-300' };
    case 'delivered':
      return { text: 'ส่งถึงแล้ว', color: 'bg-green-100 text-green-800', badge: 'border-green-300' };
    case 'cancelled':
      return { text: 'ยกเลิก', color: 'bg-red-100 text-red-800', badge: 'border-red-300' };
    default:
      return { text: status, color: 'bg-neutral-100 text-neutral-800', badge: 'border-neutral-300' };
  }
};

export function DeliveryTrackingCard({ orderId }: { orderId: string }) {
  const [job, setJob] = useState<DeliveryJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch delivery job
  const fetchDeliveryJob = async () => {
    try {
      const data = await deliveryJobAPI.getJobByOrderId(orderId);
      setJob(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('Failed to fetch delivery job:', err);
      // Don't show error, just silently fail
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDeliveryJob();
  }, [orderId]);

  // Polling interval
  useEffect(() => {
    if (!job) return;

    // Stop polling if delivered or cancelled
    if (job.status === 'delivered' || job.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      fetchDeliveryJob();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [job?.status, orderId]);

  if (loading || !job) return null;

  const meta = statusMeta(job.status);
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  const updateText =
    timeSinceUpdate < 60
      ? 'เพิ่งอัปเดต'
      : timeSinceUpdate < 3600
        ? `${Math.floor(timeSinceUpdate / 60)} นาทีที่แล้ว`
        : `${Math.floor(timeSinceUpdate / 3600)} ชั่วโมงที่แล้ว`;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200">
        <div className="text-lg font-semibold text-neutral-900">📦 การจัดส่ง</div>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`inline-block px-4 py-2 rounded-lg border font-semibold text-sm ${meta.color} border-2 ${meta.badge}`}>
            {meta.text}
          </div>
          <div className="text-xs text-neutral-500">{updateText}</div>
        </div>

        {/* Courier Info */}
        {job.status !== 'pending' && job.status !== 'cancelled' && (
          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2">ข้อมูลคนส่ง</div>
            <div className="flex flex-col gap-2">
              {job.courierName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">👤 {job.courierName}</span>
                </div>
              )}
              {job.courierPhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${job.courierPhone}`}
                    className="text-sm text-emerald-600 hover:underline font-medium"
                  >
                    ☎️ {job.courierPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Distance & Earning (if available) */}
        {job.distance || job.estimatedEarning ? (
          <div className="grid grid-cols-2 gap-3">
            {job.distance && (
              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                <div className="text-xs text-neutral-600">ระยะทาง</div>
                <div className="text-sm font-semibold text-neutral-900 mt-1">{job.distance} กม.</div>
              </div>
            )}
            {job.estimatedEarning && (
              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                <div className="text-xs text-neutral-600">ค่าจัดส่ง</div>
                <div className="text-sm font-semibold text-neutral-900 mt-1">฿{Number(job.estimatedEarning).toLocaleString()}</div>
              </div>
            )}
          </div>
        ) : null}

        {/* Addresses */}
        <div className="space-y-3">
          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2">📍 ต้นทาง (ร้าน)</div>
            <div className="text-sm text-neutral-900">{job.pickupAddress || '-'}</div>
          </div>

          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2">📍 ปลายทาง (ลูกค้า)</div>
            <div className="text-sm text-neutral-900">{job.deliveryAddress || '-'}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-3">เวลา</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">สร้างงาน:</span>
              <span className="font-medium text-neutral-900">{formatDateTime(job.createdAt)}</span>
            </div>
            {job.updatedAt && (
              <div className="flex justify-between">
                <span className="text-neutral-600">อัปเดตล่าสุด:</span>
                <span className="font-medium text-neutral-900">{formatDateTime(job.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
