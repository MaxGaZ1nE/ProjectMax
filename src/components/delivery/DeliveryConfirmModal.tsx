import React, { useState, useRef } from 'react';
import { Modal } from '@/components/core/modal';
import SignaturePad from './SignaturePad';
import { orderAPI } from '@/services/backend-api';
import { useAppDispatch } from '@/stores/index';
import { pushNotification } from '@/slices/notification-slice';

interface CourierJob {
  id: string;
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  packageDescription: string;
}

interface DeliveryConfirmModalProps {
  isOpen: boolean;
  job: CourierJob | null;
  courierId: string;
  courierName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeliveryConfirmModal({
  isOpen,
  job,
  courierId,
  courierName,
  onClose,
  onSuccess,
}: DeliveryConfirmModalProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [signatureBase64, setSignatureBase64] = useState<string>('');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!job) return null;

  const handleSignatureSave = (base64: string) => {
    setSignatureBase64(base64);
    setErrors((prev) => ({ ...prev, signature: '' }));
  };

  const handleTakePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      setPhotos((prev) => [...prev, { file, preview }]);
      setErrors((prev) => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);

    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      setPhotos((prev) => [...prev, { file, preview }]);
      setErrors((prev) => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!signatureBase64) {
      newErrors.signature = 'กรุณาวาดลายเซ็น';
    }

    if (photos.length === 0) {
      newErrors.photo = 'กรุณาถ่ายรูปหลักฐานอย่างน้อย 1 ภาพ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // For now, use the first photo as delivery_photo
      // In production, you might want to upload all photos
      const deliveryPhotoBase64 = photos[0].preview;

      await orderAPI.confirmDelivery(
        job.orderId,
        signatureBase64,
        deliveryPhotoBase64,
        courierId,
        courierName
      );

      dispatch(
        pushNotification({
          type: 'success',
          title: '✅ ยืนยันการส่งสำเร็จ',
          message: `Order ${job.orderId} ได้รับการยืนยันแล้ว`,
        })
      );

      // Reset form
      setSignatureBase64('');
      setPhotos([]);
      setErrors({});

      // Close modal and trigger refresh
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ ยืนยันการส่งไม่สำเร็จ',
          message: error?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = signatureBase64 && photos.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="ยืนยันการส่ง" showCloseButton={true}>
      <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Order Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-bold text-neutral-800 mb-2">📋 สรุปรายละเอียดออเดอร์</h3>
          <div className="space-y-1 text-sm text-neutral-700">
            <p>
              <strong>Order ID:</strong> {job.orderId}
            </p>
            <p>
              <strong>ผู้รับ:</strong> {job.buyerName}
            </p>
            <p>
              <strong>เบอร์:</strong> {job.buyerPhone}
            </p>
            <p>
              <strong>ที่อยู่:</strong> {job.deliveryAddress}
            </p>
            <p>
              <strong>รายการ:</strong> {job.packageDescription}
            </p>
          </div>
        </div>

        {/* Section 1: Signature */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-800">📝 ส่วนที่ 1: ลายเซ็นผู้รับ</h3>
          <SignaturePad onSave={handleSignatureSave} />
          {errors.signature && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
              ⚠️ {errors.signature}
            </div>
          )}
          {signatureBase64 && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded border border-green-200">
              ✅ บันทึกลายเซ็นแล้ว
            </div>
          )}
        </div>

        {/* Section 2: Photo Evidence */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-800">📸 ส่วนที่ 2: รูปหลักฐานการส่ง</h3>

          {/* Photo Upload Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              📷 ถ่ายรูป
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2.5 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
            >
              📁 อัปโหลดรูป
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleTakePhoto}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
            className="hidden"
          />

          {errors.photo && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
              ⚠️ {errors.photo}
            </div>
          )}

          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">
                รูปที่ถ่าย ({photos.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`evidence-${idx}`}
                      className="w-full h-24 object-cover rounded-lg border border-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ลบรูป"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 text-neutral-700 rounded-lg font-medium transition-colors"
          >
            ❌ ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="flex-1 px-4 py-2.5 bg-[#1a6e40] hover:bg-[#166534] disabled:bg-neutral-300 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? '⏳ กำลังบันทึก...' : '✅ ยืนยันรับของ'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
