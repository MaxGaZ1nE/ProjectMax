import { useDeliveryRegistration } from '@contexts/DeliveryRegistrationContext';
import { useState, useRef } from 'react';
import { deliveryAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

// ─── Thai National ID Checksum (Luhn-style mod-11) ───────────────────────────
function validateThaiIDChecksum(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false;
  if (digits[0] === '0') return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(digits[12]);
}

function formatThaiID(raw: string): string {
  const d = raw.replace(/\D/g, '').substring(0, 13);
  if (d.length <= 1) return d;
  if (d.length <= 5) return `${d[0]}-${d.slice(1)}`;
  if (d.length <= 10) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  if (d.length <= 12) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10)}`;
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d.slice(12)}`;
}

// ─── Image Upload Component ──────────────────────────────────────────────────
interface ImageUploadProps {
  id: string;
  label: string;
  preview: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  hint?: string;
}

function ImageUploadBox({ id, label, preview, onUpload, onClear, hint }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5 MB');
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-neutral-300">
          <img
            src={preview}
            alt={label}
            className="w-full max-h-52 object-contain bg-neutral-50"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-neutral-800 rounded-md hover:bg-neutral-100 transition"
            >
              เปลี่ยนรูป
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              ลบ
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            ✓ อัปโหลดแล้ว
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm font-medium text-neutral-700">คลิกหรือลากรูปมาวางที่นี่</p>
          <p className="text-xs text-neutral-400 mt-1">JPG, PNG · ขนาดสูงสุด 5 MB</p>
          {hint && <p className="text-xs text-neutral-500 mt-2 italic">{hint}</p>}
        </div>
      )}

      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DeliveryRegistrationStep2() {
  const { data, updateData, setStep } = useDeliveryRegistration();

  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(data.idCardFrontImage || null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(data.idCardBackImage || null);
  const [licensingPreview, setLicensingPreview] = useState<string | null>(data.drivingLicenseImage || null);
  const [ownershipPreview, setOwnershipPreview] = useState<string | null>(data.vehicleOwnershipImage || null);
  const [insurancePreview, setInsurancePreview] = useState<string | null>(data.insuranceImage || null);
  
  const [displayValue, setDisplayValue] = useState(
    data.idCardNumber ? formatThaiID(data.idCardNumber) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rawDigits = (data.idCardNumber ?? '').replace(/\D/g, '');
  const idCheckResult = (() => {
    if (rawDigits.length === 0) return null;
    if (rawDigits.length < 13) return { valid: false, msg: `กรอกให้ครบ 13 หลัก (ขณะนี้ ${rawDigits.length} หลัก)` };
    if (rawDigits[0] === '0') return { valid: false, msg: 'หลักแรกต้องไม่เป็น 0' };
    const ok = validateThaiIDChecksum(rawDigits);
    return {
      valid: ok,
      msg: ok ? '✓ เลขประจำตัวถูกต้อง' : '✗ เลขประจำตัวไม่ถูกต้อง',
    };
  })();

  const handleIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 13);
    setDisplayValue(formatThaiID(raw));
    updateData({ idCardNumber: raw });
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error('อ่านไฟล์ไม่สำเร็จ'));
      r.readAsDataURL(file);
    });

  const handleUpload = async (file: File, setPreview: (url: string) => void, dataKey: keyof typeof data) => {
    const url = await readFileAsDataURL(file);
    setPreview(url);
    updateData({ [dataKey]: url });
  };

  const allDone =
    idCheckResult?.valid &&
    idFrontPreview &&
    idBackPreview &&
    licensingPreview &&
    ownershipPreview &&
    insurancePreview &&
    (data.licensePlateNumber?.trim().length ?? 0) > 0 &&
    (data.vehicleType?.trim().length ?? 0) > 0;

  const handleNext = async () => {
    if (!allDone) {
      setSubmitError('กรุณากรอกข้อมูลและอัปโหลดเอกสารให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        idCardNumber: data.idCardNumber,
        idCardFrontImage: idFrontPreview,
        idCardBackImage: idBackPreview,
        drivingLicenseImage: licensingPreview,
        licensePlateNumber: data.licensePlateNumber,
        vehicleType: data.vehicleType,
        vehicleOwnershipImage: ownershipPreview,
        vehicleRegisteredName: data.vehicleRegisteredName || '',
        insuranceImage: insurancePreview,
      };

      const response = await deliveryAPI.registerStep2(payload);
      
      if ((response?.data as { success?: boolean })?.success) {
        setStep(3);
      } else {
        setSubmitError((response?.data as { message?: string })?.message || 'เกิดข้อผิดพลาดขณะบันทึก');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
      console.error('Step 2 error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 2 จาก 4</h2>
        <p className="text-neutral-600 mt-1">เอกสารและข้อมูลรถยนต์</p>
      </div>

      {/* ID Card Section */}
      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <span>🆔</span> บัตรประชาชน
        </h3>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            เลขประจำตัวประชาชน <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="1-2345-67890-12-3"
            value={displayValue}
            onChange={handleIDChange}
          />
          {idCheckResult && (
            <p className={`text-xs mt-1 ${idCheckResult.valid ? 'text-emerald-600' : 'text-red-600'}`}>
              {idCheckResult.msg}
            </p>
          )}
        </div>

        {/* ID Front */}
        <ImageUploadBox
          id="id-front"
          label="สำเนาบัตรประชาชนด้านหน้า"
          preview={idFrontPreview}
          onUpload={(file) => handleUpload(file, setIdFrontPreview, 'idCardFrontImage')}
          onClear={() => {
            setIdFrontPreview(null);
            updateData({ idCardFrontImage: undefined });
          }}
          hint="อัปโหลดรูปสำเนาบัตรด้านที่มีรูป"
        />

        {/* ID Back */}
        <ImageUploadBox
          id="id-back"
          label="สำเนาบัตรประชาชนด้านหลัง"
          preview={idBackPreview}
          onUpload={(file) => handleUpload(file, setIdBackPreview, 'idCardBackImage')}
          onClear={() => {
            setIdBackPreview(null);
            updateData({ idCardBackImage: undefined });
          }}
          hint="อัปโหลดรูปสำเนาบัตรด้านข้างหลัง"
        />
      </div>

      {/* Driving License */}
      <div className="space-y-4">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <span>🚗</span> ใบขับขี่
        </h3>
        <ImageUploadBox
          id="driving-license"
          label="สำเนาใบขับขี่"
          preview={licensingPreview}
          onUpload={(file) => handleUpload(file, setLicensingPreview, 'drivingLicenseImage')}
          onClear={() => {
            setLicensingPreview(null);
            updateData({ drivingLicenseImage: undefined });
          }}
          hint="อัปโหลดรูปสำเนาใบขับขี่"
        />
      </div>

      {/* Vehicle Info */}
      <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <span>📋</span> ข้อมูลรถยนต์
        </h3>

        {/* License Plate */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            เลขทะเบียนรถ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="เช่น กค-1234 ปทุมธานี"
            value={data.licensePlateNumber}
            onChange={(e) => updateData({ licensePlateNumber: e.target.value })}
            maxLength={20}
          />
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ประเภทรถ <span className="text-red-500">*</span>
          </label>
          <select
            className={inputClass}
            value={data.vehicleType || ''}
            onChange={(e) => updateData({ vehicleType: e.target.value })}
          >
            <option value="">-- เลือกประเภทรถ --</option>
            <option value="motorcycle">รถมอเตอร์ไซค์</option>
            <option value="car">รถยนต์ (สี่แฟร)ม</option>
            <option value="van">รถตู้</option>
            <option value="pickup">รถกระบะ</option>
            <option value="truck">รถบรรทุก</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </div>

        {/* Vehicle Registered Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ชื่อผู้ลงทะเบียน (ชื่อที่ปรากฏบนทะเบียน) (ไม่บังคับ)
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="เช่น สมชาย ใจดี"
            value={data.vehicleRegisteredName || ''}
            onChange={(e) => updateData({ vehicleRegisteredName: e.target.value })}
          />
        </div>
      </div>

      {/* Vehicle Ownership */}
      <div className="space-y-4">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <span>📄</span> หลักฐานความเป็นเจ้าของรถ
        </h3>
        <ImageUploadBox
          id="ownership"
          label="อัปโหลดหลักฐานความเป็นเจ้าของรถ"
          preview={ownershipPreview}
          onUpload={(file) => handleUpload(file, setOwnershipPreview, 'vehicleOwnershipImage')}
          onClear={() => {
            setOwnershipPreview(null);
            updateData({ vehicleOwnershipImage: undefined });
          }}
          hint="อัปโหลดรูปทะเบียน พ.ศ.ป. หรือสัญญาการให้เช่า"
        />
      </div>

      {/* Vehicle Insurance */}
      <div className="space-y-4">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <span>🛡️</span> ใบประกันรถ
        </h3>
        <ImageUploadBox
          id="insurance"
          label="อัปโหลดใบประกันรถที่ยังไม่หมดอายุ"
          preview={insurancePreview}
          onUpload={(file) => handleUpload(file, setInsurancePreview, 'insuranceImage')}
          onClear={() => {
            setInsurancePreview(null);
            updateData({ insuranceImage: undefined });
          }}
          hint="อัปโหลดรูปใบประกันภัย พ.ร.บ. หรือประกันสมัครใจ"
        />
      </div>

      {/* Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-6">
        <button
          className="flex-1 btn btn-neutral"
          onClick={() => (window.history.back())}
        >
          ย้อนกลับ
        </button>
        <button
          className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!allDone || isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'ถัดไป'}
        </button>
      </div>
    </div>
  );
}
