import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AnalyticsSection({
  dateRange,
  setDateRange,
  exportCsv,
  exportPdf,
  series,
  topSoftware,
}) {
  const chartData = useMemo(
    () => series.users.map((_, index) => ({
      point: `P${index + 1}`,
      users: series.users[index],
      downloads: series.downloads[index],
      sessions: series.sessions[index],
    })),
    [series],
  );

  return (
    <section className="adm-panel">
      <div className="adm-section-head">
        <h2>Analytics & Reporting</h2>
        <div className="adm-actions">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select>
          <button type="button" onClick={exportCsv}>Export CSV</button>
          <button type="button" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
      <div className="adm-chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.12)" />
            <XAxis dataKey="point" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="sessions" stroke="#d97706" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="adm-analytics">
        <section>
          <h4>Most downloaded software</h4>
          <ul className="adm-list">{topSoftware.map((x) => <li key={x.id}>{x.name}: {x.downloads}</li>)}</ul>
        </section>
      </div>
    </section>
  );
}
