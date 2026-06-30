import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordTab() {
  const { i18n } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!currentPassword.trim()) {
      setError(i18n.language === 'th' ? 'กรุณากรอกรหัสผ่านเดิม' : 'Please enter current password');
      return;
    }
    if (!newPassword.trim()) {
      setError(i18n.language === 'th' ? 'กรุณากรอกรหัสผ่านใหม่' : 'Please enter new password');
      return;
    }
    if (!confirmPassword.trim()) {
      setError(i18n.language === 'th' ? 'กรุณายืนยันรหัสผ่านใหม่' : 'Please confirm new password');
      return;
    }
    if (newPassword.length < 6) {
      setError(i18n.language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(i18n.language === 'th' ? 'รหัสผ่านใหม่ไม่ตรงกัน' : 'Passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setError(i18n.language === 'th' ? 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม' : 'New password must be different from current password');
      return;
    }

    try {
      setIsLoading(true);
      const apiClient = await import('@/services/backend-api').then(
        (m) => m.default
      );

      const response: any = await apiClient.authAPI.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: newPassword.trim(),
      });

      if (response.data?.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError((response.data as any)?.message || (i18n.language === 'th' ? 'เปลี่ยนรหัสผ่านไม่สำเร็จ' : 'Failed to change password'));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (i18n.language === 'th' ? 'เปลี่ยนรหัสผ่านไม่สำเร็จ' : 'Failed to change password');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          ✅ {i18n.language === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ!' : 'Password changed successfully!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {i18n.language === 'th' ? 'รหัสผ่านเดิม' : 'Current Password'} *
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={i18n.language === 'th' ? 'กรอกรหัสผ่านเดิม' : 'Enter current password'}
              disabled={isLoading}
              className="w-full h-10 px-4 pr-12 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              {showCurrent ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {i18n.language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'} *
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={i18n.language === 'th' ? 'กรอกรหัสผ่านใหม่' : 'Enter new password'}
              disabled={isLoading}
              className="w-full h-10 px-4 pr-12 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-50"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              {showNew ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {i18n.language === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'} *
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={i18n.language === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm new password'}
              disabled={isLoading}
              className="w-full h-10 px-4 pr-12 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              {showConfirm ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            💡 {i18n.language === 'th' ? 'เคล็ดลับ:' : 'Tips:'}
          </p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✓ {i18n.language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters'}</li>
            <li>✓ {i18n.language === 'th' ? 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม' : 'New password must be different'}</li>
            <li>✓ {i18n.language === 'th' ? 'ใช้รหัสผ่านที่ยากและปลอดภัย' : 'Use a strong and secure password'}</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '⏳ ' + (i18n.language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...') : '💾 ' + (i18n.language === 'th' ? 'บันทึกเปลี่ยนแปลง' : 'Save Changes')}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setError(null);
            }}
            disabled={isLoading}
            className="px-6 py-2 bg-neutral-200 text-neutral-800 text-sm font-medium rounded-lg hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {i18n.language === 'th' ? 'ล้างฟอร์ม' : 'Clear'}
          </button>
        </div>
      </form>
    </div>
  );
}
