import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type PromptPayType = 'phone' | 'id';

export interface SellerRegistrationData {
  // Step 1
  shopName: string;
  ownerName: string;
  phone: string;
  promptpayType: PromptPayType;
  promptpayValue: string;
  addressLine: string;
  province: string;
  postalCode: string;
  // Step 2
  latitude?: number;
  longitude?: number;
  mapAddress?: string;
  // Step 3
  idCardNumber?: string;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  idCardVerified?: boolean;
  // Step 4
  pendingApproval?: boolean;
  submittedAt?: string;
}

interface SellerRegistrationContextType {
  step: number;
  data: SellerRegistrationData;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setData: React.Dispatch<React.SetStateAction<SellerRegistrationData>>;
  updateData: (fields: Partial<SellerRegistrationData>) => void;
  resetData: () => void;
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  goNext: () => boolean;
  goPrev: () => boolean;
}

// ── Thai ID Checksum ──────────────────────────────────────────────────────────
function validateThaiIDChecksum(digits: string): boolean {
  if (!/^\d{13}$/.test(digits) || digits[0] === '0') return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === parseInt(digits[12]);
}

const initialData: SellerRegistrationData = {
  shopName: '',
  ownerName: '',
  phone: '',
  promptpayType: 'phone',
  promptpayValue: '',
  addressLine: '',
  province: '',
  postalCode: '',
};

const SellerRegistrationContext = createContext<SellerRegistrationContextType | undefined>(
  undefined
);

export function SellerRegistrationProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SellerRegistrationData>(initialData);

  const updateData = useCallback((fields: Partial<SellerRegistrationData>) => {
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
          data.shopName.trim().length >= 2 &&
          data.ownerName.trim().length >= 2 &&
          data.phone.trim().length >= 8 &&
          data.promptpayValue.trim().length >= 8
        );
      case 2:
        return !!(
          (data.latitude !== undefined && data.longitude !== undefined) ||
          data.mapAddress?.trim()
        );
      case 3:
        return !!(
          data.idCardNumber &&
          validateThaiIDChecksum(data.idCardNumber) &&
          data.idCardFrontImage &&
          data.idCardBackImage
        );
      default:
        return false;
    }
  };

  const canGoPrev = () => step > 1 && step < 5;

  const goNext = (): boolean => {
    if (canGoNext() && step < 4) {
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
    <SellerRegistrationContext.Provider
      value={{ step, data, setStep, setData, updateData, resetData, canGoNext, canGoPrev, goNext, goPrev }}
    >
      {children}
    </SellerRegistrationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSellerRegistration() {
  const ctx = useContext(SellerRegistrationContext);
  if (!ctx) throw new Error('useSellerRegistration must be used within SellerRegistrationProvider');
  return ctx;
}