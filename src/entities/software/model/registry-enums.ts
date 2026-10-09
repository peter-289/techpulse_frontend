export const SoftwareStatus = Object.freeze({
  ACTIVE: 'Active',
  PRIVATE: 'Private',
  SUSPENDED: 'Suspended',
});

export const VersionStatus = Object.freeze({
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  DEPRECATED: 'Deprecated',
  REVOKED: 'Revoked',
});

export const SubscriptionTier = Object.freeze({
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
});

export const TIER_LABELS = Object.freeze({
  [SubscriptionTier.FREE]: 'Free',
  [SubscriptionTier.STARTER]: 'Starter',
  [SubscriptionTier.PRO]: 'Pro',
  [SubscriptionTier.ENTERPRISE]: 'Enterprise',
});

export const TIER_RANK = Object.freeze({
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.STARTER]: 1,
  [SubscriptionTier.PRO]: 2,
  [SubscriptionTier.ENTERPRISE]: 3,
});
