// ==============================
// useStatistics — custom hook
// Fetches all statistics data from /api/statistics/*
// ==============================
import { useState, useEffect, useCallback } from 'react';
import { statisticsAPI } from '@/services/backend-api';

/**
 * Build startDate / endDate strings for a named preset.
 */
function buildDateRange(preset, customStart, customEnd) {
  const now  = new Date();
  const pad  = (n) => String(n).padStart(2, '0');
  const fmt  = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case 'today': {
      const t = fmt(now);
      return { startDate: t, endDate: t };
    }
    case '7days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case '30days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case 'custom':
      return { startDate: customStart || fmt(now), endDate: customEnd || fmt(now) };
    default: {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
  }
}

export function useStatistics() {
  // ── date range state ──────────────────────────────────────────────────────
  const [preset,      setPreset]      = useState('30days'); // today|7days|30days|thisMonth|custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [groupBy,     setGroupBy]     = useState('day');    // day|week|month

  // ── data state ────────────────────────────────────────────────────────────
  const [summary,     setSummary]     = useState(null);
  const [salesChart,  setSalesChart]  = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // ── loading / error ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = buildDateRange(preset, customStart, customEnd);
      const params = { startDate: range.startDate, endDate: range.endDate };

      const [sumRes, chartRes, statusRes, topRes] = await Promise.all([
        statisticsAPI.getSummary(params),
        statisticsAPI.getSalesChart({ ...params, groupBy }),
        statisticsAPI.getOrderStatus(params),
        statisticsAPI.getTopProducts({ ...params, limit: 10 }),
      ]);

      setSummary(sumRes.data?.data     || sumRes.data     || null);
      setSalesChart(chartRes.data?.data  || chartRes.data  || []);
      setOrderStatus(statusRes.data?.data || statusRes.data || []);
      setTopProducts(topRes.data?.data   || topRes.data   || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [preset, customStart, customEnd, groupBy]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    // data
    summary,
    salesChart,
    orderStatus,
    topProducts,
    // state
    loading,
    error,
    // controls
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    groupBy,
    setGroupBy,
    refetch: fetchAll,
  };
}
