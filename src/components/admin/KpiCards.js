import React from 'react';

function MiniSpark({ points }) {
  const max = Math.max(...points, 1);
  const poly = points.map((v, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - ((v / max) * 100)}`).join(' ');
  return (
    <svg className="adm-mini-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={poly} />
    </svg>
  );
}

function trendFromSeries(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return null;
  const first = Number(arr[0] || 0);
  const last = Number(arr[arr.length - 1] || 0);
  if (!first && !last) return null;
  const delta = last - first;
  const pct = first === 0 ? null : Math.round((delta / first) * 100);
  if (delta === 0) return { dir: 'flat', text: 'No change' };
  if (pct == null) return { dir: delta > 0 ? 'up' : 'down', text: `${delta > 0 ? '+' : ''}${delta}` };
  return { dir: delta > 0 ? 'up' : 'down', text: `${delta > 0 ? '+' : ''}${pct}%` };
}

const formatMetricValue = (value) => (typeof value === 'number' ? value.toLocaleString() : value);

export default function KpiCards({ metrics }) {
  return (
    <>
      {metrics.map((m) => {
        const trend = trendFromSeries(m.series);
        return (
          <article key={m.label} className="adm-panel">
            <p className="adm-kpi-label">{m.label}</p>
            <h3 className="adm-kpi-value">{formatMetricValue(m.value)}</h3>
            {trend && (
              <small className={`adm-kpi-trend ${trend.dir}`}>
                {trend.dir === 'up' ? 'Up' : trend.dir === 'down' ? 'Down' : 'Flat'} {trend.text} vs baseline
              </small>
            )}
            <MiniSpark points={m.series} />
          </article>
        );
      })}
    </>
  );
}
