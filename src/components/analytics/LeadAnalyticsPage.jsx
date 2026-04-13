'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { INTEREST_OPTIONS, PIPELINE_OPTIONS } from '@/utils/status';

/** Treat only explicit API failure flags as errors; empty charts on 200 are OK. */
function isAnalyticsFailure(res) {
  return res && typeof res === 'object' && res.success === false;
}

const PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: '6m', label: '6 months' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const COL = {
  interested: '#22c55e',
  pending: '#eab308',
  notInterested: '#ef4444',
  total: '#3b82f6',
};

const INTEREST_TOTAL_KEYS = {
  Interested: 'interested',
  Pending: 'pending',
  'Not Interested': 'notInterested',
};

const INTEREST_PIE_COLORS = {
  Interested: COL.interested,
  Pending: COL.pending,
  'Not Interested': COL.notInterested,
};

/** Distinct colors for each pipeline stage (deal stage) */
const PIPELINE_COLORS = {
  Pending: '#94a3b8',
  'Follow-up': '#f59e0b',
  'Meeting scheduled': '#8b5cf6',
  Confirmed: '#06b6d4',
  'Proposal sent': '#ec4899',
  Negotiation: '#f97316',
  'Closed won': '#22c55e',
  'Closed lost': '#64748b',
  'Not pursuing': '#ef4444',
};

function localDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthStartISO() {
  const d = new Date();
  return localDateISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduced;
}

const RC_DEBOUNCE_MS = 80;

/** Wrapped legend so 9 pipeline stages never overflow horizontally */
function PipelineStageLegendContent({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="lms-analytics-pipeline-chart-legend">
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} className="lms-analytics-pipeline-chart-legend__item">
          <span
            className="lms-analytics-pipeline-chart-legend__swatch"
            style={{ background: entry.color }}
            aria-hidden
          />
          <span className="lms-analytics-pipeline-chart-legend__label">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

function InterestDonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const cell = payload[0];
  const data = cell.payload ?? cell;
  const name = data.name ?? cell.name;
  const value = data.value ?? cell.value;
  const color = data.color ?? cell.fill ?? INTEREST_PIE_COLORS[name];
  return (
    <div className="lms-analytics-tooltip lms-analytics-tooltip--interest lms-analytics-tooltip--slice">
      <div className="lms-analytics-tooltip__interest-row">
        <span className="lms-analytics-tooltip__interest-swatch" style={{ background: color }} aria-hidden />
        <span className="lms-analytics-tooltip__interest-name" style={{ color }}>
          {name}
        </span>
        <span className="lms-analytics-tooltip__interest-val tabular-nums">{value}</span>
      </div>
      <div className="lms-analytics-tooltip__slice-meta">leads</div>
    </div>
  );
}

function PipelineDonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const cell = payload[0];
  const data = cell.payload ?? cell;
  const name = data.name ?? cell.name;
  const value = data.value ?? cell.value;
  const color = data.color ?? cell.fill ?? PIPELINE_COLORS[name];
  return (
    <div className="lms-analytics-tooltip lms-analytics-tooltip--interest lms-analytics-tooltip--slice">
      <div className="lms-analytics-tooltip__interest-row">
        <span className="lms-analytics-tooltip__interest-swatch" style={{ background: color }} aria-hidden />
        <span className="lms-analytics-tooltip__interest-name" style={{ color }}>
          {name}
        </span>
        <span className="lms-analytics-tooltip__interest-val tabular-nums">{value}</span>
      </div>
      <div className="lms-analytics-tooltip__slice-meta">leads</div>
    </div>
  );
}

function GaugeShareTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const cell = payload[0];
  const name = cell.name;
  const value = cell.value;
  const color = cell.fill ?? '#cbd5e1';
  return (
    <div className="lms-analytics-tooltip lms-analytics-tooltip--interest lms-analytics-tooltip--slice">
      <div className="lms-analytics-tooltip__interest-row">
        <span className="lms-analytics-tooltip__interest-swatch" style={{ background: color }} aria-hidden />
        <span className="lms-analytics-tooltip__interest-name" style={{ color }}>
          {name}
        </span>
        <span className="lms-analytics-tooltip__interest-val tabular-nums">{value}%</span>
      </div>
    </div>
  );
}

