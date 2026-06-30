import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourierNavbar from '@/components/delivery/CourierNavbar';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-[#1a6e40] focus:ring-2 focus:ring-[#1a6e40]/20 dark:focus:border-[#1a6e40] dark:focus:ring-[#1a6e40]/30';

const selectClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 ' +
  'focus:border-[#1a6e40] focus:ring-2 focus:ring-[#1a6e40]/20 dark:focus:border-[#1a6e40] dark:focus:ring-[#1a6e40]/30';

const btnClass =
  'bg-[#1a6e40] hover:bg-[#166534] text-white font-medium py-3 rounded-lg transition-colors shadow-sm';

const btnCancelClass =
  'bg-white border border-[#e0e0e0] hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-lg transition-colors shadow-sm';

export interface CourierBank {
  bank?: string;
  accountNumber?: string;
  accountName?: string;
}

const THAI_BANKS = [
  { code: 'ksb', name: 'ธนาคารกรุงศรี' },
  { code: 'bbl', name: 'ธนาคารกรุงเทพ' },
  { code: 'ktb', name: 'ธนาคารกสิกรไทย' },
  { code: 'ttb', name: 'ธนาคารทหารไทย' },
  { code: 'scb', name: 'ธนาคารสยาม' },
  { code: 'bay', name: 'ธนาคารกรุงไทย' },
  { code: 'uob', name: 'ธนาคารยูโอบี' },
  { code: 'cimb', name: 'ธนาคารซีไอเอ็มบี' },
  { code: 'tbank', name: 'ธนาคารไทยพาณิชย์' },
  { code: 'ibank', name: 'ธนาคารไทยยูนิยน' },
];

export default function CourierBankPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CourierBank>({
    bank: '',
    accountNumber: '',
    accountName: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch('http://localhost:5000/api/courier/bank', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok && res.status !== 404) {
          throw new Error('Failed to fetch bank info');
        }

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setFormData({
              bank: json.data.bank || '',
              accountNumber: json.data.accountNumber || '',
              accountName: json.data.accountName || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching bank info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBankInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bank?.trim()) {
      setError('กรุณาเลือกธนาคาร');
      return;
    }
    if (!formData.accountNumber?.trim()) {
      setError('กรุณากรอกเลขบัญชี');
      return;
    }
    if (!formData.accountName?.trim()) {
      setError('กรุณากรอกชื่อบัญชี');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch('http://localhost:5000/api/courier/bank', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update bank info');
      }

      setSuccessMessage('บันทึกข้อมูลธนาคารสำเร็จ');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating bank info:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลธนาคารได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
        <CourierNavbar />
        <div className="max-w-3xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-neutral-500">⏳ กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#e0e0e0]">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-neutral-500 hover:text-neutral-700 text-2xl"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-neutral-900">บัญชีธนาคาร</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✅ {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ธนาคาร</label>
              <select
                name="bank"
                value={formData.bank || ''}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">-- เลือกธนาคาร --</option>
                {THAI_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">เลขบัญชี</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber || ''}
                onChange={handleChange}
                placeholder="เช่น 0123456789"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ชื่อบัญชี</label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName || ''}
                onChange={handleChange}
                placeholder="ชื่อผู้ถือบัญชี"
                className={inputClass}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 ${btnClass} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`flex-1 ${btnCancelClass}`}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
