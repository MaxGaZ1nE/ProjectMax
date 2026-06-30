interface TopSeller {
  id: string;
  name: string;
  sales: number;
  orders: number;
  commission: number;
}

interface TopSellersTableProps {
  sellers: TopSeller[];
}

export default function TopSellersTable({ sellers }: TopSellersTableProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-neutral-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">🏆 Top Sellers (ยอดขายสูงสุด)</h3>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">ชื่อร้าน</th>
              <th className="px-4 py-3 font-semibold text-right">ยอดขาย (฿)</th>
              <th className="px-4 py-3 font-semibold text-center">ออเดอร์</th>
              <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">หัก GP (฿)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sellers.map((seller, idx) => (
              <tr key={seller.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-neutral-200 text-neutral-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-neutral-900 truncate max-w-[120px]">{seller.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                  {seller.sales.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-neutral-600">
                  {seller.orders.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-500">
                  {seller.commission.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
