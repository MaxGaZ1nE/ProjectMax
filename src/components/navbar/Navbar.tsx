import type { FC } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, Heading, Row } from '@components/core';
import { LanguageSwitcher } from '@components/language-switcher';
import { tokens } from '@locales/index';
import { logout, setUser } from '@slices/index';
import { useAppDispatch, useAppSelector } from '@stores/index';
import type { RootState } from '@stores/root-reducer';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo2 from '@assets/Logo2.png';
import { getHomeProducts } from '@/features/products/home-catalog';
import type { Product } from '@/mockItem/listProduct';
import { pushNotification, type AppNotification } from '@/slices/notification-slice';
import { sellerAPI } from '@/services/backend-api';
import { fetchSellerProfile } from '@/slices/seller-slice';

const MAX_SUGGESTIONS = 6;

function getDisplayName(user?: { firstName?: string; lastName?: string; name?: string; email?: string }) {
  if (!user) return '';
  const fn = (user.firstName ?? '').trim();
  const ln = (user.lastName ?? '').trim();
  const full = `${fn} ${ln}`.trim();
  return full || (user.name ?? '').trim() || (user.email ?? '').trim();
}

function getInitials(name: string) {
  const s = name.trim();
  if (!s) return '?';
  return s[0].toUpperCase();
}

