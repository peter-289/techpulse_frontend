import {
  BarChart3,
  Boxes,
  Compass,
  FolderKanban,
  Gauge,
  GitBranch,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareTerminal,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';

/**
 * Canonical workspace navigation.
 *
 * This module is the single source of truth for every workspace navigation
 * surface: the sidebar, the command palette and any contextual links.
 * The Upload Software navigation structure is the reference implementation —
 * every other page consumes these definitions instead of defining its own.
 */

export type WorkspaceNavAction = 'help';

export type WorkspaceNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route this item links to. Items without `to` use `action` instead. */
  to?: string;
  /** Non-route behaviour (e.g. opening the Help Centre drawer). */
  action?: WorkspaceNavAction;
  /** Extra routes where this item should render as active. */
  activePaths?: string[];
  /** Only rendered for admin sessions. */
  adminOnly?: boolean;
};

export type WorkspaceNavSection = {
  id: string;
  title: string;
  items: WorkspaceNavItem[];
};

export const workspaceNavigation: WorkspaceNavSection[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Gauge,
        to: '/workspace/overview',
        activePaths: ['/workspace'],
      },
      {
        id: 'upload-software',
        label: 'Upload Software',
        icon: UploadCloud,
        to: '/workspace/upload-software',
      },
      {
        id: 'my-software',
        label: 'My Software',
        icon: FolderKanban,
        to: '/workspace/softwares',
        activePaths: [
          '/workspace/software-details',
          '/workspace/checkout',
          '/workspace/plans',
          '/workspace/software',
        ],
      },
      {
        id: 'discover',
        label: 'Discover',
        icon: Compass,
        to: '/workspace/discover',
      },
    ],
  },
  {
    id: 'distribution',
    title: 'Distribution',
    items: [
      {
        id: 'versions',
        label: 'Versions',
        icon: GitBranch,
        to: '/workspace/versions',
        activePaths: ['/workspace/version-details'],
      },
      {
        id: 'artifacts',
        label: 'Artifacts',
        icon: Boxes,
        to: '/workspace/artifacts',
      },
    ],
  },
  {
    id: 'assurance',
    title: 'Assurance',
    items: [
      {
        id: 'security',
        label: 'Security',
        icon: ShieldCheck,
        to: '/workspace/security',
      },
      {
        id: 'audit',
        label: 'Audit',
        icon: ScrollText,
        to: '/workspace/audit',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        to: '/workspace/analytics',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        to: '/workspace/settings',
      },
      {
        id: 'help',
        label: 'Help Centre',
        icon: LifeBuoy,
        action: 'help',
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      {
        id: 'admin',
        label: 'Admin Console',
        icon: SquareTerminal,
        to: '/workspace/admin',
        adminOnly: true,
      },
    ],
  },
];

/** Flat list of every navigable item (used by the command palette). */
export const workspaceNavItems: WorkspaceNavItem[] = workspaceNavigation.flatMap(
  (section) => section.items,
);

export function isNavItemActive(item: WorkspaceNavItem, pathname: string): boolean {
  if (!item.to) return false;
  if (pathname === item.to) return true;
  return (item.activePaths ?? []).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Breadcrumb/contextual labels shown in the global workspace header. */
const pageTitles: Record<string, { section: string; title: string }> = {
  '/workspace': { section: 'Workspace', title: 'Overview' },
  '/workspace/overview': { section: 'Workspace', title: 'Overview' },
  '/workspace/upload-software': { section: 'Workspace', title: 'Upload Software' },
  '/workspace/softwares': { section: 'Workspace', title: 'My Software' },
  '/workspace/discover': { section: 'Workspace', title: 'Discover' },
  '/workspace/software-details': { section: 'Workspace', title: 'Software Details' },
  '/workspace/checkout': { section: 'Workspace', title: 'Checkout' },
  '/workspace/plans': { section: 'Workspace', title: 'Plans' },
  '/workspace/versions': { section: 'Distribution', title: 'Versions' },
  '/workspace/version-details': { section: 'Distribution', title: 'Version Details' },
  '/workspace/artifacts': { section: 'Distribution', title: 'Artifacts' },
  '/workspace/security': { section: 'Assurance', title: 'Security Center' },
  '/workspace/audit': { section: 'Assurance', title: 'Audit Center' },
  '/workspace/analytics': { section: 'Assurance', title: 'Analytics' },
  '/workspace/settings': { section: 'Account', title: 'Settings' },
  '/workspace/admin': { section: 'Administration', title: 'Admin Console' },
};

export function getPageContext(pathname: string): { section: string; title: string } {
  const exact = pageTitles[pathname];
  if (exact) return exact;

  if (/^\/workspace\/software\/[^/]+\/versions\/[^/]+/.test(pathname)) {
    return { section: 'Distribution', title: 'Version Details' };
  }
  if (/^\/workspace\/software\/[^/]+/.test(pathname)) {
    return { section: 'Workspace', title: 'Software Details' };
  }

  let best: string | undefined;
  let bestLength = 0;
  for (const path of Object.keys(pageTitles)) {
    if (path !== '/workspace' && pathname.startsWith(`${path}/`) && path.length > bestLength) {
      best = path;
      bestLength = path.length;
    }
  }
  if (best) return pageTitles[best]!;

  return { section: 'Workspace', title: 'Overview' };
}
