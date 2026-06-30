import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/contexts/AuthContext';
import CourierNavbar from '@/components/delivery/CourierNavbar';

interface CourierProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType?: string;
  licensePlateNumber?: string;
  vehicleRegisteredName?: string;
  status?: string;
  role?: string;
}

export default function CourierEditProfilePage() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  // Get token from context
  const token = authContext?.token;

  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    vehicleType: '',
    licensePlateNumber: '',
    vehicleRegisteredName: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;

      try {
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.data?.data) {
          const profileData = res.data.data as CourierProfile;
          setProfile(profileData);
          setFormData({
            phone: profileData.phone || '',
            vehicleType: profileData.vehicleType || '',
            licensePlateNumber: profileData.licensePlateNumber || '',
            vehicleRegisteredName: profileData.vehicleRegisteredName || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!formData.vehicleType.trim()) {
      setError('กรุณาเลือกประเภทรถ');
      return;
    }
    if (!formData.licensePlateNumber.trim()) {
      setError('กรุณากรอกเลขทะเบียน');
      return;
    }

    setSaving(true);
    try {
      if (!token) {
        setError('ไม่มีสิทธิ์ในการแก้ไข');
        return;
      }

      const res = await axios.patch(
        'http://localhost:5000/api/courier/profile',
        {
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          licensePlateNumber: formData.licensePlateNumber,
          vehicleRegisteredName: formData.vehicleRegisteredName,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (res.data?.data) {
        setSuccessMessage('✅ บันทึกข้อมูลสำเร็จแล้ว');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
      } else {
        setError('เกิดข้อผิดพลาดในการบันทึก');
      }
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'รอการอนุมัติ', color: 'bg-amber-100 text-amber-800' },
      approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'ปฏิเสธ', color: 'bg-rose-100 text-rose-800' },
      active: { label: 'ใช้งานได้', color: 'bg-green-100 text-green-800' },
    };
    const statusInfo = statusMap[status || 'active'] || { label: 'ไม่ทราบ', color: 'bg-neutral-100 text-neutral-800' };
    return statusInfo;
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
        <CourierNavbar />
        <div className="max-w-2xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-[12px] p-8 shadow-sm border border-[#e0e0e0] text-center">
            <p className="text-neutral-500">⏳ กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[12px] p-8 shadow-sm border border-[#e0e0e0]">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition"
            >
              ← ย้อนกลับ
            </button>
            <h1 className="text-3xl font-bold text-neutral-800">👤 แก้ไขโปรไฟล์</h1>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-sm mb-6 border border-rose-100">
              ❌ {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm mb-6 border border-green-100">
              {successMessage}
            </div>
          )}

          {profile && (
            <>
              {/* Display Only Fields */}
              <div className="mb-8 pb-8 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-700 mb-4">📋 ข้อมูลพื้นฐาน (อ่านเท่านั้น)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50 text-neutral-600">
                      {profile.fullName || 'ไม่มีข้อมูล'}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      อีเมล
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50 text-neutral-600">
                      {profile.email || 'ไม่มีข้อมูล'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      สถานะ
                    </label>
                    <div className={`inline-block px-3 py-1.5 rounded-lg font-medium text-sm ${getStatusBadge(profile.status).color}`}>
                      {getStatusBadge(profile.status).label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <form onSubmit={handleSubmit}>
                <h2 className="text-lg font-semibold text-neutral-700 mb-4">🚗 ข้อมูลรถ</h2>

                <div className="space-y-5 mb-8">
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                      📱 เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="เช่น 0812345678"
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                      required
                    />
                    <p className="text-xs text-neutral-400 mt-1">ใช้สำหรับติดต่อเกี่ยวกับการจัดส่ง</p>
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label htmlFor="vehicleType" className="block text-sm font-medium text-neutral-700 mb-2">
                      🚗 ประเภทรถ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                      required
                    >
                      <option value="">-- เลือกประเภทรถ --</option>
                      <option value="motorcycle">🏍️ มอเตอร์ไซค์</option>
                      <option value="car">🚗 รถยนต์</option>
                      <option value="van">🚐 รถตู้</option>
                      <option value="pickup">🚙 รถกระบะ</option>
                      <option value="truck">🚚 รถบรรทุก</option>
                    </select>
                  </div>

                  {/* License Plate Number */}
                  <div>
                    <label htmlFor="licensePlateNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                      🏷️ เลขทะเบียนรถ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="licensePlateNumber"
                      type="text"
                      name="licensePlateNumber"
                      value={formData.licensePlateNumber}
                      onChange={handleChange}
                      placeholder="เช่น ขค 1234 กรุงเทพมหานคร"
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                      required
                    />
                  </div>

                  {/* Vehicle Registered Name */}
                  <div>
                    <label htmlFor="vehicleRegisteredName" className="block text-sm font-medium text-neutral-700 mb-2">
                      📝 ชื่อผู้ลงทะเบียนรถ (ไม่จำเป็น)
                    </label>
                    <input
                      id="vehicleRegisteredName"
                      type="text"
                      name="vehicleRegisteredName"
                      value={formData.vehicleRegisteredName}
                      onChange={handleChange}
                      placeholder="เช่น นายสมชาย ใจดี"
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow"
                    />
                    <p className="text-xs text-neutral-400 mt-1">ชื่อบนใบอนุญาตจดทะเบียนรถ</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#1a6e40] hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
                  >
                    {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-white border border-[#e0e0e0] hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-lg transition-colors shadow-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
