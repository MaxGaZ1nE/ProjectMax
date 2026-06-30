import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/stores/index';
import { updateSellerProfile, fetchSellerProfile } from '@/slices/seller-slice';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { uploadAPI } from '@services/backend-api';

// Fix leaflet marker icon
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function DraggableMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
      position={position}
      icon={customIcon}
    />
  );
}

export default function SellerEditProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    category: 'ผลไม้สด',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idCard: '',
    address: '',
    province: '',
    district: '',
    subDistrict: '',
    zipcode: '',
    shopAvatar: '', // ✅ Add shop avatar URL field
  });

  const [position, setPosition] = useState<[number, number]>([13.7563, 100.5018]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch('http://localhost:5000/api/seller/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setFormData({
            shopName: d.shopName || '',
            shopDescription: d.shopDescription || '',
            category: d.shopCategory || 'ผลไม้สด',
            firstName: d.user?.firstName || '',
            lastName: d.user?.lastName || '',
            phone: d.phone || d.user?.phone || '',
            email: d.user?.email || '',
            idCard: '', // not exposed usually
            address: d.address || '',
            province: d.province || '',
            district: d.district || '',
            subDistrict: d.subDistrict || '',
            zipcode: d.postalCode || '',
            shopAvatar: d.shopAvatar || d.avatar || '', // ✅ Fetch shop avatar from DB
          });
          
          if (d.latitude && d.longitude) {
            setPosition([parseFloat(d.latitude), parseFloat(d.longitude)]);
          }
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        toast.error('ไม่สามารถดึงข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Upload to server
        const uploadRes = await uploadAPI.uploadImage(base64);
        const imageUrl = uploadRes?.data?.url || uploadRes?.data?.data?.url || '';

        if (imageUrl) {
          // Update form data with new image URL
          setFormData((prev) => ({ ...prev, shopAvatar: imageUrl }));
          toast.success('อัปโหลดรูปภาพสำเร็จ');
        } else {
          throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const handleChangeImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          toast.success('อัปเดตตำแหน่งปัจจุบันเรียบร้อย');
        },
        (err) => {
          toast.error('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาตรวจสอบการอนุญาตใช้งาน GPS');
        }
      );
    } else {
      toast.error('เบราว์เซอร์ของคุณไม่รองรับ Geolocation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const payload = {
        shop_name: formData.shopName,
        shop_description: formData.shopDescription,
        shop_category: formData.category,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        id_card: formData.idCard,
        address: formData.address,
        province: formData.province,
        district: formData.district,
        sub_district: formData.subDistrict,
        postal_code: formData.zipcode,
        latitude: position[0],
        longitude: position[1],
        shop_avatar: formData.shopAvatar,
      };

      const res = await fetch('http://localhost:5000/api/seller/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        console.log('✅ Save successful, updating Redux...');
        
        // ✅ Update Redux state immediately with all profile data
        dispatch(updateSellerProfile({
          shopName: formData.shopName,
          shopAvatar: formData.shopAvatar,
          phone: formData.phone,
          ownerName: `${formData.firstName} ${formData.lastName}`,
          addressLine: formData.address,
          province: formData.province,
          postalCode: formData.zipcode,
        }));
        
        // ✅ Wait for fresh data from backend to ensure accuracy before redirect
        try {
          await dispatch(fetchSellerProfile()).unwrap();
          console.log('✅ Fetch complete, navigating...');
        } catch (fetchErr) {
          console.warn('⚠️ Fetch error but continuing:', fetchErr);
        }
        
        toast.success('บันทึกข้อมูลสำเร็จ');
        
        // ✅ Redirect to seller dashboard after fetch completes
        navigate('/seller');
      } else {
        throw new Error(json.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (err: any) {
      console.error('Save profile error:', err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const maskIdCard = (id: string) => {
    if (!id || id.length < 13) return id;
    return `x-xxxx-xxxxx-xx-${id.slice(-4)}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="bg-[#f5f5f5] p-4 lg:p-8 min-h-[calc(100vh-4rem)] rounded-xl font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-[12px] border border-[#e0e0e0] p-6 lg:p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-800 mb-8 text-center">แก้ไขข้อมูลร้านค้าและข้อมูลส่วนตัว</h2>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* SECTION 1: ข้อมูลร้านค้า */}
          <section>
            <h3 className="text-lg font-bold text-[#1a6e40] mb-5 border-b border-neutral-100 pb-2">🏪 ข้อมูลร้านค้า</h3>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-inner border border-emerald-50 overflow-hidden">
                  {formData.shopAvatar ? (
                    <img src={formData.shopAvatar} alt="Shop avatar" className="w-full h-full object-cover" />
                  ) : (
                    formData.shopName?.[0] || 'ร'
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleChangeImageClick}
                  disabled={uploading}
                  className="text-sm font-medium text-[#1a6e40] hover:text-[#166534] hover:underline disabled:opacity-50"
                >
                  {uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}
                </button>
                {/* ✅ Hidden file input for image upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">ชื่อร้าน</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">ประเภทสินค้าหลัก</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow bg-white"
                  >
                    <option value="ผลไม้สด">ผลไม้สด</option>
                    <option value="ผลไม้แปรรูป">ผลไม้แปรรูป</option>
                    <option value="ผลไม้นำเข้า">ผลไม้นำเข้า</option>
                    <option value="ผักสด">ผักสด</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1">คำอธิบายร้าน</label>
              <textarea
                name="shopDescription"
                value={formData.shopDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
              />
            </div>
          </section>

          {/* SECTION 2: ข้อมูลส่วนตัวเจ้าของร้าน */}
          <section>
            <h3 className="text-lg font-bold text-[#1a6e40] mb-5 border-b border-neutral-100 pb-2">👤 ข้อมูลส่วนตัวเจ้าของร้าน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-neutral-500 mb-1">ชื่อ</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] text-neutral-500 mb-1">นามสกุล</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] text-neutral-500 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] text-neutral-500 mb-1">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] bg-[#f5f5f5] text-[#999] cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] text-neutral-500 mb-1">เลขบัตรประชาชน</label>
                <input
                  type="text"
                  value={maskIdCard(formData.idCard)}
                  disabled
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] bg-[#f5f5f5] text-[#999] cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: ที่ตั้งร้านค้า (GPS) */}
          <section>
            <h3 className="text-lg font-bold text-[#1a6e40] mb-5 border-b border-neutral-100 pb-2">📍 ที่ตั้งร้านค้า (GPS)</h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] text-neutral-500">ปักหมุดบนแผนที่ (สามารถลากหมุดเพื่อเปลี่ยนตำแหน่งได้)</label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  📍 ใช้ตำแหน่งปัจจุบัน
                </button>
              </div>
              
              <div className="h-[300px] w-full rounded-[10px] overflow-hidden border border-[#e0e0e0] z-0">
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <DraggableMarker position={position} setPosition={setPosition} />
                  <MapUpdater center={position} />
                </MapContainer>
              </div>
              <p className="text-xs text-neutral-400 mt-2 text-right font-mono">
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] text-neutral-500 mb-1">ที่อยู่รายละเอียด</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">ตำบล/แขวง</label>
                  <input
                    type="text"
                    name="subDistrict"
                    value={formData.subDistrict}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">อำเภอ/เขต</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-neutral-500 mb-1">รหัสไปรษณีย์</label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pt-6 mt-6 flex flex-col sm:flex-row gap-3 border-t border-neutral-100">
            <button
              type="submit"
              className="flex-1 bg-[#1a6e40] hover:bg-[#166534] text-white py-3 rounded-lg font-bold transition-colors"
            >
              บันทึกข้อมูล
            </button>
            <button
              type="button"
              onClick={() => navigate('/seller')}
              className="flex-1 bg-white border border-[#e0e0e0] text-neutral-700 hover:bg-neutral-50 py-3 rounded-lg font-bold transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
