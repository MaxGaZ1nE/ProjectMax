import React from 'react';
import { Modal } from '@/components/core/modal';

interface PODViewModalProps {
  isOpen: boolean;
  signatureImage?: string;
  deliveryPhoto?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  onClose: () => void;
}

export default function PODViewModal({
  isOpen,
  signatureImage,
  deliveryPhoto,
  confirmedAt,
  confirmedBy,
  onClose,
}: PODViewModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="หลักฐานการรับสินค้า" showCloseButton={true}>
      <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Metadata */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
          <p className="text-sm">
            <strong>✅ เซ็นรับแล้ว:</strong> {confirmedBy}
          </p>
          <p className="text-sm">
            <strong>🕐 เวลา:</strong> {formatDate(confirmedAt)}
          </p>
        </div>

        {/* Signature Image */}
        {signatureImage && (
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-800">📝 ลายเซ็นผู้รับ</h3>
            <img
              src={signatureImage}
              alt="signature"
              className="w-full border-2 border-neutral-300 rounded-lg bg-white p-2"
            />
          </div>
        )}

        {/* Delivery Photo */}
        {deliveryPhoto && (
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-800">📸 รูปหลักฐานการส่ง</h3>
            <img
              src={deliveryPhoto}
              alt="delivery evidence"
              className="w-full border-2 border-neutral-300 rounded-lg"
            />
          </div>
        )}

        {/* Close Button */}
        <div className="pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-medium transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
}
