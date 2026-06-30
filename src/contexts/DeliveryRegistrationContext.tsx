import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface DeliveryRegistrationData {
  // Step 1: Personal information
  fullName: string;
  phone: string;
  email: string;
  // Step 2: Documents
  idCardNumber?: string;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  drivingLicenseImage?: string;
  licensePlateNumber?: string;
  vehicleType?: string;
  vehicleOwnershipImage?: string;
  vehicleRegisteredName?: string;
  insuranceImage?: string;
  // Step 3: Submitted
  pendingApproval?: boolean;
  submittedAt?: string;
}

interface DeliveryRegistrationContextType {
  step: number;
  data: DeliveryRegistrationData;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setData: React.Dispatch<React.SetStateAction<DeliveryRegistrationData>>;
  updateData: (fields: Partial<DeliveryRegistrationData>) => void;
  resetData: () => void;
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  goNext: () => boolean;
  goPrev: () => boolean;
}

// Thai ID Checksum validation
function validateThaiIDChecksum(digits: string): boolean {
  if (!/^\d{13}$/.test(digits) || digits[0] === '0') return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === parseInt(digits[12]);
}

const initialData: DeliveryRegistrationData = {
  fullName: '',
  phone: '',
  email: '',
};

const DeliveryRegistrationContext = createContext<DeliveryRegistrationContextType | undefined>(
  undefined
);

export function DeliveryRegistrationProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<DeliveryRegistrationData>(initialData);

  const updateData = useCallback((fields: Partial<DeliveryRegistrationData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  }, []);

  const resetData = useCallback(() => {
    setStep(1);
    setData(initialData);
  }, []);

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return (
          data.fullName.trim().length >= 2 &&
          data.phone.trim().length >= 8 &&
          data.email.trim().length >= 5
        );
      case 2:
        return !!(
          data.idCardNumber &&
          validateThaiIDChecksum(data.idCardNumber) &&
          data.idCardFrontImage &&
          data.idCardBackImage &&
          data.drivingLicenseImage &&
          data.licensePlateNumber?.trim() &&
          data.vehicleType?.trim() &&
          data.vehicleOwnershipImage &&
          data.insuranceImage
        );
      case 3:
        return true; // Review step - always can submit
      default:
        return false;
    }
  };

  const canGoPrev = () => step > 1 && step < 4;

  const goNext = (): boolean => {
    if (canGoNext() && step < 3) {
      setStep((s) => s + 1);
      return true;
    }
    return false;
  };

  const goPrev = (): boolean => {
    if (canGoPrev()) {
      setStep((s) => s - 1);
      return true;
    }
    return false;
  };

  return (
    <DeliveryRegistrationContext.Provider
      value={{ step, data, setStep, setData, updateData, resetData, canGoNext, canGoPrev, goNext, goPrev }}
    >
      {children}
    </DeliveryRegistrationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDeliveryRegistration() {
  const ctx = useContext(DeliveryRegistrationContext);
  if (!ctx) throw new Error('useDeliveryRegistration must be used within DeliveryRegistrationProvider');
  return ctx;
}
