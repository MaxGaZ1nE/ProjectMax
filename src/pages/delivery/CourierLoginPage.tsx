import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-[#1a6e40] focus:ring-2 focus:ring-[#1a6e40]/20 dark:focus:border-[#1a6e40] dark:focus:ring-[#1a6e40]/30';

const btnClass =
  'w-full bg-[#1a6e40] hover:bg-[#166534] disabled:bg-neutral-400 text-white font-medium py-3 rounded-lg transition-colors shadow-sm';

export default function CourierLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      const token: string = json.data?.token;
      const role: string = json.data?.role;

      if (role !== 'courier') {
        setError('บัญชีนี้ไม่ใช่บัญชี Courier');
        return;
      }

      localStorage.setItem('token', token);
      navigate('/profile/delivery');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ';
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
          <div className="text-5xl mb-2">🚚</div>
          <h1 className="text-2xl font-bold text-[#1a6e40]">เข้าสู่ระบบ Courier</h1>
          <p className="text-sm text-neutral-500 mt-1">QINO Fruit Store — ระบบผู้ส่ง</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-[#e0e0e0]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                อีเมล
              </label>
              <input
                id="courier-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="courier@example.com"
                className={inputClass}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="courier-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className={inputClass}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  disabled={loading}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="courier-login-btn"
              type="submit"
              disabled={loading}
              className={btnClass}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              ยังไม่มีบัญชี?{' '}
              <Link
                to="/delivery/register"
                className="text-[#1a6e40] hover:text-[#166534] font-semibold transition-colors"
              >
                สมัครเป็นผู้ส่ง
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
