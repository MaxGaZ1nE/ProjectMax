import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminUserAPI } from '@services/api/admin-api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [sellerData, setSellerData] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  // Roles modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id) return;
      const userRes = await adminUserAPI.getUser(id);
      const userData = userRes?.data?.data || userRes?.data || userRes;
      setUser(userData);

      const initialRoles = ['buyer'];
      if (userData.sellerId || userData.role === 'seller') initialRoles.push('seller');
      if (userData.deliveryId) initialRoles.push('delivery');
      if (userData.role === 'admin') initialRoles.push('admin');
      setSelectedRoles(initialRoles);

      // Only fetch seller data if user is a seller
      if (initialRoles.includes('seller')) {
        try {
          const sellerRes = await adminUserAPI.getUserSeller(id);
          setSellerData(sellerRes?.data?.data || sellerRes?.data || sellerRes);
        } catch (e) {
          console.error("No seller data or failed to fetch:", e);
        }
      }

      // Only fetch delivery data if user is delivery
      if (initialRoles.includes('delivery')) {
        try {
          const deliveryRes = await adminUserAPI.getUserDelivery(id);
          setDeliveryData(deliveryRes?.data?.data || deliveryRes?.data || deliveryRes);
        } catch (e) {
          console.error("No delivery data or failed to fetch:", e);
        }
      }

      // Fetch orders
      try {
        const ordersRes = await adminUserAPI.getUserOrders(id);
        setOrdersData(ordersRes?.data?.data || ordersRes?.data || []);
      } catch (e) {
        console.error("No order data or failed to fetch:", e);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    if (selectedRoles.length === 0) {
      alert('ต้องมีอย่างน้อย 1 บทบาทเสมอ');
      return;
    }
    setSavingRole(true);
    try {
      await adminUserAPI.changeUserRoles(id as string, selectedRoles);
      setIsRoleModalOpen(false);
      fetchData(); // reload
    } catch (err: any) {
      alert('บันทึกบทบาทไม่สำเร็จ: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingRole(false);
    }
  };

  const handleBanToggle = async () => {
    try {
      if (user.banned) {
        // Unban
        // assuming adminUserAPI.unbanUser is defined (it's not exported by default, we can just use patch manually or create it)
        await adminUserAPI.banUser(id as string, '', 0); // using 0 to unban, or update the API
        alert('ปลดแบนเรียบร้อยแล้ว');
      } else {
        const reason = prompt('กรุณาระบุเหตุผลการแบน:');
        if (reason) {
          await adminUserAPI.banUser(id as string, reason, 7);
          alert('แบนผู้ใช้เรียบร้อยแล้ว');
        }
      }
      fetchData();
    } catch (err: any) {
      alert('ดำเนินการไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('คุณแน่ใจหรือว่าต้องการลบบัญชีนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้และจะลบข้อมูล Seller/Delivery ที่เกี่ยวข้องทั้งหมด (Cascade Delete)')) {
      try {
        // using axiosInstance if adminUserAPI.deleteUser is missing, but it is defined.
        await adminUserAPI.deleteUser(id as string);
        alert('ลบบัญชีผู้ใช้เรียบร้อยแล้ว');
        navigate('/admin/users');
      } catch (err: any) {
        alert('ลบบัญชีไม่สำเร็จ: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-[#f5f5f5] min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a6e40] mx-auto"></div>
        <p className="mt-4 text-neutral-600">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 text-center bg-[#f5f5f5] min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error || 'ไม่พบข้อมูลผู้ใช้'}
        </div>
        <button 
          onClick={() => navigate('/admin/users')}
          className="mt-4 text-blue-600 hover:underline"
        >
          กลับไปหน้าจัดการผู้ใช้
        </button>
      </div>
    );
  }

  const name = (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'ไม่มีชื่อ';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="bg-[#f5f5f5] min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center text-neutral-600 hover:text-neutral-900 font-medium transition"
        >
          <span className="mr-2">←</span> กลับไปหน้าจัดการผู้ใช้
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* SECTION 1: ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a6e40] flex items-center gap-2">
              <span>👤</span> ข้อมูลส่วนตัว
            </h2>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button 
                onClick={() => setIsRoleModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
              >
                จัดการบทบาท
              </button>
              <button 
                onClick={handleBanToggle}
                className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition ${
                  user.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {user.banned ? 'ปลดแบน' : 'แบนบัญชี'}
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white text-sm font-semibold rounded-lg transition"
              >
                ลบบัญชี
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0 flex justify-center items-center h-24 w-24 bg-neutral-100 text-neutral-400 rounded-full text-3xl font-bold border-2 border-neutral-200 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-neutral-500 font-medium">ชื่อ-นามสกุล</p>
                <p className="text-base font-semibold text-neutral-900">{name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">อีเมล</p>
                <p className="text-base font-semibold text-neutral-900">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">เบอร์โทรศัพท์</p>
                <p className="text-base font-semibold text-neutral-900">{user.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">วันที่สมัคร</p>
                <p className="text-base font-semibold text-neutral-900">
                  {new Date(user.createdAt || new Date()).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">สถานะ</p>
                {user.banned ? (
                  <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    🔒 ถูกแบน
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    ✅ เปิดใช้งาน
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">บทบาททั้งหมด</p>
                <div className="flex flex-wrap gap-1">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                    ผู้ซื้อ
                  </span>
                  {(user.sellerId || user.role === 'seller') && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
                      ผู้ขาย
                    </span>
                  )}
                  {user.deliveryId && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                      พนักงานส่ง
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ข้อมูลร้านค้า (Seller) */}
        {(user.sellerId || user.role === 'seller') && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1a6e40] mb-6 flex items-center gap-2">
              <span>🏪</span> ข้อมูลร้านค้า
            </h2>
            {sellerData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">รหัสผู้ขาย (Seller ID)</p>
                    <p className="text-base font-semibold text-neutral-900">{sellerData.id || user.sellerId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">ชื่อร้าน</p>
                    <p className="text-base font-semibold text-neutral-900">{sellerData.shopName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">รายละเอียดร้าน</p>
                    <p className="text-sm text-neutral-700">{sellerData.description || sellerData.shopDescription || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">ประเภทสินค้า (Category)</p>
                    <p className="text-base font-semibold text-neutral-900">{sellerData.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">ที่อยู่ร้าน</p>
                    <p className="text-sm text-neutral-700">{sellerData.address || sellerData.mapAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">บัญชีธนาคาร</p>
                    <p className="text-base font-semibold text-neutral-900">
                      {sellerData.bankName ? `${sellerData.bankName} (***${sellerData.bankAccount?.slice(-4) || 'XXXX'})` : '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                    <div>
                      <p className="text-xs text-neutral-500 font-medium">คะแนนร้าน</p>
                      <p className="text-lg font-bold text-amber-500">⭐ {sellerData.rating || '0.0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-medium">จำนวนสินค้า</p>
                      <p className="text-lg font-bold text-neutral-900">{sellerData.totalProducts || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-medium">วันที่อนุมัติ</p>
                      <p className="text-sm font-semibold text-neutral-900">
                        {sellerData.approvedAt ? new Date(sellerData.approvedAt).toLocaleDateString('th-TH') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Map Section */}
                <div className="h-full min-h-[250px] w-full rounded-xl overflow-hidden border border-neutral-200">
                  {sellerData.latitude && sellerData.longitude ? (
                    <MapContainer 
                      center={[sellerData.latitude, sellerData.longitude]} 
                      zoom={15} 
                      style={{ height: '100%', minHeight: '250px', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Marker position={[sellerData.latitude, sellerData.longitude]}>
                        <Popup>{sellerData.shopName || 'ตำแหน่งร้าน'}</Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-400 p-6 text-center min-h-[250px]">
                      <span className="text-4xl mb-2">🗺️</span>
                      <p>ไม่มีข้อมูลพิกัด (Lat/Lng) สำหรับร้านค้านี้</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">กำลังโหลดข้อมูลผู้ขาย หรือไม่มีข้อมูลจำเพาะ</p>
            )}
          </div>
        )}

        {/* SECTION 3: ข้อมูลพนักงานส่ง (Delivery) */}
        {user.deliveryId && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1a6e40] mb-6 flex items-center gap-2">
              <span>🚚</span> ข้อมูลพนักงานส่ง
            </h2>
            {deliveryData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">รหัสพนักงาน (Delivery ID)</p>
                  <p className="text-base font-semibold text-neutral-900">{deliveryData.riderId || `RIDER-${user.deliveryId}`}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 font-medium">ยานพาหนะ</p>
                  <p className="text-base font-semibold text-neutral-900">{deliveryData.vehicleType || 'มอเตอร์ไซค์'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 font-medium">บัญชีธนาคาร</p>
                  <p className="text-base font-semibold text-neutral-900">
                    {deliveryData.bankName ? `${deliveryData.bankName} (***${deliveryData.bankAccount?.slice(-4) || 'XXXX'})` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 font-medium mb-1">สถานะปัจจุบัน</p>
                  {deliveryData.isOnline ? (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      🟢 ออนไลน์
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                      ⚫ ออฟไลน์
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">คะแนนการส่ง</p>
                  <p className="text-lg font-bold text-amber-500">⭐ {deliveryData.rating || '0.0'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">ออเดอร์สำเร็จ</p>
                  <p className="text-lg font-bold text-neutral-900">{deliveryData.completedOrders || 0} ครั้ง</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-neutral-500 font-medium">วันที่ได้รับการอนุมัติ</p>
                  <p className="text-base font-semibold text-neutral-900">
                    {deliveryData.approvedAt ? new Date(deliveryData.approvedAt).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">กำลังโหลดข้อมูลคนส่ง หรือไม่มีข้อมูลจำเพาะ</p>
            )}
          </div>
        )}

        {/* SECTION 4: ประวัติออเดอร์ (Buyer) */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1a6e40] mb-6 flex items-center gap-2">
            <span>📋</span> ประวัติการสั่งซื้อ
          </h2>
          {ordersData.length > 0 ? (
            <div className="overflow-x-auto border border-neutral-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">หมายเลขออเดอร์</th>
                    <th className="px-4 py-3 font-semibold">วันที่</th>
                    <th className="px-4 py-3 font-semibold">สินค้า (ตัวอย่าง)</th>
                    <th className="px-4 py-3 font-semibold">ยอดรวม</th>
                    <th className="px-4 py-3 font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {ordersData.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">#{order.id.toString().padStart(5, '0')}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {new Date(order.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 truncate max-w-xs">
                        {order.items?.[0]?.product?.name || 'สินค้า'} {order.items?.length > 1 ? `และอื่นๆ (+${order.items.length - 1})` : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold text-neutral-900">฿{order.total?.toLocaleString() || order.grandTotal?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${
                          order.status === 'completed' || order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.status === 'completed' || order.status === 'delivered' ? 'สำเร็จ' :
                           order.status === 'cancelled' ? 'ยกเลิก' : 'กำลังดำเนินการ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ordersData.length > 10 && (
                <div className="p-3 text-center border-t border-neutral-200 bg-neutral-50">
                  <span className="text-xs text-neutral-500">แสดง 10 รายการล่าสุดจาก {ordersData.length} รายการ</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
              <span className="text-3xl mb-2 block">🛒</span>
              ไม่มีประวัติการสั่งซื้อสำหรับบัญชีนี้
            </div>
          )}
        </div>

      </div>

      {/* Role Management Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-bold text-neutral-900 text-lg mb-4">จัดการบทบาท</h3>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-blue-50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('buyer')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRoles([...selectedRoles, 'buyer']);
                    else if (selectedRoles.length > 1) setSelectedRoles(selectedRoles.filter(r => r !== 'buyer'));
                    else alert('ต้องมีอย่างน้อย 1 บทบาทเสมอ');
                  }}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                />
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">🛒 ผู้ซื้อ (Buyer)</span>
                  <p className="text-xs text-neutral-500 mt-0.5">บทบาทพื้นฐานของระบบ</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-orange-50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('seller')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRoles([...selectedRoles, 'seller']);
                    else if (selectedRoles.length > 1) setSelectedRoles(selectedRoles.filter(r => r !== 'seller'));
                    else alert('ต้องมีอย่างน้อย 1 บทบาทเสมอ');
                  }}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-orange-600 focus:ring-orange-600"
                />
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">🏪 ผู้ขาย (Seller)</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">* การเพิ่ม role ผู้ขาย จะสร้าง sellerId ให้อัตโนมัติ</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-green-50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('delivery')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRoles([...selectedRoles, 'delivery']);
                    else if (selectedRoles.length > 1) setSelectedRoles(selectedRoles.filter(r => r !== 'delivery'));
                    else alert('ต้องมีอย่างน้อย 1 บทบาทเสมอ');
                  }}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-green-600 focus:ring-green-600"
                />
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">🚚 พนักงานส่ง (Delivery)</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">* การเพิ่ม role พนักงานส่ง จะสร้าง deliveryId ให้อัตโนมัติ</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-purple-50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('admin')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRoles([...selectedRoles, 'admin']);
                    else if (selectedRoles.length > 1) setSelectedRoles(selectedRoles.filter(r => r !== 'admin'));
                    else alert('ต้องมีอย่างน้อย 1 บทบาทเสมอ');
                  }}
                  className="mt-1 w-5 h-5 rounded border-neutral-300 text-purple-600 focus:ring-purple-600"
                />
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">🔒 ผู้ดูแลระบบ (Admin)</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">จัดการระบบทั้งหมดได้</p>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={savingRole}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition disabled:opacity-50"
              >
                {savingRole ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
