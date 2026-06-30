import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourierNavbar from '@/components/delivery/CourierNavbar';
import DeliveryConfirmModal from '@/components/delivery/DeliveryConfirmModal';

const inputClass =
  'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none transition ' +
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ' +
  'focus:border-[#1a6e40] focus:ring-2 focus:ring-[#1a6e40]/20 dark:focus:border-[#1a6e40] dark:focus:ring-[#1a6e40]/30';

const btnClass =
  'bg-[#1a6e40] hover:bg-[#166534] text-white font-medium py-3 rounded-lg transition-colors shadow-sm';

const btnCancelClass =
  'bg-white border border-[#e0e0e0] hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-lg transition-colors shadow-sm';

export interface CourierJob {
  id: string;
  orderId: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_delivery' | 'delivered' | 'cancelled';
  buyerName: string;
  buyerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  packageWeight: number;
  packageDescription: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CourierDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // Default to new jobs tab

  // Job states
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [activeJob, setActiveJob] = useState<CourierJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingStatus, setPollingStatus] = useState<string>('');

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Courier info (should come from auth context or props)
  const [courierId] = useState<string>(() => localStorage.getItem('userId') || 'unknown');
  const [courierName] = useState<string>(() => localStorage.getItem('userName') || 'Courier');

  // ============================================
  // POLLING: Monitor active job status
  // ============================================
  useEffect(() => {
    if (!activeJob) return;

    // Stop polling if job is completed or cancelled
    if (['delivered', 'cancelled'].includes(activeJob.status)) {
      return;
    }

    const pollJobStatus = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch(`http://localhost:5000/api/courier/jobs/${activeJob.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch job status');
        }

        const json = await res.json();
        const updatedJob = json.data as CourierJob;

        // Check if status changed to cancelled
        if (updatedJob.status === 'cancelled') {
          alert('⚠️ ออเดอร์นี้ถูกยกเลิกโดยผู้ขาย\nกรุณากลับไปยังหน้าแดชบอร์ด');
          setActiveJob(null);
          navigate('/delivery/dashboard');
          return;
        }

        // Check if delivery address was updated
        if (updatedJob.deliveryAddress !== activeJob.deliveryAddress) {
          console.log('Delivery address updated:', updatedJob.deliveryAddress);
          // Trigger a subtle notification that address was updated
          setPollingStatus(`📍 ที่อยู่จัดส่งได้รับการอัปเดต (เวลา: ${new Date().toLocaleTimeString('th-TH')})`);
        }

        // Update active job with new data
        setActiveJob(updatedJob);
        setPollingStatus(''); // Clear status message after 2 seconds
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling even on error to avoid losing sync
      }
    };

    // Initial poll
    pollJobStatus();

    // Set interval for polling every 15 seconds
    const pollInterval = setInterval(pollJobStatus, 15000);

    // Cleanup interval on unmount or when activeJob changes
    return () => clearInterval(pollInterval);
  }, [activeJob, navigate]);

  // ============================================
  // FETCH: Load courier's jobs on mount
  // ============================================
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch('http://localhost:5000/api/courier/jobs', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const json = await res.json();
        const jobsList = json.data || [];
        setJobs(jobsList);

        // Set first job without 'delivered' or 'cancelled' status as active
        const activeJobData = jobsList.find(
          (job: CourierJob) => !['delivered', 'cancelled'].includes(job.status)
        );
        if (activeJobData) {
          setActiveJob(activeJobData);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('ไม่สามารถโหลดรายการงานได้');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const tabs = [
    { id: 0, label: 'งานใหม่', icon: '📋' },
    { id: 1, label: 'ประวัติ', icon: '📜' },
    { id: 2, label: 'โปรไฟล์', icon: '👤' },
  ];

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      pending: { label: 'รอยืนยัน', color: 'bg-amber-100 text-amber-800', icon: '⏳' },
      accepted: { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-800', icon: '✅' },
      picked_up: { label: 'ยกของแล้ว', color: 'bg-purple-100 text-purple-800', icon: '📦' },
      in_delivery: { label: 'กำลังจัดส่ง', color: 'bg-cyan-100 text-cyan-800', icon: '🚚' },
      delivered: { label: 'จัดส่งสำเร็จ', color: 'bg-green-100 text-green-800', icon: '✨' },
      cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-rose-100 text-rose-800', icon: '❌' },
    };
    return statusMap[status] || { label: 'ไม่ทราบ', color: 'bg-neutral-100 text-neutral-800', icon: '❓' };
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:5000/api/courier/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to accept job');
      }

      // Refresh jobs
      const jobsRes = await fetch('http://localhost:5000/api/courier/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const jobsJson = await jobsRes.json();
      setJobs(jobsJson.data || []);

      // Update active job
      const updatedJob = jobsJson.data?.find((j: CourierJob) => j.id === jobId);
      if (updatedJob) {
        setActiveJob(updatedJob);
      }
    } catch (err) {
      console.error('Error accepting job:', err);
      alert('ไม่สามารถรับงานได้');
    }
  };

  const handleMarkDelivered = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:5000/api/courier/jobs/${jobId}/delivered`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to mark as delivered');
      }

      // Refresh jobs
      const jobsRes = await fetch('http://localhost:5000/api/courier/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const jobsJson = await jobsRes.json();
      setJobs(jobsJson.data || []);

      // Find next active job
      const nextActiveJob = jobsJson.data?.find(
        (j: CourierJob) => !['delivered', 'cancelled'].includes(j.status)
      );
      setActiveJob(nextActiveJob || null);
    } catch (err) {
      console.error('Error marking as delivered:', err);
      alert('ไม่สามารถทำเครื่องหมายว่าจัดส่งแล้ว');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12 font-sans">
      <CourierNavbar />

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Tabs */}
        <div className="bg-white rounded-t-[12px] border-b border-[#e0e0e0] shadow-sm">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1a6e40] text-[#1a6e40] font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-[12px] p-8 shadow-sm border border-t-0 border-[#e0e0e0]">
          {/* Tab 0: New Jobs */}
          {activeTab === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-6">📋 งานใหม่</h2>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500">กำลังโหลดรายการงาน...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 text-lg">📭 ไม่มีงานใหม่ในตอนนี้</p>
                  <p className="text-neutral-400 text-sm mt-2">กรุณาตรวจสอบภายหลัง</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Polling Status Display */}
                  {pollingStatus && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-200 animate-pulse">
                      {pollingStatus}
                    </div>
                  )}

                  {/* Active Job Card */}
                  {activeJob && (
                    <div className="bg-gradient-to-r from-[#1a6e40] to-[#2d8a57] rounded-lg p-6 text-white shadow-md mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">🚚 งานที่ใช้งานอยู่</h3>
                          <p className="text-green-100 text-sm">Order ID: {activeJob.orderId}</p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            getStatusLabel(activeJob.status).color
                          }`}
                        >
                          {getStatusLabel(activeJob.status).icon}
                          {getStatusLabel(activeJob.status).label}
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-green-50">
                        <div>
                          <p className="text-sm opacity-80">👤 ชื่อผู้รับ</p>
                          <p className="font-medium">{activeJob.buyerName}</p>
                          <p className="text-sm opacity-80 mt-1">📞 {activeJob.buyerPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-80">📦 น้ำหนัก</p>
                          <p className="font-medium">{activeJob.packageWeight} kg</p>
                          <p className="text-sm opacity-80 mt-1">{activeJob.packageDescription}</p>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-green-50">
                        <div>
                          <p className="font-semibold mb-1">📍 ที่อยู่ยกของ</p>
                          <p>{activeJob.pickupAddress}</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">🏠 ที่อยู่จัดส่ง</p>
                          <p>{activeJob.deliveryAddress}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-col sm:flex-row">
                        {activeJob.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptJob(activeJob.id)}
                            className="flex-1 bg-white hover:bg-green-50 text-[#1a6e40] font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            ✅ ยืนยันรับงาน
                          </button>
                        )}
                        {['accepted', 'picked_up', 'in_delivery'].includes(activeJob.status) && (
                          <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            className="flex-1 bg-white hover:bg-green-50 text-[#1a6e40] font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            📝 ยืนยันการส่ง
                          </button>
                        )}
                      </div>

                      {/* Polling Indicator */}
                      <div className="mt-4 text-xs text-green-100 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                        ติดตามสถานะ (ทุก 15 วินาที)
                      </div>
                    </div>
                  )}

                  {/* Other Jobs List */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-700 mb-3">งานอื่น ๆ</h3>
                    <div className="space-y-2">
                      {jobs
                        .filter((job) => !activeJob || job.id !== activeJob.id)
                        .map((job) => (
                          <div key={job.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-neutral-800">Order: {job.orderId}</p>
                                <p className="text-sm text-neutral-600">👤 {job.buyerName} • 📦 {job.packageWeight}kg</p>
                                <p className="text-sm text-neutral-500 mt-1">📍 {job.deliveryAddress}</p>
                              </div>
                              <div className="flex gap-2 items-center ml-4">
                                {/* Evidence Column */}
                                <div className="text-center" title="POD Status">
                                  <span className="text-lg">—</span>
                                  <p className="text-xs text-neutral-500">หลักฐาน</p>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusLabel(job.status).color}`}>
                                  {getStatusLabel(job.status).label}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: History */}
          {activeTab === 1 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">📜 ยังไม่มีประวัติการจัดส่ง</p>
              <p className="text-neutral-400 text-sm mt-2">ประวัติจะปรากฏที่นี่เมื่อคุณจัดส่งเสร็จสิ้น</p>
            </div>
          )}

          {/* Tab 2: Profile */}
          {activeTab === 2 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">👤 ไปที่หน้าแก้ไขโปรไฟล์</p>
              <button
                onClick={() => navigate('/delivery/profile/edit')}
                className={`mt-4 ${btnClass} px-6`}
              >
                แก้ไขโปรไฟล์
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Confirm Modal */}
      <DeliveryConfirmModal
        isOpen={isConfirmModalOpen}
        job={activeJob}
        courierId={courierId}
        courierName={courierName}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={() => {
          // Refresh jobs after successful delivery confirmation
          const fetchJobs = async () => {
            try {
              const token = localStorage.getItem('token') || localStorage.getItem('authToken');
              const res = await fetch('http://localhost:5000/api/courier/jobs', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (res.ok) {
                const json = await res.json();
                const jobsList = json.data || [];
                setJobs(jobsList);

                // Find next active job
                const nextActiveJob = jobsList.find(
                  (j: CourierJob) => !['delivered', 'cancelled'].includes(j.status)
                );
                setActiveJob(nextActiveJob || null);
              }
            } catch (err) {
              console.error('Error refreshing jobs:', err);
            }
          };
          fetchJobs();
        }}
      />
    </div>
  );
}
