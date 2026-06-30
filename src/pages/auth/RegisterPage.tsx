import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import './register.css';
import basket from '@/assets/Logo.png';

type Step = 1 | 2 | 3;

function setGlobalAuthToken(token: string) {
  localStorage.setItem('token', token);
}

function extractTokenFromRegisterResponse(res: any): string | null {
  // รองรับหลายรูปแบบ response ที่พบบ่อย
  // 1) res.token
  // 2) res.data.token
  // 3) res.data.data.token
  const t =
    res?.token ||
    res?.data?.token ||
    res?.data?.data?.token ||
    res?.data?.data?.data?.token; // กันกรณีซ้อนอีกชั้น

  return typeof t === 'string' && t.length > 0 ? t : null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const title = useMemo(() => {
    if (step === 1) return { label: 'Step 1', title: 'สมัครสมาชิกใหม่' };
    if (step === 2) return { label: 'Step 2', title: 'กรอกรหัสยืนยันตัวตน' };
    return { label: 'Step 3', title: 'ข้อมูลสมัครสมาชิกใหม่' };
  }, [step]);

  const goNext = async () => {
    if (step === 1) {
      if (!phone.trim()) {
        setError('กรุณากรอกเบอร์โทรศัพท์');
        return;
      }
      if (!/^[0-9]{8,}$/.test(phone.trim())) {
        setError('กรุณากรอกหมายเลขโทรศัพท์อย่างน้อย 8 หลัก');
        return;
      }

      // Send OTP to phone
      try {
        setIsLoading(true);
        setError(null);
        
        const { apiClient } = await import('@/services/backend-api').then(m => m.default);
        const response = await apiClient.post('/auth/send-registration-otp', {
          phone: phone.trim(),
        });

        if (response.data?.success) {
          setError(null);
          setGeneratedOtp(response.data?.data?.otp || null);
          setOtp(['', '', '', '', '', '']); // Reset OTP input
          setStep(2);
          setTimeout(() => otpRefs.current[0]?.focus(), 50);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'ไม่สามารถส่ง OTP ได้';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 2) {
      const code = otp.join('');
      if (code.length !== 6) {
        setError('กรุณากรอก OTP 6 หลัก');
        return;
      }

      // Verify OTP
      try {
        setIsLoading(true);
        setError(null);
        
        const { apiClient } = await import('@/services/backend-api').then(m => m.default);
        const response = await apiClient.post('/auth/verify-registration-otp', {
          phone: phone.trim(),
          otp_code: code,
        });

        if (response.data?.success) {
          setError(null);
          setStep(3);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'ยืนยัน OTP ไม่สำเร็จ';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 3) {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) return setError('กรุณากรอกชื่อ-นามสกุล');
    if (!email.trim()) return setError('กรุณากรอก Email');
    if (!password.trim()) return setError('กรุณากรอกรหัสผ่าน');
    if (password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    if (password !== confirmPassword) return setError('รหัสผ่านไม่ตรงกัน');

    try {
      setIsLoading(true);
      setError(null);

      const firstName = fullName.trim().split(' ')[0] || '';
      const lastName = fullName.trim().split(' ').slice(1).join(' ');

      // Register and use normalized auth payload from AuthContext
      const res = await register(
        email.trim(),
        phone.trim(),
        password,
        firstName,
        lastName || '',
        'customer'
      );

      // Token should already be available from register response
      let token = extractTokenFromRegisterResponse(res);

      if (!token) {
        throw new Error('สมัครสำเร็จ แต่ไม่พบ token สำหรับเข้าสู่ระบบอัตโนมัติ');
      }

      setGlobalAuthToken(token);

      // 3) ไปหน้าใช้งานจริง
      navigate('/');
    } catch (err: any) {
      console.error('REGISTER ERROR:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.details ||
        err?.message ||
        'สมัครไม่สำเร็จ';
      setError(String(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    // if (step === 3) setStep(2);
  };

  const setOtpAt = (idx: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const onOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const onOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;

    e.preventDefault();
    const arr = text.split('');
    setOtp([arr[0] || '', arr[1] || '', arr[2] || '', arr[3] || '', arr[4] || '', arr[5] || '']);
    const nextIndex = Math.min(text.length, 6) - 1;
    setTimeout(() => otpRefs.current[nextIndex]?.focus(), 0);
  };

  return (
    <div className="reg-shell">
      <div className="reg-left">
        <div className="reg-mark">
          <img className="reg-logoOnly" src={basket} alt="Fruit basket logo" />
        </div>
      </div>

      <div className="reg-right">
        <div className="reg-card">
          <div className="reg-stepper" aria-hidden="true">
            <span className={step === 1 ? 'dot active' : 'dot'} />
            <span className="line" />
            <span className={step === 2 ? 'dot active' : 'dot'} />
            <span className="line" />
            <span className={step === 3 ? 'dot active' : 'dot'} />
          </div>

          <div className="reg-head">
            <div className="reg-stepLabel">{title.label}</div>
            <div className="reg-title">{title.title}</div>
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="reg-form">
              <label className="reg-label">Phone number *</label>
              <input
                className="reg-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (e.g. 0812345678)"
              />

              <button className="reg-btn" type="button" onClick={goNext}>
                ต่อไป
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="reg-form">
              <div className="reg-hint">
                ระบบส่งรหัส OTP ไปที่ <b>{phone}</b>
              </div>

              {generatedOtp && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    📱 รหัส OTP สำหรับทดสอบ:
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#ff6b6b',
                    letterSpacing: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {generatedOtp}
                  </div>
                </div>
              )}

              <label className="reg-label">OTP *</label>

              <div className="otp-row">
                {otp.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    className="otp-box"
                    inputMode="numeric"
                    value={d}
                    onChange={(e) => setOtpAt(idx, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(idx, e)}
                    onPaste={onOtpPaste}
                  />
                ))}
              </div>

              <button className="reg-btn" type="button" onClick={goNext}>
                ต่อไป
              </button>

              <button
                type="button"
                className="reg-linkBtn"
                onClick={() => {
                  // TODO: resend OTP จริง
                  alert('ส่ง OTP อีกครั้งแล้ว (mock)');
                }}
              >
                ส่งอีกครั้ง
              </button>

              <button type="button" className="reg-linkBtn" onClick={goBack}>
                ย้อนกลับ
              </button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="reg-form">
              <label className="reg-label">ชื่อ-นามสกุล *</label>
              <input
                className="reg-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name lastname"
              />

              <label className="reg-label">Email *</label>
              <input
                className="reg-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
              />

              <label className="reg-label">Password *</label>
              <div className="pw-wrap">
                <input
                  className="reg-input pw-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <label className="reg-label">Confirm Password *</label>
              <div className="pw-wrap">
                <input
                  className="reg-input pw-input"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>

              <button className="reg-btn" type="button" onClick={goNext} disabled={isLoading}>
                {isLoading ? 'กำลังสมัคร...' : 'สมัคร'}
              </button>
            </div>
          )}

          <div className="reg-links">
            <Link className="reg-link" to="/auth/login">
              เข้าสู่ระบบ
            </Link>
            <Link className="reg-link" to="#">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}