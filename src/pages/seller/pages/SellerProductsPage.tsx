import { useEffect, useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@stores/index';
import {
  fetchSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  clearError,
} from '@slices/seller-slice';
import type { SellerProduct } from '@services/api/seller-api';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

function unitLabel(u: string) {
  if (u === 'kg') return 'กิโลกรัม';
  if (u === 'ton') return 'ตัน';
  return u;
}

export default function SellerProductsPage() {
  const dispatch = useAppDispatch();
  const seller = useAppSelector((s) => s.seller.profile);
  const productsData = useAppSelector((s) => s.seller.products);
  const loading = useAppSelector((s) => s.seller.loading);
  const error = useAppSelector((s) => s.seller.error);

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ✅ Stock quick edit
  const [stockEditingId, setStockEditingId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState<number>(0);

  // form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(120);
  const [unit, setUnit] = useState<SellerProduct['unit']>('kg');
  const [weight, setWeight] = useState<number>(1);
  const [stock, setStock] = useState<number>(50);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  // Load products when component mounts
  useEffect(() => {
    dispatch(fetchSellerProducts());
  }, [dispatch]);

  // ป้องกัน products เป็น error object
  const products = useMemo(() => {
    return Array.isArray(productsData) ? productsData : [];
  }, [productsData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.description ?? ''} `.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query]);

  const resetForm = () => {
    setName('');
    setPrice(120);
    setUnit('kg');
    setWeight(1);
    setStock(50);
    setImage('');
    setDescription('');
    setEditingId(null);
  };

  const openCreate = () => {
    setMode('create');
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (p: SellerProduct) => {
    setMode('edit');
    setEditingId(p.id);
    setName(p.name);
    setPrice(Number(p.price ?? 0));
    setUnit(p.unit);
    setWeight(Number(p.weight ?? 0));
    setStock(Number(p.stock ?? 0));
    setImage(p.image ?? '');
    setDescription(p.description ?? '');
    setFormOpen(true);
  };

  const canSave =
    name.trim().length >= 2 &&
    price > 0 &&
    stock >= 0 &&
    weight > 0 &&
    (unit === 'box' ? true : weight > 0);

  const onSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (mode === 'create') {
        await dispatch(
          createSellerProduct({
            name: name.trim(),
            price: Number(price),
            unit: unit as 'kg' | 'ton',
            weight: Number(weight),
            stock: Number(stock),
            image: image.trim() || undefined,
            description: description.trim() || undefined,
          })
        ).unwrap();
      } else if (mode === 'edit' && editingId) {
        await dispatch(
          updateSellerProduct({
            id: editingId,
            data: {
              name: name.trim(),
              price: Number(price),
              unit: unit as 'kg' | 'ton',
              weight: Number(weight),
              stock: Number(stock),
              image: image.trim() || undefined,
              description: description.trim() || undefined,
            },
          })
        ).unwrap();
      }

      await dispatch(fetchSellerProducts()).unwrap();
      setFormOpen(false);
      resetForm();
    } catch (err) {
      setSaveError((err instanceof Error ? err.message : 'Failed to save product'));
    } finally {
      setIsSaving(false);
    }
  };

  
  const onDelete = async (p: SellerProduct) => {
    if (!window.confirm(`ต้องการลบ "${p.name}" ใช่หรือไม่?`)) return;
    try {
      await dispatch(deleteSellerProduct(p.id)).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
    } catch (err) {
      setSaveError((err instanceof Error ? err.message : 'Failed to delete product'));
    }
  };

  const onToggleStatus = async (p: SellerProduct) => {
    try {
      const newStatus = !p.isActive;  // Toggle: true ↔ false
      console.log(`Toggling product ${p.id} isActive from ${p.isActive} to ${newStatus}`);
      const result = await dispatch(
        updateSellerProduct({
          id: p.id,
          data: { isActive: newStatus },
        })
      ).unwrap();
      console.log('Update result:', result);
      
      const refreshResult = await dispatch(fetchSellerProducts()).unwrap();
      console.log('Refresh result:', refreshResult);
      console.log(`Successfully toggled product ${p.id}`);
    } catch (err: unknown) {
      console.error('onToggleStatus error:', err);
      const errorMsg = (err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err)) || 'Failed to update product status';
      console.error('Full error:', err);
      setSaveError(errorMsg);
    }
  };

  const onQuickAddStock = async (p: SellerProduct, amount: number) => {
    try {
      const newStock = Math.max(0, p.stock + amount);
      await dispatch(
        updateSellerProduct({
          id: p.id,
          data: { stock: newStock },
        })
      ).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
    } catch (err) {
      setSaveError((err instanceof Error ? err.message : 'Failed to update stock'));
    }
  };

  const onSaveCustomStock = async (p: SellerProduct) => {
    try {
      await dispatch(
        updateSellerProduct({
          id: p.id,
          data: { stock: Math.max(0, stockEditValue) },
        })
      ).unwrap();
      await dispatch(fetchSellerProducts()).unwrap();
      setStockEditingId(null);
    } catch (err) {
      setSaveError((err instanceof Error ? err.message : 'Failed to update stock'));
    }
  };

  if (!seller) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-neutral-600'>กรุณา login เป็น seller ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {(error || saveError) && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
          {typeof error === 'string' ? error : typeof saveError === 'string' ? saveError : 'เกิดข้อผิดพลาด'}
          <button
            className='ml-2 underline'
            onClick={() => {
              dispatch(clearError());
              setSaveError(null);
            }}
          >
            ปิด
          </button>
        </div>
      )}

      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <div className='text-xl font-semibold text-neutral-900'>สินค้าของฉัน</div>
          <div className='mt-1 text-sm text-neutral-600'>
            ร้าน: <span className='font-semibold'>{seller.shopName}</span>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
          <input
            className={inputClass}
            placeholder='ค้นหาสินค้า...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type='button' className='btn btn-primary' onClick={openCreate}>
            + เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div className='card p-0 overflow-auto'>
        <div className='px-6 py-4 border-b border-neutral-200 flex items-center justify-between'>
          <div className='text-sm font-semibold text-neutral-900'>
            รายการสินค้า ({filtered.length})
          </div>
          {loading && (
            <div className='text-xs text-neutral-500'>
              กำลังโหลด...
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className='p-6 text-sm text-neutral-600'>
            ยังไม่มีสินค้า กด "เพิ่มสินค้า" เพื่อเริ่มลงขายได้เลย
          </div>
        ) : (
          <div className='divide-y divide-neutral-200'>
            {filtered.map((p) => (
              <div key={p.id} className='px-6 py-4 flex gap-4 items-start'>
                <div className='h-16 w-16 rounded-lg border border-neutral-200 bg-neutral-50 overflow-auto shrink-0'>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                  ) : (
                    <div className='h-full w-full flex items-center justify-center text-xs text-neutral-400'>
                      No img
                    </div>
                  )}
                </div>

                <div className='min-w-0 flex-1'>
                  <div className='font-semibold text-neutral-900 truncate'>{p.name}</div>
                  <div className='mt-1 text-xs text-neutral-500'>
                    {p.weight} {unitLabel(p.unit)} | คงเหลือ {p.stock <= 5 ? <span className='text-red-600 font-semibold'>{p.stock}</span> : <span>{p.stock}</span>}
                  </div>
                  <div className='mt-2 flex gap-1 flex-wrap'>
                    {!p.isActive && <span className='inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600'>🔒 ซ่อน</span>}
                    {p.isActive && <span className='inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'>✓ เผยแพร่</span>}
                  </div>
                  {p.description && <div className='mt-1 text-sm text-neutral-600 line-clamp-2'>{p.description}</div>}
                </div>

                <div className='text-right shrink-0'>
                  <div className='text-xs text-neutral-500'>ราคา</div>
                  <div className='text-lg font-semibold text-red-600'>฿{Number(p.price).toLocaleString()}</div>

                  <div className='mt-3 flex flex-col gap-2'>
                    {stockEditingId === p.id ? (
                      <div className='flex gap-1'>
                        <input type='number' min='0' value={stockEditValue} onChange={(e) => setStockEditValue(Number(e.target.value))} className='w-16 px-2 py-1 rounded border border-blue-300 text-xs focus:outline-none' />
                        <button type='button' className='px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 font-medium' onClick={() => onSaveCustomStock(p)}>✓</button>
                        <button type='button' className='px-2 py-1 rounded text-xs border border-neutral-300 hover:bg-neutral-50' onClick={() => setStockEditingId(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div className='flex gap-1'>
                          <button type='button' className='flex-1 px-2 py-1.5 rounded text-xs border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium' onClick={() => onQuickAddStock(p, 5)}>+5 สต็อก</button>
                          <button type='button' className='flex-1 px-2 py-1.5 rounded text-xs border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium' onClick={() => {setStockEditingId(p.id); setStockEditValue(p.stock);}}>📦 แก้ไข</button>
                        </div>
                        <button type='button' className={p.isActive ? 'px-3 py-1.5 rounded text-xs border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium' : 'px-3 py-1.5 rounded text-xs border border-green-300 text-green-600 hover:bg-green-50 font-medium'} onClick={() => onToggleStatus(p)}>{p.isActive ? '🔓 ซ่อน' : '🔒 เผยแพร่'}</button>
                        <button type='button' className='px-3 py-1.5 rounded text-xs border border-neutral-300 hover:bg-neutral-50 font-medium' onClick={() => openEdit(p)}>✏️ แก้ไข</button>
                        <button type='button' className='px-3 py-1.5 rounded text-xs border border-red-200 text-red-600 hover:bg-red-50 font-medium' onClick={() => onDelete(p)}>🗑️ ลบ</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className='card p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div className='text-lg font-semibold text-neutral-900'>{mode === 'create' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</div>
            <button type='button' className='btn' onClick={() => setFormOpen(false)}>ปิด</button>
          </div>

          <div className='mt-5 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>ชื่อสินค้า</div>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>ราคา</div>
              <input className={inputClass} type='number' min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>สต็อก</div>
              <input className={inputClass} type='number' min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
            </div>
            <div>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>หน่วย</div>
              <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as 'kg' | 'ton')}>
                <option value='kg'>กิโลกรัม (Kg)</option>
                <option value='ton'>ตัน (Ton)</option>
              </select>
            </div>
            <div>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>น้ำหนักต่อหน่วย ({unitLabel(unit)})</div>
              <input className={inputClass} type='number' min={1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              <div className='mt-1 text-xs text-neutral-500'>ตัวอย่าง: unit=kg weight=1 (1 กก.) หรือ unit=ton weight=1 (1 ตัน)</div>
            </div>
            <div className='md:col-span-2'>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>รูปสินค้า (URL)</div>
              <input className={inputClass} value={image} onChange={(e) => setImage(e.target.value)} placeholder='เช่น https://...' />
            </div>
            <div className='md:col-span-2'>
              <div className='text-sm font-semibold text-neutral-900 mb-1'>รายละเอียด</div>
              <textarea className={[inputClass, 'min-h-[90px] py-2.5'].join(' ')} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className='mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end'>
            <button type='button' className='btn' onClick={() => setFormOpen(false)}>ยกเลิก</button>
            <button type='button' className={['btn btn-primary', !canSave ? 'opacity-50 cursor-not-allowed' : ''].join(' ')} disabled={!canSave || isSaving} onClick={onSave}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}</button>
          </div>

          {!canSave && <div className='mt-2 text-xs text-neutral-500'>กรุณากรอกชื่อสินค้าให้ครบ และตรวจสอบ ราคา/สต็อก/น้ำหนัก ให้ถูกต้อง</div>}
        </div>
      )}
    </div>
  );
}
