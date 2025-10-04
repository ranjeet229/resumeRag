import { z } from 'zod';

export const uploadResumeSchema = z.object({
  body: z.object({}).strict(), // File upload handled by multer
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

export const searchResumeSchema = z.object({
  body: z.object({
    query: z.string(),
    filters: z.object({
      skills: z.array(z.string()).optional(),
      experienceMin: z.number().min(0).optional(),
      experienceMax: z.number().min(0).optional(),
      location: z.string().optional(),
      education: z.array(z.string()).optional(),
    }).optional(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
  params: z.object({}).strict(),
});