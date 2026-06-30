import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/stores/index';
import { logout } from '@/slices/index';
import Logo2 from '@assets/Logo2.png';

export default function CourierNavbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutModal(false);
    navigate('/auth/login');
  };

  const riderName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.name || 'สมเดช จัดส่งไว';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#1a4d3a] backdrop-blur-md dark:border-neutral-800 dark:bg-bg-dark/95">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            <Link to="/" className="shrink-0 flex items-center">
              <img src={Logo2} alt="Fruit basket" className="h-12 object-contain drop-shadow-md" />
              <span className="font-bold text-lg tracking-wide hidden sm:block text-white ml-2">FRUIT FOR YOU</span>
            </Link>

      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer hover:text-emerald-200 transition">
          <span className="text-xl">🔔</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#1a6e40]">
            3
          </span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-full transition"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner overflow-hidden text-white font-bold">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.[0] || 'R'
              )}
            </div>
            <div className="hidden md:block text-left leading-tight text-white max-w-[150px]">
              <div className="text-sm font-semibold truncate text-white">{riderName}</div>
            </div>
            <span className={`text-xs text-white transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-neutral-200 overflow-hidden text-neutral-800 shadow-lg">
              <div className="p-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    '👨‍✈️'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-neutral-900 truncate">{riderName}</div>
                  <div className="text-xs text-neutral-500 truncate">{user?.email || 'rider@example.com'}</div>
                  <div className="text-[10px] font-semibold text-[#1a6e40] mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-md">ID: RIDER-992 • Courier</div>
                </div>
              </div>
              <div className="py-2">
                <Link to="/delivery/profile/edit" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 flex items-center gap-2"><span>👤</span> แก้ไขข้อมูลส่วนตัว</Link>
                <Link to="/delivery/profile/change-password" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 flex items-center gap-2"><span>🔑</span> เปลี่ยนรหัสผ่าน</Link>
                <Link to="/delivery/profile/bank" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 flex items-center gap-2"><span>🏦</span> บัญชีธนาคาร</Link>
                <div className="h-px bg-neutral-100 my-1"></div>
                <Link to="/delivery/profile/notifications" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 flex items-center gap-2"><span>🔔</span> การแจ้งเตือน</Link>
                <div className="h-px bg-neutral-100 my-1"></div>
                <button onClick={handleLogoutClick} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 text-[#e74c3c] font-medium flex items-center gap-2 transition-colors"><span>🚪</span> ออกจากระบบ</button>
              </div>
            </div>
          )}
        </div>
      </div>
          </div>
        </div>
      </header>

      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">
                🚪
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">ยืนยันการออกจากระบบ</h3>
              <p className="text-neutral-500 text-sm mb-6">คุณต้องการออกจากระบบ Courier ใช่หรือไม่?</p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-white bg-[#e74c3c] hover:bg-rose-600 rounded-lg font-medium transition-colors"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
