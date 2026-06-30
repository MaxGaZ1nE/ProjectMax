import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';

import { clearLastPlacedOrders } from '@/slices/order-slice';

import { selectLastPlacedOrders } from '@/slices/order-selectors';



export default function OrderSuccessPage() {

  const dispatch = useDispatch();

  const lastOrders = useSelector(selectLastPlacedOrders);



  return (

    <div style={{ padding: 24 }}>

      <h1>สั่งซื้อสำเร็จ</h1>



      {lastOrders.length === 0 ? (

        <div>

          <p>ไม่มีออเดอร์ล่าสุด</p>

          <Link to="/orders">ไปหน้ารายการคำสั่งซื้อ</Link>

        </div>

      ) : (

        lastOrders.map((o) => (

          <div

            key={o.id}

            style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}

          >

            <div>

              <b>Order:</b> {o.id}

            </div>

            <div>

              <b>Shop:</b> {o.shopName}

            </div>

            <div>

              <b>Total:</b> {Number(o.grandTotal ?? 0).toLocaleString()}

            </div>



            <div style={{ marginTop: 8 }}>

              <b>Items</b>

              <ul>

                {o.items.map((it) => (

                  <li key={`${it.id}-${it.unit}-${it.weight}`}>

                    {it.name} x {it.qty} ({it.weight} {it.unit})

                  </li>

                ))}

              </ul>

            </div>

            {/* ✅ Add button to view order details */}

            <Link

              to={`/orders/${o.id}`}

              style={{

                display: 'inline-block',

                marginTop: 12,

                padding: '10px 20px',

                backgroundColor: '#22c55e',

                color: 'white',

                textDecoration: 'none',

                borderRadius: '6px',

                fontWeight: 'bold',

                cursor: 'pointer',

              }}

            >

              ดูรายละเอียดคำสั่งซื้อ

            </Link>

          </div>

        ))

      )}



      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>

        <button onClick={() => dispatch(clearLastPlacedOrders())}>

          ล้างออเดอร์ล่าสุด

        </button>



        <Link to="/orders" onClick={() => dispatch(clearLastPlacedOrders())}>

          ไปหน้ารายการคำสั่งซื้อ

        </Link>

      </div>

    </div>

  );

} 