import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourierNavbar from '@/components/delivery/CourierNavbar';

export default function CourierChangePasswordPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const toggleShow = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Password Strength Logic
  const getPasswordStrength = () => {
    const pwd = formData.newPassword;
    if (!pwd) return { label: 'ไม่มี', color: 'bg-neutral-200', width: 'w-0' };
    if (pwd.length < 8) return { label: 'อ่อน', color: 'bg-rose-500', width: 'w-1/3' };
    
    // Check for mix of letters and numbers
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLetters && hasNumbers && hasSpecial) {
      return { label: 'แข็งแกร่ง', color: 'bg-[#1a6e40]', width: 'w-full' };
    }
    if (hasLetters && hasNumbers) {
      return { label: 'ปานกลาง', color: 'bg-amber-500', width: 'w-2/3' };
    }
    return { label: 'อ่อน', color: 'bg-rose-500', width: 'w-1/3' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Simulate API update
    alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    navigate('/delivery/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[12px] p-8 shadow-sm border border-[#e0e0e0]">
          <h2 className="text-2xl font-bold text-neutral-800 text-center mb-6">🔑 เปลี่ยนรหัสผ่าน</h2>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">รหัสผ่านปัจจุบัน</label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShow('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword.current ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword.new ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1 text-neutral-500">
                    <span>ความแข็งแกร่งของรหัสผ่าน:</span>
                    <span className="font-semibold" style={{ color: strength.color.replace('bg-', 'text-').replace('-500', '-600') }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden flex">
                    <div className={`h-full ${strength.width} ${strength.color} transition-all duration-300`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#1a6e40] focus:border-transparent transition-shadow pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword.confirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#1a6e40] hover:bg-[#166534] text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
              >
                เปลี่ยนรหัสผ่าน
              </button>
              <button
                type="button"
                onClick={() => navigate('/delivery/dashboard')}
                className="flex-1 bg-white border border-[#e0e0e0] hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-lg transition-colors shadow-sm"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
