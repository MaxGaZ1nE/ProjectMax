import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@stores/index';
import { logout } from '@slices/index';
import { fetchSellerProfile } from '@/slices/seller-slice';
import { SellerErrorBoundary } from '@components/core/SellerErrorBoundary';
import { useState, useRef, useEffect } from 'react';
import Logo2 from '@assets/Logo2.png';

/* ─────────────────────────────────────────────────── */
/*  Sidebar Nav components                              */
/* ─────────────────────────────────────────────────── */

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}

function NavItem({ to, label, icon, active, badge }: NavItemProps) {
  return (
    <Link
      to={to}
      className="group block"
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '14px',
          transition: 'all 0.2s ease',
          backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
          color: active ? '#ffffff' : 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span style={{ fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        {badge ? (
          <span style={{
            marginLeft: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '20px',
            minWidth: '20px',
            padding: '0 6px',
            borderRadius: '10px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{
        padding: '8px 16px 6px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  SVG Icons for sidebar                               */
/* ─────────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
const IconProducts = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
);
const IconOrders = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
);
const IconSales = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
);
/* ─────────────────────────────────────────────────── */
/*  Main Layout                                         */
/* ─────────────────────────────────────────────────── */

export default function SellerLayout() {
  const location = useLocation();
  const seller = useAppSelector((s) => (s as any).seller.profile);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Fetch seller profile on component mount to persist Redux state after page refresh
  useEffect(() => {
    dispatch(fetchSellerProfile());
  }, [dispatch]);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutModal(false);
    navigate('/auth/login');
  };

  const path = location.pathname;
  const isActive = (prefix: string) => path === prefix || path.startsWith(prefix + '/');

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.name || 'สมหวัง พาณิชย์';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6' }}>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── TOP NAVBAR (UNCHANGED) ── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#1a4d3a] backdrop-blur-md dark:border-neutral-800 dark:bg-bg-dark/95 text-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* LEFT: Logo + Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition text-xl"
                title="Toggle menu"
              >
                ☰
              </button>
              <Link to="/" className="shrink-0 flex items-center">
                <img src={Logo2} alt="Fruit basket" className="h-12 object-contain drop-shadow-md" />
                <span className="font-bold text-lg tracking-wide hidden sm:block text-white ml-2">FRUIT FOR YOU</span>
              </Link>
            </div>

        {/* RIGHT: Actions & Dropdown */}
        <div className="flex items-center gap-5">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-full transition"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner overflow-hidden font-bold text-white text-sm">
                {seller?.shopAvatar ? (
                  <img src={seller.shopAvatar} alt="Shop avatar" className="w-full h-full object-cover" />
                ) : (
                  seller?.shopName?.[0]?.toUpperCase() ?? user?.firstName?.[0]?.toUpperCase() ?? 'S'
                )}
              </div>
              <div className="hidden lg:block text-left leading-tight max-w-[150px]">
                <div className="text-sm font-semibold truncate text-white">{displayName}</div>
              </div>
              <span className={`text-xs transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {profileOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-[10px] border border-[#e0e0e0] overflow-hidden text-neutral-800 animate-in fade-in slide-in-from-top-2"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
              >
                <div className="p-4 border-b border-[#e0e0e0] bg-neutral-50/50">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden">
                      {seller?.shopAvatar ? (
                        <img src={seller.shopAvatar} alt="Shop avatar" className="w-full h-full object-cover" />
                      ) : (
                        seller?.shopName?.[0]?.toUpperCase() ?? 'S'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate text-sm">{seller?.shopName ?? user?.firstName ?? 'ร้านของฉัน'}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{user?.email ?? 'seller@example.com'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-[#1a6e40] mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded-md">
                    ShopId: {seller?.shopId ?? '001'} • Seller
                  </div>
                </div>

                <div className="py-1">
                  <Link to="/seller" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>🏪</span> จัดการร้านค้า</Link>
                  <Link to="/seller/products" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>📦</span> จัดการสินค้า</Link>
                  <Link to="/seller/orders" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>📋</span> ออเดอร์ทั้งหมด</Link>
                  <div className="h-[0.5px] bg-[#e0e0e0] my-1"></div>
                  
                  <Link to="/seller/profile/edit" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>👤</span> แก้ไขข้อมูลส่วนตัว</Link>
                  <Link to="/seller/profile/change-password" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>🔑</span> เปลี่ยนรหัสผ่าน</Link>
                  <Link to="/seller/profile/bank" onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"><span>🏦</span> บัญชีธนาคาร</Link>
                  <div className="h-[0.5px] bg-[#e0e0e0] my-1"></div>
                  
                  <button onClick={handleLogoutClick} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 text-[#e74c3c] font-medium flex items-center gap-2 transition-colors"><span>🚪</span> ออกจากระบบ</button>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── MAIN LAYOUT (Dark Green Sidebar + Content) ── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* ── SIDEBAR ── */}
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <aside
            style={{
              width: '260px',
              minWidth: '260px',
              backgroundColor: '#1a4d3a',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              position: 'sticky',
              top: '73px', // below navbar
              height: 'calc(100vh - 73px)',
              overflowY: 'auto',
              zIndex: 40,
            }}
            className="hidden lg:flex"
          >
            {/* Sidebar Shop Mini-Profile */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {seller?.shopAvatar ? (
                    <img src={seller.shopAvatar} alt="Shop avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    seller?.shopName?.[0]?.toUpperCase() ?? 'S'
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {seller?.shopName ?? 'ร้านของฉัน'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                  }}>
                    Seller Center
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Nav */}
            <nav style={{ padding: '12px 12px', flex: 1 }}>
              <NavSection title="ภาพรวม">
                <NavItem
                  to="/seller"
                  label="แดชบอร์ด"
                  icon={<IconDashboard />}
                  active={path === '/seller'}
                />
              </NavSection>

              <NavSection title="สินค้า">
                <NavItem
                  to="/seller/products"
                  label="จัดการสินค้า"
                  icon={<IconProducts />}
                  active={isActive('/seller/products')}
                />
              </NavSection>

              <NavSection title="ออเดอร์">
                <NavItem
                  to="/seller/orders"
                  label="ออเดอร์ทั้งหมด"
                  icon={<IconOrders />}
                  active={path === '/seller/orders'}
                />
                <NavItem
                  to="/seller/sales"
                  label="ประวัติการขาย"
                  icon={<IconSales />}
                  active={isActive('/seller/sales')}
                />
              </NavSection>

            </nav>

            {/* Sidebar Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.35)',
              textAlign: 'center',
            }}>
              Fruit For You © {new Date().getFullYear()}
            </div>
          </aside>
        )}

        {/* ── Mobile Sidebar Overlay ── */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {sidebarOpen && (
          <aside
            className="lg:hidden fixed left-0 top-[73px] z-40 w-[280px] h-[calc(100vh-73px)] overflow-y-auto"
            style={{ backgroundColor: '#1a4d3a' }}
          >
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{seller?.shopName ?? 'ร้านของฉัน'}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>shopId: {seller?.shopId ?? '-'}</div>
            </div>
            <nav style={{ padding: '12px 12px' }}>
              <NavSection title="ภาพรวม">
                <NavItem to="/seller" label="แดชบอร์ด" icon={<IconDashboard />} active={path === '/seller'} />
              </NavSection>
              <NavSection title="สินค้า">
                <NavItem to="/seller/products" label="จัดการสินค้า" icon={<IconProducts />} active={isActive('/seller/products')} />
              </NavSection>
              <NavSection title="ออเดอร์">
                <NavItem to="/seller/orders" label="ออเดอร์ทั้งหมด" icon={<IconOrders />} active={path === '/seller/orders'} />
                <NavItem to="/seller/sales" label="ประวัติการขาย" icon={<IconSales />} active={isActive('/seller/sales')} />
              </NavSection>
            </nav>
          </aside>
        )}

        {/* ── CONTENT AREA ── */}
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: '28px 32px',
          backgroundColor: '#f3f4f6',
        }}>
          <SellerErrorBoundary>
            <Outlet />
          </SellerErrorBoundary>
        </main>
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">
                🚪
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">ยืนยันการออกจากระบบ</h3>
              <p className="text-neutral-500 text-sm mb-6">คุณต้องการออกจากระบบ Seller Center ใช่หรือไม่?</p>
              
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
    </div>
  );
}