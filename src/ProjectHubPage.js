import React, { useEffect, useMemo, useState } from 'react';
import { authApi as api, API_BASE_URL } from './API_Wrapper';
import DashboardLayout from './dashboard/DashboardLayout';
import './ProjectHubPage.css';
import FeedbackMessage from './components/FeedbackMessage';

const CATEGORY_ORDER = [
  'networking software',
  'cracked applications',
  'school projects',
  'entertainment software',
  'developer tools',
  'security tools',
  'others',
];

const CATEGORY_ALIASES = {
  'cracked software': 'cracked applications',
  'student projects': 'school projects',
  'desktop applications': 'developer tools',
  'mobile application': 'entertainment software',
};

const LICENSE_TYPES = ['All licenses', 'MIT', 'Apache', 'GPL', 'Commercial', 'Unknown'];

function toCategory(input) {
  const value = String(input || '').trim().toLowerCase();
  if (CATEGORY_ORDER.includes(value)) return value;
  return CATEGORY_ALIASES[value] || 'others';
}

function asTitle(text) {
  return String(text || '')
    .split(' ')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function inferLicense(pkg) {
  const text = `${pkg.name || ''} ${pkg.description || ''}`.toLowerCase();
  if (text.includes('mit')) return 'MIT';
  if (text.includes('apache')) return 'Apache';
  if (text.includes('gpl')) return 'GPL';
  if (text.includes('commercial')) return 'Commercial';
  return 'Unknown';
}

function ratingFromId(id) {
  const seeded = (Number(id) % 13) + 37;
  return (seeded / 10).toFixed(1);
}

export default function ProjectHubPage({ user, onNavigate, onLogout, activePage = 'projects' }) {
  const [projects, setProjects] = useState([]);
  const [versionsById, setVersionsById] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [licenseFilter, setLicenseFilter] = useState('All licenses');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subscriptionTier = String(user?.role || '').toLowerCase() === 'admin' ? 'enterprise' : 'free';

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/v1/software-packages', { params: { limit: 120 } });
        const items = response.data || [];
        setProjects(items);

        const versionEntries = await Promise.all(
          items.map(async (pkg) => {
            try {
              const versionRes = await api.get(`/api/v1/software-packages/${pkg.id}/versions`, {
                params: { limit: 1 },
              });
              return [pkg.id, (versionRes.data || [])[0] || null];
            } catch {
              return [pkg.id, null];
            }
          })
        );
        setVersionsById(Object.fromEntries(versionEntries));
      } catch {
        setError('Unable to fetch projects right now.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const normalizedProjects = useMemo(
    () =>
      projects.map((pkg) => {
        const latestVersion = versionsById[pkg.id] || null;
        const category = toCategory(pkg.category);
        const license = inferLicense(pkg);
        const downloads = Number(latestVersion?.download_count || 0);
        const createdAt = pkg.created_at ? new Date(pkg.created_at).getTime() : 0;
        const ownerLabel = Number(pkg.owner_id) === Number(user?.id) ? 'You' : `Developer ${pkg.owner_id}`;
        const restrictedByPlan = !pkg.is_public && subscriptionTier === 'free' && Number(pkg.owner_id) !== Number(user?.id);

        return {
          ...pkg,
          latestVersion,
          category,
          license,
          downloads,
          createdAt,
          ownerLabel,
          restrictedByPlan,
          rating: ratingFromId(pkg.id),
        };
      }),
    [projects, versionsById, subscriptionTier, user?.id]
  );

  const visibleProjects = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    const filtered = normalizedProjects.filter((pkg) => {
      if (activeCategory !== 'all' && pkg.category !== activeCategory) return false;
      if (licenseFilter !== 'All licenses' && pkg.license !== licenseFilter) return false;
      if (!lowered) return true;
      return `${pkg.name} ${pkg.description}`.toLowerCase().includes(lowered);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
      return b.createdAt - a.createdAt;
    });
  }, [normalizedProjects, activeCategory, licenseFilter, query, sortBy]);

  const byCategory = useMemo(() => {
    const counts = { all: visibleProjects.length };
    CATEGORY_ORDER.forEach((category) => {
      counts[category] = normalizedProjects.filter((pkg) => pkg.category === category).length;
    });
    return counts;
  }, [visibleProjects.length, normalizedProjects]);

  return (
    <DashboardLayout
      user={user}
      activePage={activePage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="My Projects"
      subtitle="Software repository and distribution controls"
    >
      <section className="tp-dashboard-grid">
        <article className="tp-panel tp-span-12 ph-header-card">
          <div>
            <h1>Project Library</h1>
            <p>Browse all shared software, enforce visibility logic, and monitor package engagement.</p>
          </div>
          <div className="ph-header-actions">
            <button className="tp-btn tp-btn-primary" type="button" onClick={() => onNavigate('upload_project')}>
              Upload Project
            </button>
          </div>
        </article>

        <article className="tp-panel tp-span-12 ph-filter-row">
          <div className="ph-chip-scroll" role="tablist" aria-label="Project categories">
            <button
              type="button"
              className={`ph-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All ({byCategory.all || 0})
            </button>
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                type="button"
                className={`ph-chip ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {asTitle(category)} ({byCategory[category] || 0})
              </button>
            ))}
          </div>

          <div className="ph-filter-controls">
            <input
              className="ph-input"
              type="search"
              aria-label="Search projects"
              placeholder="Search by project name or description"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="ph-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Sort by newest</option>
              <option value="downloads">Sort by downloads</option>
              <option value="rating">Sort by rating</option>
            </select>
            <select
              className="ph-select"
              value={licenseFilter}
              onChange={(event) => setLicenseFilter(event.target.value)}
              aria-label="Filter by license"
            >
              {LICENSE_TYPES.map((license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              ))}
            </select>
          </div>
        </article>

        {loading && (
          <article className="tp-panel tp-span-12">
            <p>Loading projects...</p>
          </article>
        )}

        {!!error && (
          <article className="tp-panel tp-span-12">
            <FeedbackMessage variant="error" title="Project library error" message={error} />
          </article>
        )}

        {!loading && !error && visibleProjects.length === 0 && (
          <article className="tp-panel tp-span-12">
            <p>No projects match your current filters.</p>
          </article>
        )}

        {!loading &&
          !error &&
          visibleProjects.map((project) => {
            const latestVersion = project.latestVersion;
            const canDownload = !!latestVersion && !project.restrictedByPlan && project.is_public;
            const downloadHref = latestVersion
              ? `${API_BASE_URL || ''}/api/v1/software-packages/${project.id}/versions/${latestVersion.id}/download`
              : '#';

            return (
              <article key={project.id} className="tp-panel tp-span-4 ph-card">
                <header className="ph-card-top">
                  <span className="ph-thumb" aria-hidden="true">
                    {String(project.name || 'P').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>{project.name}</h3>
                    <p className="ph-meta">by {project.ownerLabel}</p>
                  </div>
                </header>

                <div className="ph-tags">
                  <span className="ph-tag">{asTitle(project.category)}</span>
                  <span className={`ph-tag ${project.is_public ? 'is-public' : 'is-private'}`}>
                    {project.is_public ? 'Public' : 'Private'}
                  </span>
                  {!project.is_public && <span className="ph-lock">??</span>}
                </div>

                <p className="ph-description">{project.description || 'No description provided.'}</p>

                <div className="ph-stats">
                  <span>Downloads: {project.downloads}</span>
                  <span>Rating: {project.rating}</span>
                  <span>License: {project.license}</span>
                </div>

                <div className="ph-actions">
                  <a
                    href={canDownload ? downloadHref : undefined}
                    className={`tp-btn ${canDownload ? 'tp-btn-primary' : 'tp-btn-secondary'} ${!canDownload ? 'disabled' : ''}`}
                    aria-disabled={!canDownload}
                    title={!canDownload ? 'Requires subscription' : 'Download latest version'}
                    onClick={(event) => {
                      if (!canDownload) event.preventDefault();
                    }}
                    target={canDownload ? '_blank' : undefined}
                    rel={canDownload ? 'noreferrer' : undefined}
                  >
                    {canDownload ? 'Download' : 'Requires subscription'}
                  </a>
                </div>
              </article>
            );
          })}
      </section>
    </DashboardLayout>
  );
}
