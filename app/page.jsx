'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Announcement from "./components/Announcement";
import Navbar from "./components/Navbar";
import FundFilterBar from "./components/FundFilterBar";
import SettingsModal from "./components/SettingsModal";
import {
  PlusIcon,
  CloseIcon,
} from "./components/Icons";
import FeedbackModal from "./components/modals/FeedbackModal";
import AddResultModal from "./components/modals/AddResultModal";
import SuccessModal from "./components/modals/SuccessModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import GroupManageModal from "./components/modals/GroupManageModal";
import AddFundToGroupModal from "./components/modals/AddFundToGroupModal";
import GroupModal from "./components/modals/GroupModal";
import PositionModal from "./components/modals/PositionModal";
import FundListView from "./components/FundListView";
import { fetchFundData } from "./lib/fundApi";
import { useFunds } from "./hooks/useFunds";
import { useFundSearch } from "./hooks/useFundSearch";
import { useFundLayout } from "./hooks/useFundLayout";
import { useFundConfig } from "./hooks/useFundConfig";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 基金数据 + 持仓 + 刷新定时逻辑
  const {
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
  } = useFunds();

  // 布局 / 分组 / 自选等状态
  const {
    collapsedCodes,
    setCollapsedCodes,
    favorites,
    setFavorites,
    groups,
    setGroups,
    currentTab,
    setCurrentTab,
    viewMode,
    setViewMode,
    toggleFavorite,
    toggleCollapse,
    addGroup,
    removeGroup,
    updateGroups,
    addFundsToCurrentGroup,
    removeFundFromCurrentGroup: removeFundFromCurrentGroupInLayout,
  } = useFundLayout(funds);

  // 刷新频率设置弹窗中的临时秒数
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSeconds, setTempSeconds] = useState(30);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [addFundToGroupOpen, setAddFundToGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [editingPositionFund, setEditingPositionFund] = useState(null);

  // 排序状态
  const [sortBy, setSortBy] = useState('default'); // default, name, yield, code

  // 反馈弹窗状态
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackNonce, setFeedbackNonce] = useState(0);

  // 搜索相关状态与逻辑（自定义 Hook）
  const {
    searchTerm,
    searchResults,
    selectedFunds,
    isSearching,
    handleSearchInput,
    toggleSelectFund,
    resetSearch,
  } = useFundSearch();

  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [addFailures, setAddFailures] = useState([]);

  // 成功提示弹窗
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  // 导入/导出配置相关
  const {
    importFileRef,
    importMsg,
    exportLocalData,
    handleImportFileChange,
  } = useFundConfig({
    dedupeByCode,
    setFunds,
    setFavorites,
    setGroups,
    setCollapsedCodes,
    updateRefreshMs,
    setViewMode,
    setPositions,
    refreshAll,
    setTempSeconds,
    setSuccessModal,
    setSettingsOpen,
  });

  // tabs 滚动逻辑已封装到 FundFilterBar 中

  // 过滤和排序后的基金列表
  const displayFunds = funds
    .filter(f => {
      if (currentTab === 'all') return true;
      if (currentTab === 'fav') return favorites.has(f.code);
      const group = groups.find(g => g.id === currentTab);
      return group ? group.codes.includes(f.code) : true;
    })
    .sort((a, b) => {
      if (sortBy === 'yield') {
        const valA = typeof a.estGszzl === 'number' ? a.estGszzl : (Number(a.gszzl) || 0);
        const valB = typeof b.estGszzl === 'number' ? b.estGszzl : (Number(b.gszzl) || 0);
        return valB - valA;
      }
      if (sortBy === 'recentYield') {
        const getCurrentPrice = (f) => {
          if (f.estPricedCoverage > 0.05) return Number(f.estGsz);
          if (Number.isFinite(Number(f.gsz))) return Number(f.gsz);
          return Number(f.dwjz);
        };
        const calcRecentYield = (f) => {
          const pos = positions[f.code];
          const p = getCurrentPrice(f);
          if (!pos || !pos.lastTradeNav || !Number.isFinite(p) || p <= 0 || pos.lastTradeNav <= 0) return -Infinity;
          return (p / pos.lastTradeNav - 1) * 100;
        };
        const valA = calcRecentYield(a);
        const valB = calcRecentYield(b);
        return valB - valA;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      return 0;
    });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddGroup = (name) => {
    addGroup(name);
    setGroupModalOpen(false);
  };

  const handleRemoveGroup = (id) => {
    removeGroup(id);
  };

  const handleUpdateGroups = (newGroups) => {
    updateGroups(newGroups);
  };

  const handleAddFundsToGroup = (codes) => {
    const addedCount = addFundsToCurrentGroup(codes);
    setAddFundToGroupOpen(false);
    if (addedCount > 0) {
      setSuccessModal({ open: true, message: `成功添加 ${addedCount} 支基金` });
    }
  };

  const removeFundFromCurrentGroup = (code) => {
    removeFundFromCurrentGroupInLayout(code);
  };

  const batchAddFunds = async () => {
    if (selectedFunds.length === 0) return;
    setLoading(true);
    setError('');
    
    try {
      const newFunds = [];
      for (const f of selectedFunds) {
        if (funds.some(existing => existing.code === f.CODE)) continue;
        try {
          const data = await fetchFundData(f.CODE);
          newFunds.push(data);
        } catch (e) {
          console.error(`添加基金 ${f.CODE} 失败`, e);
        }
      }
      
      if (newFunds.length > 0) {
        const updated = dedupeByCode([...newFunds, ...funds]);
        setFunds(updated);
        localStorage.setItem('funds', JSON.stringify(updated));
      }

      resetSearch();
    } catch (e) {
      setError('批量添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 注意：refreshAll 已由 useFunds 提供，这里不再重复声明
  const addFund = async (e) => {
    e?.preventDefault?.();
    setError('');
    const manualTokens = String(searchTerm || '')
      .split(/[^0-9A-Za-z]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
    const selectedCodes = Array.from(new Set([
      ...selectedFunds.map(f => f.CODE),
      ...manualTokens.filter(t => /^\d{6}$/.test(t))
    ]));
    if (selectedCodes.length === 0) {
      setError('请输入或选择基金代码');
      return;
    }
    setLoading(true);
    try {
      const newFunds = [];
      const failures = [];
      const nameMap = {};
      selectedFunds.forEach(f => { nameMap[f.CODE] = f.NAME; });
      for (const c of selectedCodes) {
        if (funds.some((f) => f.code === c)) continue;
        try {
          const data = await fetchFundData(c);
          newFunds.push(data);
        } catch (err) {
          failures.push({ code: c, name: nameMap[c] });
        }
      }
      if (newFunds.length === 0) {
        setError('未添加任何新基金');
      } else {
        const next = dedupeByCode([...newFunds, ...funds]);
        setFunds(next);
        localStorage.setItem('funds', JSON.stringify(next));
      }
      resetSearch();
      setShowDropdown(false);
      if (failures.length > 0) {
        setAddFailures(failures);
        setAddResultOpen(true);
      }
    } catch (e) {
      setError(e.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const removeFund = (removeCode) => {
    const next = funds.filter((f) => f.code !== removeCode);
    setFunds(next);
    localStorage.setItem('funds', JSON.stringify(next));

    // 同步删除分组中的失效代码
    const nextGroups = groups.map(g => ({
      ...g,
      codes: g.codes.filter(c => c !== removeCode)
    }));
    setGroups(nextGroups);
    localStorage.setItem('groups', JSON.stringify(nextGroups));

    // 同步删除展开收起状态
    setCollapsedCodes(prev => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      localStorage.setItem('collapsedCodes', JSON.stringify(Array.from(nextSet)));
      return nextSet;
    });

    // 同步删除自选状态
    setFavorites(prev => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      localStorage.setItem('favorites', JSON.stringify(Array.from(nextSet)));
      if (nextSet.size === 0) setCurrentTab('all');
      return nextSet;
    });
  };

  const [deleteFundConfirm, setDeleteFundConfirm] = useState(null); // { code, name }

  const saveSettings = (e) => {
    e?.preventDefault?.();
    const ms = Math.max(5, Number(tempSeconds)) * 1000;
    updateRefreshMs(ms);
    setSettingsOpen(false);
  };

  useEffect(() => {
    const isAnyModalOpen = 
      settingsOpen || 
      feedbackOpen || 
      addResultOpen || 
      addFundToGroupOpen || 
      groupManageOpen || 
      groupModalOpen || 
      successModal.open ||
      !!editingPositionFund;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [settingsOpen, feedbackOpen, addResultOpen, addFundToGroupOpen, groupManageOpen, groupModalOpen, successModal.open, editingPositionFund]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Escape' && settingsOpen) setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  return (
    <div className="container content">
      <Announcement />
      <Navbar
        refreshMs={refreshMs}
        refreshing={refreshing}
        hasFunds={funds.length > 0}
        onManualRefresh={manualRefresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="grid">
        <div className="col-12 glass card add-fund-section" role="region" aria-label="添加基金">
          <div className="title" style={{ marginBottom: 12 }}>
            <PlusIcon width="20" height="20" />
            <span>添加基金</span>
            <span className="muted">搜索并选择基金（支持名称或代码）</span>
          </div>
          
          <div className="search-container" ref={dropdownRef}>
            <form className="form" onSubmit={addFund}>
              <div className="search-input-wrapper" style={{ flex: 1, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {selectedFunds.length > 0 && (
                  <div className="selected-inline-chips">
                    {selectedFunds.map(fund => (
                      <div key={fund.CODE} className="fund-chip">
                        <span>{fund.NAME}</span>
                        <button onClick={() => toggleSelectFund(fund)} className="remove-chip">
                          <CloseIcon width="14" height="14" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  className="input"
                  placeholder="搜索基金名称或代码..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  onFocus={() => setShowDropdown(true)}
                />
                {isSearching && <div className="search-spinner" />}
              </div>
              <button className="button" type="submit" disabled={loading}>
                {loading ? '添加中…' : '添加'}
              </button>
            </form>

            <AnimatePresence>
              {showDropdown && (searchTerm.trim() || searchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="search-dropdown glass"
                >
                  {searchResults.length > 0 ? (
                    <div className="search-results">
                      {searchResults.map((fund) => {
                        const isSelected = selectedFunds.some(f => f.CODE === fund.CODE);
                        const isAlreadyAdded = funds.some(f => f.code === fund.CODE);
                        return (
                          <div
                            key={fund.CODE}
                            className={`search-item ${isSelected ? 'selected' : ''} ${isAlreadyAdded ? 'added' : ''}`}
                            onClick={() => {
                              if (isAlreadyAdded) return;
                              toggleSelectFund(fund);
                            }}
                          >
                            <div className="fund-info">
                              <span className="fund-name">{fund.NAME}</span>
                              <span className="fund-code muted">#{fund.CODE} | {fund.TYPE}</span>
                            </div>
                            {isAlreadyAdded ? (
                              <span className="added-label">已添加</span>
                            ) : (
                              <div className="checkbox">
                                {isSelected && <div className="checked-mark" />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : searchTerm.trim() && !isSearching ? (
                    <div className="no-results muted">未找到相关基金</div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          

          {error && <div className="muted" style={{ marginTop: 8, color: 'var(--danger)' }}>{error}</div>}
        </div>

        <div className="col-12">
          <FundFilterBar
            fundsCount={funds.length}
            favoritesCount={favorites.size}
            groups={groups}
            currentTab={currentTab}
            onChangeTab={setCurrentTab}
            viewMode={viewMode}
            onChangeViewMode={(mode) => {
              setViewMode(mode);
              localStorage.setItem('viewMode', mode);
            }}
            sortBy={sortBy}
            onChangeSortBy={setSortBy}
            onOpenGroupManage={() => setGroupManageOpen(true)}
            onOpenGroupModal={() => setGroupModalOpen(true)}
          />

          {displayFunds.length === 0 ? (
            <div className="glass card empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: 16, opacity: 0.5 }}>📂</div>
              <div className="muted" style={{ marginBottom: 20 }}>{funds.length === 0 ? '尚未添加基金' : '该分组下暂无数据'}</div>
              {currentTab !== 'all' && currentTab !== 'fav' && funds.length > 0 && (
                <button className="button" onClick={() => setAddFundToGroupOpen(true)}>
                  添加基金到此分组
                </button>
              )}
            </div>
          ) : (
            <>
              {currentTab !== 'all' && currentTab !== 'fav' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 12,
                  }}
                >
                  <button
                    className="button"
                    onClick={() => setAddFundToGroupOpen(true)}
                    style={{
                      height: '32px',
                      fontSize: '13px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <PlusIcon width="16" height="16" />
                    <span>添加基金</span>
                  </button>
                </div>
              )}
              <FundListView
                funds={displayFunds}
                viewMode={viewMode}
                currentTab={currentTab}
                favorites={favorites}
                positions={positions}
                collapsedCodes={collapsedCodes}
                onToggleFavorite={toggleFavorite}
                onRemoveFromCurrentGroup={removeFundFromCurrentGroup}
                onEditPosition={setEditingPositionFund}
                onDeleteFund={(code, name) =>
                  setDeleteFundConfirm({ code, name })
                }
                onToggleCollapse={toggleCollapse}
              />
            </>
          )}
        </div>
      </div>

      <div className="footer">
        <p>数据源：实时估值与重仓直连东方财富，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议
        </p>
        <p>注：估算数据与真实结算数据会有1%左右误差，非股票型基金误差较大</p>
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          <p>
            遇到任何问题或需求建议可
            <button
              className="link-button"
              onClick={() => {
                setFeedbackNonce((n) => n + 1);
                setFeedbackOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline', fontSize: 'inherit', fontWeight: 600 }}
            >
              点此提交反馈
            </button>
          </p>
        </div>
      </div>

      <AnimatePresence>
        {feedbackOpen && (
          <FeedbackModal
            key={feedbackNonce}
            onClose={() => setFeedbackOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addResultOpen && (
          <AddResultModal
            failures={addFailures}
            onClose={() => setAddResultOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addFundToGroupOpen && (
          <AddFundToGroupModal
            allFunds={funds}
            currentGroupCodes={groups.find(g => g.id === currentTab)?.codes || []}
            onClose={() => setAddFundToGroupOpen(false)}
            onAdd={handleAddFundsToGroup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupManageOpen && (
          <GroupManageModal
            groups={groups}
            onClose={() => setGroupManageOpen(false)}
            onSave={handleUpdateGroups}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupModalOpen && (
          <GroupModal
            onClose={() => setGroupModalOpen(false)}
            onConfirm={handleAddGroup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal.open && (
          <SuccessModal
            message={successModal.message}
            onClose={() => setSuccessModal({ open: false, message: '' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteFundConfirm && (
          <ConfirmModal
            title="删除基金"
            message={`确定要删除基金「${deleteFundConfirm.name || ''} #${deleteFundConfirm.code}」吗？该基金的持仓与分组记录也会被移除。`}
            onConfirm={() => {
              removeFund(deleteFundConfirm.code);
              setDeleteFundConfirm(null);
            }}
            onCancel={() => setDeleteFundConfirm(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPositionFund && (
          <PositionModal
            fund={editingPositionFund}
            position={positions[editingPositionFund.code]}
            onClose={() => setEditingPositionFund(null)}
            onSave={(code, pos) => {
              setPositions(prev => {
                const next = { ...prev };
                if (!pos) {
                  delete next[code];
                } else {
                  next[code] = pos;
                }
                localStorage.setItem('positions', JSON.stringify(next));
                return next;
              });
            }}
          />
        )}
      </AnimatePresence>

      {settingsOpen && (
        <SettingsModal
          tempSeconds={tempSeconds}
          onTempSecondsChange={setTempSeconds}
          importFileRef={importFileRef}
          importMsg={importMsg}
          onExport={exportLocalData}
          onImportChange={handleImportFileChange}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
