import { useSellerRegistration } from '@contexts/SellerRegistrationContext';
import { useState, useRef } from 'react';
import { sellerAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

// ─── Thai National ID Checksum (Luhn-style mod-11) ───────────────────────────
function validateThaiIDChecksum(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false;

  // First digit must NOT be 0
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
}

function ImageUploadBox({ id, label, preview, onUpload, onClear }: ImageUploadProps) {
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
          // Reset so same file can be re-selected
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SellerRegistrationStep3() {
  const { data, updateData, setStep } = useSellerRegistration();

  const [frontPreview, setFrontPreview] = useState<string | null>(data.idCardFrontImage || null);
  const [backPreview, setBackPreview] = useState<string | null>(data.idCardBackImage || null);
  const [displayValue, setDisplayValue] = useState(
    data.idCardNumber ? formatThaiID(data.idCardNumber) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Derived validation state
  const rawDigits = (data.idCardNumber ?? '').replace(/\D/g, '');
  const idCheckResult = (() => {
    if (rawDigits.length === 0) return null;
    if (rawDigits.length < 13) return { valid: false, msg: `กรอกให้ครบ 13 หลัก (ขณะนี้ ${rawDigits.length} หลัก)` };
    if (rawDigits[0] === '0') return { valid: false, msg: 'หลักแรกต้องไม่เป็น 0' };
    const ok = validateThaiIDChecksum(rawDigits);
    return {
      valid: ok,
      msg: ok ? '✓ เลขประจำตัวถูกต้อง (ผ่าน Checksum)' : '✗ เลขประจำตัวไม่ถูกต้อง — กรุณาตรวจสอบอีกครั้ง',
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

  const handleFrontUpload = async (file: File) => {
    const url = await readFileAsDataURL(file);
    setFrontPreview(url);
    updateData({ idCardFrontImage: url });
  };

  const handleBackUpload = async (file: File) => {
    const url = await readFileAsDataURL(file);
    setBackPreview(url);
    updateData({ idCardBackImage: url });
  };

  const allDone = idCheckResult?.valid && frontPreview && backPreview;

  const handleNext = async () => {
    if (!allDone) {
      setSubmitError('กรุณาให้ครบทั้ง: เลขประจำตัว บัตรหน้า และบัตรหลัง');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        idCardNumber: data.idCardNumber,
        idCardFrontImage: frontPreview,
        idCardBackImage: backPreview,
      };

      const response = await sellerAPI.registerStep3(payload);
      
      if ((response?.data as { success?: boolean })?.success) {
        setStep(4);
      } else {
        setSubmitError((response?.data as { message?: string })?.message || 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
      console.error('Step 3 error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 3 จาก 4</h2>
        <p className="text-neutral-600 mt-1">ยืนยันตัวตนด้วยบัตรประชาชน</p>
      </div>

      {/* ID Card Number */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          เลขประจำตัวประชาชน <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          inputMode="numeric"
          className={`${inputClass} font-mono tracking-widest ${
            idCheckResult
              ? idCheckResult.valid
                ? 'border-emerald-400 ring-2 ring-emerald-100'
                : 'border-red-400 ring-2 ring-red-100'
              : ''
          }`}
          placeholder="0-0000-00000-00-0"
          value={displayValue}
          onChange={handleIDChange}
          maxLength={17} // 13 digits + 4 hyphens
          autoComplete="off"
        />

        {idCheckResult && (
          <p
            className={`text-xs mt-1.5 font-medium ${
              idCheckResult.valid ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {idCheckResult.msg}
          </p>
        )}

        <p className="text-xs text-neutral-400 mt-1">
          รูปแบบ: 0-0000-00000-00-0 · ตรวจสอบด้วย Thai ID Checksum อัตโนมัติ
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 leading-relaxed">
          🔒 ข้อมูลบัตรประชาชนจะถูก <strong>เข้ารหัส AES-256</strong> และส่งผ่าน HTTPS ·
          ใช้เพื่อตรวจสอบตัวตนเท่านั้น · ลบออกหลังได้รับการอนุมัติ
        </p>
      </div>

      {/* Image uploads */}
      <ImageUploadBox
        id="id-card-front"
        label="รูปบัตรประชาชนด้านหน้า"
        preview={frontPreview}
        onUpload={handleFrontUpload}
        onClear={() => {
          setFrontPreview(null);
          updateData({ idCardFrontImage: '' });
        }}
      />

      <ImageUploadBox
        id="id-card-back"
        label="รูปบัตรประชาชนด้านหลัง"
        preview={backPreview}
        onUpload={handleBackUpload}
        onClear={() => {
          setBackPreview(null);
          updateData({ idCardBackImage: '' });
        }}
      />

      {/* Checklist */}
      <div
        className={`border rounded-lg p-4 space-y-2 transition-colors ${
          allDone
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className={`text-sm font-medium ${allDone ? 'text-emerald-900' : 'text-amber-900'}`}>
          {allDone ? '✅ พร้อมดำเนินการต่อ' : '🔍 สถานะการตรวจสอบ'}
        </p>
        <div className="space-y-1.5 text-xs">
          {[
            {
              done: idCheckResult?.valid === true,
              text: idCheckResult?.valid
                ? 'เลขประจำตัวผ่าน Checksum'
                : 'รอตรวจสอบเลขประจำตัว',
            },
            {
              done: !!frontPreview,
              text: frontPreview ? 'อัปโหลดรูปบัตรหน้าแล้ว' : 'รออัปโหลดรูปบัตรหน้า',
            },
            {
              done: !!backPreview,
              text: backPreview ? 'อัปโหลดรูปบัตรหลังแล้ว' : 'รออัปโหลดรูปบัตรหลัง',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 ${
                item.done ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span>{item.done ? '✓' : '○'}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photo tips */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <p className="text-xs font-medium text-neutral-700 mb-2">📌 คำแนะนำการถ่ายรูปบัตร</p>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• ถ่ายในที่แสงสว่างเพียงพอ ไม่มีแสงสะท้อน</li>
          <li>• วางบัตรบนพื้นเรียบ ถ่ายให้เห็นครบทั้งใบ</li>
          <li>• ข้อความบนบัตรต้องอ่านได้ชัดเจน</li>
          <li>• ไม่ปิดบังข้อมูลหรือรูปถ่ายบนบัตร</li>
        </ul>
      </div>

      {/* Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {submitError}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2 border-t border-neutral-200">
        <button
          type="button"
          className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition disabled:opacity-50"
          disabled={isSubmitting}
          onClick={() => setStep(2)}
        >
          ← ย้อนกลับ
        </button>

        <button
          type="button"
          className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2 ${
            allDone && !isSubmitting
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-neutral-300 cursor-not-allowed'
          }`}
          disabled={!allDone || isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            'ถัดไป →'
          )}
        </button>
      </div>
    </div>
  );
}