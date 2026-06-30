import React, { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { reviewAPI } from '@/services/backend-api';
import { pushNotification } from '@/slices/notification-slice';
import type { OrderItem } from '@/slices/order-slice';

type Props = {
  orderId: string;
  shopId: number;
  item: OrderItem;
  onClose: () => void;
};

// ✅ helper — ต้องตรงกับที่ OrdersPage ใช้เช็ค reviewed
function makeProductKey(item: OrderItem): string {
  const sellerProductId = (item as any)?.sellerProductId as string | undefined;
  if (sellerProductId && String(sellerProductId).trim()) {
    return `seller:${String(sellerProductId)}`;
  }
  return `base:${Number((item as any).id)}`;
}

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className={`text-3xl transition ${
            s <= (hover || value) ? 'text-orange-400' : 'text-neutral-300'
          }`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-neutral-500 self-center">
        {['', 'แย่มาก', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'][hover || value]}
      </span>
    </div>
  );
};

export default function ReviewModal({ orderId, shopId, item, onClose }: Props) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s: any) => s.auth.user);

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [qualityText, setQualityText] = useState('');
  const [tasteText, setTasteText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!body.trim()) return;
    if (loading) return;

    setLoading(true);
    try {
      const productId = Number((item as any).id);
      await reviewAPI.submitReview(
        orderId,
        productId,
        rating,
        body.trim(),
        qualityText.trim() || undefined,
        tasteText.trim() || undefined
      );

      dispatch(
        pushNotification({
          type: 'system',
          title: '⭐ ขอบคุณสำหรับรีวิว!',
          message: `รีวิว "${(item as any).name}" สำเร็จแล้ว`,
        })
      );

      onClose();
    } catch (error: any) {
      console.error('Submit review error:', error);
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ ส่งรีวิวไม่สำเร็จ',
          message: error?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">⭐ รีวิวสินค้า</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
          <img
            src={(item as any).image ?? '/no-image.png'}
            alt={(item as any).name}
            className="h-14 w-14 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium text-sm text-neutral-900 line-clamp-2">{(item as any).name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">น้ำหนัก: {item.weight} กก.</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">
            คะแนนรวม <span className="text-red-500">*</span>
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-neutral-500 mb-1">คุณภาพ</p>
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="เช่น สดใหม่ คุณภาพดี"
              value={qualityText}
              onChange={(e) => setQualityText(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">รสชาติ</p>
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="เช่น หวานหอม อร่อย"
              value={tasteText}
              onChange={(e) => setTasteText(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            ความคิดเห็น <span className="text-red-500">*</span>
          </p>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 resize-none"
            placeholder="แชร์ประสบการณ์การซื้อสินค้านี้..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <p className="text-xs text-neutral-400 mt-0.5 text-right">{body.length} ตัวอักษร</p>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-1">แนบรูปภาพ (ถ้ามี)</p>
          {imageBase64 ? (
            <div className="relative inline-block">
              <img src={imageBase64} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-neutral-200" />
              <button
                type="button"
                onClick={() => setImageBase64(undefined)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs leading-none"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 rounded-lg px-6 py-3 text-sm text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition"
            >
              📷 เพิ่มรูปภาพ
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim() || loading}
            className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ กำลังส่ง...' : 'ส่งรีวิว ⭐'}
          </button>
        </div>
      </div>
    </div>
  );
}