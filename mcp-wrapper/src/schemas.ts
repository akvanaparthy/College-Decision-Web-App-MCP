import { z } from 'zod';

// ─── Shared enums ────────────────────────────────────────────────────────────

export const OwnershipSchema = z.enum([
  'public',
  'private_nonprofit',
  'private_for_profit',
  'unknown',
]);
export type Ownership = z.infer<typeof OwnershipSchema>;

export const SizeBucketSchema = z.enum(['small', 'medium', 'large']);
export type SizeBucket = z.infer<typeof SizeBucketSchema>;

const StateCodeSchema = z
  .string()
  .length(2, '2-letter state code (e.g., CA)')
  .transform((s) => s.toUpperCase());

const SOURCE = 'U.S. Department of Education College Scorecard';

// ─── Output shapes ───────────────────────────────────────────────────────────

export const SchoolSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  ownership: OwnershipSchema,
  size: z.number().int().nullable(),
  net_price_year: z.number().nullable(),
  admission_rate: z.number().nullable(),
  grad_rate: z.number().nullable(),
  url: z.string().nullable(),
});
export type SchoolSummary = z.infer<typeof SchoolSummarySchema>;

export const SchoolProfileSchema = SchoolSummarySchema.extend({
  tuition_in_state: z.number().nullable(),
  tuition_out_of_state: z.number().nullable(),
  median_earnings_10yr: z.number().nullable(),
  median_debt: z.number().nullable(),
  source: z.literal(SOURCE),
});
export type SchoolProfile = z.infer<typeof SchoolProfileSchema>;

export const ComparisonRowSchema = z.object({
  metric: z.string(),
  values: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
});
export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

// `total_matching` is the upstream total (could be thousands).
// `returned` is the actual length of `schools` (capped by `limit`).
// Distinct fields prevent the agent from reporting "1247 schools" while
// only seeing 10.
export const SchoolListResultSchema = z.object({
  schools: z.array(SchoolSummarySchema),
  total_matching: z.number().int().nonnegative(),
  returned: z.number().int().nonnegative(),
  applied_filters: z.record(z.string(), z.unknown()),
  source: z.literal(SOURCE),
});
export type SchoolListResult = z.infer<typeof SchoolListResultSchema>;

export const ComparisonFailureSchema = z.object({
  school_id: z.number().int(),
  reason: z.string(),
});
export type ComparisonFailure = z.infer<typeof ComparisonFailureSchema>;

export const ComparisonResultSchema = z.object({
  schools: z.array(SchoolProfileSchema),
  rows: z.array(ComparisonRowSchema),
  failures: z.array(ComparisonFailureSchema),
  source: z.literal(SOURCE),
});
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

// ─── Input shapes ────────────────────────────────────────────────────────────

export const SearchSchoolsInputSchema = z.object({
  query: z.string().min(1).max(120),
  state: StateCodeSchema.optional(),
  size: SizeBucketSchema.optional(),
  limit: z.number().int().min(1).max(20).default(10),
});
export type SearchSchoolsInput = z.infer<typeof SearchSchoolsInputSchema>;

export const GetSchoolProfileInputSchema = z.object({
  school_id: z.number().int().positive(),
});
export type GetSchoolProfileInput = z.infer<typeof GetSchoolProfileInputSchema>;

export const CompareSchoolsInputSchema = z.object({
  school_ids: z
    .array(z.number().int().positive())
    .min(2)
    .max(4)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'school_ids must be unique',
    }),
});
export type CompareSchoolsInput = z.infer<typeof CompareSchoolsInputSchema>;

export const FindByCriteriaInputSchema = z
  .object({
    state: StateCodeSchema.optional(),
    max_net_price: z.number().int().nonnegative().optional(),
    min_grad_rate: z.number().min(0).max(1).optional(),
    size: SizeBucketSchema.optional(),
    ownership: z
      .enum(['public', 'private_nonprofit', 'private_for_profit'])
      .optional(),
    // Degree-type filter ensures "find me a college" queries surface recognized
    // 4-year institutions instead of trade schools or adult-education programs.
    // Maps to Scorecard's school.degrees_awarded.predominant (1..4).
    degree_type: z
      .enum(['certificate', 'associate', 'bachelor', 'graduate'])
      .optional(),
    limit: z.number().int().min(1).max(20).default(10),
  })
  .refine(
    (d) =>
      d.state !== undefined ||
      d.max_net_price !== undefined ||
      d.min_grad_rate !== undefined ||
      d.size !== undefined ||
      d.ownership !== undefined ||
      d.degree_type !== undefined,
    {
      message:
        'Provide at least one filter: state, max_net_price, min_grad_rate, size, ownership, or degree_type.',
    }
  );
export type FindByCriteriaInput = z.infer<typeof FindByCriteriaInputSchema>;

export const SOURCE_LITERAL = SOURCE;
