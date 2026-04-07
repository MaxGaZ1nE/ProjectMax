import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './register.css';
import basket from '@/assets/Logo.png';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);

  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
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

  const goNext = () => {
    if (step === 1) {
      if (!username.trim()) return;
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
      return;
    }
    if (step === 2) {
      const code = otp.join('');
      if (code.length !== 6) return;
      // TODO: ตรวจ OTP จริง
      // ตอนนี้ให้ผ่านไป Step 3 ไว้ก่อน (คุณจะทำต่อทีหลัง)
      // setStep(3);
      setStep(3);
      return;
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

          {/* STEP 1 */}
          {step === 1 && (
            <div className="reg-form">
              <label className="reg-label">Phone number/Username *</label>
              <input
                className="reg-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Phone number/Username *"
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
                ระบบส่งรหัส OTP ไปที่ <b>{username}</b>
              </div>

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

    <button className="reg-btn" type="button" onClick={() => alert('สมัคร (mock)')}>
      สมัคร
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