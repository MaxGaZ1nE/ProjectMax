import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '@services/backend-api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('ลิงก์นี้ไม่ถูกต้อง');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!token) {
      setError('ลิงก์นี้ไม่ถูกต้อง');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword({
        token,
        new_password: password,
      });

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // ไปหน้า login หลัง 2 วินาที
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errMsg);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-gray-600 mb-6">
            กรอกรหัสผ่านใหม่ของคุณ
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-700">
                <p className="font-semibold mb-2">✅ รีเซ็ตสำเร็จ</p>
                <p className="text-sm mb-4">
                  รหัสผ่านของคุณได้รับการอัปเดตแล้ว
                </p>
                <p className="text-xs text-gray-500">
                  กำลังไปหน้า login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!token && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  ⚠️ ลิงก์นี้ไม่ถูกต้อง กรุณาลองขอรีเซ็ตใหม่
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading || !token}
                />
              </div>

              {/* Password strength indicator */}
              <div className="text-xs text-gray-600">
                {password && (
                  <div>
                    {password.length < 6 && (
                      <p className="text-red-600">❌ ต้องมีความยาว 6+ ตัวอักษร</p>
                    )}
                    {password.length >= 6 && password === confirmPassword && (
                      <p className="text-green-600">✅ รหัสผ่านตรงกัน</p>
                    )}
                    {password.length >= 6 && password !== confirmPassword && (
                      <p className="text-red-600">❌ รหัสผ่านไม่ตรงกัน</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token || !password || !confirmPassword}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'กำลังประมวลผล...' : 'รีเซ็ตรหัสผ่าน'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                กลับไปหน้า login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
