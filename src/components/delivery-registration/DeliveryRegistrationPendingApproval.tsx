import { useAppSelector, useAppDispatch } from '@stores/index';
import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { deliveryAPI } from '@services/backend-api';
import { setUser } from '@slices/auth-slice';

export default function DeliveryRegistrationPendingApproval() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  
  const [statusData, setStatusData] = useState<{
    status: string;
    submittedAt?: string;
    estimatedApprovalDate?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [showApprovedMessage, setShowApprovedMessage] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    checkRegistrationStatus();
    // More aggressive polling: every 5 seconds for first minute, then every 10 seconds
    const setupPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      const interval = pollCountRef.current < 12 ? 5000 : 10000;
      intervalRef.current = setInterval(() => {
        pollCountRef.current++;
        checkRegistrationStatus();
      }, interval);
    };
    
    setupPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      setIsChecking(true);
      setCheckError(null);
      const response = await deliveryAPI.getRegistrationStatus();
      const data = (response?.data as any)?.data ?? response?.data;
      
      setStatusData({
        status: data?.status || 'pending_approval',
        submittedAt: data?.submittedAt || data?.createdAt,
        estimatedApprovalDate: data?.estimatedApprovalDate,
      });

      // If approved, update user role and show message before redirect
      if (data?.status === 'approved') {
        setShowApprovedMessage(true);
        setIsApproved(true);
        
        // Update user role in Redux store
        if (user) {
          dispatch(setUser({ ...user, role: 'delivery' }));
        }
        
        // Clear polling interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (err: unknown) {
      console.error('Error checking status:', err);
      setCheckError('ไม่สามารถตรวจสอบสถานะได้');
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // If approved, redirect to dashboard
  if (isApproved) {
    return <Navigate to="/delivery/dashboard" replace />;
  }

  return (
    <div className="py-10 bg-gradient-to-b from-neutral-50 to-white min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6">
        {/* Approved Message Overlay */}
        {showApprovedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <div className="absolute inset-0 bg-green-300 blur-2xl opacity-40"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  ยินดีด้วย!
                </h3>
                <p className="text-neutral-600">
                  การสมัครของคุณได้รับการอนุมัติแล้ว
                </p>
                <p className="text-sm text-neutral-500">
                  กำลังนำคุณไปยังหน้าแดชบอร์ด...
                </p>
                <div className="pt-4">
                  <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card p-8 space-y-8">
          {/* Icon & Header */}
          <div className="text-center space-y-4">
            <div className="inline-block relative">
              <div className="text-6xl animate-bounce">⏳</div>
              <div className="absolute inset-0 bg-amber-200 blur-xl opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                รอการอนุมัติจากแอดมิน
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                ข้อมูลของคุณกำลังอยู่ในกระบวนการตรวจสอบ
              </p>
            </div>
          </div>

          {/* Info Summary */}
          {(user?.email || statusData?.submittedAt) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <span>📋</span> ข้อมูลที่ส่งให้ตรวจสอบ
              </h3>
              <div className="grid gap-4 text-sm">
                {user?.email && (
                  <div>
                    <p className="text-neutral-600 text-xs">อีเมล</p>
                    <p className="font-semibold text-neutral-900 break-all">{user.email}</p>
                  </div>
                )}
                {statusData?.submittedAt && (
                  <div>
                    <p className="text-neutral-600 text-xs">วันที่ส่งคำขอ</p>
                    <p className="font-semibold text-neutral-900">
                      {formatDate(statusData.submittedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <span>⏱️</span> กำหนดเวลา
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 items-start">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-neutral-900">ส่งคำขอแล้ว</p>
                  <p className="text-neutral-600 text-xs">
                    {statusData?.submittedAt 
                      ? formatDate(statusData.submittedAt)
                      : 'เมื่อ 1-2 นาทีที่แล้ว'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0 ${
                  showApprovedMessage ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}>
                  {showApprovedMessage ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">ตรวจสอบเอกสาร</p>
                  <p className="text-neutral-600 text-xs">
                    {showApprovedMessage ? 'ผ่านการตรวจสอบ' : 'ทำการตรวจสอบ 1-3 วันทำการ'}
                  </p>
                </div>
              </div>
              <div className={`flex gap-3 items-start ${showApprovedMessage ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0 ${
                  showApprovedMessage ? 'bg-emerald-500 animate-bounce' : 'bg-neutral-300'
                }`}>
                  {showApprovedMessage ? '✓' : ''}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">อนุมัติแล้ว</p>
                  <p className="text-neutral-600 text-xs">
                    {showApprovedMessage 
                      ? 'เสร็จสิ้น! ✨'
                      : `ประมาณ ${
                          statusData?.estimatedApprovalDate
                            ? formatDate(statusData.estimatedApprovalDate)
                            : 'ภายใน 3 วันทำการ'
                        }`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          {statusData && (
            <div className={`rounded-lg p-4 border ${
              showApprovedMessage
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm font-medium ${
                showApprovedMessage
                  ? 'text-green-900'
                  : 'text-blue-900'
              }`}>
                📊 สถานะ: <strong className="capitalize">
                  {showApprovedMessage ? '✅ อนุมัติแล้ว' : 'รอการอนุมัติ'}
                </strong>
              </p>
            </div>
          )}

          {/* Error Message */}
          {checkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-red-800">⚠️ {checkError}</p>
                <button
                  type="button"
                  onClick={checkRegistrationStatus}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <span>💡</span> สิ่งที่ต้องรู้
            </h3>
            <ul className="text-sm text-green-900 space-y-1 list-disc list-inside">
              <li>เราจะส่งอีเมลแจ้งให้ทราบเมื่อการตรวจสอบเสร็จ</li>
              <li>หากการตรวจสอบผ่าน คุณสามารถใช้งานได้ทันที</li>
              <li>ระบบตรวจสอบสถานะทุก 5 วินาทีโดยอัตโนมัติ</li>
              <li>หากต้องการความช่วยเหลือ โปรดติดต่อทีมสนับสนุน</li>
            </ul>
          </div>

          {/* Refresh Button */}
          <div className="flex gap-3">
            <button
              className="flex-1 btn btn-primary"
              onClick={checkRegistrationStatus}
              disabled={isChecking || showApprovedMessage}
            >
              {isChecking ? 'กำลังตรวจสอบ...' : '🔄 ตรวจสอบสถานะ'}
            </button>
            <button
              className="flex-1 btn btn-neutral"
              onClick={() => (window.location.href = '/')}
            >
              ← กลับหน้าแรก
            </button>
          </div>

          {/* Polling Status Indicator */}
          <div className="text-xs text-neutral-500 text-center">
            🔄 กำลังตรวจสอบสถานะโดยอัตโนมัติ...
          </div>
        </div>
      </div>
    </div>
  );
}
