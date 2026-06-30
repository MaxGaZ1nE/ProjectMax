/**
 * ✅ Cart Persistence Utilities
 * Handles clearing both Redux cart state and persisted localStorage data
 * to prevent stale data from appearing after order placement
 */

/**
 * Clear cart from both Redux store and localStorage persist
 * Call this BEFORE navigating away after successful order placement
 * 
 * @param dispatch Redux dispatch function from useAppDispatch()
 * @param clearCartAction Action creator to dispatch (e.g., clearCart())
 */
export function clearCartCompletely(dispatch: any, clearCartAction: any) {
  // ✅ Step 1: Clear Redux store
  dispatch(clearCartAction);

  // ✅ Step 2: Manually clear persisted cart data from localStorage
  // This prevents race condition with redux-persist where old data could be restored
  clearPersistedCart();
}

/**
 * Clear only the persisted localStorage data
 * Useful if you've already dispatched the Redux action separately
 */
export function clearPersistedCart() {
  try {
    const persistedRoot = localStorage.getItem('persist:root');
    if (persistedRoot) {
      const parsed = JSON.parse(persistedRoot);
      // Set cart to empty items array
      parsed.cart = JSON.stringify({ items: [] });
      localStorage.setItem('persist:root', JSON.stringify(parsed));
      console.log('🧹 Persisted cart cleared from localStorage');
    }
  } catch (e) {
    console.warn('⚠️ Failed to clear persisted cart from localStorage:', e);
    // Continue anyway - Redux state is cleared at least
  }
}

/**
 * Verify cart is actually empty in localStorage
 * Useful for debugging
 */
export function isCartEmptyInPersist(): boolean {
  try {
    const persistedRoot = localStorage.getItem('persist:root');
    if (!persistedRoot) return true;

    const parsed = JSON.parse(persistedRoot);
    const cartData = JSON.parse(parsed.cart || '{"items":[]}');
    return Array.isArray(cartData.items) && cartData.items.length === 0;
  } catch (e) {
    console.warn('⚠️ Failed to check cart in localStorage:', e);
    return true; // Assume empty on error
  }
}

/**
 * Debug helper: Get current persisted cart data
 */
export function getPersistedCartData() {
  try {
    const persistedRoot = localStorage.getItem('persist:root');
    if (!persistedRoot) return null;

    const parsed = JSON.parse(persistedRoot);
    const cartData = JSON.parse(parsed.cart || '{"items":[]}');
    return cartData;
  } catch (e) {
    console.error('Failed to get persisted cart data:', e);
    return null;
  }
}

