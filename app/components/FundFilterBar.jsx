'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SortIcon, GridIcon, ListIcon } from './Icons';

function GlassSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div
      ref={wrapperRef}
      className="glass-select"
      style={{ position: 'relative', minWidth: 130 }}
    >
      <button
        type="button"
        className="glass-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          height: 28,
          padding: '0 10px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text)',
          fontSize: 12,
          cursor: 'pointer',
          outline: 'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selected?.label}
        </span>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: '999px',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '5px solid var(--muted)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.16s ease-out',
            }}
          />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="glass-select-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: '100%',
              padding: 4,
              borderRadius: 12,
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid var(--border)',
              boxShadow: '0 18px 45px rgba(15,23,42,0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 20,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                  className={`glass-select-item ${active ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: active
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                    color: active ? 'var(--text)' : 'var(--muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FundFilterBar({
  fundsCount,
  favoritesCount,
  groups,
  currentTab,
  onChangeTab,
  viewMode,
  onChangeViewMode,
  sortBy,
  onChangeSortBy,
  sortOrder = 'desc',
  onChangeSortOrder,
  onOpenGroupManage,
  onOpenGroupModal,
}) {
  const tabsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // 自动滚动选中 Tab 到可视区域
  useEffect(() => {
    if (!tabsRef.current) return;
    if (currentTab === 'all') {
      tabsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const activeTab = tabsRef.current.querySelector('.tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentTab]);

  const updateTabOverflow = () => {
    if (!tabsRef.current) return;
    const el = tabsRef.current;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    updateTabOverflow();
    const onResize = () => updateTabOverflow();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [groups, fundsCount, favoritesCount]);

  const handleMouseDown = () => {
    if (!tabsRef.current) return;
    setIsDragging(true);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    tabsRef.current.scrollLeft -= e.movementX;
  };

  const handleWheel = (e) => {
    if (!tabsRef.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    tabsRef.current.scrollLeft += delta;
  };

  return (
    <div
      className="filter-bar"
      style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div className="tabs-container">
        <div
          className="tabs-scroll-area"
          data-mask-left={canLeft}
          data-mask-right={canRight}
        >
          <div
            className="tabs"
            ref={tabsRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onScroll={updateTabOverflow}
          >
            <AnimatePresence mode="popLayout">
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key="all"
                className={`tab ${currentTab === 'all' ? 'active' : ''}`}
                onClick={() => onChangeTab('all')}
                transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
              >
                全部 ({fundsCount})
              </motion.button>
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key="fav"
                className={`tab ${currentTab === 'fav' ? 'active' : ''}`}
                onClick={() => onChangeTab('fav')}
                transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
              >
                自选 ({favoritesCount})
              </motion.button>
              {groups.map((g) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={g.id}
                  className={`tab ${currentTab === g.id ? 'active' : ''}`}
                  onClick={() => onChangeTab(g.id)}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                >
                  {g.name} ({g.codes.length})
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {groups.length > 0 && (
          <button
            className="icon-button manage-groups-btn"
            onClick={onOpenGroupManage}
            title="管理分组"
          >
            <SortIcon width="16" height="16" />
          </button>
        )}
        <button
          className="icon-button add-group-btn"
          onClick={onOpenGroupModal}
          title="新增分组"
        >
          <PlusIcon width="16" height="16" />
        </button>
      </div>

      <div
        className="sort-group"
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div
          className="view-toggle"
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '2px',
          }}
        >
          <button
            className={`icon-button ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('card')}
            style={{
              border: 'none',
              width: '32px',
              height: '32px',
              background: viewMode === 'card' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'card' ? '#05263b' : 'var(--muted)',
            }}
            title="卡片视图"
          >
            <GridIcon width="16" height="16" />
          </button>
          <button
            className={`icon-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('list')}
            style={{
              border: 'none',
              width: '32px',
              height: '32px',
              background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'list' ? '#05263b' : 'var(--muted)',
            }}
            title="表格视图"
          >
            <ListIcon width="16" height="16" />
          </button>
        </div>

        <div
          className="divider"
          style={{ width: '1px', height: '20px', background: 'var(--border)' }}
        />

        <div
          className="sort-items"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span
            className="muted"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <SortIcon width="14" height="14" />
            排序
          </span>
          <GlassSelect
            value={sortBy}
            onChange={(val) => onChangeSortBy(val)}
            options={[
              { value: 'default', label: '默认' },
              { value: 'yield', label: '涨跌幅' },
              { value: 'recentYield', label: '最近交易日收益' },
              { value: 'name', label: '名称' },
              { value: 'code', label: '代码' },
            ]}
          />
          <button
            className="chip"
            onClick={() => {
              const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
              if (onChangeSortOrder) {
                onChangeSortOrder(nextOrder);
              }
            }}
            style={{
              height: '28px',
              fontSize: '12px',
              padding: '0 12px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background:
                sortOrder === 'asc'
                  ? 'var(--primary)'
                  : 'rgba(255,255,255,0.06)',
              color: sortOrder === 'asc' ? '#05263b' : 'var(--muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>
              {sortOrder === 'asc' ? '升序 ↑' : '降序 ↓'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}


