import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourierNavbar from '@/components/delivery/CourierNavbar';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-[#1a6e40] focus:ring-2 focus:ring-[#1a6e40]/20 dark:focus:border-[#1a6e40] dark:focus:ring-[#1a6e40]/30';

const btnClass =
  'bg-[#1a6e40] hover:bg-[#166534] text-white font-medium py-3 rounded-lg transition-colors shadow-sm';

const btnCancelClass =
  'bg-white border border-[#e0e0e0] hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-lg transition-colors shadow-sm';

export interface CourierProfile {
  id: string;
  phone: string;
  email: string;
  fullName: string;
  vehicleType?: string;
  licensePlateNumber?: string;
  idCardNumber?: string;
  status?: string;
}

export default function CourierEditProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(2); // Default to profile tab (index 2)

  // Profile form states
  const [formData, setFormData] = useState({
    phone: '',
    vehicleType: '',
    licensePlateNumber: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const json = await res.json();
        if (json.data) {
          setFormData({
            phone: json.data.phone || '',
            vehicleType: json.data.vehicleType || '',
            licensePlateNumber: json.data.licensePlateNumber || '',
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
  }, []);

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
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch('http://localhost:5000/api/courier/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          licensePlateNumber: formData.licensePlateNumber,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccessMessage('อัปเดตข้อมูลโปรไฟล์สำเร็จ');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 0, label: 'งานใหม่', icon: '📋' },
    { id: 1, label: 'ประวัติ', icon: '📜' },
    { id: 2, label: 'โปรไฟล์', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-3xl mx-auto px-4 mt-8">
        {/* Tabs */}
        <div className="bg-white rounded-t-[12px] border-b border-[#e0e0e0] shadow-sm">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1a6e40] text-[#1a6e40] font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-[12px] p-8 shadow-sm border border-t-0 border-[#e0e0e0]">
          {/* Tab 0: New Jobs */}
          {activeTab === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">📋 ยังไม่มีงานใหม่ในตอนนี้</p>
              <p className="text-neutral-400 text-sm mt-2">กรุณาตรวจสอบภายหลัง</p>
            </div>
          )}

          {/* Tab 1: History */}
          {activeTab === 1 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">📜 ยังไม่มีประวัติการจัดส่ง</p>
              <p className="text-neutral-400 text-sm mt-2">ประวัติจะปรากฏที่นี่เมื่อคุณดำเนินการจัดส่ง</p>
            </div>
          )}

          {/* Tab 2: Profile */}
          {activeTab === 2 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">👤 ไปที่หน้าแก้ไขโปรไฟล์</p>
              <button
                onClick={() => navigate('/courier/profile/edit')}
                className={`mt-4 ${btnClass} px-6`}
              >
                แก้ไขโปรไฟล์
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
