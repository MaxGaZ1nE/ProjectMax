import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@stores/index';
import type { RootState } from '@stores/root-reducer';
import type { AppNotification } from '@/slices/notification-slice';

import SideButton from './components/SideButton';
import AccountTab from './tabs/AccTab';
import AddressTab from './tabs/AddressTab';
import ChangePasswordTab from './tabs/ChangePasswordTab';
import OrdersTab from './tabs/OrdersTab';
import NotificationTab from './tabs/NotificationTab';

import { useAuth } from '@contexts/AuthContext';
import { uploadAPI } from '@/services/backend-api';
import { getDisplayName, getInitials } from './utils/profile-utils';

type TabKey = 'account' | 'address' | 'password' | 'notification' | 'orders';

const Profile: FC = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  const { user, updateProfile: updateProfileAPI } = useAuth();
  const [, startTransition] = useTransition();

  // ✅ unread notifications count (ใช้ทำ badge ฝั่งซ้าย)
  const unreadNotiCount = useAppSelector((s: RootState) =>
    (s.notifications.items ?? []).filter((n: AppNotification) => !n.read).length
  );

  const displayName = useMemo(() => getDisplayName(user ?? undefined), [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // ✅ รับ state.tab จากการ redirect (เช่น จาก navbar)
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = location.state?.tab as TabKey | undefined;
    return tab ?? 'account';
  });

  useEffect(() => {
    const tab = location.state?.tab as TabKey | undefined;
    if (tab) {
      startTransition(() => {
        setActiveTab(tab);
      });
    }
  }, [location.state]);

  const [accountOpen, setAccountOpen] = useState(true);
  const [purchaseOpen, setPurchaseOpen] = useState(true);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const goTab = (tab: TabKey) => setActiveTab(tab);

  const onPickAvatar = () => fileRef.current?.click();

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error('อ่านไฟล์ไม่สำเร็จ'));
      r.readAsDataURL(file);
    });

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    try {
      setIsUploading(true);
      const base64 = await readFileAsDataURL(f);
      
      // Upload to backend
      const res = await uploadAPI.uploadImage(base64);
      if (res.data?.success) {
        const url = res.data.data.url;
        // Save to user profile
        await updateProfileAPI({ avatar_url: url });
        alert('อัปเดตรูปโปรไฟล์สำเร็จ');
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!user) {
    return (
      <div className="py-10 text-center">
        <div className="text-lg font-semibold">
          {i18n.language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : 'Please log in first'}
        </div>
        <Link className="text-primary-600 underline underline-offset-4" to="/auth/login">
          {i18n.language === 'th' ? 'ไปหน้าเข้าสู่ระบบ' : 'Go to login page'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-120px)] py-10">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* LEFT */}
          <aside className="card p-0 overflow-hidden bg-white border border-neutral-200">
            {/* Profile header */}
            <div className="p-6 flex flex-col items-center text-center bg-white">
              <div className="h-24 w-24 rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center shadow-sm">
                {user?.avatarUrl ? (
                  <img src={`${user.avatarUrl}?t=${Date.now()}`} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-neutral-600">{initials}</span>
                )}
              </div>

              <button 
                type="button" 
                onClick={onPickAvatar} 
                disabled={isUploading}
                className="btn mt-4 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {i18n.language === 'th' ? (isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูป') : (isUploading ? 'Uploading...' : 'Choose Image')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

              <div className="mt-3 font-semibold text-neutral-900">{displayName}</div>
              <div className="text-xs text-neutral-500">{user.email}</div>
            </div>

            <div className="border-t border-neutral-200" />

            {/* ACCOUNT */}
            <div>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="w-full px-6 py-3 flex items-center justify-between text-sm font-semibold text-neutral-900 hover:bg-neutral-50 bg-white"
              >
                <span>{i18n.language === 'th' ? 'บัญชี' : 'Account'}</span>
                <span className="text-neutral-400">{accountOpen ? '▾' : '▸'}</span>
              </button>

              <div className={['overflow-hidden transition-all duration-200', accountOpen ? 'max-h-80' : 'max-h-0'].join(' ')}>
                <div className="pb-3 bg-white">
                  <SideButton active={activeTab === 'account'} label={i18n.language === 'th' ? 'บัญชี' : 'Account'} onClick={() => goTab('account')} />
                  <SideButton active={activeTab === 'address'} label={i18n.language === 'th' ? 'ที่อยู่' : 'Address'} onClick={() => goTab('address')} />
                  <SideButton active={activeTab === 'password'} label={i18n.language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'} onClick={() => goTab('password')} />
                  <SideButton
                    active={activeTab === 'notification'}
                    label={i18n.language === 'th' ? 'แจ้งเตือน' : 'Notifications'}
                    badge={unreadNotiCount}
                    onClick={() => goTab('notification')}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200" />

            {/* PURCHASE */}
            <div>
              <button
                type="button"
                onClick={() => setPurchaseOpen((v) => !v)}
                className="w-full px-6 py-3 flex items-center justify-between text-sm font-semibold text-neutral-900 hover:bg-neutral-50 bg-white"
              >
                <span>{i18n.language === 'th' ? 'การซื้อ' : 'Purchase'}</span>
                <span className="text-neutral-400">{purchaseOpen ? '▾' : '▸'}</span>
              </button>

              <div className={['overflow-hidden transition-all duration-200', purchaseOpen ? 'max-h-40' : 'max-h-0'].join(' ')}>
                <div className="pb-3 bg-white">
                  <SideButton active={activeTab === 'orders'} label={i18n.language === 'th' ? 'คำสั่งซื้อ' : 'Orders'} onClick={() => goTab('orders')} />
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT */}
          <main className="card p-0 overflow-hidden bg-white border border-neutral-200">
            <div className="min-h-[720px] flex flex-col bg-white">
              <div className="px-8 py-6 border-b border-neutral-200 flex items-center justify-between gap-4 bg-white">
                <div className="text-lg font-semibold text-neutral-900">
                  {activeTab === 'account' && (i18n.language === 'th' ? 'ข้อมูลของฉัน' : 'My Account')}
                  {activeTab === 'address' && (i18n.language === 'th' ? 'ที่อยู่ของฉัน' : 'My Address')}
                  {activeTab === 'password' && (i18n.language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password')}
                  {activeTab === 'notification' && (i18n.language === 'th' ? 'แจ้งเตือน' : 'Notifications')}
                  {activeTab === 'orders' && (i18n.language === 'th' ? 'คำสั่งซื้อ' : 'My Orders')}
                </div>

                <div className="hidden sm:block text-xs text-neutral-500">
                  {activeTab === 'orders'
                    ? (i18n.language === 'th' ? 'ติดตามสถานะการสั่งซื้อและการชำระเงิน' : 'Track your purchase status and payments')
                    : activeTab === 'notification'
                      ? (i18n.language === 'th' ? 'ดูรายการแจ้งเตือนล่าสุด' : 'View latest notifications')
                      : (i18n.language === 'th' ? 'จัดการข้อมูลโปรไฟล์ของคุณ' : 'Manage your profile information')}
                </div>
              </div>

              <div className="px-8 py-6 flex-1 bg-white">
                {activeTab === 'account' && <AccountTab />}
                {activeTab === 'address' && <AddressTab />}
                {activeTab === 'password' && <ChangePasswordTab />}
                {activeTab === 'orders' && <OrdersTab />}

                {/* ✅ แท็บแจ้งเตือน */}
                {activeTab === 'notification' && <NotificationTab />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;