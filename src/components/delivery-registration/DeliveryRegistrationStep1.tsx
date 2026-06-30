import { useAppSelector } from '@stores/index';
import { useDeliveryRegistration } from '@contexts/DeliveryRegistrationContext';
import { useEffect, useState } from 'react';
import { deliveryAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

export default function DeliveryRegistrationStep1() {
  const { data, updateData, setStep } = useDeliveryRegistration();
  const user = useAppSelector((s) => s.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with user data on first mount
  useEffect(() => {
    if (user && !data.fullName) {
      const fn = (user?.firstName ?? '').trim();
      const ln = (user?.lastName ?? '').trim();
      const full = `${fn} ${ln}`.trim();
      const fullName = full || (user?.name ?? '');
      
      updateData({
        fullName,
        phone: user?.phone ?? '',
        email: user?.email ?? '',
      });
    }
  }, [user, data.fullName, updateData]);

  const canProceed = () => {
    return (
      data.fullName.trim().length >= 2 &&
      data.phone.trim().length >= 8 &&
      data.email.trim().length >= 5 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    );
  };

  const handleNext = async () => {
    if (!canProceed()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
      };

      const response = await deliveryAPI.registerStep1(payload);
      
      if ((response?.data as { success?: boolean })?.success) {
        setStep(2);
      } else {
        setError((response?.data as { message?: string })?.message || 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setError(msg);
      console.error('Step 1 error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 1 จาก 3</h2>
        <p className="text-neutral-600 mt-1">ข้อมูลส่วนตัว</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="เช่น สมชาย ใจดี"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
          />
          <p className="text-xs text-neutral-500 mt-1">
            ต้องมีอย่างน้อย 2 ตัวอักษร
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            className={inputClass}
            placeholder="เช่น 0812345678"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value.replace(/\D/g, '').slice(0, 20) })}
          />
          <p className="text-xs text-neutral-500 mt-1">
            ต้องมีอย่างน้อย 8 หลัก
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className={inputClass}
            placeholder="เช่น somchai@example.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
          <p className="text-xs text-neutral-500 mt-1">
            ต้องเป็นอีเมลที่ถูกต้อง
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-6">
        <button
          className="flex-1 btn btn-neutral"
          onClick={() => (window.history.back())}
        >
          ยกเลิก
        </button>
        <button
          className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canProceed() || isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'ถัดไป'}
        </button>
      </div>
    </div>
  );
}
