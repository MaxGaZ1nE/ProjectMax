import DeliveryRegistrationFlow from '@/components/delivery-registration/DeliveryRegistrationFlow';
import { DeliveryRegistrationProvider } from '@/contexts/DeliveryRegistrationContext';

export default function DeliverySignupPage() {
  return (
    <DeliveryRegistrationProvider>
      <DeliveryRegistrationFlow />
    </DeliveryRegistrationProvider>
  );
}
