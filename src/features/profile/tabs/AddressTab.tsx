import { useEffect, useMemo, useState } from 'react';
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

import { useAppSelector } from '@stores/index';
import { useAuth } from '@contexts/AuthContext';
import { addressAPI } from '@/services/backend-api';

import { uid, getDisplayName, type AddressItem } from '../utils/profile-utils';

const inputClass =
  'w-full h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

const labelClass = 'text-sm font-medium text-neutral-700 mb-1';

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function AddressTab() {
  const { user, updateProfile: updateProfileAPI } = useAuth();
  const sellerProfile = useAppSelector((s) => s.seller?.profile ?? null);

  const displayName = useMemo(() => getDisplayName(user ?? undefined), [user]);

  const [addressBook, setAddressBook] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressFormMode, setAddressFormMode] = useState<'create' | 'edit'>('create');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await addressAPI.getAddresses();
      setAddressBook(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  if (!user) return null;

  const syncDefaultToUser = async (item: AddressItem) => {
    try {
      await updateProfileAPI({
        phone: item.phone,
        address: item.addressLine,
        province: item.province,
        postalCode: item.postalCode,
      });
    } catch (err) {
      console.error('Failed to sync address to profile:', err);
    }
  };

  const openCreateAddress = () => {
    setAddressFormMode('create');
    setEditingAddressId(null);
    setRecipientName(displayName);
    setAddrPhone(user.phone ?? '');
    setAddressLine('');
    setProvince('');
    setPostalCode('');
    setLat(undefined);
    setLng(undefined);
    setAddressFormOpen(true);
  };

  const openEditAddress = (id: string) => {
    const item = addressBook.find((x) => x.id === id);
    if (!item) return;

    setAddressFormMode('edit');
    setEditingAddressId(id);
    setRecipientName(item.recipientName);
    setAddrPhone(item.phone);
    setAddressLine(item.addressLine);
    setProvince(item.province);
    setPostalCode(item.postalCode);
    setLat(item.lat);
    setLng(item.lng);
    setAddressFormOpen(true);
  };

  const removeAddress = async (id: string) => {
    try {
      await addressAPI.deleteAddress(id);
      await fetchAddresses();
      if (editingAddressId === id) setAddressFormOpen(false);
    } catch (err: any) {
      alert(`ไม่สามารถลบที่อยู่ได้: ${err.message}`);
    }
  };

  const setDefaultAddress = async (id: string) => {
    const item = addressBook.find((x) => x.id === id);
    if (!item) return;
    
    try {
      await addressAPI.updateAddress(id, { ...item, isDefault: true });
      await fetchAddresses();
      await syncDefaultToUser(item);
    } catch (err: any) {
      alert(`ไม่สามารถตั้งเป็นค่าเริ่มต้นได้: ${err.message}`);
    }
  };

  const onCancelAddressForm = () => setAddressFormOpen(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSaveAddressForm = async () => {
    const newErrors: Record<string, string> = {};
    if (!recipientName.trim()) newErrors.recipientName = 'กรุณากรอกชื่อผู้รับ';
    if (!addrPhone.trim()) newErrors.addrPhone = 'กรุณากรอกเบอร์โทร';
    if (!addressLine.trim()) newErrors.addressLine = 'กรุณากรอกที่อยู่';
    if (!province.trim()) newErrors.province = 'กรุณากรอกจังหวัด';
    if (!postalCode.trim()) newErrors.postalCode = 'กรุณากรอกรหัสไปรษณีย์';
    if (lat === undefined || lng === undefined) newErrors.map = 'กรุณาปักหมุดที่อยู่บนแผนที่';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload: AddressItem = {
      id: editingAddressId ?? uid(),
      recipientName: recipientName.trim(),
      phone: addrPhone.trim(),
      addressLine: addressLine.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
      lat,
      lng,
      isDefault: false,
    };

    try {
      if (addressFormMode === 'create') {
        const res = await addressAPI.addAddress(payload);
        if (res.data.data.isDefault) {
          syncDefaultToUser(res.data.data);
        }
      } else {
        await addressAPI.updateAddress(editingAddressId!, payload);
      }
      
      await fetchAddresses();
      alert('บันทึกที่อยู่สำเร็จ');
      setAddressFormOpen(false);
    } catch (err: any) {
      alert(`API Error: ${err.message || 'ไม่สามารถบันทึกที่อยู่ได้'}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-5">
        <button type="button" onClick={openCreateAddress} className="btn btn-primary">
          + เพิ่มที่อยู่
        </button>
      </div>

      {/* Address list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addressBook.map((a) => (
          <div
            key={a.id}
            className="relative rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditAddress(a.id)}
                className="btn !px-0 !py-0 h-9 w-9"
                title="แก้ไข"
                aria-label="edit"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => removeAddress(a.id)}
                className="btn !px-0 !py-0 h-9 w-9"
                title="ลบ"
                aria-label="delete"
              >
                🗑️
              </button>
            </div>

            <div className="text-sm font-semibold text-neutral-900 pr-24">
              {a.recipientName} ({a.phone})
            </div>

            <div className="mt-2 text-sm text-neutral-700 whitespace-pre-line">{a.addressLine}</div>
            <div className="mt-1 text-sm text-neutral-700">
              {a.province} {a.postalCode}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                {a.isDefault ? (
                  <span className="text-xs font-semibold text-emerald-700">ค่าเริ่มต้น</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(a.id)}
                    className="text-xs text-primary-600 hover:underline underline-offset-4"
                  >
                    ตั้งเป็นค่าเริ่มต้น
                  </button>
                )}
                {a.lat && a.lng ? (
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">📍 มีพิกัด GPS</span>
                ) : (
                  <span className="text-xs font-semibold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">ไม่มีพิกัด</span>
                )}
              </div>
              <span className="text-xs text-neutral-500">ที่อยู่สำหรับจัดส่ง</span>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="mt-6">
        {addressFormOpen && (
          <div className="card p-6 bg-neutral-50">
            <div className="font-semibold text-neutral-900">
              {addressFormMode === 'create' ? 'เพิ่มที่อยู่ใหม่' : 'แก้ไขที่อยู่'}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={labelClass}>ชื่อผู้รับ</div>
                <input 
                  className={`${inputClass} ${errors.recipientName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`} 
                  value={recipientName} 
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    if (errors.recipientName) setErrors({ ...errors, recipientName: '' });
                  }} 
                />
                {errors.recipientName && <p className="text-xs text-red-500 mt-1">{errors.recipientName}</p>}
              </div>

              <div>
                <div className={labelClass}>เบอร์โทร</div>
                <input 
                  className={`${inputClass} ${errors.addrPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`} 
                  value={addrPhone} 
                  onChange={(e) => {
                    setAddrPhone(e.target.value);
                    if (errors.addrPhone) setErrors({ ...errors, addrPhone: '' });
                  }} 
                />
                {errors.addrPhone && <p className="text-xs text-red-500 mt-1">{errors.addrPhone}</p>}
              </div>

              <div className="md:col-span-2">
                <div className={labelClass}>ที่อยู่</div>
                <textarea
                  className={[
                    'w-full min-h-[110px] rounded-lg border bg-white px-3 py-2 text-sm outline-none transition',
                    errors.addressLine ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-200',
                  ].join(' ')}
                  value={addressLine}
                  onChange={(e) => {
                    setAddressLine(e.target.value);
                    if (errors.addressLine) setErrors({ ...errors, addressLine: '' });
                  }}
                />
                {errors.addressLine && <p className="text-xs text-red-500 mt-1">{errors.addressLine}</p>}
              </div>

              {/* Map Pin Section */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <div className={labelClass}>ปักหมุดที่อยู่ (GPS)</div>
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
                              if (errors.map) setErrors({ ...errors, map: '' });
                            },
                            (err) => alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + err.message)
                          );
                        }
                      }}
                    >
                      📍 ใช้ตำแหน่งปัจจุบัน
                    </button>
                    {(lat && lng) && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          setLat(undefined);
                          setLng(undefined);
                        }}
                      >
                        ล้างหมุด
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={`h-[300px] w-full rounded-lg overflow-hidden border relative z-0 ${errors.map ? 'border-red-500' : 'border-neutral-300'}`}>
                  <MapContainer
                    center={lat && lng ? [lat, lng] : [13.7563, 100.5018]}
                    zoom={lat && lng ? 16 : 6}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker 
                      position={lat && lng ? [lat, lng] : null} 
                      setPosition={(pos) => {
                        setLat(pos[0]);
                        setLng(pos[1]);
                        if (errors.map) setErrors({ ...errors, map: '' });
                      }} 
                    />
                  </MapContainer>
                </div>
                {errors.map && <p className="text-xs text-red-500 mt-1">{errors.map}</p>}
                {lat && lng && !errors.map && (
                  <div className="text-xs text-emerald-600 mt-1">
                    พิกัดที่เลือก: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </div>
                )}
              </div>

              <div>
                <div className={labelClass}>จังหวัด</div>
                <input 
                  className={`${inputClass} ${errors.province ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`} 
                  value={province} 
                  onChange={(e) => {
                    setProvince(e.target.value);
                    if (errors.province) setErrors({ ...errors, province: '' });
                  }} 
                />
                {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
              </div>

              <div>
                <div className={labelClass}>รหัสไปรษณีย์</div>
                <input 
                  inputMode="numeric" 
                  className={`${inputClass} ${errors.postalCode ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`} 
                  value={postalCode} 
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    if (errors.postalCode) setErrors({ ...errors, postalCode: '' });
                  }} 
                />
                {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onCancelAddressForm} className="btn">
                ยกเลิก
              </button>
              <button type="button" onClick={onSaveAddressForm} className="btn btn-primary">
                บันทึก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}