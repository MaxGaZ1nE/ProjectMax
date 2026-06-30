import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/backend-api';

interface OTPVerificationPageProps {
  email?: string;
  onSuccess?: () => void;
}

const OTPVerificationPage: React.FC<OTPVerificationPageProps> = ({
  email,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Start resend timer (60 seconds)
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!otp || otp.length !== 6) {
      toast.error('กรุณากรอก OTP 6 หลัก');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error('OTP ต้องเป็นตัวเลข 6 หลัก');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP({
        otp_code: otp,
      });

      if (response.data?.success) {
        toast.success('ยืนยัน OTP สำเร็จ');
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to profile or home
          setTimeout(() => navigate('/profile'), 1500);
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'ยืนยัน OTP ไม่สำเร็จ';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || resendTimer > 0) return;

    try {
      const response = await authAPI.resendOTP();
      if (response.data?.success) {
        toast.success('ส่ง OTP ไปยังอีเมลแล้ว');
        setOtp('');
        setCanResend(false);
        setResendTimer(60);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'ส่ง OTP ไม่สำเร็จ';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-4xl font-bold text-green-600">🍎</div>
            <p className="text-sm text-gray-600 mt-2">QINO Fruit Store</p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ยืนยัน OTP</h1>
          <p className="text-gray-600 mb-6">
            ได้รับรหัส OTP แล้วหรือ?
            {email && (
              <>
                <br />
                <span className="text-sm font-medium text-gray-900">{email}</span>
              </>
            )}
          </p>

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัส OTP (6 หลัก)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-2 text-2xl text-center tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 disabled:bg-gray-100"
              />
              <small className="block text-xs text-gray-500 mt-2">
                {otp.length}/6 ตัวอักษร
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">ไม่ได้รับรหัส?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || resendTimer > 0}
              className="text-green-600 hover:text-green-700 disabled:text-gray-400 font-medium text-sm transition duration-200"
            >
              {resendTimer > 0
                ? `ส่งใหม่อีกครั้ง (${resendTimer}s)`
                : 'ส่ง OTP ใหม่'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900 transition duration-200"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
