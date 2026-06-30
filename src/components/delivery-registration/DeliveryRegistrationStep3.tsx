import { useDeliveryRegistration } from '@contexts/DeliveryRegistrationContext';
import { useState } from 'react';
import { deliveryAPI } from '@services/backend-api';

function maskIDCard(id: string | undefined): string {
  if (!id || id.length < 13) return id ?? '';
  const d = id.replace(/\D/g, '');
  return `${d[0]}-****-*****-${d.slice(10, 12)}-${d[12]}`;
}

export default function DeliveryRegistrationStep3() {
  const { data, updateData, setStep } = useDeliveryRegistration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateBeforeSubmit = (): string | null => {
    if (!data.fullName?.trim()) return 'กรุณากรอกชื่อ-นามสกุล';
    if (!data.phone?.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
    if (!data.email?.trim()) return 'กรุณากรอกอีเมล';
    if (!data.idCardNumber) return 'เลขประจำตัวประชาชนไม่ถูกต้อง (ขั้นตอน 2)';
    if (!data.idCardFrontImage) return 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหน้า (ขั้นตอน 2)';
    if (!data.idCardBackImage) return 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหลัง (ขั้นตอน 2)';
    if (!data.drivingLicenseImage) return 'กรุณาอัปโหลดรูปใบขับขี่ (ขั้นตอน 2)';
    if (!data.licensePlateNumber) return 'กรุณาระบุเลขทะเบียนรถ (ขั้นตอน 2)';
    if (!data.vehicleType) return 'กรุณาเลือกประเภทรถ (ขั้นตอน 2)';
    if (!data.vehicleOwnershipImage) return 'กรุณาอัปโหลดหลักฐานความเป็นเจ้าของรถ (ขั้นตอน 2)';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await deliveryAPI.submitRegistration();

      if ((response?.data as { success?: boolean })?.success) {
        updateData({ pendingApproval: true, submittedAt: new Date().toISOString() });
        setStep(4);
      } else {
        setError((response?.data as { message?: string })?.message || 'เกิดข้อผิดพลาดขณะส่งคำขอ');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'การส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setError(msg);
      console.error('Registration submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between items-start gap-2 text-sm py-1">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-medium text-neutral-900 text-right">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 3 จาก 3</h2>
        <p className="text-neutral-600 mt-1">ตรวจสอบข้อมูลและส่งการขอ</p>
      </div>

      {/* Summary */}
      <SectionCard title="👤 ข้อมูลส่วนตัว">
        <Row label="ชื่อ-นามสกุล" value={data.fullName} />
        <Row label="เบอร์โทรศัพท์" value={data.phone} />
        <Row label="อีเมล" value={data.email} />
      </SectionCard>

      <SectionCard title="🆔 เอกสารประจำตัว">
        <Row label="เลขประจำตัวประชาชน" value={maskIDCard(data.idCardNumber)} />
        <div className="grid grid-cols-2 gap-3 mt-2">
          {data.idCardFrontImage && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">บัตรด้านหน้า</p>
              <img
                src={data.idCardFrontImage}
                alt="ID Front"
                className="w-full max-h-36 object-contain rounded border border-neutral-200 bg-neutral-50"
              />
            </div>
          )}
          {data.idCardBackImage && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">บัตรด้านหลัง</p>
              <img
                src={data.idCardBackImage}
                alt="ID Back"
                className="w-full max-h-36 object-contain rounded border border-neutral-200 bg-neutral-50"
              />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="🚗 ใบขับขี่">
        {data.drivingLicenseImage && (
          <div>
            <img
              src={data.drivingLicenseImage}
              alt="Driving License"
              className="w-full max-h-40 object-contain rounded border border-neutral-200 bg-neutral-50"
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="📋 ข้อมูลรถยนต์">
        <Row label="เลขทะเบียนรถ" value={data.licensePlateNumber} />
        <Row label="ประเภทรถ" value={data.vehicleType} />
        {data.vehicleRegisteredName && <Row label="ชื่อผู้ลงทะเบียน" value={data.vehicleRegisteredName} />}
      </SectionCard>

      <SectionCard title="📄 หลักฐานความเป็นเจ้าของรถ">
        {data.vehicleOwnershipImage && (
          <div>
            <img
              src={data.vehicleOwnershipImage}
              alt="Vehicle Ownership"
              className="w-full max-h-40 object-contain rounded border border-neutral-200 bg-neutral-50"
            />
          </div>
        )}
      </SectionCard>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">📋 หมายเหตุและข้อมูลสำคัญ</p>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>ตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนส่งคำขอ</li>
          <li>ทีมงานจะตรวจสอบและติดต่อคุณภายใน 1-3 วันทำการ</li>
          <li>หากมีข้อสงสัยหรือต้องการแก้ไข สามารถติดต่อเราได้ทุกเวลา</li>
          <li>การยอมรับเงื่อนไขนี้ถือว่าคุณยอมรับข้อตกลงการให้บริการ</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6">
        <button
          className="flex-1 btn btn-neutral"
          onClick={() => (window.history.back())}
          disabled={isSubmitting}
        >
          ย้อนกลับ
        </button>
        <button
          className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
        </button>
      </div>
    </div>
  );
}
