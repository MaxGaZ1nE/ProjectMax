import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/services/backend-api';
import { useAppDispatch } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface PaymentSlip {
  slip_id: string;
  order_id: string;
  slip_image: string;
  paid_amount: number;
  slip_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  grand_total: number;
  user_id: number;
  shop_id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

// ─────────────────────────────────────────
// Components
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: '#fef3c7', color: '#92400e', label: '⏳ รอตรวจสอบ' },
    approved: { bg: '#dcfce7', color: '#166534', label: '✅ อนุมัติแล้ว' },
    rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ ปฏิเสธแล้ว' },
  };
  const c = config[status] || config.pending;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      {c.label}
    </span>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString('th-TH'); } catch { return iso; }
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();

  const [slips, setSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const [previewSlip, setPreviewSlip] = useState<{
    open: boolean; orderId?: string; src?: string;
  }>({ open: false });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean; orderId?: string;
  }>({ open: false });
  const [rejectReason, setRejectReason] = useState('สลิปไม่ชัดเจน');

  // ─── Fetch ───
  const fetchSlips = useCallback(async () => {
    try {
      setError('');
      const res = await adminAPI.getPaymentSlips();
      setSlips(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlips();
    const interval = setInterval(fetchSlips, 15000);
    return () => clearInterval(interval);
  }, [fetchSlips]);

  // ─── Actions ───
  const onApprove = async (orderId: string) => {
    if (actionLoading) return;
    setActionLoading(orderId);
    try {
      await adminAPI.approvePayment(orderId);
      await fetchSlips();

      dispatch(pushNotification({
        type: 'payment',
        title: '✅ อนุมัติสลิปแล้ว',
        message: `ออเดอร์ #${orderId} ผ่านการตรวจสอบ ส่งงานไป Delivery แล้ว`,
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'อนุมัติไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const onReject = async (orderId: string, reason: string) => {
    if (actionLoading) return;
    setActionLoading(orderId);
    try {
      await adminAPI.rejectPayment(orderId, reason);
      await fetchSlips();

      dispatch(pushNotification({
        type: 'payment',
        title: '❌ ปฏิเสธสลิป',
        message: `ออเดอร์ #${orderId} ไม่ผ่านการตรวจสอบ (${reason})`,
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'ปฏิเสธไม่สำเร็จ');
    } finally {
      setActionLoading(null);
      setRejectModal({ open: false });
    }
  };

  // ─── Derived ───
  const displayed = tab === 'pending'
    ? slips.filter(s => s.slip_status === 'pending')
    : slips;

  const pendingCount = slips.filter(s => s.slip_status === 'pending').length;

  return (
    <div style={{ padding: '32px 0', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>
            💳 ตรวจสอบสลิปการชำระเงิน
          </h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
            ดูสลิปและอนุมัติ/ปฏิเสธการชำระเงินของลูกค้า — อัปเดตอัตโนมัติทุก 15 วินาที
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'รอตรวจสอบ', value: slips.filter(s => s.slip_status === 'pending').length, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'อนุมัติแล้ว', value: slips.filter(s => s.slip_status === 'approved').length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'ปฏิเสธแล้ว', value: slips.filter(s => s.slip_status === 'rejected').length, color: '#ef4444', bg: '#fef2f2' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg, border: `1px solid ${stat.color}30`,
              borderRadius: 12, padding: '18px 24px',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22
              }}>
                {stat.color === '#f59e0b' ? '⏳' : stat.color === '#10b981' ? '✅' : '❌'}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setTab('pending')}
            style={{
              padding: '8px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: 'none',
              background: tab === 'pending' ? '#f59e0b' : '#fff',
              color: tab === 'pending' ? '#fff' : '#374151',
              boxShadow: tab === 'pending' ? '0 2px 8px #f59e0b44' : '0 1px 3px #0002',
              transition: 'all .2s',
            }}
          >
            ⏳ รอตรวจสอบ {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setTab('all')}
            style={{
              padding: '8px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: 'none',
              background: tab === 'all' ? '#6366f1' : '#fff',
              color: tab === 'all' ? '#fff' : '#374151',
              boxShadow: tab === 'all' ? '0 2px 8px #6366f144' : '0 1px 3px #0002',
              transition: 'all .2s',
            }}
          >
            📋 ทั้งหมด
          </button>
          <button onClick={fetchSlips} style={{
            marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151'
          }}>
            🔄 รีเฟรช
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: 24, color: '#dc2626', textAlign: 'center'
          }}>
            ❌ {error}
            <button onClick={fetchSlips} style={{
              marginLeft: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #dc2626',
              background: 'transparent', color: '#dc2626', cursor: 'pointer'
            }}>
              ลองใหม่
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
            padding: 60, textAlign: 'center', color: '#9ca3af'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#374151' }}>
              {tab === 'pending' ? 'ไม่มีสลิปรอตรวจสอบ' : 'ยังไม่มีสลิปในระบบ'}
            </div>
            <div style={{ fontSize: 13 }}>
              {tab === 'pending' ? 'ทุกรายการได้รับการตรวจสอบแล้วครับ' : 'เมื่อลูกค้าแนบสลิป จะปรากฏที่นี่'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {displayed.map(slip => (
              <div key={slip.slip_id} style={{
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001',
                borderLeft: slip.slip_status === 'pending'
                  ? '4px solid #f59e0b'
                  : slip.slip_status === 'approved'
                    ? '4px solid #10b981'
                    : '4px solid #ef4444',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  {/* Left info */}
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <StatusBadge status={slip.slip_status} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                        #{slip.order_id}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>ลูกค้า</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                          {slip.first_name} {slip.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{slip.phone}</div>
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>ยอดชำระ</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                          ฿{Number(slip.paid_amount).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          ยอดออเดอร์: ฿{Number(slip.grand_total).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      แนบสลิป: {formatDate(slip.created_at)}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                    {/* View Slip */}
                    <button
                      onClick={() => setPreviewSlip({ open: true, orderId: slip.order_id, src: slip.slip_image })}
                      style={{
                        padding: '10px 0', borderRadius: 8, border: '2px solid #6366f1',
                        background: 'transparent', color: '#6366f1', fontWeight: 700,
                        fontSize: 14, cursor: 'pointer', transition: 'all .2s',
                      }}
                    >
                      🖼️ ดูสลิป
                    </button>

                    {slip.slip_status === 'pending' && (
                      <>
                        <button
                          disabled={actionLoading === slip.order_id}
                          onClick={() => onApprove(slip.order_id)}
                          style={{
                            padding: '10px 0', borderRadius: 8, border: 'none',
                            background: actionLoading === slip.order_id ? '#9ca3af' : '#10b981',
                            color: '#fff', fontWeight: 700, fontSize: 14,
                            cursor: actionLoading === slip.order_id ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px #10b98133',
                          }}
                        >
                          {actionLoading === slip.order_id ? '⏳...' : '✅ อนุมัติ'}
                        </button>

                        <button
                          disabled={actionLoading === slip.order_id}
                          onClick={() => { setRejectModal({ open: true, orderId: slip.order_id }); setRejectReason('สลิปไม่ชัดเจน'); }}
                          style={{
                            padding: '10px 0', borderRadius: 8, border: 'none',
                            background: actionLoading === slip.order_id ? '#9ca3af' : '#ef4444',
                            color: '#fff', fontWeight: 700, fontSize: 14,
                            cursor: actionLoading === slip.order_id ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px #ef444433',
                          }}
                        >
                          ❌ ปฏิเสธ
                        </button>

                        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.4 }}>
                          หลังอนุมัติ → ระบบส่งงาน Delivery อัตโนมัติ
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Slip Preview Modal ─── */}
      {previewSlip.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>🖼️ สลิปการโอนเงิน</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>ออเดอร์ #{previewSlip.orderId}</div>
              </div>
              <button
                onClick={() => setPreviewSlip({ open: false })}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {previewSlip.src ? (
                <img
                  src={previewSlip.src}
                  alt="slip"
                  style={{ width: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  ไม่พบรูปสลิป
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ─── */}
      {rejectModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#ef4444' }}>❌ ปฏิเสธสลิป</div>
              <button
                onClick={() => setRejectModal({ open: false })}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: 18
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>
                กรุณาเลือกเหตุผล ลูกค้าจะเห็นเหตุผลนี้เพื่อแนบสลิปใหม่
              </div>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14, background: '#f9fafb',
                  outline: 'none'
                }}
              >
                <option value="สลิปไม่ชัดเจน">สลิปไม่ชัดเจน</option>
                <option value="ยอดเงินไม่ตรง">ยอดเงินไม่ตรง</option>
                <option value="วันเวลาโอนไม่ชัดเจน">วันเวลาโอนไม่ชัดเจน</option>
                <option value="สลิปปลอมหรือแก้ไข">สลิปปลอมหรือแก้ไข</option>
                <option value="สลิปซ้ำกับออเดอร์อื่น">สลิปซ้ำกับออเดอร์อื่น</option>
              </select>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setRejectModal({ open: false })}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 8,
                    border: '1px solid #d1d5db', background: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  disabled={!!actionLoading}
                  onClick={() => {
                    if (rejectModal.orderId) onReject(rejectModal.orderId, rejectReason);
                  }}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 8,
                    border: 'none',
                    background: actionLoading ? '#9ca3af' : '#ef4444',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? '⏳ กำลังดำเนินการ...' : 'ยืนยันปฏิเสธสลิป'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}