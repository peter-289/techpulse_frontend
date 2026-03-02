import React, { useEffect, useMemo, useState } from 'react';
import { authApi as api } from './API_Wrapper';
import DashboardLayout from './dashboard/DashboardLayout';
import './ResourcesPage.css';
import FeedbackMessage from './components/FeedbackMessage';

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function subscriptionFromRole(user) {
  return String(user?.role || '').toLowerCase() === 'admin' ? 'Enterprise' : 'Free';
}

function statCard(label, value, helper) {
  return { label, value, helper };
}

export default function ResourcesPage({ user, onNavigate, onLogout, activePage = 'resources' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [downloadsReceived, setDownloadsReceived] = useState(0);

  const userName = user?.full_name || user?.username || 'User';

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const previousLogin = window.localStorage.getItem('tp-last-login');
    window.localStorage.setItem('tp-last-login', nowIso);
    if (!previousLogin) {
      window.localStorage.setItem('tp-previous-login', nowIso);
      return;
    }
    window.localStorage.setItem('tp-previous-login', previousLogin);
  }, [user?.id]);

  const lastLoginLabel = useMemo(() => {
    const previous = window.localStorage.getItem('tp-previous-login');
    return formatDate(previous);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const [packagesRes, chatRes] = await Promise.all([
          api.get('/api/v1/software-packages', { params: { limit: 100 } }),
          api.get('/api/v1/support-chat/messages', { params: { limit: 100 } }),
        ]);
        const packageItems = packagesRes.data || [];
        setProjects(packageItems);
        setMessages(chatRes.data || []);

        const owned = packageItems.filter((pkg) => Number(pkg.owner_id) === Number(user?.id));
        const versionRows = await Promise.all(
          owned.map(async (pkg) => {
            try {
              const versionRes = await api.get(`/api/v1/software-packages/${pkg.id}/versions`, {
                params: { limit: 1 },
              });
              return versionRes.data || [];
            } catch {
              return [];
            }
          })
        );
        const totalDownloads = versionRows
          .flat()
          .reduce((sum, version) => sum + Number(version?.download_count || 0), 0);
        setDownloadsReceived(totalDownloads);
      } catch {
        setError('Could not load dashboard analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user?.id]);

  const myProjects = projects.filter((pkg) => Number(pkg.owner_id) === Number(user?.id));
  const privateProjects = myProjects.filter((pkg) => !pkg.is_public);

  const stats = [
    statCard('Projects uploaded', myProjects.length, 'Your owned packages'),
    statCard('Downloads received', downloadsReceived, 'Across latest project versions'),
    statCard('Private projects count', privateProjects.length, 'Visibility set to private'),
    statCard('AI usage count', messages.length, 'Support AI interactions'),
  ];

  const trendProjects = [...projects]
    .sort((a, b) => Number(b.download_count || 0) - Number(a.download_count || 0))
    .slice(0, 5);

  return (
    <DashboardLayout
      user={user}
      activePage={activePage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Dashboard"
      subtitle="Platform operations and activity overview"
    >
      <section className="tp-dashboard-grid">
        <article className="tp-panel tp-span-12 tp-landing-hero">
          <div>
            <h1>Welcome back, {userName}</h1>
            <p>Track software delivery, documentation usage, and AI support from one workspace.</p>
            <div className="tp-landing-meta">
              <span>Last login: {lastLoginLabel}</span>
              <span className="tp-subscription-badge">{subscriptionFromRole(user)} plan</span>
            </div>
          </div>
          <div className="tp-hero-actions">
            <button className="tp-btn tp-btn-primary" type="button" onClick={() => onNavigate('upload_project')}>
              Upload New Project
            </button>
            <button className="tp-btn tp-btn-secondary" type="button" onClick={() => onNavigate('developers')}>
              Open Developer Hub
            </button>
          </div>
        </article>

        {stats.map((item) => (
          <article key={item.label} className="tp-panel tp-span-3 tp-stat-card">
            <span>{item.label}</span>
            <strong>{loading ? '...' : item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}

        <article className="tp-panel tp-span-8">
          <div className="tp-section-head">
            <h2>Activity Feed</h2>
            <button className="tp-btn tp-btn-secondary" type="button" onClick={() => onNavigate('projects')}>
              View all projects
            </button>
          </div>
          {error && (
            <FeedbackMessage
              variant="error"
              title="Dashboard data unavailable"
              message={error}
              compact
            />
          )}
          {!error && trendProjects.length === 0 && !loading && <p className="tp-empty">No recent uploads yet.</p>}
          <div className="tp-feed-list">
            {trendProjects.map((project) => (
              <article key={project.id} className="tp-feed-item">
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.description}</p>
                </div>
                <div className="tp-feed-meta">
                  <span>{project.category}</span>
                  <span>{project.is_public ? 'Public' : 'Private'}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="tp-panel tp-span-4">
          <h2>Trust & Safety</h2>
          <div className="tp-safety-list">
            <div className="tp-safety-item">
              <strong>Virus scan</strong>
              <span className="tp-badge-ok">Enabled</span>
            </div>
            <div className="tp-safety-item">
              <strong>Verified developer</strong>
              <span className="tp-badge-muted">Preparation</span>
            </div>
            <div className="tp-safety-item">
              <strong>Report abuse</strong>
              <span className="tp-badge-muted">Available</span>
            </div>
          </div>
          <div className="tp-upgrade-card">
            <h3>Private distribution requires paid plan</h3>
            <p>Upgrade prompts and feature gating are wired and ready for billing integration.</p>
            <button className="tp-btn tp-btn-primary" type="button">Upgrade Plan</button>
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}