function PipelineTotalsBarTooltip({ active, label, payload }) {
  if (!active || label == null) return null;
  const v = payload?.[0]?.value ?? 0;
  const color = PIPELINE_COLORS[label] ?? '#94a3b8';
  return (
    <div className="lms-analytics-tooltip lms-analytics-tooltip--interest lms-analytics-tooltip--slice">
      <div className="lms-analytics-tooltip__interest-row">
        <span className="lms-analytics-tooltip__interest-swatch" style={{ background: color }} aria-hidden />
        <span className="lms-analytics-tooltip__interest-name" style={{ color }}>
          {label}
        </span>
        <span className="lms-analytics-tooltip__interest-val tabular-nums">{v}</span>
      </div>
      <div className="lms-analytics-tooltip__slice-meta">leads in range</div>
    </div>
  );
}

export default function LeadAnalyticsPage({ scopeLabel }) {
  const [period, setPeriod] = useState('monthly');
  const [rangeMode, setRangeMode] = useState('preset');
  const [customFrom, setCustomFrom] = useState(monthStartISO);
  const [customTo, setCustomTo] = useState(() => localDateISO(new Date()));
  /** Set only when user clicks Apply range — avoids refetch on every keystroke. */
  const [appliedRange, setAppliedRange] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const reduceMotion = usePrefersReducedMotion();
  const animateCharts = !reduceMotion;

  const load = useCallback(async (opts) => {
    setLoading(true);
    try {
      const res = await api.getLeadAnalytics(opts);
      if (isAnalyticsFailure(res)) {
        setPayload(null);
        toast.error(res.message || 'Failed to load analytics');
      } else if (res && typeof res === 'object') {
        setPayload(res);
      } else {
        setPayload(null);
      }
    } catch {
      setPayload(null);
      toast.error('Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rangeMode === 'custom') {
      if (appliedRange) {
        void load({ from: appliedRange.from, to: appliedRange.to });
      }
    } else {
      void load({ period });
    }
  }, [rangeMode, period, appliedRange, load]);

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      toast.error('Choose both start and end dates');
      return;
    }
    if (customFrom > customTo) {
      toast.error('Start date must be before end date');
      return;
    }
    setAppliedRange({ from: customFrom, to: customTo });
    setRangeMode('custom');
  };

  const usePresets = () => {
    setAppliedRange(null);
    setRangeMode('preset');
  };

  const chartData = useMemo(() => {
    if (!payload?.series) return [];
    return payload.series.map((s) => ({
      name: s.label,
      Total: s.total,
      Interested: s.interested,
      Pending: s.pending,
      'Not Interested': s.notInterested,
    }));
  }, [payload]);

  const interestTooltipContent = useCallback(
    ({ active, label }) => {
      if (!active || label == null) return null;
      const row = chartData.find((r) => r.name === label);
      if (!row) return null;
      const interested = Number(row.Interested) || 0;
      const pending = Number(row.Pending) || 0;
      const notInterested = Number(row['Not Interested']) || 0;
      const total = interested + pending + notInterested;
      const rows = [
        { name: 'Interested', value: interested, color: COL.interested },
        { name: 'Pending', value: pending, color: COL.pending },
        { name: 'Not Interested', value: notInterested, color: COL.notInterested },
      ];
      return (
        <div className="lms-analytics-tooltip lms-analytics-tooltip--interest">
          <div className="lms-analytics-tooltip__bucket">{label}</div>
          <ul className="lms-analytics-tooltip__interest-list list-unstyled mb-0">
            {rows.map((item) => (
              <li key={item.name} className="lms-analytics-tooltip__interest-row">
                <span
                  className="lms-analytics-tooltip__interest-swatch"
                  style={{ background: item.color }}
                  aria-hidden
                />
                <span className="lms-analytics-tooltip__interest-name" style={{ color: item.color }}>
                  {item.name}
                </span>
                <span className="lms-analytics-tooltip__interest-val tabular-nums">{item.value}</span>
              </li>
            ))}
          </ul>
          <div className="lms-analytics-tooltip__interest-total">
            Total <span className="tabular-nums">{total}</span> in bucket
          </div>
        </div>
      );
    },
    [chartData]
  );

  /** Always all 3 interest statuses (including zeros) */
  const interestPieData = useMemo(() => {
    if (!payload?.totals) return [];
    const t = payload.totals;
    return INTEREST_OPTIONS.map((name) => ({
      name,
      value: t[INTEREST_TOTAL_KEYS[name]] ?? 0,
      color: INTEREST_PIE_COLORS[name],
    }));
  }, [payload]);

  /** Always all deal-stage / pipeline statuses (including zeros) */
  const pipelinePieData = useMemo(() => {
    if (!payload?.totals) return [];
    const p = payload.totals.pipeline || {};
    return PIPELINE_OPTIONS.map((name) => ({
      name,
      value: p[name] ?? 0,
      color: PIPELINE_COLORS[name],
    }));
  }, [payload]);

  const pipelineTimeData = useMemo(() => {
    if (!payload?.series) return [];
    return payload.series.map((s) => {
      const row = { name: s.label };
      for (const st of PIPELINE_OPTIONS) {
        row[st] = s.pipeline?.[st] ?? 0;
      }
      return row;
    });
  }, [payload]);

  const pipelineTotalsBar = useMemo(() => {
    if (!payload?.totals?.pipeline) return [];
    return PIPELINE_OPTIONS.map((stage) => ({
      stage,
      count: payload.totals.pipeline[stage] ?? 0,
    }));
  }, [payload]);

  /** Max stacked height per bucket — for Y-axis when everything is zero */
  const pipelineBucketMax = useMemo(() => {
    if (!pipelineTimeData.length) return 0;
    return Math.max(
      0,
      ...pipelineTimeData.map((row) =>
        PIPELINE_OPTIONS.reduce((s, k) => s + (Number(row[k]) || 0), 0)
      )
    );
  }, [pipelineTimeData]);

  const pipelineYDomain = useMemo(() => {
    if (pipelineBucketMax === 0) return [0, 1];
    return [0, 'auto'];
  }, [pipelineBucketMax]);

  const pipelineTooltipContent = useCallback(
    ({ active, label }) => {
      if (!active || label == null) return null;
      const row = pipelineTimeData.find((r) => r.name === label);
      if (!row) return null;
      const total = PIPELINE_OPTIONS.reduce((s, k) => s + (Number(row[k]) || 0), 0);
      return (
        <div className="lms-analytics-tooltip lms-analytics-tooltip--pipeline">
          <div className="lms-analytics-tooltip__bucket">{label}</div>
          <div className="lms-analytics-tooltip__pipeline-grid">
            {PIPELINE_OPTIONS.map((name) => {
              const v = Number(row[name]) || 0;
              return (
                <div key={name} className="lms-analytics-tooltip__pipeline-cell">
                  <span
                    className="lms-analytics-tooltip__pipeline-dot"
                    style={{ background: PIPELINE_COLORS[name] }}
                    aria-hidden
                  />
                  <span
                    className="lms-analytics-tooltip__pipeline-name"
                    style={{ color: PIPELINE_COLORS[name] }}
                    title={name}
                  >
                    {name}
                  </span>
                  <span className="lms-analytics-tooltip__pipeline-val tabular-nums">{v}</span>
                </div>
              );
            })}
          </div>
          <div className="lms-analytics-tooltip__pipeline-total">
            Total <span className="tabular-nums">{total}</span> in bucket
          </div>
        </div>
      );
    },
    [pipelineTimeData]
  );

  const totals = payload?.totals;
  const interestedPct = useMemo(() => {
    if (!totals || totals.total === 0) return 0;
    return Math.round((totals.interested / totals.total) * 100);
  }, [totals]);

  const gaugeData = useMemo(
    () => [
      { name: 'Interested', value: interestedPct, fill: COL.interested },
      { name: 'Other', value: Math.max(0, 100 - interestedPct), fill: '#cbd5e1' },
    ],
    [interestedPct]
  );

  const showDenseAxis =
    payload?.granularity === 'day' || (payload?.mode === 'preset' && payload?.period === 'daily');

  const gridStroke = 'var(--lms-border-strong, #cbd5e1)';
  const tickFill = 'var(--lms-text-muted, #64748b)';

  const barMarginInterest = useMemo(
    () => ({ top: 8, right: 12, left: 4, bottom: showDenseAxis ? 24 : 8 }),
    [showDenseAxis]
  );
  const barMarginVolume = useMemo(
    () => ({ top: 8, right: 8, left: 4, bottom: showDenseAxis ? 20 : 8 }),
    [showDenseAxis]
  );

  /** Room for angled date labels + multi-row wrapped pipeline legend */
  const barMarginPipeline = useMemo(
    () => ({
      top: 8,
      right: 12,
      left: 4,
      bottom: showDenseAxis ? 118 : 102,
    }),
    [showDenseAxis]
  );

  /** Theme-aware hover band (see `.lms-analytics-chart` / `html[data-lms-theme='light']` in lms.css) */
  const barTooltipCursor = useMemo(
    () => ({ fill: 'var(--lms-analytics-cursor-fill, rgba(148, 163, 184, 0.14))' }),
    []
  );

  const volumeTooltipContent = useCallback(
    ({ active, label }) => {
      if (!active || label == null) return null;
      const row = chartData.find((r) => r.name === label);
      if (!row) return null;
      const v = Number(row.Total) || 0;
      return (
        <div className="lms-analytics-tooltip lms-analytics-tooltip--interest">
          <div className="lms-analytics-tooltip__bucket">{label}</div>
          <div className="lms-analytics-tooltip__interest-row">
            <span className="lms-analytics-tooltip__interest-swatch" style={{ background: COL.total }} aria-hidden />
            <span className="lms-analytics-tooltip__interest-name" style={{ color: COL.total }}>
              Total
            </span>
            <span className="lms-analytics-tooltip__interest-val tabular-nums">{v}</span>
          </div>
          <div className="lms-analytics-tooltip__slice-meta">new leads in bucket</div>
        </div>
      );
    },
    [chartData]
  );

  return (
    <div className="lms-page lms-analytics-page pb-5">
      <header className="mb-4">
        <p className="small text-uppercase fw-semibold text-muted mb-1" style={{ letterSpacing: '0.08em' }}>
          Analytics
        </p>
        <h1 className="h3 mb-1">Lead performance</h1>
        <p className="text-muted small mb-0">
          {scopeLabel} — buckets use <strong>lead creation date</strong>. Custom range uses <strong>UTC calendar dates</strong>{' '}
          (same as <code className="small">YYYY-MM-DD</code> on the API).
        </p>
      </header>

      <div className="card lms-analytics-card border mb-3">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: '0.06em' }}>
              Custom range
            </span>
            {rangeMode === 'custom' && (
              <span className="badge rounded-pill bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                Active
              </span>
            )}
          </div>
          <div className="row g-2 align-items-end flex-wrap">
            <div className="col-6 col-sm-auto">
              <label className="form-label small mb-1" htmlFor="analytics-from">
                From
              </label>
              <input
                id="analytics-from"
                type="date"
                className="form-control form-control-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="col-6 col-sm-auto">
              <label className="form-label small mb-1" htmlFor="analytics-to">
                To
              </label>
              <input
                id="analytics-to"
                type="date"
                className="form-control form-control-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-sm btn-primary" onClick={applyCustomRange}>
                Apply range
              </button>
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={usePresets}>
                Use presets
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Quick range">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              rangeMode === 'preset' && period === p.id ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => {
              setRangeMode('preset');
              setPeriod(p.id);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      )}

      {!loading && !payload && (
        <div className="alert alert-secondary border mb-0" role="status">
          No analytics data loaded. Adjust the range or presets and try again.
        </div>
      )}

      {!loading && payload && (
        <>
          <div className="row g-3 g-md-4 mb-4">
            <div className="col-6 col-md-3">
              <div className="lms-analytics-kpi border rounded-3 p-3 h-100">
                <div className="small text-muted">Total leads</div>
                <div className="h4 mb-0 tabular-nums">{payload.totals.total}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="lms-analytics-kpi border rounded-3 p-3 h-100 border-success border-opacity-25">
                <div className="small text-muted">Interested</div>
                <div className="h4 mb-0 tabular-nums text-success">{payload.totals.interested}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="lms-analytics-kpi border rounded-3 p-3 h-100 border-warning border-opacity-25">
                <div className="small text-muted">Pending</div>
                <div className="h4 mb-0 tabular-nums text-warning">{payload.totals.pending}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="lms-analytics-kpi border rounded-3 p-3 h-100 border-danger border-opacity-25">
                <div className="small text-muted">Not interested</div>
                <div className="h4 mb-0 tabular-nums text-danger">{payload.totals.notInterested}</div>
              </div>
            </div>
          </div>

          <div className="card lms-analytics-card border mb-4">
            <div className="card-body lms-analytics-card--chart">
              <h2 className="h6 mb-3">New leads over time (by interest)</h2>
              <div className="lms-analytics-chart" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                  <BarChart
                    data={chartData}
                    margin={barMarginInterest}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: tickFill }}
                      interval={showDenseAxis ? 3 : 0}
                      angle={showDenseAxis ? -30 : 0}
                      textAnchor={showDenseAxis ? 'end' : 'middle'}
                      height={showDenseAxis ? 48 : 32}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: tickFill }}
                      width={36}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={interestTooltipContent}
                      cursor={barTooltipCursor}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      name="Interested"
                      dataKey="Interested"
                      stackId="a"
                      fill={COL.interested}
                      radius={[0, 0, 0, 0]}
                      isAnimationActive={animateCharts}
                      animationDuration={380}
                    />
                    <Bar
                      name="Pending"
                      dataKey="Pending"
                      stackId="a"
                      fill={COL.pending}
                      isAnimationActive={animateCharts}
                      animationDuration={380}
                    />
                    <Bar
                      name="Not Interested"
                      dataKey="Not Interested"
                      stackId="a"
                      fill={COL.notInterested}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={animateCharts}
                      animationDuration={380}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card lms-analytics-card border mb-4">
            <div className="card-body lms-analytics-card--chart">
              <h2 className="h6 mb-3">New leads over time (by deal stage)</h2>
              <p className="small text-muted mb-3">All pipeline stages — same buckets as above.</p>
              <div className="lms-analytics-chart lms-analytics-chart--pipeline-stack position-relative" style={{ height: 400 }}>
                {payload.totals.total === 0 && (
                  <div className="lms-analytics-empty-hint" aria-hidden>
                    No leads in this range — chart will fill when new leads appear.
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                  <BarChart
                    data={pipelineTimeData}
                    margin={barMarginPipeline}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: tickFill }}
                      interval={showDenseAxis ? 3 : 0}
                      angle={showDenseAxis ? -30 : 0}
                      textAnchor={showDenseAxis ? 'end' : 'middle'}
                      height={showDenseAxis ? 48 : 32}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: tickFill }}
                      width={36}
                      domain={pipelineYDomain}
                      {...(pipelineBucketMax === 0 ? { tickCount: 2 } : {})}
                    />
                    <Tooltip
                      content={pipelineTooltipContent}
                      cursor={barTooltipCursor}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend
                      content={PipelineStageLegendContent}
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ width: '100%', left: 0, paddingTop: 4 }}
                    />
                    {PIPELINE_OPTIONS.map((st, idx) => (
                      <Bar
                        key={st}
                        dataKey={st}
                        name={st}
                        stackId="pl"
                        fill={PIPELINE_COLORS[st]}
                        radius={idx === PIPELINE_OPTIONS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        isAnimationActive={animateCharts}
                        animationDuration={380}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card lms-analytics-card border mb-4">
            <div className="card-body lms-analytics-card--chart">
              <h2 className="h6 mb-3">Deal stages in range (all statuses)</h2>
              <p className="small text-muted mb-3">Total leads per pipeline stage for the selected period.</p>
              <div className="lms-analytics-chart" style={{ minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={320} debounce={RC_DEBOUNCE_MS}>
                  <BarChart
                    layout="vertical"
                    data={pipelineTotalsBar}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} domain={[0, 'auto']} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={128}
                      tick={{ fontSize: 10, fill: tickFill }}
                      interval={0}
                    />
                    <Tooltip
                      content={PipelineTotalsBarTooltip}
                      cursor={barTooltipCursor}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                      isAnimationActive={animateCharts}
                      animationDuration={380}
                    >
                      {pipelineTotalsBar.map((e) => (
                        <Cell key={e.stage} fill={PIPELINE_COLORS[e.stage]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="card lms-analytics-card border h-100">
                <div className="card-body lms-analytics-card--chart">
                  <h2 className="h6 mb-2">Donut — interest (all statuses)</h2>
                  <p className="small text-muted mb-3">Interest: Interested, Pending, Not Interested — always shown.</p>
                  {payload.totals.total === 0 ? (
                    <p className="text-muted small mb-0 py-5 text-center">No leads in this range.</p>
                  ) : (
                    <>
                      <div
                        className="position-relative mx-auto lms-analytics-donut-chart"
                        style={{ width: '100%', maxWidth: 260, height: 220 }}
                      >
                        <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Pie
                              data={interestPieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="52%"
                              outerRadius="78%"
                              paddingAngle={2.5}
                              label={false}
                              stroke="none"
                              isAnimationActive={animateCharts}
                              animationDuration={450}
                            >
                              {interestPieData.map((d) => (
                                <Cell key={d.name} fill={d.color} stroke="var(--lms-bg-card)" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip content={InterestDonutTooltip} wrapperStyle={{ outline: 'none' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div
                          className="position-absolute text-center lms-analytics-donut-center"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            maxWidth: '42%',
                          }}
                        >
                          <div className="small text-muted mb-0 text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>
                            Leads
                          </div>
                          <div className="h3 mb-0 tabular-nums lh-sm">{payload.totals.total}</div>
                        </div>
                      </div>
                      <ul className="lms-analytics-donut-legend list-unstyled mb-0 mt-3 d-flex flex-wrap justify-content-center gap-2 gap-md-3 small">
                        {interestPieData.map((d) => {
                          const pct =
                            payload.totals.total > 0 ? ((d.value / payload.totals.total) * 100).toFixed(0) : '0';
                          return (
                            <li key={d.name} className="d-flex align-items-center gap-2">
                              <span
                                className="rounded-circle flex-shrink-0"
                                style={{ width: 9, height: 9, background: d.color }}
                                aria-hidden
                              />
                              <span>
                                <span className="fw-semibold">{d.name}</span>{' '}
                                <span className="text-muted">
                                  {pct}% · {d.value}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card lms-analytics-card border h-100">
                <div className="card-body lms-analytics-card--chart">
                  <h2 className="h6 mb-2">Donut — deal stage (all statuses)</h2>
                  <p className="small text-muted mb-3">All pipeline stages — zeros appear in the legend.</p>
                  {payload.totals.total === 0 ? (
                    <p className="text-muted small mb-0 py-5 text-center">No leads in this range.</p>
                  ) : (
                    <>
                      <div
                        className="position-relative mx-auto lms-analytics-donut-chart"
                        style={{ width: '100%', maxWidth: 260, height: 220 }}
                      >
                        <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Pie
                              data={pipelinePieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="52%"
                              outerRadius="78%"
                              paddingAngle={1.2}
                              label={false}
                              stroke="none"
                              isAnimationActive={animateCharts}
                              animationDuration={450}
                            >
                              {pipelinePieData.map((d) => (
                                <Cell key={d.name} fill={d.color} stroke="var(--lms-bg-card)" strokeWidth={1} />
                              ))}
                            </Pie>
                            <Tooltip content={PipelineDonutTooltip} wrapperStyle={{ outline: 'none' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div
                          className="position-absolute text-center lms-analytics-donut-center"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            maxWidth: '46%',
                          }}
                        >
                          <div className="small text-muted mb-0 text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                            Pipeline
                          </div>
                          <div className="h3 mb-0 tabular-nums lh-sm">{payload.totals.total}</div>
                        </div>
                      </div>
                      <ul
                        className="lms-analytics-donut-legend lms-analytics-pipeline-grid list-unstyled mb-0 mt-3"
                        aria-label="Deal stage breakdown"
                      >
                        {pipelinePieData.map((d) => {
                          const pct =
                            payload.totals.total > 0 ? ((d.value / payload.totals.total) * 100).toFixed(0) : '0';
                          return (
                            <li key={d.name} className="lms-analytics-pipeline-grid__item">
                              <span
                                className="lms-analytics-pipeline-grid__swatch"
                                style={{ background: d.color }}
                                aria-hidden
                              />
                              <div className="lms-analytics-pipeline-grid__text">
                                <div className="lms-analytics-pipeline-grid__name text-truncate" title={d.name}>
                                  {d.name}
                                </div>
                                <div className="lms-analytics-pipeline-grid__meta text-muted tabular-nums">
                                  {pct}% · {d.value} leads
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card lms-analytics-card border h-100">
                <div className="card-body d-flex flex-column lms-analytics-card--chart">
                  <h2 className="h6 mb-2">Gauge — interested share</h2>
                  <p className="small text-muted mb-3">
                    Portion of leads marked <strong>Interested</strong> (0–100%).
                  </p>
                  {payload.totals.total === 0 ? (
                    <p className="text-muted small mb-0 py-5 text-center flex-grow-1 d-flex align-items-center justify-content-center">
                      No leads in this range.
                    </p>
                  ) : (
                  <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center lms-analytics-chart">
                    <div className="lms-analytics-gauge-wrap w-100" style={{ maxWidth: 280, height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                        <PieChart margin={{ top: 12, right: 8, bottom: 4, left: 8 }}>
                          <Pie
                            data={gaugeData}
                            dataKey="value"
                            cx="50%"
                            cy="82%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="62%"
                            outerRadius="92%"
                            stroke="none"
                            paddingAngle={0}
                            isAnimationActive={animateCharts}
                            animationDuration={450}
                          >
                            {gaugeData.map((d) => (
                              <Cell key={d.name} fill={d.fill} stroke="var(--lms-bg-card)" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip content={GaugeShareTooltip} wrapperStyle={{ outline: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 pt-1">
                      <div className="display-6 fw-bold tabular-nums lh-1" style={{ color: COL.interested }}>
                        {interestedPct}%
                      </div>
                      <div className="small text-muted mt-1">Interested of total</div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card lms-analytics-card border h-100">
                <div className="card-body lms-analytics-card--chart">
                  <h2 className="h6 mb-3">Volume per bucket</h2>
                  <p className="small text-muted mb-3">Total new leads per time bucket (same range as charts above).</p>
                  <div className="lms-analytics-chart" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={RC_DEBOUNCE_MS}>
                      <BarChart
                        data={chartData}
                        margin={barMarginVolume}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeOpacity={0.5} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: tickFill }}
                          interval={showDenseAxis ? 3 : 0}
                          angle={showDenseAxis ? -30 : 0}
                          textAnchor={showDenseAxis ? 'end' : 'middle'}
                          height={showDenseAxis ? 44 : 28}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: tickFill }}
                          width={36}
                          domain={[0, 'auto']}
                        />
                        <Tooltip
                          content={volumeTooltipContent}
                          cursor={barTooltipCursor}
                          wrapperStyle={{ outline: 'none' }}
                        />
                        <Bar
                          name="Total"
                          dataKey="Total"
                          fill={COL.total}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={56}
                          isAnimationActive={animateCharts}
                          animationDuration={380}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-muted small mt-2 mb-0">
            Range: {new Date(payload.range.start).toISOString().slice(0, 10)} → {new Date(payload.range.end).toISOString().slice(0, 10)}{' '}
            UTC ·{' '}
            {payload.mode === 'custom' ? (
              <>
                custom · <span className="text-capitalize">{payload.granularity}</span> buckets
              </>
            ) : (
              <>preset: {payload.period}</>
            )}
          </p>
        </>
      )}
    </div>
  );
}
