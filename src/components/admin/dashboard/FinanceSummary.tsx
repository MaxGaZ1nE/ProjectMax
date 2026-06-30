interface FinanceSummaryProps {
  pendingSeller: number;
  pendingRider: number;
  transferredToday: number;
}

export default function FinanceSummary({ pendingSeller, pendingRider, transferredToday }: FinanceSummaryProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-neutral-100">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">💰 สรุปการเงิน & การโอน</h3>
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-amber-800">รอโอนให้ร้านค้า (Pending Seller Payout)</div>
            <div className="text-xs text-amber-600 mt-1">เงินที่ต้องโอนให้ Seller หลังหัก GP</div>
          </div>
          <div className="text-xl font-bold text-amber-700">฿{pendingSeller.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-blue-800">รอโอนให้ไรเดอร์ (Pending Rider Payout)</div>
            <div className="text-xs text-blue-600 mt-1">เงินค่าจัดส่งที่ต้องโอนให้คนขับ</div>
          </div>
          <div className="text-xl font-bold text-blue-700">฿{pendingRider.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-emerald-800">โอนแล้ววันนี้ (Transferred Today)</div>
            <div className="text-xs text-emerald-600 mt-1">ยอดรวมที่โอนสำเร็จในวันนี้</div>
          </div>
          <div className="text-xl font-bold text-emerald-700">฿{transferredToday.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
