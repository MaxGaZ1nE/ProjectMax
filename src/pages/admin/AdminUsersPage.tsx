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

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, error, total, page, limit } = useAppSelector((state: any) => state.adminUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | 'admin' | ''>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ open: boolean; action?: string; userId?: string }>({ open: false });
  const [banReason, setBanReason] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');

  // ดึงข้อมูลผู้ใช้
  useEffect(() => {
    dispatch(
      fetchUsers({
        page,
        limit,
        search: searchQuery,
        role: roleFilter,
      }) as any
    );
  }, [dispatch]);

  // ค้นหาเมื่อเปลี่ยน search query หรือ role filter
  const debounceSearch = useMemo(() => {
    let timeout: any;
    return (sq: string, rf: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        dispatch(
          fetchUsers({
            page: 1,
            limit,
            search: sq,
            role: rf,
          }) as any
        );
      }, 300);
    };
  }, [dispatch, limit]);

  const handleChangeRole = (userId: string, newRole: 'customer' | 'seller' | 'admin') => {
    dispatch(updateUserRoles({ userId, roles: [newRole] }) as any);
    setActionModal({ open: false });
  };

  const handleBanUser = (userId: string) => {
    if (!banReason.trim()) {
      alert('กรุณาระบุเหตุผลในการแบน');
      return;
    }
    dispatch(banUser({ userId, reason: banReason }) as any);
    setBanReason('');
    setActionModal({ open: false });
  };

  const handleUnbanUser = (userId: string) => {
    dispatch(unbanUser(userId) as any);
    setActionModal({ open: false });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('แน่ใจหรือว่าต้องการลบผู้ใช้นี้? ไม่สามารถเรียกคืนได้')) {
      dispatch(deleteUser(userId) as any);
      setActionModal({ open: false });
    }
  };

  const handleDeactivateAccount = (userId: string) => {
    if (!deactivateReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปิดใช้งาน');
      return;
    }
    dispatch(deactivateAccount({ userId, reason: deactivateReason }) as any);
    setDeactivateReason('');
    setActionModal({ open: false });
  };

  const handleReactivateAccount = (userId: string) => {
    dispatch(reactivateAccount(userId) as any);
    setActionModal({ open: false });
  };

  // Search effect
  useEffect(() => {
    debounceSearch(searchQuery, roleFilter);
  }, [searchQuery, roleFilter, debounceSearch]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">👥 จัดการผู้ใช้</h2>
          <p className="text-sm text-neutral-600 mt-1">ทั้งหมด {total} ผู้ใช้</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-600"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-600"
          >
            <option value="">ทั้งหมด</option>
            <option value="buyer">ผู้ซื้อ</option>
            <option value="seller">ผู้ขาย</option>
            <option value="delivery">คนส่ง</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Users Table */}
      {!loading && users.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">ชื่อ</th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">อีเมล</th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">เบอร์โทร</th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">บทบาท</th>
                  <th className="px-6 py-3 text-left font-medium text-neutral-700">สถานะ</th>
                  <th className="px-6 py-3 text-center font-medium text-neutral-700">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {(user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'ไม่มีชื่อ'}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{user.email}</td>
                    <td className="px-6 py-4 text-neutral-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.role === 'admin' && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-100 text-purple-800">
                            🔐 Admin
                          </span>
                        )}
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-800">
                          👤 ผู้ซื้อ
                        </span>
                        {(user.sellerId || user.role === 'seller') && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-800">
                            🏪 ผู้ขาย
                          </span>
                        )}
                        {user.deliveryId && (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            🚚 คนส่ง
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.banned ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          🚫 แบน
                        </span>
                      ) : !user.isActive ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ⏸️ ปิดใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ ใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsInfoModalOpen(true);
                          }}
                          className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-sm hover:bg-green-100 font-medium"
                        >
                          👁️ ดูข้อมูล
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionModal({ open: true });
                          }}
                          className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded text-sm hover:bg-gray-100 font-medium"
                        >
                          ⚙️ จัดการ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-sm text-neutral-600">
                หน้า {page} จาก {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50"
                >
                  ← ก่อนหน้า
                </button>
                <button
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-neutral-300 text-sm disabled:opacity-50"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">ไม่พบผู้ใช้</p>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">
              จัดการ: {selectedUser.firstName} {selectedUser.lastName}
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">เปลี่ยนบทบาทหลัก (Role):</label>
              <div className="flex gap-2">
                {(['customer', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleChangeRole(selectedUser.id, role)}
                    disabled={selectedUser.role === role}
                    className="flex-1 px-3 py-2 rounded border text-sm font-medium disabled:opacity-50"
                  >
                    {role === 'admin' ? '🔐 Admin' : '👤 ผู้ซื้อ'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">* การเป็นผู้ขายหรือคนส่งจะถูกจัดการผ่านระบบ Approvals อัตโนมัติ (sellerId, deliveryId)</p>
            </div>

            {!selectedUser.banned ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">แบนผู้ใช้:</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="เหตุผลในการแบน..."
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  rows={3}
                />
                <button
                  onClick={() => handleBanUser(selectedUser.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded font-medium text-sm hover:bg-red-700"
                >
                  🚫 แบนผู้ใช้
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleUnbanUser(selectedUser.id)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700"
              >
                ✅ ยกเลิกการแบน
              </button>
            )}

            {selectedUser.isActive ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">ปิดใช้งานบัญชี:</label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="เหตุผลในการปิดใช้งาน..."
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  rows={3}
                />
                <button
                  onClick={() => handleDeactivateAccount(selectedUser.id)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded font-medium text-sm hover:bg-orange-700"
                >
                  ⏸️ ปิดใช้งานบัญชี
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleReactivateAccount(selectedUser.id)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
              >
                ▶️ เปิดใช้งานบัญชี
              </button>
            )}

            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              className="w-full px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded font-medium text-sm hover:bg-red-100"
            >
              🗑️ ลบผู้ใช้
            </button>

            <button
              onClick={() => setActionModal({ open: false })}
              className="w-full px-4 py-2 bg-neutral-100 text-neutral-900 rounded font-medium text-sm hover:bg-neutral-200"
            >
              ปิด
            </button>
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
            className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
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
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-5">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-2xl font-bold text-neutral-400 border-2 border-neutral-200 shrink-0">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    ((selectedUser.firstName || selectedUser.lastName || 'U')[0]).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-neutral-900">
                    {(selectedUser.firstName || selectedUser.lastName) ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() : 'ไม่มีชื่อ'}
                  </h4>
                  <p className="text-sm text-neutral-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">เบอร์โทรศัพท์</p>
                  <p className="text-sm font-semibold text-neutral-900">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">วันที่สมัคร</p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {new Date(selectedUser.createdAt || new Date()).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">สถานะ</p>
                  {selectedUser.banned ? (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      🚫 ถูกแบน
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✅ เปิดใช้งาน
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">บทบาท</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">ผู้ซื้อ</span>
                    {(selectedUser.sellerId || selectedUser.role === 'seller') && (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">ผู้ขาย</span>
                    )}
                    {selectedUser.deliveryId && (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">คนส่ง</span>
                    )}
                    {selectedUser.role === 'admin' && (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">Admin</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-neutral-50 px-6 py-4 flex justify-end border-t border-neutral-200">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-neutral-200 text-neutral-800 font-medium rounded-lg hover:bg-neutral-300 transition"
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
