'use client';

import { useCallback, useRef, useState } from 'react';
import { searchFunds } from '../lib/fundApi';

/**
 * 基金搜索相关的状态与逻辑：
 * - 搜索输入
 * - 搜索结果
 * - 选中的待添加基金
 * - 搜索中的 loading 状态
 * - 输入防抖 & JSONP 请求
 */
export const useFundSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFunds, setSelectedFunds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(
    async (val) => {
      const keyword = String(val || '').trim();
      if (!keyword) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchFunds(keyword);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearchInput = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchTerm(val);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    },
    [performSearch]
  );

  const toggleSelectFund = useCallback((fund) => {
    setSelectedFunds((prev) => {
      const exists = prev.find((f) => f.CODE === fund.CODE);
      if (exists) {
        return prev.filter((f) => f.CODE !== fund.CODE);
      }
      return [...prev, fund];
    });
  }, []);

  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedFunds([]);
  }, []);

  return {
    searchTerm,
    searchResults,
    selectedFunds,
    isSearching,
    handleSearchInput,
    toggleSelectFund,
    resetSearch,
  };
};


