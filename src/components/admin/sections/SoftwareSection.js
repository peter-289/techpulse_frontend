import React from 'react';
import { Pill, toDate } from '../adminUtils';

export default function SoftwareSection({
  softwarePageRows,
  softwareTotalPages,
  softwarePage,
  setSoftwarePage,
  selectedSoftwareIds,
  allSoftwareOnPageSelected,
  onToggleAllSoftwareOnPage,
  onToggleSoftwareSelect,
  softwareBulkAction,
  setSoftwareBulkAction,
  onApplySoftwareBulkAction,
  updateSoftware,
  permissions,
  setConfirm,
  setFeedback,
}) {
  return (
    <section className="adm-panel">
      <div className="adm-section-head"><h2>Software Management</h2></div>

      {selectedSoftwareIds.size > 0 && (
        <div className="adm-bulk-bar">
          <strong>{selectedSoftwareIds.size} selected</strong>
          <select value={softwareBulkAction} onChange={(e) => setSoftwareBulkAction(e.target.value)} aria-label="Bulk software action">
            <option value="">Bulk actions</option>
            <option value="approve">Bulk Approve</option>
            <option value="reject">Bulk Reject</option>
            <option value="archive">Bulk Archive</option>
          </select>
          <button type="button" onClick={onApplySoftwareBulkAction} disabled={!softwareBulkAction}>Apply</button>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSoftwareOnPageSelected}
                  onChange={(e) => onToggleAllSoftwareOnPage(e.target.checked)}
                  aria-label="Select all software on this page"
                />
              </th>
              <th>Software Name</th><th>Version</th><th>Owner</th><th>Upload Date</th><th>Status</th><th>Downloads</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {softwarePageRows.map((s) => (
              <tr key={s.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSoftwareIds.has(s.id)}
                    onChange={() => onToggleSoftwareSelect(s.id)}
                    aria-label={`Select ${s.name}`}
                  />
                </td>
                <td>{s.name}</td><td>{s.version}</td><td>{s.owner}</td><td>{toDate(s.uploadDate)}</td>
                <td>
                  <div className="adm-status-stack">
                    <Pill value={s.status} />
                    {s.virusFlagged && <span className="adm-virus-badge">Virus flagged</span>}
                  </div>
                </td>
                <td>{s.downloads}</td>
                <td>
                  <div className="adm-actions">
                    <button type="button" onClick={() => updateSoftware(s.id, 'Approved')}>Approve</button>
                    <button type="button" onClick={() => updateSoftware(s.id, 'Suspended')}>Suspend</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!permissions.destructiveActions) {
                          setFeedback({ variant: 'warning', title: 'Limited privilege', message: 'Reject/Archive actions require super admin privilege.' });
                          return;
                        }
                        setConfirm({ title: 'Reject package', message: `Reject ${s.name}?`, action: () => updateSoftware(s.id, 'Rejected') });
                      }}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!permissions.destructiveActions) {
                          setFeedback({ variant: 'warning', title: 'Limited privilege', message: 'Reject/Archive actions require super admin privilege.' });
                          return;
                        }
                        updateSoftware(s.id, 'Archived');
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-pagination">
        {Array.from({ length: softwareTotalPages }).map((_, index) => (
          <button
            key={`s-page-${index + 1}`}
            type="button"
            className={softwarePage === index + 1 ? 'active' : ''}
            onClick={() => setSoftwarePage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
