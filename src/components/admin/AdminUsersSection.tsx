import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { 
  fetchUsers, 
  updateUserRoles, 
  banUser, 
  unbanUser, 
  deleteUser,
  deactivateAccount,
  reactivateAccount
} from '@slices/admin-users-slice';
import { adminUserAPI } from '@services/api/admin-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200 dark:focus:border-primary-500 dark:focus:ring-primary-900';

export default function AdminUsersSection() {
  const dispatch = useAppDispatch();
  // Key must match root-reducer: adminUsers (not 'admin-users')
  const usersState = useAppSelector((s) => (s as any).adminUsers || {});
  const users = usersState.users || [];
  const loading = usersState.loading || false;
  const error = usersState.error || null;
  const totalPages = usersState.totalPages || 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{ open: boolean; type: string; userId?: string }>({ open: false, type: '' });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7');
  const [deactivateReason, setDeactivateReason] = useState('');

  // Auto-fetch users on mount and when filters change
  useEffect(() => {
    dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
  }, [dispatch, page, searchQuery, roleFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleViewInfo = async (e: React.MouseEvent, user: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedUser(user);
    setIsInfoModalOpen(true);
    setDetailLoading(true);
    setUserDetailData(null);
    try {
      // Assuming adminUserAPI is imported at the top. Let's check imports.
      const res = await adminUserAPI.getUserDetail(user.id);
      if (res && res.data) {
        setUserDetailData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRoleChange = (userId: string, user: any) => {
    setSelectedUser(user);
    // buyer is ALWAYS included — it cannot be removed
    const detected: string[] = ['buyer'];
    // Seller role: infer from sellerId or role field
    if (user.sellerId || user.role === 'seller') detected.push('seller');
    // Delivery role: infer from deliveryId or role field
    if (user.deliveryId || user.role === 'delivery') detected.push('delivery');
    // Admin role
    if (user.role === 'admin') detected.push('admin');
    setSelectedRoles(detected);
    setActionModal({ open: true, type: 'role', userId });
  };

  const handleBanClick = (userId: string) => {
    setSelectedUser({ id: userId });
    setBanReason('');
    setBanDuration('7');
    setActionModal({ open: true, type: 'ban', userId });
  };

  const handleUnbanClick = (userId: string) => {
    setSelectedUser({ id: userId });
    setActionModal({ open: true, type: 'unban', userId });
  };

  const handleDeactivateClick = (userId: string) => {
    setSelectedUser({ id: userId });
    setDeactivateReason('');
    setActionModal({ open: true, type: 'deactivate', userId });
  };

  const handleReactivateClick = (userId: string) => {
    setSelectedUser({ id: userId });
    setActionModal({ open: true, type: 'reactivate', userId });
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm('คุณแน่ใจหรือว่า ต้องการลบผู้ใช้นี้?')) {
      dispatch(deleteUser(userId) as any).then(() => {
        dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
      });
      setActionModal({ open: false, type: '' });
    }
  };

  const confirmAction = async () => {
    const userId = actionModal.userId;
    if (!userId) return;

    switch (actionModal.type) {
      case 'role': {
        // Always ensure 'buyer' is in the array before sending
        const rolesWithBuyer = selectedRoles.includes('buyer')
          ? selectedRoles
          : ['buyer', ...selectedRoles];
        console.debug('[Admin] Saving roles:', rolesWithBuyer);
        await dispatch(updateUserRoles({ userId, roles: rolesWithBuyer }) as any);
        dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
        break;
      }
      case 'ban':
        if (banReason.trim()) {
          await dispatch(banUser({ userId, reason: banReason, duration: parseInt(banDuration) }) as any);
          dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
        }
        break;
      case 'unban':
        await dispatch(unbanUser(userId) as any);
        dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
        break;
      case 'deactivate':
        if (deactivateReason.trim()) {
          await dispatch(deactivateAccount({ userId, reason: deactivateReason }) as any);
          dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
        }
        break;
      case 'reactivate':
        await dispatch(reactivateAccount(userId) as any);
        dispatch(fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter }) as any);
        break;
    }
    setActionModal({ open: false, type: '' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'seller':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'customer':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      default:
        return 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '👨‍💼 ผู้ดูแลระบบ';
      case 'seller':
        return '🏪 ผู้ขาย';
      case 'customer':
        return '👤 ผู้ซื้อ';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">👥 จัดการผู้ใช้</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">เปลี่ยนบทบาท, แบน/เปิดใช้งาน, และลบผู้ใช้</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              ค้นหา (ชื่อ, อีเมล, เบอร์โทร)
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="พิมพ์เพื่อค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              บทบาท
            </label>
            <select
              className={inputClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="buyer">ผู้ซื้อ</option>
              <option value="seller">ผู้ขาย</option>
              <option value="delivery">คนส่ง</option>
              <option value="admin">ผู้ดูแลระบบ</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
              {usersState.total ?? users.length} ผู้ใช้
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
                disabled={page === 1}
              >
                ← ก่อนหน้า
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">หน้า {page}/{totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
                disabled={page >= totalPages}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">กำลังโหลด...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length === 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">ไม่พบผู้ใช้</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">อีเมล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">บทบาท</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <td className="px-4 py-3">
                      <a 
                        href={`/admin/users/${user.id}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {user.firstName || user.name || 'ไม่มีชื่อ'}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{user.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {/* Buyer — always shown */}
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-50 text-green-800 border border-green-200">
                          🛒 ผู้ซื้อ
                        </span>
                        {(user.sellerId || user.role === 'seller') && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            🏪 ผู้ขาย
                          </span>
                        )}
                        {(user.deliveryId || user.role === 'delivery') && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                            🚚 คนส่ง
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-50 text-red-800 border border-red-200">
                            👨‍💼 Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user.banned ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      }`}>
                        {user.banned ? '🔒 แบน' : '✅ เปิดใช้'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => handleViewInfo(e, user)}
                          className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                          title="ดูข้อมูล"
                        >
                          ดูข้อมูล
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange(user.id, user)}
                          className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          title="จัดการบทบาท"
                        >
                          บทบาท
                        </button>
                        {!user.banned ? (
                          <button
                            type="button"
                            onClick={() => handleBanClick(user.id)}
                            className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition"
                            title="แบนผู้ใช้"
                          >
                            แบน
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUnbanClick(user.id)}
                            className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition"
                            title="เปิดใช้งาน"
                          >
                            เปิด
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="px-2 py-1 text-xs font-semibold bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                          title="ลบผู้ใช้"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {/* Change Role Modal */}
      {actionModal.open && actionModal.type === 'role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="font-bold text-white text-lg">🎭 จัดการบทบาทผู้ใช้</h3>
              {selectedUser && (
                <p className="text-blue-100 text-sm mt-0.5">
                  {selectedUser.firstName || selectedUser.name || selectedUser.email || `User #${actionModal.userId}`}
                </p>
              )}
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-500">ผู้ใช้ 1 คนสามารถมีได้หลาย role พร้อมกัน</p>

              <div className="space-y-2">
                {/* ── Buyer: always locked ── */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 opacity-80">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="w-5 h-5 rounded border-green-300 accent-green-600 cursor-not-allowed"
                    id="role-buyer"
                  />
                  <label htmlFor="role-buyer" className="flex-1 cursor-not-allowed">
                    <span className="text-sm font-semibold text-green-900 block">🛒 ผู้ซื้อ (Buyer)</span>
                    <span className="text-[10px] text-green-700">บทบาทพื้นฐาน — ลบไม่ได้</span>
                  </label>
                  <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold">ล็อก</span>
                </div>

                {/* ── Seller ── */}
                <label
                  htmlFor="role-seller"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedRoles.includes('seller')
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="role-seller"
                    checked={selectedRoles.includes('seller')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      // Use functional update to avoid stale closure
                      setSelectedRoles((prev) =>
                        checked
                          ? prev.includes('seller') ? prev : [...prev, 'seller']
                          : prev.filter((r) => r !== 'seller')
                      );
                    }}
                    className="w-5 h-5 rounded border-neutral-300 accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-neutral-900 block">🏪 ผู้ขาย (Seller)</span>
                    <span className="text-[10px] text-neutral-500">
                      {selectedUser?.sellerId ? '✅ มี Shop อยู่แล้ว' : '⚙️ จะสร้าง Shop ใหม่ให้อัตโนมัติ'}
                    </span>
                  </div>
                </label>

                {/* ── Delivery ── */}
                <label
                  htmlFor="role-delivery"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedRoles.includes('delivery')
                      ? 'bg-teal-50 border-teal-300'
                      : 'bg-white border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="role-delivery"
                    checked={selectedRoles.includes('delivery')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedRoles((prev) =>
                        checked
                          ? prev.includes('delivery') ? prev : [...prev, 'delivery']
                          : prev.filter((r) => r !== 'delivery')
                      );
                    }}
                    className="w-5 h-5 rounded border-neutral-300 accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-neutral-900 block">🚚 พนักงานส่ง (Delivery)</span>
                    <span className="text-[10px] text-neutral-500">
                      {selectedUser?.deliveryId ? '✅ มีข้อมูล Delivery อยู่แล้ว' : '⚙️ จะสร้าง Delivery record ให้อัตโนมัติ'}
                    </span>
                  </div>
                </label>

                {/* ── Admin ── */}
                <label
                  htmlFor="role-admin"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedRoles.includes('admin')
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="role-admin"
                    checked={selectedRoles.includes('admin')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedRoles((prev) =>
                        checked
                          ? prev.includes('admin') ? prev : [...prev, 'admin']
                          : prev.filter((r) => r !== 'admin')
                      );
                    }}
                    className="w-5 h-5 rounded border-neutral-300 accent-red-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-neutral-900 block">👨‍💼 ผู้ดูแลระบบ (Admin)</span>
                    <span className="text-[10px] text-red-600">⚠️ มีสิทธิ์เต็มในระบบ</span>
                  </div>
                </label>
              </div>

              {/* Active roles preview */}
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-neutral-500 mb-1.5">บทบาทที่จะบันทึก:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedRoles.map((r) => (
                    <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      r === 'buyer'    ? 'bg-green-100 text-green-800 border-green-200' :
                      r === 'seller'   ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      r === 'delivery' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                         'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {r === 'buyer' ? '🛒 ผู้ซื้อ' : r === 'seller' ? '🏪 ผู้ขาย' : r === 'delivery' ? '🚚 คนส่ง' : '👨‍💼 Admin'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, type: '' })}
                  className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 font-medium text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
                >
                  💾 บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {actionModal.open && actionModal.type === 'ban' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-sm w-full space-y-4 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">แบนผู้ใช้</h3>
            <div>
              <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
                เหตุผล
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="เหตุผลการแบน"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
                ระยะเวลา (วัน)
              </label>
              <input
                type="number"
                className={inputClass}
                min="1"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal({ open: false, type: '' })}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                disabled={!banReason.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 font-medium disabled:opacity-50"
              >
                แบน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {actionModal.open && actionModal.type === 'unban' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-sm w-full space-y-4 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">เปิดใช้งานผู้ใช้</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">คุณแน่ใจหรือว่า ต้องการเปิดใช้งานผู้ใช้นี้?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal({ open: false, type: '' })}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 font-medium"
              >
                เปิดใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {actionModal.open && actionModal.type === 'deactivate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-sm w-full space-y-4 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">⏸️ ปิดใช้งานบัญชี</h3>
            <div>
              <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 block">
                เหตุผลในการปิดใช้งาน
              </label>
              <textarea
                className={inputClass}
                placeholder="อธิบายเหตุผล..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal({ open: false, type: '' })}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600 font-medium"
                disabled={!deactivateReason.trim()}
              >
                ปิดใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Account Modal */}
      {actionModal.open && actionModal.type === 'reactivate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-sm w-full space-y-4 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">▶️ เปิดใช้งานบัญชี</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">คุณแน่ใจหรือว่า ต้องการเปิดใช้งานบัญชีนี้?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal({ open: false, type: '' })}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium"
              >
                เปิดใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-neutral-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a6e40] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">ข้อมูลผู้ใช้</h3>
              <button 
                onClick={() => setIsInfoModalOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {detailLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a6e40]"></div>
                  <span className="ml-3 text-neutral-500">กำลังโหลดข้อมูล...</span>
                </div>
              ) : !userDetailData ? (
                <div className="text-center py-10 text-red-500">
                  ไม่สามารถโหลดข้อมูลผู้ใช้ได้ หรือไม่พบข้อมูล
                </div>
              ) : (
                <>
                  {/* ข้อมูลพื้นฐาน */}
                  <div>
                    <h5 className="font-bold text-neutral-800 dark:text-neutral-200 border-b pb-2 mb-4">ข้อมูลพื้นฐาน</h5>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-2xl font-bold text-neutral-400 border-2 border-neutral-200 dark:border-neutral-600 shrink-0 overflow-hidden">
                        {selectedUser.avatarUrl ? (
                          <img src={selectedUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          ((userDetailData.user.firstName || userDetailData.user.lastName || 'U')[0]).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                          {(userDetailData.user.firstName || userDetailData.user.lastName) ? `${userDetailData.user.firstName || ''} ${userDetailData.user.lastName || ''}`.trim() : 'ไม่มีชื่อ'}
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{userDetailData.user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">เบอร์โทรศัพท์</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{userDetailData.user.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">วันที่สมัคร</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {new Date(userDetailData.user.createdAt || new Date()).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">สถานะบัญชี</p>
                        {userDetailData.user.banned ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            🚫 ปิดใช้งาน (ถูกแบน)
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            ✅ เปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">บทบาท / ประเภทผู้ใช้</p>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${
                          userDetailData.user.role === 'admin' ? 'bg-red-50 text-red-800 border-red-200' :
                          userDetailData.user.role === 'seller' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          userDetailData.user.role === 'delivery' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {userDetailData.user.role === 'admin' ? '👨‍💼 Admin' :
                           userDetailData.user.role === 'seller' ? '🏪 ผู้ขาย' :
                           userDetailData.user.role === 'delivery' ? '🚚 คนส่ง' : '👤 ผู้ซื้อ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลร้านค้า (Seller) */}
                  {(userDetailData.user.role === 'seller' || selectedUser.sellerId || userDetailData.sellerInfo) && (
                    <div>
                      <h5 className="font-bold text-[#1a6e40] border-b border-green-100 pb-2 mb-4 flex items-center gap-2">
                        <span>🏪</span> ข้อมูลร้านค้า
                      </h5>
                      {userDetailData.sellerInfo ? (
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-green-50/50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                          <div className="col-span-2 flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-xl shadow-sm border border-neutral-100">
                              {userDetailData.sellerInfo.logoUrl ? (
                                <img src={userDetailData.sellerInfo.logoUrl} alt="Shop Logo" className="w-full h-full object-cover rounded" />
                              ) : '🏪'}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-neutral-100">{userDetailData.sellerInfo.shopName || '-'}</p>
                              <p className="text-xs text-neutral-500">{userDetailData.sellerInfo.category || 'ทั่วไป'}</p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs font-medium text-neutral-500 mb-1">คำอธิบายร้าน</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 p-2 rounded border border-neutral-100 dark:border-neutral-700">
                              {userDetailData.sellerInfo.description || 'ไม่มีคำอธิบายร้าน'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">สถานะร้าน</p>
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {userDetailData.sellerInfo.isActive ? '✅ เปิดร้าน' : 'ปิดร้าน'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">จำนวนสินค้าในร้าน</p>
                            <p className="text-sm font-bold text-neutral-900">{userDetailData.sellerInfo.totalProducts || 0} รายการ</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 italic bg-neutral-50 p-3 rounded">ไม่พบข้อมูลร้านค้าโดยละเอียด</p>
                      )}
                    </div>
                  )}

                  {/* ข้อมูลยานพาหนะ (Delivery) */}
                  {(userDetailData.user.role === 'delivery' || selectedUser.deliveryId || userDetailData.deliveryInfo) && (
                    <div>
                      <h5 className="font-bold text-teal-700 border-b border-teal-100 pb-2 mb-4 flex items-center gap-2">
                        <span>🚚</span> ข้อมูลยานพาหนะและการรับส่ง
                      </h5>
                      {userDetailData.deliveryInfo ? (
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-teal-50/50 dark:bg-teal-900/10 p-4 rounded-lg border border-teal-100 dark:border-teal-900/30">
                          <div className="col-span-2 flex items-center gap-3 mb-2">
                            <div className="w-16 h-12 bg-white rounded flex items-center justify-center text-xl shadow-sm border border-neutral-100 overflow-hidden">
                              {userDetailData.deliveryInfo.vehicleImageUrl ? (
                                <img src={userDetailData.deliveryInfo.vehicleImageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                              ) : '🛵'}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-neutral-100">{userDetailData.deliveryInfo.licensePlate || '-'}</p>
                              <p className="text-xs text-neutral-500">{userDetailData.deliveryInfo.vehicleType || 'มอเตอร์ไซค์'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">ยี่ห้อและรุ่นรถ</p>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {userDetailData.deliveryInfo.vehicleBrand !== '-' ? `${userDetailData.deliveryInfo.vehicleBrand} ${userDetailData.deliveryInfo.vehicleModel}` : userDetailData.deliveryInfo.vehicleModel || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">สีรถ</p>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{userDetailData.deliveryInfo.vehicleColor || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs font-medium text-neutral-500 mb-1">สถานะการรับงาน</p>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${userDetailData.deliveryInfo.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                              {userDetailData.deliveryInfo.isAvailable !== false ? '🟢 Available (พร้อมรับงาน)' : '⚫ Unavailable (ไม่พร้อมรับงาน)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 italic bg-neutral-50 p-3 rounded">ไม่พบข้อมูลยานพาหนะโดยละเอียด</p>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {!detailLoading && userDetailData && (
                <div className="pt-2 flex justify-center mt-2">
                  <a 
                    href={`/admin/users/${selectedUser.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    ดูหน้ารายละเอียดข้อมูลเชิงลึกเต็มรูปแบบ <span>→</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 flex justify-end border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
