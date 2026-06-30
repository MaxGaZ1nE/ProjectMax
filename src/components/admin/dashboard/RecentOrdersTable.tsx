interface RecentOrder {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
  time: string;
}

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-600 border border-amber-200">รอชำระ</span>;
      case 'paid': return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-blue-50 text-blue-600 border border-blue-200">ชำระแล้ว</span>;
      case 'shipping': return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-purple-50 text-purple-600 border border-purple-200">กำลังส่ง</span>;
      case 'completed': return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">สำเร็จ</span>;
      case 'cancelled': return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-50 text-red-600 border border-red-200">ยกเลิก</span>;
      default: return <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-neutral-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-neutral-900">🕒 ออเดอร์ล่าสุด</h3>
        <button className="text-xs font-semibold text-[#1B4332] hover:underline">ดูทั้งหมด</button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Order ID</th>
              <th className="px-4 py-3 font-semibold">ผู้ซื้อ / ร้านค้า</th>
              <th className="px-4 py-3 font-semibold text-right">ยอดรวม (฿)</th>
              <th className="px-4 py-3 font-semibold text-right">GP (฿)</th>
              <th className="px-4 py-3 font-semibold text-center">สถานะ</th>
              <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">เวลา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{order.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900 truncate max-w-[150px]">{order.buyer}</div>
                  <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">ร้าน: {order.seller}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                  {order.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-500">
                  {order.commission.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-neutral-500">
                  {order.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
