import { useAppSelector } from '@stores/index';
import { useSellerRegistration } from '@contexts/SellerRegistrationContext';
import { useEffect, useState } from 'react';
import { sellerAPI } from '@services/backend-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

export default function SellerRegistrationStep1() {
  const { data, updateData, setStep } = useSellerRegistration();
  const user = useAppSelector((s) => s.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with user data on first mount
  useEffect(() => {
    if (user && !data.ownerName) {
      const fn = (user?.firstName ?? '').trim();
      const ln = (user?.lastName ?? '').trim();
      const full = `${fn} ${ln}`.trim();
      const ownerName = full || (user?.name ?? '');
      
      updateData({
        ownerName,
        phone: user?.phone ?? '',
        addressLine: user?.address ?? '',
        province: user?.province ?? '',
        postalCode: user?.postalCode ?? '',
      });
    }
  }, [user, data.ownerName, updateData]);

  const canProceed = () => {
    return (
      data.shopName.trim().length >= 2 &&
      data.ownerName.trim().length >= 2 &&
      data.phone.trim().length >= 8 &&
      data.promptpayValue.trim().length >= 8
    );
  };

  const handleNext = async () => {
    if (!canProceed()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shopName: data.shopName.trim(),
        ownerName: data.ownerName.trim(),
        phone: data.phone.trim(),
        promptpayType: data.promptpayType,
        promptpayValue: data.promptpayValue.trim(),
        addressLine: data.addressLine?.trim() ?? '',
        province: data.province?.trim() ?? '',
        postalCode: data.postalCode?.trim() ?? '',
      };

      const response = await sellerAPI.registerStep1(payload);
      
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
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 1 จาก 4</h2>
        <p className="text-neutral-600 mt-1">ข้อมูลพื้นฐานร้านค้า</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ชื่อร้านค้า <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="เช่น ร้านผลไม้สดใหม่"
            value={data.shopName}
            onChange={(e) => updateData({ shopName: e.target.value })}
          />
          <p className="text-xs text-neutral-500 mt-1">
            ต้องมีอย่างน้อย 2 ตัวอักษร
          </p>
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ชื่อเจ้าของร้าน <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="ชื่อจริง นามสกุล"
            value={data.ownerName}
            onChange={(e) => updateData({ ownerName: e.target.value })}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            className={inputClass}
            placeholder="0851234567"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
          />
        </div>

        {/* Payment Method */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            วิธีการรับชำระเงิน <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {/* PromptPay Type Selection */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promptpay-type"
                  value="phone"
                  checked={data.promptpayType === 'phone'}
                  onChange={() => updateData({ promptpayType: 'phone' })}
                  className="w-4 h-4"
                />
                <span className="text-sm">เบอร์โทรศัพท์</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promptpay-type"
                  value="id"
                  checked={data.promptpayType === 'id'}
                  onChange={() => updateData({ promptpayType: 'id' })}
                  className="w-4 h-4"
                />
                <span className="text-sm">เลขประจำตัวประชาชน</span>
              </label>
            </div>

            {/* PromptPay Value Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-2">
                {data.promptpayType === 'phone'
                  ? 'เบอร์โทรศัพท์ PromptPay'
                  : 'เลขประจำตัวประชาชน PromptPay'}
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder={
                  data.promptpayType === 'phone' ? '0851234567' : '1234567890123'
                }
                value={data.promptpayValue}
                onChange={(e) => updateData({ promptpayValue: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            ข้อมูลที่อยู่ (ตัวเลือก)
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                ที่อยู่
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="เลขที่ ซอย ถนน..."
                value={data.addressLine}
                onChange={(e) => updateData({ addressLine: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  จังหวัด
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="เช่น กรุงเทพฯ"
                  value={data.province}
                  onChange={(e) => updateData({ province: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="10110"
                  value={data.postalCode}
                  onChange={(e) => updateData({ postalCode: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Box */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900">
          ✓ ข้อมูลนี้จะเป็นที่แสดงบนร้านค้าของคุณ
          <br />
          ✓ คุณสามารถแก้ไขได้ในภายหลัง
        </p>
      </div>

      {/* Next Button */}
      <div className="flex gap-3 pt-2 border-t border-neutral-200">
        <button
          type="button"
          className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-400 bg-neutral-50 rounded-lg cursor-not-allowed"
          disabled
        >
          ← ย้อนกลับ
        </button>

        <button
          type="button"
          className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2 ${
            canProceed() && !isSubmitting
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-neutral-300 cursor-not-allowed'
          }`}
          disabled={!canProceed() || isSubmitting}
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