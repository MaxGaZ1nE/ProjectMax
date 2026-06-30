import React, { useEffect, useRef, useState, useCallback, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '@services/backend-api';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { pushNotification } from '@/slices/notification-slice';
import categories from '@/mockItem/categories';

// Type definitions
interface ApiErrorResponse {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string | Record<string, unknown>;
    };
  };
  message?: string;
}

interface SellerProduct {
  id: number;
  name: string;
  price: number;
  unit: string;
  weight: number;
  stock: number;
  quantity_in_stock?: number;
  is_active?: boolean;
  image?: string;
  images?: string[];
  description?: string;
  category_id?: string | number;
  created_at?: string;
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-neutral-500">{label}</label>
    {children}
  </div>
);

export default function SellerProductsPage() {
  const dispatch = useAppDispatch();
  const seller = useAppSelector((s) => (s as { seller?: { profile?: Record<string, unknown> } }).seller?.profile);
  const [, startTransition] = useTransition();

  // ✅ Products from Backend API
  const [items, setItems] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'price-asc' | 'price-desc'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Log seller profile for debugging
  useEffect(() => {
    const debugSeller = async () => {
      console.log('🛍️ Seller Profile:', seller);
      console.log('Token:', localStorage.getItem('token') ? '✓ Present' : '✗ Missing');
      
      try {
        const profile = await sellerAPI.getProfile();
        console.log('✓ Profile endpoint response:', profile);
      } catch (err) {
        const apiError = err as ApiErrorResponse;
        console.error('✗ Profile endpoint error:', {
          status: apiError?.response?.status,
          message: apiError?.response?.data?.message || apiError?.message,
        });
      }
    };
    debugSeller();
  }, [seller]);

  // ✅ state สำหรับแถบเพิ่มสต็อก
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);

  const reload = useCallback(async () => {
    try {
      if (!seller) {
        console.log('📦 Seller profile not loaded yet, fetching...');
        try {
          const profileRes = await sellerAPI.getProfile();
          console.log('✓ Profile loaded:', profileRes.data);
        } catch (profileErr) {
          console.warn('⚠️ Could not load profile:', profileErr);
        }
      }
      
      const res = (await sellerAPI.getMyProducts()) as { data?: Record<string, unknown> | unknown[] };
      const data = (res.data as { data?: unknown; products?: unknown[] })?.data ?? res.data;
      const rawProducts = Array.isArray(data) ? data : (data as { products?: unknown[] })?.products ?? [];
      const products = rawProducts.map((p: Record<string, unknown>) => ({
        ...p,
        stock: p.quantity_in_stock ?? p.stock ?? 0,
        is_active: p.is_active ?? true,
      } as SellerProduct));
      startTransition(() => {
        setItems(products);
      });
      setError(null);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      console.error('Failed to load products:', err);
      let errorMessage = 'ไม่สามารถโหลดสินค้าได้';
      if (typeof apiError?.response?.data?.error === 'string') {
        errorMessage = apiError.response.data.error;
      } else if (typeof apiError?.response?.data?.message === 'string') {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.message) {
        errorMessage = String(apiError.message);
      }
      setError(errorMessage);
    }
  }, [startTransition, seller]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    };
    fetchProducts();
  }, [reload]);

  // ── form state ──
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(100);
  const [unit, setUnit] = useState<'kg' | 'g' | 'box'>('kg');
  const [weight, setWeight] = useState<number>(1);
  const [stock, setStock] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── edit modal state ──
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<'kg' | 'g' | 'box'>('kg');
  const [editStock, setEditStock] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const canAdd = name.trim().length >= 2 && price > 0;

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── open edit modal ──
  const openEditModal = (p: SellerProduct) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditUnit((p.unit || 'kg') as 'kg' | 'g' | 'box');
    setEditStock(p.stock);
    setEditDescription(p.description || '');
    setEditCategoryId(String(p.category_id || ''));
    setEditImages(p.images || []);
  };

  const handleEditSave = async () => {
    if (!editProduct || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await sellerAPI.updateProduct(editProduct.id, {
        name: editName.trim(),
        price: Number(editPrice),
        unit: editUnit,
        quantity_in_stock: Number(editStock),
        description: editDescription.trim(),
        category_id: editCategoryId || undefined,
        images: editImages.length > 0 ? editImages : undefined,
      });
      dispatch(pushNotification({ type: 'system', title: '✅ แก้ไขสินค้าสำเร็จ', message: `${editName.trim()} ถูกอัปเดตแล้ว` }));
      setEditProduct(null);
      await reload();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      dispatch(pushNotification({ type: 'error', title: '❌ แก้ไขไม่สำเร็จ', message: String(apiError?.response?.data?.message || apiError?.message || 'เกิดข้อผิดพลาด') }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleEditImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setEditImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const addProduct = async () => {
    if (!canAdd || submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        price: Number(price) || 100,
        unit: unit || 'kg',
        quantity_in_stock: Number(stock) || 50,
        description: description.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        category_id: categoryId || undefined,
      };
      
      await sellerAPI.createProduct(payload);

      dispatch(
        pushNotification({
          type: 'system',
          title: '✅ เพิ่มสินค้าสำเร็จ',
          message: `${name.trim()} ถูกเพิ่มเข้าร้านแล้ว`,
        })
      );

      setName('');
      setPrice(100);
      setUnit('kg');
      setWeight(1);
      setStock(50);
      setCategoryId('');
      setDescription('');
      setImages([]);
      if (fileRef.current) fileRef.current.value = '';
      
      setTimeout(() => {
        reload();
      }, 500);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      let errorMsg = apiError?.response?.data?.message || apiError?.response?.data?.error || apiError?.message || 'เกิดข้อผิดพลาด';
      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เพิ่มสินค้าไม่สำเร็จ',
          message: String(errorMsg),
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('ยืนยันการลบสินค้านี้?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      dispatch(
        pushNotification({
          type: 'system',
          title: '🗑️ ลบสินค้าแล้ว',
          message: 'สินค้าถูกลบออกจากร้านแล้ว',
        })
      );
      await reload();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      let errorMsg = apiError?.response?.data?.message || apiError?.message || 'เกิดข้อผิดพลาด';
      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ ลบสินค้าไม่สำเร็จ',
          message: String(errorMsg),
        })
      );
    }
  };

  const handleToggleStatus = async (p: SellerProduct) => {
    const newIsActive = !(p.is_active ?? true);
    try {
      await sellerAPI.updateProduct(p.id, { is_active: newIsActive });
      dispatch(
        pushNotification({
          type: 'system',
          title: newIsActive ? '✅ เผยแพร่สินค้าแล้ว' : '🔒 ซ่อนสินค้าแล้ว',
          message: `${p.name} ${newIsActive ? 'ถูกเผยแพร่' : 'ถูกซ่อน'}`,
        })
      );
      await reload();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      let errorMsg = apiError?.response?.data?.message || apiError?.message || 'ไม่สามารถเปลี่ยนสถานะสินค้าได้';
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: String(errorMsg),
        })
      );
    }
  };

  const handleAddStock = (productId: number, currentStock: number) => {
    setEditingStockId(productId);
    setEditingStockValue(currentStock);
  };

  const handleSaveStock = async (productId: number, oldStock: number) => {
    const newStock = editingStockValue;
    try {
      await sellerAPI.updateProduct(productId, { quantity_in_stock: newStock });
      const diff = newStock - oldStock;
      dispatch(
        pushNotification({
          type: 'system',
          title: diff > 0 ? '📦 เพิ่มสต็อกแล้ว' : '📦 อัปเดตสต็อกแล้ว',
          message: diff > 0
            ? `เพิ่ม ${diff} ชิ้น (รวม ${newStock} ชิ้น)`
            : `ปรับสต็อกเป็น ${newStock} ชิ้น`,
        })
      );
      setEditingStockId(null);
      setEditingStockValue(0);
      await reload();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      let errorMsg = apiError?.response?.data?.message || apiError?.message || 'ไม่สามารถอัปเดตสต็อกได้';
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: String(errorMsg),
        })
      );
    }
  };

  // ✅ Filtered & Sorted Products
  const lowStockItems = items.filter((p) => p.stock > 0 && p.stock < 20);
  const outOfStockItems = items.filter((p) => p.stock === 0);

  const filteredItems = items
    .filter((p) => {
      // Search filter
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filterStatus === 'active' && !(p.is_active ?? true)) return false;
      if (filterStatus === 'hidden' && (p.is_active ?? true)) return false;
      // Stock filter
      if (filterStock === 'low' && p.stock >= 20) return false;
      if (filterStock === 'out' && p.stock > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return (b.id ?? 0) - (a.id ?? 0);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(filteredItems.map((p) => p.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkPublish = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          sellerAPI.updateProduct(id, { is_active: true })
        )
      );
      dispatch(
        pushNotification({
          type: 'system',
          title: '✅ เผยแพร่สินค้าแล้ว',
          message: `เผยแพร่ ${selectedIds.size} สินค้า`,
        })
      );
      setSelectedIds(new Set());
      setShowBulkActions(false);
      await reload();
    } catch (err) {
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: 'ไม่สามารถเผยแพร่สินค้าได้',
        })
      );
    }
  };

  const handleBulkHide = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          sellerAPI.updateProduct(id, { is_active: false })
        )
      );
      dispatch(
        pushNotification({
          type: 'system',
          title: '🔒 ซ่อนสินค้าแล้ว',
          message: `ซ่อน ${selectedIds.size} สินค้า`,
        })
      );
      setSelectedIds(new Set());
      setShowBulkActions(false);
      await reload();
    } catch (err) {
      dispatch(
        pushNotification({
          type: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          message: 'ไม่สามารถซ่อนสินค้าได้',
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-pulse text-lg font-medium text-emerald-700">⏳ กำลังโหลดสินค้า...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">📦 สินค้า</h1>
        <p className="text-neutral-600 mt-1">จัดการและขายสินค้าของร้านคุณ</p>
      </div>

      {/* ✅ Low stock alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="font-semibold text-amber-900 mb-2">⚠️ แจ้งเตือนสต็อก</div>
          {outOfStockItems.length > 0 && (
            <div className="text-sm text-red-700 mb-1">
              🔴 สินค้าหมดสต็อก ({outOfStockItems.length}):{' '}
              <span className="font-medium">{outOfStockItems.map(p => p.name).join(', ')}</span>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="text-sm text-amber-700">
              🟡 สต็อกใกล้หมด ({lowStockItems.length}):{' '}
              <span className="font-medium">{lowStockItems.map(p => `${p.name} (${p.stock})`).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Add Product Form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">➕ เพิ่มสินค้าใหม่</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ชื่อสินค้า *">
            <input
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="เช่น มะม่วงน้ำดอกไม้"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="ราคา (บาท) *">
            <input
              type="number"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="เช่น 150"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </Field>

          <Field label="หน่วยขาย">
            <select
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'kg' | 'ton')}
            >
              <option value="kg">กิโลกรัม (Kg)</option>
              <option value="ton">ตัน (Ton)</option>
            </select>
          </Field>

          <Field label="น้ำหนักต่อหน่วย">
            <input
              type="number"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="เช่น 1"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>

          <Field label="จำนวนสต็อก (ชิ้น)">
            <input
              type="number"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="เช่น 50"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </Field>

          <Field label="หมวดหมู่">
            <select
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>

          <Field label="รูปสินค้า">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition text-left"
            >
              📷 คลิกเพื่อเลือกรูปภาพ
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImages}
            />
          </Field>
        </div>

        {images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img}
                  className="h-20 w-20 object-cover rounded-lg border border-neutral-200"
                  alt={`preview-${i}`}
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">
                    หลัก
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <Field label="รายละเอียดสินค้า">
          <textarea
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="อธิบายสินค้า เช่น แหล่งที่มา ความสด วิธีเก็บรักษา"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <button
          type="button"
          className={`mt-4 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg transition ${
            !canAdd || submitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-emerald-700'
          }`}
          disabled={!canAdd || submitting}
          onClick={addProduct}
        >
          {submitting ? '⏳ กำลังเพิ่ม...' : '+ เพิ่มสินค้า'}
        </button>
      </div>

      {/* Products List with Filters & Bulk Actions */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="text-lg font-bold text-neutral-900">
            สินค้าของฉัน ({items.length})
          </div>

          {/* Search & Filters */}
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 md:flex-none rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">เผยแพร่</option>
              <option value="hidden">ซ่อน</option>
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="all">สต็อก: ทั้งหมด</option>
              <option value="low">สต็อกน้อย (&lt;20)</option>
              <option value="out">หมด</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="latest">ล่าสุด</option>
              <option value="price-asc">ราคา: ต่ำ-สูง</option>
              <option value="price-desc">ราคา: สูง-ต่ำ</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {showBulkActions && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-blue-900">
                เลือก {selectedIds.size} / {filteredItems.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkPublish}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ✅ เผยแพร่
              </button>
              <button
                onClick={handleBulkHide}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                🙈 ซ่อน
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Select All Checkbox */}
        {filteredItems.length > 0 && !showBulkActions && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={false}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs text-neutral-600">เลือกทั้งหมด</span>
          </div>
        )}

        {/* Products Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-lg">📭 ไม่มีสินค้า</p>
            <p className="text-sm mt-1">เริ่มเพิ่มสินค้าแรกของคุณ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-neutral-200 hover:border-emerald-300 hover:shadow-lg transition overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative h-40 bg-neutral-100 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="absolute top-2 left-2 w-4 h-4 z-10 cursor-pointer"
                  />
                  <Link to={`/details/${p.id}`}>
                    <img
                      src={(p.images?.[0]) || p.image || '/no-image.png'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </Link>
                  {(p.is_active === false) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">🔒 ซ่อน</span>
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      หมด
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 space-y-2">
                  <Link
                    to={`/details/${p.id}`}
                    className="font-semibold text-neutral-900 text-sm line-clamp-2 hover:text-emerald-700 block"
                  >
                    {p.name}
                  </Link>

                  <div className="text-sm text-neutral-600">
                    ฿{Number(p.price).toLocaleString()} / {p.unit || 'kg'}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">สต็อก: {p.stock}</span>
                    {p.stock < 20 && p.stock > 0 && (
                      <span className="text-amber-600 font-semibold">⚠️ น้อย</span>
                    )}
                  </div>

                  {/* Actions */}
                  {editingStockId === p.id ? (
                    <div className="flex gap-1 mt-3">
                      <input
                        type="number"
                        value={editingStockValue}
                        onChange={(e) => setEditingStockValue(Number(e.target.value))}
                        className="flex-1 text-xs px-2 py-1 rounded border border-emerald-300 outline-none"
                      />
                      <button
                        type="button"
                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                        onClick={() => handleSaveStock(p.id, p.stock)}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 border border-neutral-300 text-xs rounded hover:bg-neutral-50"
                        onClick={() => setEditingStockId(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="flex-1 px-2 py-1.5 rounded border border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-medium"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddStock(p.id, p.stock)}
                        className="flex-1 px-2 py-1.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                      >
                        📦 +สต็อก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`flex-1 px-2 py-1.5 rounded border font-medium ${
                          p.is_active
                            ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                            : 'border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {p.is_active ? '🙈 ซ่อน' : '🌐 แสดง'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="flex-1 px-2 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditProduct(null)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl border border-neutral-200 max-h-[90vh] overflow-auto">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
              <div className="font-semibold text-neutral-900 text-lg">✏️ แก้ไขสินค้า</div>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="h-9 w-9 rounded-md hover:bg-neutral-50 text-lg"
                aria-label="close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="ชื่อสินค้า *">
                <input
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="ราคา (บาท) *">
                  <input
                    type="number"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                  />
                </Field>

                <Field label="หน่วยขาย">
                  <select
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as 'kg' | 'ton')}
                  >
                    <option value="kg">กิโลกรัม (Kg)</option>
                    <option value="ton">ตัน (Ton)</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="จำนวนสต็อก">
                  <input
                    type="number"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                  />
                </Field>

                <Field label="หมวดหมู่">
                  <select
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="รายละเอียดสินค้า">
                <textarea
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </Field>

              <Field label="รูปสินค้า">
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  className="rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition text-left"
                >
                  📷 เพิ่มรูปภาพ
                </button>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleEditImages}
                />
              </Field>

              {editImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} className="h-20 w-20 object-cover rounded-lg border border-neutral-200" alt={`edit-preview-${i}`} />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">หลัก</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={editSubmitting || !editName.trim() || editPrice <= 0}
                  onClick={handleEditSave}
                  className={`flex-1 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                    editSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'
                  }`}
                >
                  {editSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-5 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}