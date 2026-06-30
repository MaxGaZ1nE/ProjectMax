import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@services/backend-api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    try {
      setLoading(true);
      await authAPI.forgotPassword({ email: email.trim() });
      
      setSuccess(true);
      setEmail('');
      
      // ไปหน้า login หลัง 3 วินาที
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(message);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ลืมรหัสผ่าน?</h1>
          <p className="text-gray-600 mb-6">
            ใส่ที่อยู่อีเมลของคุณ และเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-700">
                <p className="font-semibold mb-2">✅ ส่งสำเร็จ</p>
                <p className="text-sm mb-4">
                  เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง {email}
                </p>
                <p className="text-xs text-gray-600">
                  กรุณาตรวจสอบอีเมลของคุณ (อาจอยู่ในโฟลเดอร์ Spam)
                </p>
                <p className="text-xs text-gray-500 mt-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              จำรหัสผ่านแล้ว?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
