import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './change-password.css';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
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
      setError('กรุณากรอกรหัสผ่านเดิม');
      return;
    }
    if (!newPassword.trim()) {
      setError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (!confirmPassword.trim()) {
      setError('กรุณายืนยันรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (currentPassword === newPassword) {
      setError('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม');
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
        confirmPassword: confirmPassword.trim(),
      });

      if (response.data?.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Show success message and redirect after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError((response.data as any)?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'เปลี่ยนรหัสผ่านไม่สำเร็จ';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>เปลี่ยนรหัสผ่าน</h1>
          <p>โปรดกรอกรหัสผ่านเดิมและรหัสผ่านใหม่</p>
        </div>

        {error && <div className="cp-error-message">{error}</div>}
        {success && (
          <div className="cp-success-message">
            ✅ เปลี่ยนรหัสผ่านสำเร็จ! กำลังเปลี่ยนหน้า...
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-password-form">
          {/* Current Password */}
          <div className="cp-form-group">
            <label htmlFor="currentPassword">รหัสผ่านเดิม *</label>
            <div className="cp-password-wrapper">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านเดิม"
                disabled={isLoading}
              />
              <button
                type="button"
                className="cp-toggle-password"
                onClick={() => setShowCurrent(!showCurrent)}
                disabled={isLoading}
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="cp-form-group">
            <label htmlFor="newPassword">รหัสผ่านใหม่ *</label>
            <div className="cp-password-wrapper">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่"
                disabled={isLoading}
              />
              <button
                type="button"
                className="cp-toggle-password"
                onClick={() => setShowNew(!showNew)}
                disabled={isLoading}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="cp-form-group">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่ *</label>
            <div className="cp-password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่"
                disabled={isLoading}
              />
              <button
                type="button"
                className="cp-toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isLoading}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="cp-button-group">
            <button
              type="submit"
              className="cp-button cp-button-primary"
              disabled={isLoading}
            >
              {isLoading ? '⏳ กำลังดำเนินการ...' : '💾 บันทึกเปลี่ยนแปลง'}
            </button>
            <button
              type="button"
              className="cp-button cp-button-secondary"
              onClick={() => navigate('/profile')}
              disabled={isLoading}
            >
              ❌ ยกเลิก
            </button>
          </div>
        </form>

        <div className="cp-info-box">
          <p>💡 <strong>เคล็ดลับ:</strong></p>
          <ul>
            <li>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</li>
            <li>รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม</li>
            <li>หลังจากเปลี่ยนรหัสผ่านแล้ว คุณต้อง login ใหม่</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
