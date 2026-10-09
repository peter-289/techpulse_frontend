/**
 * Canonical route paths.
 *
 * Single source of truth for every navigable route so that navigation,
 * redirects and the command palette never drift out of sync. Dynamic
 * segments are exposed through builder helpers.
 */
export const ROUTE_PATHS = {
  landing: '/',
  register: '/register',
  login: '/login',
  forgotPassword: '/forgot-password',
  checkEmail: '/check-email',
  passwordReset: '/password-reset/:token',
  emailVerification: '/email-verification',

  workspaceOverview: '/workspace/overview',
  workspaceSoftwares: '/workspace/softwares',
  workspaceDiscover: '/workspace/discover',
  workspaceUploadSoftware: '/workspace/upload-software',
  workspaceVersions: '/workspace/versions',
  workspaceArtifacts: '/workspace/artifacts',
  workspaceSecurity: '/workspace/security',
  workspaceAudit: '/workspace/audit',
  workspaceAnalytics: '/workspace/analytics',
  workspaceSettings: '/workspace/settings',
  workspacePlans: '/workspace/plans',
  workspaceCheckout: '/workspace/checkout',
  workspaceAdmin: '/workspace/admin',

  /** Deep-linkable dynamic routes. */
  softwareDetails: '/workspace/software/:softwareId',
  softwareVersionDetails: '/workspace/software/:softwareId/versions/:version',

  /** Legacy state-carrying routes (kept for backwards compatibility). */
  legacySoftwareDetails: '/workspace/software-details',
  legacyVersionDetails: '/workspace/version-details',
} as const;

export function passwordResetPath(token: string): string {
  return `/password-reset/${encodeURIComponent(token)}`;
}

export function emailVerificationPath(token?: string): string {
  return token ? `${ROUTE_PATHS.emailVerification}?token=${encodeURIComponent(token)}` : ROUTE_PATHS.emailVerification;
}

export function softwareDetailsPath(softwareId: string | number): string {
  return `/workspace/software/${encodeURIComponent(String(softwareId))}`;
}

export function softwareVersionDetailsPath(softwareId: string | number, version: string): string {
  return `/workspace/software/${encodeURIComponent(String(softwareId))}/versions/${encodeURIComponent(version)}`;
}
