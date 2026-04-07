import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { removeFromCart, setQty } from '@/slices/cart-slice';

type Group = {
  shopId: number;
  shopName: string;
  items: any[];
  total: number;
};

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);

  const groups: Group[] = useMemo(() => {
    const map = new Map<number, Group>();

    for (const it of items) {
      const g = map.get(it.shopId) ?? {
        shopId: it.shopId,
        shopName: it.shopName,
        items: [],
        total: 0,
      };

      g.items.push(it);
      g.total += it.price * it.qty;

      map.set(it.shopId, g);
    }

    return Array.from(map.values());
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold">ตะกร้าว่าง</div>
        <Link className="text-emerald-700 underline underline-offset-4" to="/">
          กลับไปเลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-8">
        {groups.map((g) => (
          <div key={g.shopId} className="rounded-lg border border-neutral-200 overflow-hidden">
            {/* header row */}
            <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between">
              <div className="font-semibold">{g.shopName}</div>

              <div className="grid grid-cols-[160px_120px_60px] gap-4 text-sm text-neutral-600">
                <div className="text-right">จำนวนสินค้า</div>
                <div className="text-right">ราคาต่อหน่วย</div>
                <div className="text-center">ลบ</div>
              </div>
            </div>

            {/* items */}
            <div className="divide-y divide-neutral-200">
              {g.items.map((it) => (
                <div key={it.id} className="px-4 py-4 flex items-center justify-between gap-4">
                  {/* left */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-14 w-14 rounded-lg object-cover border border-neutral-200"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-neutral-500">การันตีความสด 100%</div>
                    </div>
                  </div>

                  {/* right columns */}
                  <div className="grid grid-cols-[160px_120px_60px] gap-4 items-center">
                    {/* qty */}
                    <div className="flex justify-end">
                      <div className="inline-flex items-center rounded-lg border border-neutral-200 overflow-hidden">
                        <button
                          type="button"
                          className="px-3 py-2 hover:bg-neutral-50"
                          onClick={() => dispatch(setQty({ id: it.id, qty: Math.max(1, it.qty - 1) }))}
                        >
                          −
                        </button>
                        <div className="px-4 py-2 text-sm">{it.qty}</div>
                        <button
                          type="button"
                          className="px-3 py-2 hover:bg-neutral-50"
                          onClick={() => dispatch(setQty({ id: it.id, qty: it.qty + 1 }))}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* unit price */}
                    <div className="text-right text-sm">{it.price.toLocaleString()}</div>

                    {/* delete */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => dispatch(removeFromCart({ id: it.id }))}
                        aria-label="remove"
                        title="ลบสินค้า"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* footer total */}
            <div className="px-4 py-3 flex items-center justify-end gap-3">
              <div className="text-sm text-neutral-600">รวมราคาสินค้า</div>
              <div className="text-red-600 font-semibold">{g.total.toLocaleString()}</div>

              <button
                type="button"
                className="ml-2 bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-800"
              >
                สั่งสินค้า
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}