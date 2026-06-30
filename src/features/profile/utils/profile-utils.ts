// =======================
// Types
// =======================
export type AddressItem = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
};

export type DisplayUser = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
};

// =======================
// LocalStorage keys
// =======================
export const LS_AVATAR_KEY = 'ffy_avatar_preview';
export const LS_ADDRESS_BOOK_KEY = 'ffy_address_book_v1';

// =======================
// UI helpers
// =======================
export function getDisplayName(user?: DisplayUser) {
  if (!user) return '';

  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();

  // 1) ใช้ first + last ก่อน
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;

  // 2) fallback เป็น name
  const name = (user.name ?? '').trim();
  if (name) return name;

  // 3) สุดท้าย fallback เป็น email
  return (user.email ?? '').trim();
}

export function getInitials(name: string) {
  const s = name.trim();
  return s ? s[0].toUpperCase() : '?';
}

// id ง่ายๆ สำหรับ address book (โปรเจกต์จบเพียงพอ)
export function uid() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// =======================
// Address book storage
// =======================
export function loadAddressBook(): AddressItem[] {
  try {
    const raw = localStorage.getItem(LS_ADDRESS_BOOK_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AddressItem[]) : [];
  } catch {
    return [];
  }
}

export function saveAddressBook(items: AddressItem[]) {
  localStorage.setItem(LS_ADDRESS_BOOK_KEY, JSON.stringify(items));
}