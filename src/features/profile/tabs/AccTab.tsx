import { useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@stores/index';
import type { RootState } from '@stores/root-reducer';
import { useAuth } from '@contexts/AuthContext';
import type { Gender } from '@/slices/auth-slice';

const inputClass =
  'w-full h-10 rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';
const inputReadOnlyClass = 'bg-neutral-50 text-neutral-700 cursor-not-allowed';
const labelClass = 'text-xs text-neutral-600 mb-1';

export default function AccountTab() {
  const { i18n } = useTranslation();
  const { user, updateProfile: updateProfileAPI } = useAuth();
  const sellerProfile = useAppSelector((s: RootState) => s.seller?.profile ?? null);
  const isSeller = !!sellerProfile?.isSeller;

  const [editingAccount, setEditingAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender>('');

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!user) return;
    startTransition(() => {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setBirthDate(
  user.birthDate
    ? user.birthDate.split('T')[0]: '');
      setPhone(user.phone ?? '');
      const userGender = user.gender ?? '';
      console.log('💾 Loading user data - gender:', userGender, 'type:', typeof userGender); // ✅ Debug
      setGender(userGender as Gender);
    });
  }, [user]);const onCancelAccount = () => {
  if (!user) return;

  setFirstName(user.firstName ?? '');
  setLastName(user.lastName ?? '');
  setBirthDate(
    user.birthDate ? user.birthDate.split('T')[0] : ''
  );
  setPhone(user.phone ?? '');
  setGender((user.gender ?? '') as Gender);

  setEditingAccount(false);
  setError(null);
};


  if (!user) return null;

  const onSaveAccount = async () => {
  try {
    setLoading(true);
    setError(null);

    const payload = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      birth_date: birthDate || null,
      phone: phone.trim() || undefined,
      gender: gender || null,
    };

    console.log("📤 SEND DATA:", payload);
    

    await updateProfileAPI(payload);

    console.log("✅ UPDATE SUCCESS");

    setEditingAccount(false);

  } catch (err: unknown) {
    console.error("❌ UPDATE ERROR:", err);

    let message = "อัปเดตโปรไฟล์ไม่สำเร็จ";
    if (err instanceof Error) {
      message = err.message;
    }

    setError(message);

  } finally {
    setLoading(false);
  }
};



  return (
    <div>

      <div className="flex items-center justify-end mb-4">
        {error && (
  <div className="mt-4 text-sm text-red-500">
    {error}
  </div>
)}

{loading && (
  <div className="mt-2 text-sm text-gray-500">
    กำลังบันทึก...
  </div>
)}
        {!editingAccount ? (
          <button
            type="button"
            onClick={() => setEditingAccount(true)}
            className="h-10 px-6 rounded-sm border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            {i18n.language === 'th' ? 'แก้ไข' : 'Edit'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className={labelClass}>{i18n.language === 'th' ? 'ชื่อ' : 'First Name'}</div>
          <input
            className={`${inputClass} ${!editingAccount ? inputReadOnlyClass : ''}`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            readOnly={!editingAccount}
          />
        </div>

        <div>
          <div className={labelClass}>{i18n.language === 'th' ? 'นามสกุล' : 'Last Name'}</div>
          <input
            className={`${inputClass} ${!editingAccount ? inputReadOnlyClass : ''}`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            readOnly={!editingAccount}
          />
        </div>

        <div className="md:col-span-2">
          <div className={labelClass}>{i18n.language === 'th' ? 'วัน/เดือน/ปี เกิด' : 'Date of Birth'}</div>
          <input
            type="date"
            className={`${inputClass} ${!editingAccount ? inputReadOnlyClass : ''}`}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            readOnly={!editingAccount}
          />
        </div>

        <div className="md:col-span-2">
          <div className={labelClass}>{i18n.language === 'th' ? 'อีเมล' : 'Email'}</div>
          <input className={`${inputClass} bg-neutral-50`} value={user.email ?? ''} readOnly />
        </div>

        <div className="md:col-span-2">
          <div className={labelClass}>{i18n.language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}</div>
          <input
            type="tel"
            className={`${inputClass} ${!editingAccount ? inputReadOnlyClass : ''}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            readOnly={!editingAccount}
          />
        </div>

        <div className="md:col-span-2">
          <div className={labelClass}>{i18n.language === 'th' ? 'เพศ' : 'Gender'}</div>
          <select
            className={`${inputClass} ${!editingAccount ? 'bg-neutral-50' : 'bg-white'}`}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            disabled={!editingAccount}
          >
            <option value="">{i18n.language === 'th' ? 'เลือกเพศ' : 'Select Gender'}</option>
            <option value="male">{i18n.language === 'th' ? 'ชาย' : 'Male'}</option>
            <option value="female">{i18n.language === 'th' ? 'หญิง' : 'Female'}</option>
            <option value="other">{i18n.language === 'th' ? 'อื่นๆ' : 'Other'}</option>
          </select>
        </div>
      </div>

      {editingAccount && (
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelAccount}
            className="h-10 px-6 rounded-sm border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            {i18n.language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onSaveAccount}
            className="h-10 px-6 rounded-sm bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
          >
            {i18n.language === 'th' ? 'บันทึก' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}