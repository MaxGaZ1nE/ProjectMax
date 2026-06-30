/**
 * useOrderStatusStream
 * 
 * เชื่อมต่อ Server-Sent Events (SSE) จาก /api/stream
 * เพื่อรับการอัปเดตสถานะออเดอร์แบบ real-time ทุก role
 * 
 * Usage:
 *   useOrderStatusStream((orderId, status) => {
 *     // handle status change
 *   });
 */
import { useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const SSE_URL = `${API_BASE_URL}/api/stream`;

type StatusChangeHandler = (orderId: string, status: string) => void;

export function useOrderStatusStream(onStatusChange?: StatusChangeHandler) {
  const esRef = useRef<EventSource | null>(null);
  const handlerRef = useRef(onStatusChange);
  handlerRef.current = onStatusChange;

  useEffect(() => {
    // Get token for auth (SSE doesn't support Authorization header,
    // but our endpoint is public SSE — all roles listen same stream)
    let es: EventSource;
    try {
      es = new EventSource(SSE_URL);
      esRef.current = es;
    } catch (e) {
      console.warn('[SSE] EventSource not supported or URL invalid:', e);
      return;
    }

    es.onopen = () => {
      console.log('[SSE] Connected to order status stream');
    };

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ORDER_STATUS_CHANGED') {
          const { orderId, status } = msg.data || {};
          if (orderId && status) {
            handlerRef.current?.(orderId, status);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, will auto-reconnect:', err);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []); // connect once per mount
}
