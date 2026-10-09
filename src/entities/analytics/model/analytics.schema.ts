import { z } from 'zod';

export const analyticsPointSchema = z.object({
  day: z.string(),
  label: z.string(),
  value: z.number(),
});

export const analyticsTopItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  downloads: z.number(),
});

export const analyticsSummarySchema = z.object({
  totalDownloads: z.number().default(0),
  activeSoftware: z.number().default(0),
  totalSoftware: z.number().default(0),
  avgScanSeconds: z.number().nullable().optional().default(null),
  series: z.array(analyticsPointSchema).default([]),
  topSoftware: z.array(analyticsTopItemSchema).default([]),
});

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type AnalyticsPoint = z.infer<typeof analyticsPointSchema>;
export type AnalyticsTopItem = z.infer<typeof analyticsTopItemSchema>;
