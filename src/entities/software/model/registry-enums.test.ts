import { describe, expect, it } from 'vitest';
import { SubscriptionTier, TIER_LABELS, TIER_RANK, VersionStatus } from './registry-enums';

describe('registry enums', () => {
  it('exposes stable status values', () => {
    expect(VersionStatus.PUBLISHED).toBe('Published');
    expect(VersionStatus.DRAFT).toBe('Draft');
    expect(Object.isFrozen(VersionStatus)).toBe(true);
  });

  it('maps tiers to labels and ranks', () => {
    expect(TIER_LABELS[SubscriptionTier.PRO]).toBe('Pro');
    expect(TIER_RANK[SubscriptionTier.ENTERPRISE]).toBe(3);
    expect(TIER_RANK[SubscriptionTier.FREE]).toBe(0);
  });
});
