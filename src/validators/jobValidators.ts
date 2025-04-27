// src/validators/jobValidators.ts
import { z } from 'zod';

export const jobQuerySchema = z.object({
  lastPageMarker: z.string().optional(),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "pageSize must be between 1 and 100",
    }),
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  employmentType: z.string().optional(),
  domain: z.string().optional(),
  workplaceType: z.string().optional(),
});
