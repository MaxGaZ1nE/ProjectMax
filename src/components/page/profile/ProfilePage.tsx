import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { updateProfile } from '@/slices/auth-slice';

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

const inputClass =
  'mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm ' +
  'outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

const labelClass = 'text-sm font-medium text-neutral-700';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const displayFullName = useMemo(() => {
    const fn = (user?.firstName ?? '').trim();
    const ln = (user?.lastName ?? '').trim();
    const combined = `${fn} ${ln}`.trim();
    return combined || (user?.name ?? '');
  }, [user]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    setFullName(displayFullName);
    setPhone(user?.phone ?? '');
    setAddress(user?.address ?? '');
  }, [user, displayFullName]);

  const onSave = () => {
    const { firstName, lastName } = splitFullName(fullName);

    dispatch(
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })
    );
  };

  if (!user) return <div className="py-10 text-center text-neutral-700">กรุณาเข้าสู่ระบบก่อน</div>;

  return (
    <div className="py-10">
      <div className="max-w-xl mx-auto px-4">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-neutral-900">ข้อมูลส่วนตัว</h1>
          <p className="mt-1 text-sm text-neutral-600">
            แก้ไขข้อมูลสำหรับติดต่อและจัดส่งสินค้า
          </p>
        </div>

        {/* ใช้ card ของคุณเพื่อให้มีมิติ */}
        <div className="card space-y-5">
          <div>
            <label className={labelClass}>ชื่อผู้รับ</label>
            <input
              type="text"
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="เช่น สมชาย ใจดี"
            />
          </div>

          <div>
            <label className={labelClass}>เบอร์โทร</label>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="เช่น 08x-xxx-xxxx"
            />
          </div>

          <div>
            <label className={labelClass}>ที่อยู่จัดส่ง</label>
            <textarea
              className={[
                inputClass,
                'min-h-[110px] resize-y',
              ].join(' ')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="shipping street-address"
              placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
            />
          </div>

          <div className="pt-2">
            {/* ใช้ btn + btn-primary ที่มีอยู่แล้ว */}
            <button
              type="button"
              onClick={onSave}
              className="btn btn-primary w-full"
            >
              บันทึกข้อมูล
            </button>

            <div className="mt-2 text-xs text-neutral-500">
              ตรวจสอบให้ถูกต้อง เพื่อให้จัดส่งได้เร็วขึ้น
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}