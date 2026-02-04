'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 按需注册图表和组件，参考官方文档：
// https://echarts.apache.org/handbook/zh/basics/import
echarts.use([TooltipComponent, GridComponent, LineChart, CanvasRenderer]);

/**
 * 使用 ECharts 渲染的净值趋势图
 * @param {{ data: { x: number, y: number, equityReturn?: number }[] }} props
 */
export default function FundTrendChart({ data }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!Array.isArray(data) || data.length < 2) return;
    if (!chartRef.current) return;

    let destroyed = false;

    if (instanceRef.current) {
      instanceRef.current.dispose();
      instanceRef.current = null;
    }

    const el = chartRef.current;
    const chart = echarts.init(el);
    instanceRef.current = chart;

    const ys = data
      .map((d) => Number(d.y))
      .filter((v) => Number.isFinite(v));
    if (ys.length < 2) return;

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // 使用最后一个点的日涨跌幅（equityReturn）决定颜色：
    // 跌：绿色；涨：红色；持平：灰色
    const lastPoint = data[data.length - 1] || {};
    const lastChange = Number(lastPoint.equityReturn);
    const isUp = lastChange > 0;
    const isDown = lastChange < 0;
    const colorUp = '#ff4d4f';
    const colorDown = '#52c41a';
    const colorFlat = '#999999';

    const option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter(params) {
          const p = params && params[0];
          if (!p) return '';
          const date = new Date(p.value[0]);
          const d =
            Number.isFinite(date.getTime()) &&
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(date.getDate()).padStart(2, '0')}`;
          return `${d || ''}<br/>净值：${p.value[1]}`;
        },
      },
      grid: {
        left: 0,
        right: 4,
        top: 8,
        bottom: 16,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { show: true, lineStyle: { color: '#e5e5e5', width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#999',
          fontSize: 10,
          formatter: (value) => {
            const d = new Date(value);
            if (!Number.isFinite(d.getTime())) return '';
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${m}-${day}`;
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: minY,
        max: maxY,
        axisLine: { show: true, lineStyle: { color: '#e5e5e5', width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#999',
          fontSize: 10,
        },
        splitLine: {
          show: false,
          // lineStyle: { color: '#f0f0f0', type: 'dashed', width: 1 },
        },
      },
      series: [
        {
          type: 'line',
          symbol: 'none',
          smooth: true,
          lineStyle: {
            width: 1.5,
            color: isUp ? colorUp : isDown ? colorDown : colorFlat,
          },
          areaStyle: {
            opacity: 0.05,
            color: isUp ? colorUp : isDown ? colorDown : colorFlat,
          },
          data: data.map((d) => [d.x, Number(d.y)]),
        },
      ],
    };

    chart.setOption(option);
    chart.resize();

    return () => {
      destroyed = true;
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, [data]);

  if (!Array.isArray(data) || data.length < 2) return null;

  return (
    <div
      className="fund-trend-chart"
      ref={chartRef}
      style={{
        width: '100%',
        height: 120,
      }}
    />
  );
}