const Navbar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const hideSearch = location.pathname.startsWith('/auth');

  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.qty, 0));
  const ordersCount = useAppSelector((state) =>
    state.orders.orders.filter((o) => o.status === 'unpaid' || o.status === 'waiting_driver').length
  );

  // ✅ seller state
  const seller = useAppSelector((s) => s.seller.profile);
  const isSeller = !!seller?.isSeller;

  // ✅ seller registration status
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);

  // ✅ Check seller registration status (to detect admin approval)
  useEffect(() => {
    if (!isAuthenticated) {
      setSellerStatus(null);
      return;
    }

    // Fetch immediately on mount
    sellerAPI.getRegistrationStatus()
      .then((res: any) => {
        const data = (res?.data as any)?.data ?? res?.data;
        setSellerStatus(data?.status || null);
        
        // ✅ When seller is approved, refresh user profile to update role/shopId
        if (data?.status === 'approved') {
          sellerAPI.getProfile()
            .then((profileRes: any) => {
              const profileData = profileRes?.data as any;
              console.log('✅ Seller approved! Updated profile:', profileData);
              
              // Update user in Redux auth state with role and shopId
              if (profileData) {
                const updatedUser = {
                  ...user,
                  role: 'seller',
                  shopId: profileData?.id || profileData?.shopId || profileData?.shop_id,
                  isSeller: true,
                };
                dispatch(setUser(updatedUser));
              }
            })
            .catch((err) => console.error('Failed to refresh user profile:', err));
        }
      })
      .catch(() => setSellerStatus(null));

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      sellerAPI.getRegistrationStatus()
        .then((res: any) => {
          const data = (res?.data as any)?.data ?? res?.data;
          setSellerStatus(data?.status || null);
          
          // ✅ Detect approval change and refresh user
          if (data?.status === 'approved' && sellerStatus !== 'approved') {
            sellerAPI.getProfile()
              .then((profileRes: any) => {
                const profileData = profileRes?.data as any;
                console.log('✅ Seller status changed to approved! Updating profile:', profileData);
                
                if (profileData) {
                  const updatedUser = {
                    ...user,
                    role: 'seller',
                    shopId: profileData?.id || profileData?.shopId || profileData?.shop_id,
                    isSeller: true,
                  };
                  dispatch(setUser(updatedUser));
                }
              })
              .catch((err) => console.error('Failed to refresh user profile:', err));
          }
        })
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch, user?.id]);

  // ✅ unread notifications count
  const unreadNotiCount = useAppSelector((state: RootState) =>
    (state.notifications.items ?? []).filter((n: AppNotification) => !n.read).length
  );

  const { t } = useTranslation();
  const handleLogout = () => dispatch(logout());

  // Search: sync input with URL query ?q=
  const qFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') ?? '';
  }, [location.search]);

  const [q, setQ] = useState(qFromUrl);

  useEffect(() => {
    setQ(qFromUrl);
  }, [qFromUrl]);

  // Suggestions dropdown
  const [openSuggest, setOpenSuggest] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const allProducts = useMemo(() => getHomeProducts(), []);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    return allProducts
      .map((p: Product) => {
        const name = String(p.name ?? '').toLowerCase();
        const categoryId = String(p.categoryId ?? '').toLowerCase();

        const score =
          (name.includes(query) ? 3 : 0) +
          (categoryId.includes(query) ? 1 : 0);

        return { p, score };
      })
      .filter((x: { p: Product; score: number }) => x.score > 0)
      .sort((a: { p: Product; score: number }, b: { p: Product; score: number }) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS)
      .map((x: { p: Product; score: number }) => x.p);
  }, [q, allProducts]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) setOpenSuggest(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const onSubmitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    setOpenSuggest(false);
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  const onPickSuggestion = (productId: number | string) => {
    setOpenSuggest(false);
    navigate(`/details/${productId}`);
  };

  // ✅ Determine if user is a seller: check profile OR registration status
  const hasShop = Boolean(user?.shopId && user.shopId !== 0);
  const isApprovedSeller = isSeller || user?.role === 'seller' || hasShop || sellerStatus === 'approved';
  const sellerLink = isApprovedSeller ? '/seller' : '/seller/register';
  const sellerTitle = isApprovedSeller ? 'ร้านค้าของฉัน' : 'สมัครเป็นผู้ขาย';

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#1a4d3a] backdrop-blur-md dark:border-neutral-800 dark:bg-bg-dark/95">
      <Container size="xl">
        <Row justify="between" align="center" className="py-4 gap-4">
          {/* LOGO */}
          <Link to="/" className="shrink-0">
            <Heading as="h1" size="lg" color="gradient">
              <img src={Logo2} alt="Fruit basket" className="w-full h-12 object-contain drop-shadow-md" />
            </Heading>
          </Link>

          {/* SEARCH (Desktop) */}
          {!hideSearch && (
            <div className="hidden md:flex flex-1 justify-center">
              <div className="w-full max-w-xl" ref={searchWrapRef}>
                <form onSubmit={onSubmitSearch}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M16.5 16.5 21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>

                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => setOpenSuggest(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setOpenSuggest(false);
                      }}
                      placeholder="ค้นหาสินค้า เช่น ทุเรียน, มะม่วง"
                      className="w-full h-10 rounded-md bg-white/25 text-white placeholder:text-white/70
                               pl-10 pr-20 text-sm outline-none ring-1 ring-white/20
                               focus:ring-2 focus:ring-white/40"
                    />

                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md
                               bg-white/15 hover:bg-white/20 text-sm text-white"
                    >
                      ค้นหา
                    </button>

                    {/* Suggestion dropdown */}
                    {openSuggest && suggestions.length > 0 && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50">
                        <div className="rounded-md border border-neutral-200 bg-white shadow-lg overflow-hidden">
                          {suggestions.map((p: Product) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onPickSuggestion(p.id)}
                              className="w-full text-left px-4 py-3 hover:bg-neutral-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-md overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                                  {p.image?.[0] ? (
                                    <img src={p.image[0]} alt={p.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] text-neutral-400">
                                      No img
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-medium text-neutral-900 truncate">{p.name}</div>
                                  <div className="text-xs text-neutral-500 mt-0.5 truncate">
                                    ฿{p.price}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => onSubmitSearch()}
                            className="w-full text-left px-4 py-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          >
                            ดูผลการค้นหาทั้งหมดสำหรับ “{q.trim()}”
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RIGHT */}
          <Row gap="sm" align="center" className="shrink-0">
            <LanguageSwitcher />

            {/* ✅ Notifications */}
            {isAuthenticated && (
              <Link
                to="/profile"
                state={{ tab: 'notification' }}
                className="relative inline-flex items-center justify-center px-2"
                title="แจ้งเตือน"
              >
                <span className="text-white text-xl leading-none">🔔</span>
                {unreadNotiCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                    {unreadNotiCount}
                  </span>
                )}
              </Link>
            )}

            {/* ✅ Seller entry */}
            {isAuthenticated && (
              <Link
                to={sellerLink}
                className="relative inline-flex items-center justify-center px-2"
                title={sellerTitle}
              >
                <span className="text-white text-xl leading-none">🏪</span>
                {isApprovedSeller && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center">
                    S
                  </span>
                )}
              </Link>
            )}

            {/* ✅ Orders */}
            {isAuthenticated && (
              <Link
                to="/profile"
                state={{ tab: 'orders' }}
                className="relative inline-flex items-center justify-center px-2"
                title="คำสั่งซื้อของฉัน"
              >
                <span className="text-white text-xl leading-none">📦</span>
                {ordersCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                    {ordersCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative inline-flex items-center justify-center px-2" title="ตะกร้าสินค้า">
              <span className="text-white text-xl leading-none">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <ProfileMenu
                displayName={getDisplayName(user ?? undefined)}
                email={user?.email ?? ''}
                avatarUrl={user?.avatarUrl || undefined}
                onLogout={handleLogout}
                isSeller={isApprovedSeller}
                sellerLink={sellerLink}
                sellerTitle={sellerTitle}
              />
            ) : (
              <Link to="/auth/login">
                <Button variant="primary" size="sm">
                  {t(tokens.auth.login)}
                </Button>
              </Link>
            )}
          </Row>
        </Row>
      </Container>
    </header>
  );
};

