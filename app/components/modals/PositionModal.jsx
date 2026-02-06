 'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderPlusIcon, CloseIcon } from '../Icons';
import GlassDatePicker from '../GlassDatePicker';

function getNavByDate(fund, dateStr) {
  if (!fund || !Array.isArray(fund.historyTrend) || !dateStr) return null;
  const [y, m, d] = dateStr.split('-').map((n) => Number(n));
  if (!y || !m || !d) return null;
  const targetDay = new Date(y, m - 1, d);
  targetDay.setHours(0, 0, 0, 0);

  for (let i = fund.historyTrend.length - 1; i >= 0; i -= 1) {
    const item = fund.historyTrend[i];
    if (!item || typeof item.x !== 'number' || typeof item.y !== 'number') continue;
    const day = new Date(item.x);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === targetDay.getTime()) {
      return item.y;
    }
  }
  return null;
}

export default function PositionModal({ fund, position, onClose, onSave }) {
  const [mode, setMode] = useState(position && position.shares > 0 ? 'trade' : 'reset');
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [resetShares, setResetShares] = useState(
    position?.shares ? position.shares.toFixed(2) : '',
  );
  const [resetCostPrice, setResetCostPrice] = useState(
    position?.costPrice ? position.costPrice.toFixed(4) : '',
  );
  const [resetDate, setResetDate] = useState(position?.lastTradeDate || date);
  const [resetNav, setResetNav] = useState(
    position?.lastTradeNav ? String(position.lastTradeNav) : '',
  );

  const hasPosition = position && position.shares > 0;

  const currentPrice =
    fund && fund.estPricedCoverage > 0.05
      ? Number(fund.estGsz)
      : Number.isFinite(Number(fund?.gszzl)) && Number(fund?.gszzl) !== 0
      ? Number(fund.dwjz)
      : Number.isFinite(Number(fund?.gsz))
      ? Number(fund.gsz)
      : Number(fund?.dwjz);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fund) return;

    let next =
      position || {
        shares: 0,
        costPrice: 0,
        lastTradeDate: null,
        lastTradeNav: null,
        totalCost: 0,
      };

    if (mode === 'reset') {
      const s = parseFloat(resetShares);
      const cp = parseFloat(resetCostPrice);
      if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(cp) || cp <= 0) {
        return;
      }
      next.shares = s;
      next.costPrice = cp;
      next.totalCost = s * cp;
      next.lastTradeDate = resetDate || null;
      const nav = parseFloat(resetNav);
      next.lastTradeNav = Number.isFinite(nav) && nav > 0 ? nav : cp;
      onSave(fund.code, next);
      onClose();
      return;
    }

    const p = Number(currentPrice);
    if (!Number.isFinite(p) || p <= 0) return;

    let sharesChange = 0;
    const num = Math.abs(parseFloat(amount));
    if (!Number.isFinite(num) || num <= 0) return;

    if (type === 'buy') {
      sharesChange = num / p;
    } else {
      sharesChange = num;
    }

    if (!Number.isFinite(sharesChange) || sharesChange <= 0) return;

    if (!next.shares || next.shares < 0) {
      next = {
        shares: 0,
        costPrice: 0,
        lastTradeDate: null,
        lastTradeNav: null,
        totalCost: 0,
      };
    }

    if (type === 'buy') {
      const newShares = next.shares + sharesChange;
      const newTotalCost =
        (next.totalCost || next.shares * next.costPrice || 0) + sharesChange * p;
      next.shares = newShares;
      next.totalCost = newTotalCost;
      next.costPrice = newShares > 0 ? newTotalCost / newShares : 0;
    } else {
      const newShares = next.shares - sharesChange;
      if (newShares <= 0) {
        next.shares = 0;
        next.totalCost = 0;
        next.costPrice = 0;
      } else {
        next.shares = newShares;
        next.costPrice =
          next.costPrice ||
          (next.totalCost && next.shares ? next.totalCost / next.shares : p);
        next.totalCost = newShares * next.costPrice;
      }
    }

    next.lastTradeDate = date || null;
    next.lastTradeNav = p;

    onSave(fund.code, next);
    onClose();
  };

  const handleClear = () => {
    if (!fund) return;
    onSave(fund.code, null);
    onClose();
  };

  const positionValue =
    hasPosition && Number.isFinite(currentPrice) && currentPrice > 0
      ? (position.shares * currentPrice).toFixed(2)
      : null;

  const holdYield =
    hasPosition && position.costPrice > 0 && Number.isFinite(currentPrice) && currentPrice > 0
      ? ((currentPrice / position.costPrice - 1) * 100).toFixed(2)
      : null;

  const recentYield =
    hasPosition && position.lastTradeNav > 0 && Number.isFinite(currentPrice) && currentPrice > 0
      ? ((currentPrice / position.lastTradeNav - 1) * 100).toFixed(2)
      : null;

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="编辑持仓"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal"
        style={{ maxWidth: '480px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="title" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderPlusIcon width="20" height="20" />
              <span>编辑持仓</span>
            </div>
            {fund && (
              <div
                className="muted"
                style={{ fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                <span>{fund.name}</span>
                <span>#{fund.code}</span>
              </div>
            )}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        {hasPosition && (
          <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div className="badge-v">
              <span>金额</span>
              <strong>{positionValue ? `${positionValue}` : '—'}</strong>
            </div>
            <div className="badge-v">
              <span>当前持有份额</span>
              <strong>{position.shares ? position.shares.toFixed(2) : '—'}</strong>
            </div>
            <div className="badge-v">
              <span>成本价</span>
              <strong>{position.costPrice ? position.costPrice.toFixed(4) : '—'}</strong>
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
                {holdYield ? `${parseFloat(holdYield) > 0 ? '+' : ''}${holdYield}%` : '—'}
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
                {recentYield ? `${parseFloat(recentYield) > 0 ? '+' : ''}${recentYield}%` : '—'}
              </strong>
            </div>
          </div>
        )}

        <div className="chips" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`chip ${mode === 'trade' ? 'active' : ''}`}
            onClick={() => setMode('trade')}
          >
            加/减仓（记录一笔交易）
          </button>
          <button
            type="button"
            className={`chip ${mode === 'reset' ? 'active' : ''}`}
            onClick={() => setMode('reset')}
          >
            覆盖当前持仓
          </button>
        </div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          加/减仓模式适合按笔记录交易；覆盖模式适合直接录入当前总持仓和成本。
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'trade' ? (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <div className="chips">
                  {[
                    { id: 'buy', label: '加仓（买入）' },
                    { id: 'sell', label: '减仓（卖出）' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`chip ${type === t.id ? 'active' : ''}`}
                      onClick={() => {
                        setType(t.id);
                        setAmount('');
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  {type === 'buy' ? '本次买入金额（元）' : '本次卖出份额'}
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step={type === 'buy' ? '0.01' : '0.01'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={type === 'buy' ? '例如 1000' : '例如 500.1234'}
                />
                {type === 'sell' && hasPosition && (
                  <div
                    className="chips"
                    style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}
                  >
                    {[
                      { ratio: 0.25, label: '1/4' },
                      { ratio: 1 / 3, label: '1/3' },
                      { ratio: 0.5, label: '1/2' },
                      { ratio: 1, label: '全部' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className="chip"
                        style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                        onClick={() => {
                          const shares = position?.shares || 0;
                          if (!shares || shares <= 0) return;
                          const val = shares * opt.ratio;
                          setAmount(val.toFixed(2));
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  交易日期
                </label>
                <GlassDatePicker
                  value={date}
                  onChange={setDate}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  当前持仓份额
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={resetShares}
                  onChange={(e) => setResetShares(e.target.value)}
                  placeholder="例如 1000.12"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  成本价（净值）
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={resetCostPrice}
                  onChange={(e) => setResetCostPrice(e.target.value)}
                  placeholder="例如 1.2345"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  最近交易日
                </label>
                <GlassDatePicker
                  value={resetDate}
                  onChange={(nextDate) => {
                    setResetDate(nextDate);
                    const autoNav = getNavByDate(fund, nextDate);
                    if (Number.isFinite(autoNav) && autoNav > 0) {
                      setResetNav(autoNav.toFixed(4));
                    }
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label
                  className="muted"
                  style={{ display: 'block', marginBottom: 4, fontSize: '14px' }}
                >
                  最近交易净值（用于“距最近交易日涨跌幅”）
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={resetNav}
                  onChange={(e) => setResetNav(e.target.value)}
                  placeholder="默认等于成本价，可单独填写"
                />
              </div>
            </>
          )}

          <div className="row" style={{ marginTop: 16, gap: 8 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              取消
            </button>
            {hasPosition && (
              <button
                type="button"
                className="button danger"
                onClick={handleClear}
                style={{ flex: 1 }}
              >
                清空持仓
              </button>
            )}
            <button type="submit" className="button" style={{ flex: 1 }}>
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


