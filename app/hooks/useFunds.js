'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFundData } from '../lib/fundApi';

// 按 code 去重，保留第一次出现的项，避免列表重复
const dedupeByCode = (list) => {
  const seen = new Set();
  return list.filter((f) => {
    const c = f?.code;
    if (!c || seen.has(c)) return false;
    seen.add(c);
    return true;
  });
};

export const useFunds = () => {
  const [funds, setFunds] = useState([]);
  const [refreshMs, setRefreshMs] = useState(30000);
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState({});

  const timerRef = useRef(null);
  const refreshingRef = useRef(false);

  const refreshAll = useCallback(
    async (codes) => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      setRefreshing(true);
      const uniqueCodes = Array.from(new Set(codes));
      try {
        const updated = [];
        for (const c of uniqueCodes) {
          try {
            const data = await fetchFundData(c);
            updated.push(data);
          } catch (e) {
            console.error(`刷新基金 ${c} 失败`, e);
            // 失败时从当前 state 中寻找旧数据
            setFunds((prev) => {
              const old = prev.find((f) => f.code === c);
              if (old) updated.push(old);
              return prev;
            });
          }
        }

        if (updated.length > 0) {
          setFunds((prev) => {
            // 将更新后的数据合并回当前最新的 state 中，防止覆盖掉刚刚导入的数据
            const merged = [...prev];
            updated.forEach((u) => {
              const idx = merged.findIndex((f) => f.code === u.code);
              if (idx > -1) {
                merged[idx] = u;
              } else {
                merged.push(u);
              }
            });
            const deduped = dedupeByCode(merged);
            localStorage.setItem('funds', JSON.stringify(deduped));
            return deduped;
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    },
    []
  );

  // 初始化：从 localStorage 读取基金列表、刷新频率和持仓，并触发一次刷新
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('funds') || '[]');
      if (Array.isArray(saved) && saved.length) {
        const deduped = dedupeByCode(saved);
        setFunds(deduped);
        localStorage.setItem('funds', JSON.stringify(deduped));
        const codes = Array.from(new Set(deduped.map((f) => f.code)));
        if (codes.length) refreshAll(codes);
      }
      const savedMs = parseInt(localStorage.getItem('refreshMs') || '30000', 10);
      if (Number.isFinite(savedMs) && savedMs >= 5000) {
        setRefreshMs(savedMs);
      }
      // 加载持仓信息
      const savedPositions = JSON.parse(localStorage.getItem('positions') || '{}');
      if (savedPositions && typeof savedPositions === 'object') {
        setPositions(savedPositions);
      }
    } catch {
      // ignore
    }
  }, [refreshAll]);

  // 定时刷新
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const codes = Array.from(new Set(funds.map((f) => f.code)));
      if (codes.length) refreshAll(codes);
    }, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [funds, refreshMs, refreshAll]);

  const manualRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    const codes = Array.from(new Set(funds.map((f) => f.code)));
    if (!codes.length) return;
    await refreshAll(codes);
  }, [funds, refreshAll]);

  const updateRefreshMs = useCallback((ms) => {
    setRefreshMs(ms);
    localStorage.setItem('refreshMs', String(ms));
  }, []);

  return {
    funds,
    setFunds,
    refreshMs,
    updateRefreshMs,
    refreshing,
    manualRefresh,
    refreshAll,
    positions,
    setPositions,
    dedupeByCode,
  };
};


