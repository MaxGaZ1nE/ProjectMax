import { useAppSelector } from '@stores/index';
import { useDeliveryRegistration } from '@contexts/DeliveryRegistrationContext';
import { useCallback, useEffect, useState } from 'react';
import { deliveryAPI } from '@services/backend-api';
import DeliveryRegistrationStep1 from './DeliveryRegistrationStep1';
import DeliveryRegistrationStep2 from './DeliveryRegistrationStep2';
import DeliveryRegistrationStep3 from './DeliveryRegistrationStep3';
import DeliveryRegistrationPendingApproval from './DeliveryRegistrationPendingApproval';

const STEPS = [
  { num: 1, label: 'ข้อมูลส่วนตัว' },
  { num: 2, label: 'เอกสารและรถ' },
  { num: 3, label: 'ตรวจสอบ' },
];

export default function DeliveryRegistrationFlow() {
  const { step, setStep } = useDeliveryRegistration();

  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id ?? null;

  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

  const checkRegistrationStatus = useCallback(async () => {
    if (!userId) {
      setIsCheckingStatus(false);
      return;
    }

    setIsCheckingStatus(true);
    setStatusCheckError(null);

    try {
      const response = await deliveryAPI.getRegistrationStatus();
      const data = (response?.data as any)?.data ?? response?.data;
      setRegistrationStatus(data?.status);

      // If already pending approval or approved, go to step 4
      if (data?.status === 'pending_approval' || data?.status === 'approved') {
        setStep(4);
      }
    } catch (err) {
      console.error('Could not fetch registration status:', err);
      setStatusCheckError('ไม่สามารถโหลดสถานะการสมัครได้ กรุณาลองอีกครั้ง');
    } finally {
      setIsCheckingStatus(false);
    }
  }, [userId, setStep]);

  useEffect(() => {
    checkRegistrationStatus();
  }, [checkRegistrationStatus]);

  if (!user) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl font-semibold text-neutral-900">กรุณาเข้าสู่ระบบก่อน</div>
        <a
          href="/auth/login"
          className="text-primary-600 underline underline-offset-4 inline-block mt-2 text-sm"
        >
          ไปหน้าเข้าสู่ระบบ
        </a>
      </div>
    );
  }

  if (isCheckingStatus) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-3" />
        <p className="text-sm text-neutral-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Step 4 = pending approval page
  if (step === 4) {
    return <DeliveryRegistrationPendingApproval />;
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-[calc(100vh-120px)]">
      {statusCheckError && (
        <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>⚠️ {statusCheckError}</span>
              <button
                type="button"
                onClick={checkRegistrationStatus}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          
          {/* Header - Delivery Registration Title */}
          <div className="mb-8 pb-6 border-b border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚚</span>
              <h1 className="text-3xl font-bold text-neutral-900">สมัครเป็นผู้ส่ง</h1>
            </div>
            <p className="text-neutral-600">เข้าร่วมเป็นพนักงานส่งของกับเรา</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="relative flex items-center justify-between">
              {/* Connector lines */}
              <div className="absolute top-5 left-0 right-0 flex px-5">
                {STEPS.slice(0, -1).map((s, idx) => {
                  const isCompleted = step > s.num;
                  const width = 100 / (STEPS.length - 1);
                  return (
                    <div
                      key={`line-${idx}`}
                      className={`flex-1 h-1 mx-1 rounded-full transition ${
                        isCompleted ? 'bg-primary-600' : 'bg-neutral-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Step circles */}
              <div className="relative flex justify-between w-full">
                {STEPS.map((s) => {
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <div key={s.num} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {isCompleted ? '✓' : s.num}
                      </div>
                      <div className="text-xs font-medium text-neutral-600 mt-2 text-center w-16">
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mt-12">
            {step === 1 && <DeliveryRegistrationStep1 />}
            {step === 2 && <DeliveryRegistrationStep2 />}
            {step === 3 && <DeliveryRegistrationStep3 />}
          </div>
        </div>
      </div>
    </div>
  );
}