function ProfileMenu({
  displayName,
  email,
  avatarUrl,
  onLogout,
  isSeller,
  sellerLink,
  sellerTitle,
}: {
  displayName: string;
  email: string;
  avatarUrl?: string;
  onLogout: () => void;
  isSeller: boolean;
  sellerLink: string;
  sellerTitle: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const initials = getInitials(displayName);

  // Direct navigation to seller center
  const handleSellerCenterClick = () => {
    navigate(sellerLink);
  };

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to="/profile" className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={`${avatarUrl}?t=${Date.now()}`} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-white">{initials}</span>
          )}
        </div>

        <div className="hidden lg:block leading-tight">
          <div className="text-sm font-semibold text-white max-w-[160px] truncate">{displayName}</div>
          <div className="text-xs text-white/70 max-w-[160px] truncate">{email}</div>
        </div>

        <div className="hidden lg:block text-white/80">▾</div>
      </Link>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64">
          <div className="absolute right-8 -top-2 h-4 w-4 rotate-45 bg-white border-l border-t border-neutral-200" />
          <div className="rounded-md border border-neutral-200 bg-white shadow-lg overflow-hidden">
            <MenuItem to="/profile" label="👤 บัญชีของฉัน" />
            <MenuItem to="/followed-shops" label="⭐ ร้านค้าที่ติดตาม" />
            <MenuItem to="/profile" label="📦 คำสั่งซื้อของฉัน" state={{ tab: 'orders' }} />
            <MenuItem to="/profile" label="🔔 แจ้งเตือน" state={{ tab: 'notification' }} />

            <div className="h-px bg-neutral-200" />

            {/* 🏪 Seller Center - Direct Navigation */}
            <button
              type="button"
              onClick={handleSellerCenterClick}
              className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 text-neutral-700"
              title={sellerTitle}
            >
              🏪 {sellerTitle}
            </button>

            <div className="h-px bg-neutral-200" />

            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 text-red-600"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, label, state }: { to: string; label: string; state?: unknown }) {
  return (
    <Link to={to} state={state} className="block px-4 py-3 text-sm hover:bg-neutral-50 text-neutral-700">
      {label}
    </Link>
  );
}

export default Navbar;