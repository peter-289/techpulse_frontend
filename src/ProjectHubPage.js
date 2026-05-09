import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import './ProjectHubPage.css';
import FeedbackMessage from './components/FeedbackMessage';
import useSoftwareRegistry from './hooks/useSoftwareRegistry';
import { SubscriptionTier, TIER_LABELS, TIER_RANK, VersionStatus } from './constants/registryEnums';
import { errorMessageFrom, notifyToast } from './toastBus';

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
  const seeded = String(id || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 13 + 37;
  return (seeded / 10).toFixed(1);
}

function formatMoney(cents, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  if (amount <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function userIdOf(user) {
  return user?.id ?? user?.user_id ?? user?.sub ?? null;
}

export default function ProjectHubPage({
  user,
  onNavigate,
  onLogout,
  activePage = 'projects',
  onOpenSoftware,
  onNavigatePlans,
  onCheckoutProject,
  purchasedProjectIds = [],
}) {
  const [projects, setProjects] = useState([]);
  const [versionsById, setVersionsById] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [licenseFilter, setLicenseFilter] = useState('All licenses');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  const { fetchSoftwareList, fetchSoftwareVersions, downloadVersion } = useSoftwareRegistry();
  const currentUserId = userIdOf(user);
  const purchasedSet = useMemo(() => new Set(purchasedProjectIds.map(String)), [purchasedProjectIds]);

  const subscriptionTier = useMemo(() => {
    const tier = String(user?.subscription_tier || user?.plan || user?.tier || '').toLowerCase();
    if (Object.values(SubscriptionTier).includes(tier)) return tier;
    const role = String(user?.role || '').toLowerCase();
    if (role === 'admin') return SubscriptionTier.ENTERPRISE;
    if (role === 'subscriber') return SubscriptionTier.PRO;
    return SubscriptionTier.FREE;
  }, [user]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const items = await fetchSoftwareList(120);
        setProjects(items);

        const versionEntries = await Promise.all(
          items.map(async (pkg) => {
            try {
              const versions = await fetchSoftwareVersions(pkg.id, 1);
              return [pkg.id, versions[0] || null];
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
  }, [fetchSoftwareList, fetchSoftwareVersions]);

  const normalizedProjects = useMemo(
    () =>
      projects.map((pkg) => {
        const latestVersion = versionsById[pkg.id] || null;
        const category = toCategory(pkg.category);
        const license = inferLicense(pkg);
        const downloads = Number(latestVersion?.download_count || 0);
        const createdAt = pkg.created_at ? new Date(pkg.created_at).getTime() : 0;
        const ownerLabel = String(pkg.owner_id) === String(currentUserId) ? 'You' : `Developer ${pkg.owner_id}`;
        const requiredTier = String(pkg.required_tier || pkg.visibility_tier || '').toLowerCase()
          || (pkg.is_public ? SubscriptionTier.FREE : SubscriptionTier.STARTER);
        const isOwner = String(pkg.owner_id) === String(currentUserId);
        const isPaid = Number(pkg.price_cents || 0) > 0;
        const hasAccess = isOwner || !isPaid || !!pkg.viewer_has_access || purchasedSet.has(String(pkg.id));
        const restrictedByPlan = !pkg.is_public
          && !isOwner
          && TIER_RANK[subscriptionTier] < (TIER_RANK[requiredTier] ?? TIER_RANK[SubscriptionTier.STARTER]);
        const status = latestVersion?.is_published ? VersionStatus.PUBLISHED : VersionStatus.DRAFT;

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
          requiredTier,
          isOwner,
          isPaid,
          hasAccess,
          priceLabel: formatMoney(pkg.price_cents, pkg.currency),
          status,
        };
      }),
    [projects, versionsById, subscriptionTier, currentUserId, purchasedSet]
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

  const groupedByCategory = useMemo(() => {
    const groups = {};
    visibleProjects.forEach((project) => {
      if (!groups[project.category]) groups[project.category] = [];
      groups[project.category].push(project);
    });
    return groups;
  }, [visibleProjects]);

  const handleDownload = async (project) => {
    const latestVersion = project.latestVersion;
    if (!latestVersion) return;
    setDownloadingId(project.id);
    try {
      await downloadVersion({
        softwareId: project.id,
        version: latestVersion.version,
        fileName: latestVersion.file_name,
      });
      notifyToast({
        variant: 'success',
        title: 'Download started',
        message: `${project.name} is downloading.`,
      });
    } catch (err) {
      notifyToast({
        variant: 'error',
        title: 'Download blocked',
        message: errorMessageFrom(err, 'Unable to download this project.'),
      });
    } finally {
      setDownloadingId('');
    }
  };

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
            <span className="ph-tier-pill">
              Plan: {TIER_LABELS[subscriptionTier] || 'Free'}
            </span>
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
          CATEGORY_ORDER.filter((category) => groupedByCategory[category]?.length).map((category) => (
            <section key={category} className="tp-span-12 ph-category-block">
              <div className="ph-category-head">
                <div>
                  <h2>{asTitle(category)}</h2>
                  <p>{groupedByCategory[category].length} package(s) available</p>
                </div>
                <span className="ph-category-pill">{category === 'others' ? 'General' : 'Curated'}</span>
              </div>

              <div className="ph-card-grid">
                {groupedByCategory[category].map((project) => {
                  const latestVersion = project.latestVersion;
                  const canDownload = !!latestVersion && !project.restrictedByPlan && project.is_public && project.hasAccess;
                  const canPurchase = project.isPaid && project.is_public && !project.isOwner && !project.hasAccess && !project.restrictedByPlan;
                  const tierLabel = TIER_LABELS[project.requiredTier] || 'Starter';
                  const isDownloading = downloadingId === project.id;

                  return (
                    <article key={project.id} className="tp-panel ph-card">
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
                          {project.is_public ? 'Public' : `Private - ${tierLabel}+`}
                        </span>
                        {!project.is_public && <span className="ph-lock">LOCK</span>}
                        <span className="ph-tag ph-status">{project.status}</span>
                        <span className="ph-tag">{project.priceLabel}</span>
                      </div>

                      <p className="ph-description">{project.description || 'No description provided.'}</p>

                      <div className="ph-stats">
                        <span>Downloads: {project.downloads}</span>
                        <span>Rating: {project.rating}</span>
                        <span>License: {project.license}</span>
                      </div>

                      <div className="ph-actions">
                        <button
                          type="button"
                          className="tp-btn tp-btn-secondary"
                          onClick={() => (onOpenSoftware ? onOpenSoftware(project) : onNavigate('projects'))}
                        >
                          {project.isOwner ? 'Manage' : 'View details'}
                        </button>
                        <button
                          type="button"
                          className={`tp-btn ${canDownload ? 'tp-btn-primary' : 'tp-btn-secondary'} ${!canDownload ? 'disabled' : ''}`}
                          aria-disabled={!canDownload}
                          disabled={isDownloading}
                          title={!canDownload ? (canPurchase ? 'Purchase required' : `Requires ${tierLabel}+`) : 'Download latest version'}
                          onClick={() => {
                            if (canDownload) {
                              handleDownload(project);
                            } else if (canPurchase && onCheckoutProject) {
                              onCheckoutProject(project);
                            } else if (onNavigatePlans) {
                              onNavigatePlans();
                            }
                          }}
                        >
                          {isDownloading ? 'Downloading...' : canDownload ? 'Download' : canPurchase ? `Buy ${project.priceLabel}` : `Upgrade to ${tierLabel}+`}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      </section>
    </DashboardLayout>
  );
}


