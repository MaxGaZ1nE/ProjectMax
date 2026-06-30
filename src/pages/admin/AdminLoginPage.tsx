import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { login } from '@slices/auth-slice';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

const buttonClass =
  'w-full rounded-lg bg-primary-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-700 ' +
  'transition disabled:opacity-50 disabled:cursor-not-allowed';

export default function AdminLoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => (state as any).auth?.user);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ถ้า login แล้ว ให้ไป admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!adminId.trim() || !password.trim()) {
        throw new Error('กรุณากรอก Admin ID และรหัสผ่าน');
      }

      // เรียก backend login endpoint
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: adminId.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      const { user, token } = result.data;

      dispatch(
        login({
          user,
          token,
        })
      );

      // บันทึก token เข้า localStorage
      localStorage.setItem('token', token);

      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-neutral-900">🔐 Admin Panel</div>
          <p className="text-sm text-neutral-600">เข้าสู่ระบบจัดการ Qino Fruit Store</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-neutral-900 mb-1.5 block">
              Admin ID
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="กรุณากรอก Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-900 mb-1.5 block">
              รหัสผ่าน
            </label>
            <input
              type="password"
              className={inputClass}
              placeholder="กรุณากรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className={buttonClass} disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Test Credentials */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <strong>🧪 ข้อมูลทดสอบ:</strong>
          <div className="mt-1">
            Admin ID: <code className="bg-blue-100 px-2 py-0.5 rounded">admin</code>
          </div>
          <div className="mt-0.5">
            รหัสผ่าน: <code className="bg-blue-100 px-2 py-0.5 rounded">admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
