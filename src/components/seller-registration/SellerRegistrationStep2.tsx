/**
 * SellerRegistrationStep2.tsx
 *
 * แผนที่: Leaflet + OpenStreetMap tile (ฟรี ไม่ต้อง API key)
 * ค้นหา: Nominatim (nominatim.openstreetmap.org) — debounce 600ms
 * Reverse geocode: Nominatim reverse endpoint
 * GPS: navigator.geolocation
 * Manual mode: fallback เมื่อ user เลือกเอง
 *
 * ติดตั้ง:
 *   npm install leaflet
 *   npm install -D @types/leaflet
 */

import { useSellerRegistration } from '@contexts/SellerRegistrationContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

// ─── CSS ต้อง import ใน main.tsx หรือ index.css ────────────────────────────
// import 'leaflet/dist/leaflet.css';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition ' +
  'focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

// ─── Nominatim Types ────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// ─── Nominatim API helpers ───────────────────────────────────────────────────
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
// ✅ Nominatim policy: ต้องใส่ User-Agent ชื่อ app
const NOMINATIM_HEADERS = {
  'Accept-Language': 'th,en',
  'User-Agent': 'QinoSellerApp/1.0',
};

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=th&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error('Nominatim search failed');
  return res.json();
}

async function reverseNominatim(lat: number, lon: number): Promise<string> {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  const data: NominatimResult = await res.json();
  return data.display_name ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── ManualLocationForm (top-level — ไม่อยู่ใน render ของ parent) ────────────
interface ManualLocationFormProps {
  mapAddress: string;
  latitude?: number;
  longitude?: number;
  onAddressChange: (v: string) => void;
  onLatChange: (v: number | undefined) => void;
  onLngChange: (v: number | undefined) => void;
  onUseGPS: () => void;
  isLocating: boolean;
  onSwitchToMap: () => void;
}

function ManualLocationForm({
  mapAddress, latitude, longitude,
  onAddressChange, onLatChange, onLngChange,
  onUseGPS, isLocating, onSwitchToMap,
}: ManualLocationFormProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Auto-geocode address when user leaves the field
  const handleAddressBlur = async () => {
    if (!mapAddress?.trim() || latitude !== undefined) return; // Already has coords
    
    setIsGeocoding(true);
    setGeocodeError(null);
    
    try {
      const results = await searchNominatim(mapAddress);
      if (results.length > 0) {
        const r = results[0];
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        onLatChange(lat);
        onLngChange(lng);
      } else {
        setGeocodeError('ไม่พบที่อยู่นี้ กรุณากรอกพิกัดด้วยตนเอง หรือใช้แผนที่');
      }
    } catch (err) {
      setGeocodeError('ไม่สามารถค้นหาที่อยู่ได้ กรุณากรอกพิกัดด้วยตนเอง');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            ที่อยู่ร้านค้า <span className="text-red-500">*</span>
          </label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            placeholder="เช่น 123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ"
            value={mapAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            onBlur={handleAddressBlur}
          />
          {isGeocoding && <p className="text-xs text-neutral-500 mt-1">🔍 กำลังค้นหาพิกัด...</p>}
          {geocodeError && <p className="text-xs text-orange-600 mt-1">⚠️ {geocodeError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Latitude</label>
            <input
              type="number" step="any" className={inputClass} placeholder="13.756331"
              value={latitude ?? ''}
              onChange={(e) => onLatChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Longitude</label>
            <input
              type="number" step="any" className={inputClass} placeholder="100.501765"
              value={longitude ?? ''}
              onChange={(e) => onLngChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>

        {latitude && longitude && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
            ✓ พิกัด: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">💡 เปิด Google Maps → กดค้าง → ดูพิกัด</p>
          <button
            type="button" onClick={onUseGPS} disabled={isLocating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition disabled:opacity-50 whitespace-nowrap"
          >
            {isLocating ? '⏳ กำลังหา...' : '📍 ใช้ GPS'}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="text-xs text-primary-600 hover:text-primary-700 underline"
        onClick={onSwitchToMap}
      >
        ใช้แผนที่แทน →
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SellerRegistrationStep2() {
  const { data, updateData, setStep } = useSellerRegistration();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 600);

  // Validation — ต้องมีพิกัด (lat/lng) ก่อนแล้วค่อย text address
  const canProceed = () => {
    return data.latitude !== undefined && data.longitude !== undefined;
  };

  const handleNext = () => {
    if (!canProceed()) {
      alert('❌ กรุณาปักหมุดตำแหน่งร้านค้า\n\nวิธี:\n1. คลิกบนแผนที่หรือค้นหาที่อยู่\n2. ใช้ GPS ของคุณ\n3. หรือกรอกพิกัด Lat/Lng ด้วยตนเอง');
      return;
    }
    // Proceed without API call (frontend-only state)
    setStep(3);
  };

  // ── Init Leaflet map ────────────────────────────────────────────────────────
  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import — ไม่ block initial render
    const L = (await import('leaflet')).default;

    // Fix default marker icon (Leaflet + Vite issue)
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const center: [number, number] = [
      data.latitude ?? 13.7563,
      data.longitude ?? 100.5018,
    ];

    const map = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: true,
    });

    // OSM tile layer — ฟรี ไม่ต้อง key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Restore existing marker
    if (data.latitude && data.longitude) {
      markerRef.current = L.marker([data.latitude, data.longitude]).addTo(map);
    }

    // Click to place marker
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      placeLeafletMarker(L, lat, lng);
      try {
        const addr = await reverseNominatim(lat, lng);
        updateData({ latitude: lat, longitude: lng, mapAddress: addr });
      } catch {
        updateData({ latitude: lat, longitude: lng });
      }
    });

    setMapReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place / move marker ─────────────────────────────────────────────────────
  const placeLeafletMarker = useCallback(
    async (L: typeof import('leaflet').default, lat: number, lng: number) => {
      if (!mapInstanceRef.current) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.panTo([lat, lng]);
    },
    []
  );

  // ── Load map on mount / when switching back from manual mode ────────────────
  useEffect(() => {
    if (manualMode) return;

    // CSS ต้อง load ก่อน map render
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Reset instance เมื่อ switch กลับจาก manual
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    }

    // รอ DOM render แล้วค่อย init
    const t = setTimeout(() => initMap(), 50);
    return () => clearTimeout(t);
  }, [manualMode, initMap]);

  // ── Nominatim search (auto-trigger เมื่อ debounced query เปลี่ยน) ───────────
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    searchNominatim(debouncedQuery)
      .then((results) => {
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      })
      .catch(() => {
        setSearchError('ค้นหาไม่สำเร็จ กรุณาลองใหม่');
        setSuggestions([]);
      })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  // ── Select suggestion ────────────────────────────────────────────────────────
  const handleSelectSuggestion = useCallback(
    async (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const addr = result.display_name;

      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      updateData({ latitude: lat, longitude: lng, mapAddress: addr });

      if (mapInstanceRef.current) {
        const L = (await import('leaflet')).default;
        placeLeafletMarker(L, lat, lng);
        mapInstanceRef.current.setView([lat, lng], 16);
      }
    },
    [updateData, placeLeafletMarker]
  );

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const handleUseGPS = useCallback(() => {
    if (!navigator.geolocation) { alert('เบราว์เซอร์ไม่รองรับ GPS'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const addr = await reverseNominatim(lat, lng);
          updateData({ latitude: lat, longitude: lng, mapAddress: addr });
        } catch {
          updateData({ latitude: lat, longitude: lng });
        }

        if (mapInstanceRef.current) {
          const L = (await import('leaflet')).default;
          placeLeafletMarker(L, lat, lng);
          mapInstanceRef.current.setView([lat, lng], 16);
        }
      },
      () => {
        setIsLocating(false);
        alert('ไม่สามารถรับตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS');
      },
      { timeout: 10000 }
    );
  }, [updateData, placeLeafletMarker]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">ขั้นตอนที่ 2 จาก 4</h2>
        <p className="text-neutral-600 mt-1">ปักหมุดตำแหน่งร้านค้า</p>
      </div>

      {/* Map mode */}
      {!manualMode && (
        <>
          {/* Search box */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              ค้นหาที่อยู่ร้านค้า
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="พิมพ์ชื่อสถานที่หรือที่อยู่..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />

                {/* Loading spinner */}
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.place_id}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 text-sm border-b border-neutral-100 last:border-0 transition"
                        onMouseDown={() => handleSelectSuggestion(s)}
                      >
                        <span className="text-neutral-500 mr-1.5">📍</span>
                        <span className="text-neutral-800 line-clamp-1">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS button */}
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={isLocating}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
              >
                {isLocating
                  ? <><span className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin inline-block" /> กำลังหา...</>
                  : '📍 ตำแหน่งฉัน'
                }
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-red-500 mt-1">⚠️ {searchError}</p>
            )}
          </div>

          {/* Map container */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              แผนที่{' '}
              <span className="text-neutral-400 font-normal text-xs">(คลิกเพื่อปักหมุด)</span>{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                ref={mapRef}
                style={{ width: '100%', height: '380px', borderRadius: '0.5rem' }}
                className="border border-neutral-300 overflow-hidden"
              />
              {/* Loading overlay */}
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2" />
                    <p className="text-sm text-neutral-500">กำลังโหลดแผนที่...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="text-xs text-neutral-400 hover:text-neutral-600 underline"
            onClick={() => setManualMode(true)}
          >
            กรอกที่อยู่แบบ Manual แทน
          </button>
        </>
      )}

      {/* Manual mode */}
      {manualMode && (
        <ManualLocationForm
          mapAddress={data.mapAddress ?? ''}
          latitude={data.latitude}
          longitude={data.longitude}
          onAddressChange={(v) => updateData({ mapAddress: v })}
          onLatChange={(v) => updateData({ latitude: v })}
          onLngChange={(v) => updateData({ longitude: v })}
          onUseGPS={handleUseGPS}
          isLocating={isLocating}
          onSwitchToMap={() => setManualMode(false)}
        />
      )}

      {/* Selected location display */}
      {(data.latitude || data.mapAddress) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-900 mb-1">📍 ตำแหน่งที่เลือก</p>
          {data.mapAddress && (
            <p className="text-xs text-emerald-800 leading-relaxed">{data.mapAddress}</p>
          )}
          {data.latitude && data.longitude && (
            <p className="text-xs text-emerald-700 mt-1 font-mono">
              {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
            </p>
          )}
          <button
            type="button"
            className="text-xs text-emerald-600 hover:text-emerald-800 underline mt-2 block"
            onClick={() => {
              updateData({ latitude: undefined, longitude: undefined, mapAddress: '' });
              if (markerRef.current && mapInstanceRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
            }}
          >
            ล้างตำแหน่ง
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900 leading-relaxed">
          ✓ ค้นหาชื่อร้านหรือที่อยู่ในช่องค้นหา
          <br />
          ✓ หรือคลิกบนแผนที่เพื่อปักหมุดตำแหน่ง
          <br />
          ✓ กด &quot;ตำแหน่งฉัน&quot; เพื่อใช้ GPS ของอุปกรณ์
          <br />
          ✓ แผนที่ใช้ OpenStreetMap — ฟรี ไม่ต้องเสียค่าใช้จ่าย
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2 border-t border-neutral-200">
        <button
          type="button"
          className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition"
          onClick={() => setStep(1)}
        >
          ← ย้อนกลับ
        </button>

        <button
          type="button"
          className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition flex items-center justify-center gap-2 ${
            canProceed()
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-neutral-300 cursor-not-allowed'
          }`}
          disabled={!canProceed()}
          onClick={handleNext}
        >
          ถัดไป →
        </button>
      </div>
    </div>
  );
}