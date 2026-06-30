import { useSellerRegistration } from '@contexts/SellerRegistrationContext';
import { useState } from 'react';
import { sellerAPI } from '@services/backend-api';

// ✅ FIX: Thai ID checksum (same util, kept local to avoid circular import)
function validateThaiIDChecksum(digits: string): boolean {
  if (!/^\d{13}$/.test(digits) || digits[0] === '0') return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === parseInt(digits[12]);
}

function maskIDCard(id: string | undefined): string {
  if (!id || id.length < 13) return id ?? '';
  const d = id.replace(/\D/g, '');
  return `${d[0]}-****-*****-${d.slice(10, 12)}-${d[12]}`;
}

export default function SellerRegistrationStep4() {
  const { data, updateData, setStep } = useSellerRegistration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation guard ────────────────────────────────────────────────────────
  const validateBeforeSubmit = (): string | null => {
    if (!data.shopName?.trim()) return 'กรุณากรอกชื่อร้านค้า';
    if (!data.ownerName?.trim()) return 'กรุณากรอกชื่อเจ้าของร้าน';
    if (!data.phone?.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
    if (!data.promptpayValue?.trim()) return 'กรุณากรอก PromptPay';
    if (!data.latitude || !data.longitude) {
      return 'กรุณาปักหมุดตำแหน่งร้านค้าให้ครบถ้วน (ต้องมีพิกัด Lat/Lng) — ขั้นตอน 2';
    }
    if (!data.idCardNumber || !validateThaiIDChecksum(data.idCardNumber)) {
      return 'เลขประจำตัวประชาชนไม่ถูกต้อง (ขั้นตอน 3)';
    }
    if (!data.idCardFrontImage) return 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหน้า (ขั้นตอน 3)';
    if (!data.idCardBackImage) return 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหลัง (ขั้นตอน 3)';
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
      // 1. Save Step 1
      await sellerAPI.registerStep1({
        shopName: data.shopName,
        ownerName: data.ownerName,
        phone: data.phone,
        promptpayType: data.promptpayType,
        promptpayValue: data.promptpayValue,
        addressLine: data.addressLine ?? '',
        province: data.province ?? '',
        postalCode: data.postalCode ?? '',
      });

      // 2. Save Step 2
      await sellerAPI.registerStep2({
        latitude: data.latitude,
        longitude: data.longitude,
        mapAddress: data.mapAddress ?? '',
      });

      // 3. Save Step 3
      await sellerAPI.registerStep3({
        idCardNumber: data.idCardNumber,
        idCardFrontImage: data.idCardFrontImage,
        idCardBackImage: data.idCardBackImage,
      });

      // 4. Finally submit for approval
      const response = await sellerAPI.submitRegistration();

      if ((response?.data as { success?: boolean })?.success) {
        // Update Redux seller state
        updateData({ pendingApproval: true, submittedAt: new Date().toISOString() });
        // Go to Step 5 (PendingApproval)
        setStep(5);
      } else {
        setError((response?.data as { message?: string })?.message || 'เกิดข้อผิดพลาดขณะส่งคำขอ');
      }
    } catch (err: any) {
      console.error('Registration submit error:', err);

      // 409 Conflict: Already registered as a seller
      if (err.response?.status === 409) {
        window.location.href = '/seller';
        return;
      }

      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'การส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setError(msg);
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
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 4 จาก 4</h2>
        <p className="text-neutral-600 mt-1">ตรวจสอบข้อมูลและส่งการขอ</p>
      </div>

      {/* Summary */}
      <SectionCard title="📋 ข้อมูลพื้นฐานร้านค้า">
        <Row label="ชื่อร้านค้า" value={data.shopName} />
        <Row label="ชื่อเจ้าของ" value={data.ownerName} />
        <Row label="เบอร์โทร" value={data.phone} />
        <Row
          label="PromptPay"
          value={`${data.promptpayType === 'phone' ? '📱' : '🆔'} ${data.promptpayValue}`}
        />
        {data.addressLine && <Row label="ที่อยู่" value={data.addressLine} />}
        {data.province && <Row label="จังหวัด" value={data.province} />}
        {data.postalCode && <Row label="รหัสไปรษณีย์" value={data.postalCode} />}
      </SectionCard>

      <SectionCard title="📍 ตำแหน่งร้านค้า">
        <Row label="ที่อยู่แผนที่" value={data.mapAddress || '(ไม่ได้ระบุ)'} />
        {data.latitude && data.longitude && (
          <Row
            label="พิกัด GPS"
            value={`${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`}
          />
        )}
      </SectionCard>

      <SectionCard title="🆔 ยืนยันตัวตน">
        <Row label="เลขบัตรประชาชน" value={maskIDCard(data.idCardNumber)} />
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">📋 หมายเหตุและข้อมูลสำคัญ</p>
        <ul className="text-xs text-blue-800 space-y-1.5">
          <li className="flex gap-2">
            <span>✓</span>
            <span>ข้อมูลจะถูกส่งให้ Admin ตรวจสอบทันที</span>
          </li>
          <li className="flex gap-2">
            <span>⏳</span>
            <span>ใช้เวลา 1–3 วันทำการในการตรวจสอบ</span>
          </li>
          <li className="flex gap-2">
            <span>📧</span>
            <span>ระบบจะส่งอีเมลแจ้งเตือนเมื่ออนุมัติหรือปฏิเสธ</span>
          </li>
          <li className="flex gap-2">
            <span>🔒</span>
            <span>ข้อมูลบัตรประชาชนจะถูกเข้ารหัสและลบหลังตรวจสอบ</span>
          </li>
          <li className="flex gap-2">
            <span>🚫</span>
            <span>ไม่สามารถแก้ไขข้อมูลได้หลังส่งคำขอ</span>
          </li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition disabled:opacity-50"
          disabled={isSubmitting}
          onClick={() => window.history.back()}
        >
          ← ย้อนกลับ
        </button>

        <button
          type="button"
          className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              กำลังส่ง...
            </>
          ) : (
            '✓ ยืนยันและส่งการขอ'
          )}
        </button>
      </div>
    </div>
  );
}