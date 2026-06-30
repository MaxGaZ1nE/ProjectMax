import { useState, useEffect } from 'react';
import { deliveryJobAPI } from '@services/api';
import type { DeliveryJob } from '@services/api/delivery-api';

const deliveryStatusMeta = (status: DeliveryJob['status']) => {
  switch (status) {
    case 'pending':
      return { icon: '⏳', text: 'รอรับสินค้า', color: 'bg-yellow-100 text-yellow-800' };
    case 'accepted':
      return { icon: '✅', text: 'รับงานแล้ว', color: 'bg-blue-100 text-blue-800' };
    case 'picked_up':
      return { icon: '📦', text: 'รับสินค้าแล้ว', color: 'bg-orange-100 text-orange-800' };
    case 'in_delivery':
      return { icon: '🚚', text: 'กำลังส่ง', color: 'bg-indigo-100 text-indigo-800' };
    case 'delivered':
      return { icon: '✨', text: 'ส่งสำเร็จ', color: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { icon: '❌', text: 'ยกเลิก', color: 'bg-red-100 text-red-800' };
    default:
      return { icon: '❓', text: status, color: 'bg-neutral-100 text-neutral-800' };
  }
};

export function SellerDeliveryStatusCard({
  orderId,
  onCancelJob,
}: {
  orderId: string;
  onCancelJob?: (jobId: string) => Promise<void>;
}) {
  const [job, setJob] = useState<DeliveryJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await deliveryJobAPI.getJobByOrderId(orderId);
        setJob(data);
      } catch (err) {
        console.warn('Failed to fetch delivery job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [orderId]);

  if (loading || !job) return null;

  const meta = deliveryStatusMeta(job.status);
  const canCancel = job.status === 'pending' || job.status === 'accepted';

  const handleCancelJob = async () => {
    if (!canCancel) return;

    try {
      setCancelling(true);
      await deliveryJobAPI.cancelJob(job.id, 'ยกเลิกโดยผู้ขาย');
      await onCancelJob?.(job.id);
    } catch (err) {
      console.error('Failed to cancel job:', err);
      alert('ไม่สามารถยกเลิกงานได้');
    } finally {
      setCancelling(false);
    }
  };

  // Timeline steps
  const steps = [
    { status: 'pending', icon: '⏳', label: 'รอรับสินค้า' },
    { status: 'accepted', icon: '✅', label: 'รับงาน' },
    { status: 'picked_up', icon: '📦', label: 'รับสินค้า' },
    { status: 'in_delivery', icon: '🚚', label: 'กำลังส่ง' },
    { status: 'delivered', icon: '✨', label: 'ส่งสำเร็จ' },
  ];

  const getStepState = (stepStatus: string) => {
    const statusOrder = ['pending', 'accepted', 'picked_up', 'in_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(job.status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'todo';
  };

  const dotClass = (state: 'done' | 'active' | 'todo') => {
    if (state === 'done') return 'bg-emerald-600';
    if (state === 'active') return 'bg-amber-500';
    return 'bg-neutral-300';
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold text-neutral-900 mb-3">📍 สถานะการจัดส่ง</div>

        {/* Current Status Badge */}
        <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${meta.color}`}>
          {meta.icon} {meta.text}
        </div>
      </div>

      {/* Courier Info */}
      {job.status !== 'pending' && job.status !== 'cancelled' && (
        <div className="mb-4 rounded-lg bg-neutral-50 p-3 border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-2">ข้อมูลคนส่ง</div>
          <div className="flex items-center justify-between">
            <div>
              {job.courierName && (
                <div className="text-sm font-medium text-neutral-900">👤 {job.courierName}</div>
              )}
              {job.courierPhone && (
                <a
                  href={`tel:${job.courierPhone}`}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  ☎️ {job.courierPhone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-4">
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const state = getStepState(step.status);
            return (
              <div key={step.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotClass(state)}`} />
                  {idx !== steps.length - 1 && <div className="w-px h-6 bg-neutral-200 mt-1" />}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-medium ${
                      state === 'done'
                        ? 'text-emerald-700'
                        : state === 'active'
                          ? 'text-amber-700'
                          : 'text-neutral-400'
                    }`}
                  >
                    {step.icon} {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancelJob}
            disabled={cancelling}
            className={[
              'text-xs px-3 py-2 rounded-lg border',
              cancelling
                ? 'border-neutral-100 text-neutral-300 cursor-not-allowed'
                : 'border-red-200 text-red-600 hover:bg-red-50',
            ].join(' ')}
          >
            {cancelling ? '⏳ กำลังยกเลิก...' : '❌ ยกเลิก Job'}
          </button>
        </div>
      )}
    </div>
  );
}
