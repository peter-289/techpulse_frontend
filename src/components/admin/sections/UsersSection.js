import React from 'react';
import { Pill, toDate } from '../adminUtils';

export default function UsersSection({
  usersPageRows,
  userRole,
  setUserRole,
  userStatus,
  setUserStatus,
  userTotalPages,
  userPage,
  setUserPage,
  selectedUser,
  setSelectedUser,
  selectedUserIds,
  allUsersOnPageSelected,
  onToggleAllUsersOnPage,
  onToggleUserSelect,
  userBulkAction,
  setUserBulkAction,
  onApplyUserBulkAction,
  assignUserRole,
  updateUser,
  setConfirm,
  setFeedback,
}) {
  return (
    <section className="adm-panel">
      <div className="adm-section-head"><h2>User Management</h2></div>
      <div className="adm-filters">
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
          <option value="all">Role: all</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="developer">Developer</option><option value="viewer">Viewer</option>
        </select>
        <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)}>
          <option value="all">Status: all</option><option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
      </div>

      {selectedUserIds.size > 0 && (
        <div className="adm-bulk-bar">
          <strong>{selectedUserIds.size} selected</strong>
          <select value={userBulkAction} onChange={(e) => setUserBulkAction(e.target.value)} aria-label="Bulk user action">
            <option value="">Bulk actions</option>
            <option value="suspend">Bulk Suspend</option>
            <option value="activate">Bulk Activate</option>
            <option value="warn">Bulk Warn</option>
          </select>
          <button type="button" onClick={onApplyUserBulkAction} disabled={!userBulkAction}>Apply</button>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allUsersOnPageSelected}
                  onChange={(e) => onToggleAllUsersOnPage(e.target.checked)}
                  aria-label="Select all users on this page"
                />
              </th>
              <th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersPageRows.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(u.id)}
                    onChange={() => onToggleUserSelect(u.id)}
                    aria-label={`Select ${u.name}`}
                  />
                </td>
                <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td><Pill value={u.status} /></td><td>{toDate(u.lastActive)}</td>
                <td>
                  <div className="adm-actions">
                    <button type="button" onClick={() => setSelectedUser(u)}>View</button>
                    <button type="button" onClick={() => setFeedback({ variant: 'info', title: 'Notification sent', message: `Warning sent to ${u.email}.` })}>Warn</button>
                    <select
                      value={u.role}
                      aria-label={`Assign role for ${u.name}`}
                      onChange={(e) => assignUserRole(u.id, e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Developer">Developer</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    {u.status === 'Suspended'
                      ? <button type="button" onClick={() => updateUser(u.id, 'Active')}>Activate</button>
                      : <button type="button" onClick={() => setConfirm({ title: 'Suspend account', message: `Suspend ${u.name}?`, action: () => updateUser(u.id, 'Suspended') })}>Suspend</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-pagination">
        {Array.from({ length: userTotalPages }).map((_, index) => (
          <button
            key={`u-page-${index + 1}`}
            type="button"
            className={userPage === index + 1 ? 'active' : ''}
            onClick={() => setUserPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {selectedUser && <div className="adm-detail"><h3>{selectedUser.name}</h3><p>{selectedUser.email}</p><p>Login and activity history available for audit.</p><button type="button" onClick={() => setSelectedUser(null)}>Close</button></div>}
    </section>
  );
}
