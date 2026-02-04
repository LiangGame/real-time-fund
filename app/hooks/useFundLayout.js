'use client';

import { useEffect, useState } from 'react';

/**
 * 管理与布局相关的状态：
 * - 分组
 * - 自选
 * - 前 10 重仓折叠状态
 * - 当前 tab
 * - 视图模式（card / list）
 *
 * 同时负责这些状态的本地存储读写。
 */
export const useFundLayout = (funds) => {
  const [collapsedCodes, setCollapsedCodes] = useState(new Set());
  const [favorites, setFavorites] = useState(new Set());
  const [groups, setGroups] = useState([]); // [{ id, name, codes: [] }]
  const [currentTab, setCurrentTab] = useState('all');
  const [viewMode, setViewMode] = useState('card'); // card, list

  // 初始化：从 localStorage 读取布局相关状态
  useEffect(() => {
    try {
      const savedCollapsed = JSON.parse(localStorage.getItem('collapsedCodes') || '[]');
      if (Array.isArray(savedCollapsed)) {
        setCollapsedCodes(new Set(savedCollapsed));
      }
      const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(savedFavorites)) {
        setFavorites(new Set(savedFavorites));
      }
      const savedGroups = JSON.parse(localStorage.getItem('groups') || '[]');
      if (Array.isArray(savedGroups)) {
        setGroups(savedGroups);
      }
      const savedViewMode = localStorage.getItem('viewMode');
      if (savedViewMode === 'card' || savedViewMode === 'list') {
        setViewMode(savedViewMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // 默认收起前 10 重仓股票：初始时将所有已存在基金 code 加入 collapsedCodes
  useEffect(() => {
    if (!funds || !funds.length) return;
    setCollapsedCodes((prev) => {
      const next = new Set(prev);
      let changed = false;
      funds.forEach((f) => {
        if (f && f.code && !next.has(f.code)) {
          next.add(f.code);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('collapsedCodes', JSON.stringify(Array.from(next)));
      }
      return changed ? next : prev;
    });
  }, [funds]);

  const toggleFavorite = (code) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      localStorage.setItem('favorites', JSON.stringify(Array.from(next)));
      if (next.size === 0) setCurrentTab('all');
      return next;
    });
  };

  const toggleCollapse = (code) => {
    setCollapsedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      localStorage.setItem('collapsedCodes', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const addGroup = (name) => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      codes: [],
    };
    const next = [...groups, newGroup];
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
    setCurrentTab(newGroup.id);
  };

  const removeGroup = (id) => {
    const next = groups.filter((g) => g.id !== id);
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
    if (currentTab === id) setCurrentTab('all');
  };

  const updateGroups = (newGroups) => {
    setGroups(newGroups);
    localStorage.setItem('groups', JSON.stringify(newGroups));
    // 如果当前选中的分组被删除了，切换回“全部”
    if (
      currentTab !== 'all' &&
      currentTab !== 'fav' &&
      !newGroups.find((g) => g.id === currentTab)
    ) {
      setCurrentTab('all');
    }
  };

  const addFundsToCurrentGroup = (codes) => {
    if (!codes || codes.length === 0) return 0;
    let addedCount = 0;
    const next = groups.map((g) => {
      if (g.id === currentTab) {
        const beforeSize = g.codes.length;
        const merged = Array.from(new Set([...g.codes, ...codes]));
        if (merged.length > beforeSize) {
          addedCount += merged.length - beforeSize;
        }
        return {
          ...g,
          codes: merged,
        };
      }
      return g;
    });
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
    return addedCount;
  };

  const removeFundFromCurrentGroup = (code) => {
    const next = groups.map((g) => {
      if (g.id === currentTab) {
        return {
          ...g,
          codes: g.codes.filter((c) => c !== code),
        };
      }
      return g;
    });
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
  };

  const toggleFundInGroup = (code, groupId) => {
    const next = groups.map((g) => {
      if (g.id === groupId) {
        const has = g.codes.includes(code);
        return {
          ...g,
          codes: has ? g.codes.filter((c) => c !== code) : [...g.codes, code],
        };
      }
      return g;
    });
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
  };

  const setViewModeAndPersist = (mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  return {
    collapsedCodes,
    setCollapsedCodes,
    favorites,
    setFavorites,
    groups,
    setGroups,
    currentTab,
    setCurrentTab,
    viewMode,
    setViewMode: setViewModeAndPersist,
    toggleFavorite,
    toggleCollapse,
    addGroup,
    removeGroup,
    updateGroups,
    addFundsToCurrentGroup,
    removeFundFromCurrentGroup,
    toggleFundInGroup,
  };
};


