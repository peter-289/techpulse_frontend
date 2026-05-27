import React from 'react';

export default function SkeletonDashboard() {
  return (
    <section className="adm-grid" aria-label="Loading dashboard" aria-busy="true">
      {Array.from({ length: 6 }).map((_, idx) => (
        <article key={`skeleton-card-${idx}`} className="adm-panel">
          <div className="adm-skeleton adm-skeleton-title" />
          <div className="adm-skeleton adm-skeleton-value" />
          <div className="adm-skeleton adm-skeleton-line" />
        </article>
      ))}
      <article className="adm-panel adm-wide">
        <div className="adm-skeleton adm-skeleton-title" />
        <div className="adm-skeleton adm-skeleton-row" />
        <div className="adm-skeleton adm-skeleton-row" />
        <div className="adm-skeleton adm-skeleton-row" />
      </article>
    </section>
  );
}
