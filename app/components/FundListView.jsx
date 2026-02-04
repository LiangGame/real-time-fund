'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Stat from "./Stat";
import {
  ChevronIcon,
  ExitIcon,
  FolderPlusIcon,
  StarIcon,
  TrashIcon,
} from "./Icons";

/**
 * 基金列表展示组件（卡片视图 + 列表视图）
 * 纯展示 + 回调，不持有业务状态。
 */
export default function FundListView({
  funds,
  viewMode,
  currentTab,
  favorites,
  positions,
  collapsedCodes,
  onToggleFavorite,
  onRemoveFromCurrentGroup,
  onEditPosition,
  onDeleteFund,
  onToggleCollapse,
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={viewMode === 'card' ? 'grid' : 'table-container glass'}
      >
        <div
          className={viewMode === 'card' ? 'grid col-12' : ''}
          style={viewMode === 'card' ? { gridColumn: 'span 12', gap: 16 } : {}}
        >
          <AnimatePresence mode="popLayout">
            {funds.map((f) => (
              <motion.div
                layout="position"
                key={f.code}
                className={viewMode === 'card' ? 'col-6' : 'table-row-wrapper'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className={viewMode === 'card' ? 'glass card' : 'table-row'}>
                  {viewMode === 'list' ? (
                    <>
                      <div className="table-cell name-cell">
                        {currentTab !== 'all' && currentTab !== 'fav' ? (
                          <button
                            className="icon-button fav-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromCurrentGroup(f.code);
                            }}
                            title="从当前分组移除"
                          >
                            <ExitIcon
                              width="18"
                              height="18"
                              style={{ transform: 'rotate(180deg)' }}
                            />
                          </button>
                        ) : (
                          <button
                            className={`icon-button fav-button ${
                              favorites.has(f.code) ? 'active' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(f.code);
                            }}
                            title={favorites.has(f.code) ? '取消自选' : '添加自选'}
                          >
                            <StarIcon
                              width="18"
                              height="18"
                              filled={favorites.has(f.code)}
                            />
                          </button>
                        )}
                        <div className="title-text">
                          <span className="name-text">{f.name}</span>
                          <span className="muted code-text">#{f.code}</span>
                        </div>
                      </div>
                      <div className="table-cell text-right value-cell">
                        <span style={{ fontWeight: 700 }}>
                          {f.estPricedCoverage > 0.05
                            ? f.estGsz.toFixed(4)
                            : f.gsz ?? '—'}
                        </span>
                      </div>
                      <div className="table-cell text-right change-cell">
                        <span
                          className={
                            f.estPricedCoverage > 0.05
                              ? f.estGszzl > 0
                                ? 'up'
                                : f.estGszzl < 0
                                ? 'down'
                                : ''
                              : Number(f.gszzl) > 0
                              ? 'up'
                              : Number(f.gszzl) < 0
                              ? 'down'
                              : ''
                          }
                          style={{ fontWeight: 700 }}
                        >
                          {f.estPricedCoverage > 0.05
                            ? `${f.estGszzl > 0 ? '+' : ''}${f.estGszzl.toFixed(2)}%`
                            : typeof f.gszzl === 'number'
                            ? `${f.gszzl > 0 ? '+' : ''}${f.gszzl.toFixed(2)}%`
                            : f.gszzl ?? '—'}
                        </span>
                      </div>
                      <div className="table-cell text-right time-cell">
                        {(() => {
                          const pos = positions[f.code];
                          const currentPrice =
                            f.estPricedCoverage > 0.05
                              ? Number(f.estGsz)
                              : Number.isFinite(Number(f.gsz))
                              ? Number(f.gsz)
                              : Number(f.dwjz);
                          const hasPos = pos && pos.shares > 0;
                          const value =
                            hasPos && Number.isFinite(currentPrice) && currentPrice > 0
                              ? (pos.shares * currentPrice).toFixed(2)
                              : null;
                          const holdYield =
                            hasPos &&
                            pos.costPrice > 0 &&
                            Number.isFinite(currentPrice) &&
                            currentPrice > 0
                              ? ((currentPrice / pos.costPrice - 1) * 100).toFixed(2)
                              : null;
                          return (
                            <div style={{ textAlign: 'right', fontSize: '12px' }}>
                              <div className="muted" style={{ fontSize: '11px' }}>
                                {f.gztime || f.time || '-'}
                              </div>
                              {hasPos ? (
                                <div style={{ marginTop: 2 }}>
                                  <span style={{ marginRight: 6 }}>
                                    {value ? `${value} 元` : '—'}
                                  </span>
                                  <span
                                    className={
                                      holdYield
                                        ? parseFloat(holdYield) > 0
                                          ? 'up'
                                          : parseFloat(holdYield) < 0
                                          ? 'down'
                                          : ''
                                        : ''
                                    }
                                  >
                                    {holdYield
                                      ? `${parseFloat(holdYield) > 0 ? '+' : ''}${holdYield}%`
                                      : '—'}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className="muted"
                                  style={{ fontSize: '11px', marginTop: 2 }}
                                >
                                  暂无持仓
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="table-cell text-center action-cell" style={{ gap: 4 }}>
                        <button
                          className="icon-button"
                          onClick={() => onEditPosition(f)}
                          title="编辑持仓"
                          style={{ width: '28px', height: '28px' }}
                        >
                          <FolderPlusIcon width="14" height="14" />
                        </button>
                        <button
                          className="icon-button danger"
                          onClick={() => onDeleteFund(f.code, f.name)}
                          title="删除"
                          style={{ width: '28px', height: '28px' }}
                        >
                          <TrashIcon width="14" height="14" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="row" style={{ marginBottom: 10 }}>
                        <div className="title">
                          {currentTab !== 'all' && currentTab !== 'fav' ? (
                            <button
                              className="icon-button fav-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromCurrentGroup(f.code);
                              }}
                              title="从当前分组移除"
                            >
                              <ExitIcon
                                width="18"
                                height="18"
                                style={{ transform: 'rotate(180deg)' }}
                              />
                            </button>
                          ) : (
                            <button
                              className={`icon-button fav-button ${
                                favorites.has(f.code) ? 'active' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(f.code);
                              }}
                              title={favorites.has(f.code) ? '取消自选' : '添加自选'}
                            >
                              <StarIcon
                                width="18"
                                height="18"
                                filled={favorites.has(f.code)}
                              />
                            </button>
                          )}
                          <div className="title-text">
                            <span>{f.name}</span>
                            <span className="muted">#{f.code}</span>
                          </div>
                        </div>

                        <div className="actions">
                          <div className="badge-v">
                            <span>估值时间</span>
                            <strong>{f.gztime || f.time || '-'}</strong>
                          </div>
                          <div className="row" style={{ gap: 4 }}>
                            <button
                              className="icon-button danger"
                              onClick={() => onDeleteFund(f.code, f.name)}
                              title="删除"
                              style={{ width: '28px', height: '28px' }}
                            >
                              <TrashIcon width="14" height="14" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="row" style={{ marginBottom: 12 }}>
                        <Stat label="昨日净值" value={f.dwjz ?? '—'} />
                        <Stat
                          label="估值净值"
                          value={
                            f.estPricedCoverage > 0.05
                              ? f.estGsz.toFixed(4)
                              : f.gsz ?? '—'
                          }
                        />
                        <Stat
                          label="估值涨跌幅"
                          value={
                            f.estPricedCoverage > 0.05
                              ? `${f.estGszzl > 0 ? '+' : ''}${f.estGszzl.toFixed(2)}%`
                              : typeof f.gszzl === 'number'
                              ? `${f.gszzl > 0 ? '+' : ''}${f.gszzl.toFixed(2)}%`
                              : f.gszzl ?? '—'
                          }
                          delta={
                            f.estPricedCoverage > 0.05 ? f.estGszzl : Number(f.gszzl) || 0
                          }
                        />
                      </div>
                      {(() => {
                        const pos = positions[f.code];
                        const currentPrice =
                          f.estPricedCoverage > 0.05
                            ? Number(f.estGsz)
                            : Number.isFinite(Number(f.gsz))
                            ? Number(f.gsz)
                            : Number(f.dwjz);
                        const hasPos = pos && pos.shares > 0;
                        const value =
                          hasPos && Number.isFinite(currentPrice) && currentPrice > 0
                            ? (pos.shares * currentPrice).toFixed(2)
                            : null;
                        const holdYield =
                          hasPos &&
                          pos.costPrice > 0 &&
                          Number.isFinite(currentPrice) &&
                          currentPrice > 0
                            ? ((currentPrice / pos.costPrice - 1) * 100).toFixed(2)
                            : null;
                        const recentYield =
                          hasPos &&
                          pos.lastTradeNav > 0 &&
                          Number.isFinite(currentPrice) &&
                          currentPrice > 0
                            ? ((currentPrice / pos.lastTradeNav - 1) * 100).toFixed(2)
                            : null;
                        return (
                          <div
                            className="row"
                            style={{
                              marginBottom: 10,
                              marginTop: -4,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 8,
                            }}
                          >
                            <div className="badge-v">
                              <span>金额</span>
                              <strong>{hasPos && value ? `${value}` : '—'}</strong>
                            </div>
                            <div className="badge-v">
                              <span>当前持有份额</span>
                              <strong>
                                {hasPos && pos.shares ? pos.shares.toFixed(2) : '—'}
                              </strong>
                            </div>
                            <div className="badge-v">
                              <span>成本价</span>
                              <strong>
                                {hasPos && pos.costPrice ? pos.costPrice.toFixed(4) : '—'}
                              </strong>
                            </div>
                            <div className="badge-v">
                              <span>持有收益率</span>
                              <strong
                                className={
                                  holdYield
                                    ? parseFloat(holdYield) > 0
                                      ? 'up'
                                      : parseFloat(holdYield) < 0
                                      ? 'down'
                                      : ''
                                    : ''
                                }
                              >
                                {holdYield
                                  ? `${parseFloat(holdYield) > 0 ? '+' : ''}${holdYield}%`
                                  : '—'}
                              </strong>
                            </div>
                            <div className="badge-v">
                              <span>最近交易日</span>
                              <strong>
                                {hasPos && pos.lastTradeDate ? pos.lastTradeDate : '—'}
                              </strong>
                            </div>
                            <div className="badge-v">
                              <span>最近交易日收益</span>
                              <strong
                                className={
                                  recentYield
                                    ? parseFloat(recentYield) > 0
                                      ? 'up'
                                      : parseFloat(recentYield) < 0
                                      ? 'down'
                                      : ''
                                    : ''
                                }
                              >
                                {recentYield
                                  ? `${parseFloat(recentYield) > 0 ? '+' : ''}${recentYield}%`
                                  : '—'}
                              </strong>
                            </div>
                            <button
                              className="button secondary"
                              style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                              onClick={() => onEditPosition(f)}
                            >
                              编辑持仓
                            </button>
                          </div>
                        );
                      })()}
                      {f.estPricedCoverage > 0.05 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--muted)',
                            marginTop: -8,
                            marginBottom: 10,
                            textAlign: 'right',
                          }}
                        >
                          基于 {Math.round(f.estPricedCoverage * 100)}% 持仓估算
                        </div>
                      )}
                      <div
                        style={{ marginBottom: 8, cursor: 'pointer', userSelect: 'none' }}
                        className="title"
                        onClick={() => onToggleCollapse(f.code)}
                      >
                        <div className="row" style={{ width: '100%', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>前10重仓股票</span>
                            <ChevronIcon
                              width="16"
                              height="16"
                              className="muted"
                              style={{
                                transform: collapsedCodes.has(f.code)
                                  ? 'rotate(-90deg)'
                                  : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}
                            />
                          </div>
                          <span className="muted">涨跌幅 / 占比</span>
                        </div>
                      </div>
                      <AnimatePresence>
                        {!collapsedCodes.has(f.code) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            {Array.isArray(f.holdings) && f.holdings.length ? (
                              <div className="list">
                                {f.holdings.map((h, idx) => (
                                  <div className="item" key={idx}>
                                    <span className="name">{h.name}</span>
                                    <div className="values">
                                      {typeof h.change === 'number' && (
                                        <span
                                          className={`badge ${
                                            h.change > 0 ? 'up' : h.change < 0 ? 'down' : ''
                                          }`}
                                          style={{ marginRight: 8 }}
                                        >
                                          {h.change > 0 ? '+' : ''}
                                          {h.change.toFixed(2)}%
                                        </span>
                                      )}
                                      <span className="weight">{h.weight}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="muted" style={{ padding: '8px 0' }}>
                                暂无重仓数据
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


