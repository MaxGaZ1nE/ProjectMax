import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { clearCart } from '@/slices/cart-slice';
import { cartAPI } from '@services/backend-api';

/**
 * ✅ Hook to sync Redux cart with backend on app initialization
 * 
 * Problem: After checkout, old redux-persisted cart data could still exist
 * Solution: On app load, clear Redux if backend cart is empty
 * 
 * This prevents showing stale qty=16 in the navbar badge when backend actually has qty=1
 */
export function useSyncCartWithBackend() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const reduxCartItems = useAppSelector((s) => s.cart.items);

  useEffect(() => {
    if (!user?.id) {
      // Not authenticated, nothing to sync
      return;
    }

    // Only check once on mount
    const checkAndSyncCart = async () => {
      try {
        const response = await cartAPI.getCart();
        const backendItems = response.data?.data?.items || response.data?.items || [];

        // If backend is empty but Redux has items, clear Redux
        if (backendItems.length === 0 && reduxCartItems.length > 0) {
          console.log('🧹 Clearing stale Redux cart items (backend is empty)');
          dispatch(clearCart());
          
          // Also clear persisted cart data
          try {
            const persistedRoot = localStorage.getItem('persist:root');
            if (persistedRoot) {
              const parsed = JSON.parse(persistedRoot);
              parsed.cart = JSON.stringify({ items: [] });
              localStorage.setItem('persist:root', JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn('Failed to clear persisted cart:', e);
          }
        }
      } catch (error) {
        // Silently fail - don't break the app if sync fails
        console.warn('Failed to sync cart with backend:', error);
      }
    };

    checkAndSyncCart();
  }, [user?.id, dispatch]); // Only run when user changes
}
