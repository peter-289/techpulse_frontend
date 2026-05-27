import React from 'react';
import { Pill, toDate } from '../adminUtils';

export default function LogsSection({ logsPageRows, logTotalPages, logPage, setLogPage }) {
  return (
    <section className="adm-panel">
      <div className="adm-section-head"><h2>Activity Logs & Security</h2></div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Timestamp</th><th>Type</th><th>Actor</th><th>Details</th><th>Severity</th></tr></thead>
          <tbody>{logsPageRows.map((l) => <tr key={l.id}><td>{toDate(l.time)}</td><td>{l.type}</td><td>{l.actor}</td><td>{l.details}</td><td><Pill value={l.severity} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="adm-pagination">
        {Array.from({ length: logTotalPages }).map((_, index) => (
          <button
            key={`l-page-${index + 1}`}
            type="button"
            className={logPage === index + 1 ? 'active' : ''}
            onClick={() => setLogPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
