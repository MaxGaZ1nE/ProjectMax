import { SellerRegistrationProvider } from '@contexts/SellerRegistrationContext';
import SellerRegistrationFlow from '@components/seller-registration/SellerRegistrationFlow';

/**
 * Seller Registration Page (Multi-step flow)
 * 
 * Steps:
 * 1. Basic shop information
 * 2. Store location with Google Maps
 * 3. Identity verification with ID card
 * 4. Review and submit for approval
 * 5. Pending approval (on another page)
 */
export default function SellerRegisterPage() {
  return (
    <SellerRegistrationProvider>
      <SellerRegistrationFlow />
    </SellerRegistrationProvider>
  );
}