import { useAppSelector, useAppDispatch } from '@stores/index';
import { useState, useEffect } from 'react';
import { fetchSellerProfile } from '@/slices/seller-slice';
import { sellerAPI } from '@/services/api/seller-api';
import { pushNotification } from '@/slices/notification-slice';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function SellerShopSettingsPage() {
  const seller = useAppSelector((s: any) => s.seller.profile);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'shop' | 'policies' | 'payment'>('shop');
  
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (seller?.latitude && seller?.longitude) {
      setLat(Number(seller.latitude));
      setLng(Number(seller.longitude));
    }
  }, [seller]);

  const saveLocation = async () => {
    if (!lat || !lng) return;
    setIsSaving(true);
    try {
      await sellerAPI.updateProfile({ latitude: lat, longitude: lng });
      dispatch(fetchSellerProfile());
      dispatch(pushNotification({
        type: 'system',
        title: '✅ บันทึกสำเร็จ',
        message: 'อัปเดตพิกัดร้านค้าเรียบร้อยแล้ว',
      }));
    } catch (err: any) {
      dispatch(pushNotification({
        type: 'error',
        title: '❌ เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถบันทึกพิกัดได้',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">⚙️ การตั้งค่าร้านค้า</h1>
        <p className="text-neutral-600 mt-1">จัดการข้อมูลและนโยบายของร้านค้าของคุณ</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {[
          { id: 'shop', label: '🏪 ข้อมูลร้านค้า' },
          { id: 'policies', label: '📋 นโยบาย' },
          { id: 'payment', label: '💳 ข้อมูลการชำระเงิน' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        {activeTab === 'shop' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-neutral-900">ข้อมูลร้านค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อร้านค้า</label>
                <input
                  type="text"
                  value={seller?.shopName ?? ''}
                  readOnly
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={seller?.phone ?? ''}
                  readOnly
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ที่อยู่ร้านค้า</label>
              <input
                type="text"
                value={seller?.addressLine ?? ''}
                readOnly
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-600"
              />
            </div>
            
            {/* Map Pin Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">📍 พิกัดร้านค้า (GPS)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setLat(pos.coords.latitude);
                            setLng(pos.coords.longitude);
                          },
                          (err) => alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + err.message)
                        );
                      }
                    }}
                  >
                    📍 ใช้ตำแหน่งปัจจุบัน
                  </button>
                </div>
              </div>
              <div className="h-[300px] w-full rounded-lg overflow-hidden border border-neutral-300 relative z-0">
                <MapContainer
                  center={lat && lng ? [lat, lng] : [13.7563, 100.5018]}
                  zoom={lat && lng ? 16 : 6}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker 
                    position={lat && lng ? [lat, lng] : null} 
                    setPosition={(pos) => {
                      setLat(pos[0]);
                      setLng(pos[1]);
                    }} 
                  />
                </MapContainer>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-neutral-600">
                  {lat && lng ? `พิกัดที่เลือก: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'ยังไม่ได้ปักหมุด'}
                </div>
                <button
                  type="button"
                  onClick={saveLocation}
                  disabled={!lat || !lng || isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกพิกัด'}
                </button>
              </div>
            </div>

            <p className="text-sm text-neutral-500">💡 หากต้องการแก้ไขข้อมูลอื่นๆ กรุณาติดต่อ Admin</p>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">นโยบายของร้านค้า</h2>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center text-neutral-600">
              📝 หน้านี้อยู่ระหว่างการพัฒนา
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">ข้อมูลการชำระเงิน</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">PromptPay</label>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <div className="text-sm text-neutral-600">
                    <span className="font-medium">{seller?.promptpay?.type === 'phone' ? '📱 เบอร์โทร' : '🆔 เลขประชาชน'}:</span>
                    <span className="ml-2 font-mono">{seller?.promptpay?.value}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-500">💡 หากต้องการเปลี่ยนข้อมูลการชำระเงิน กรุณาติดต่อ Admin</p>
          </div>
        )}
      </div>
    </div>
  );
}
