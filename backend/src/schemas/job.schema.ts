import { z } from 'zod';
import { JobType, JobStatus } from '../types/job';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    company: z.string().min(2).max(100),
    location: z.string().min(2).max(100),
    type: z.nativeEnum(JobType),
    description: z.string().min(50),
    requirements: z.object({
      skills: z.array(z.string()).min(1),
      experience: z.number().min(0),
      education: z.array(z.string()).min(1),
      other: z.array(z.string()).optional(),
    }),
    salary: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default('USD'),
    }).optional(),
  }),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

export const updateJobSchema = z.object({
  body: createJobSchema.shape.body.partial(),
  query: z.object({}).strict(),
  params: z.object({
    id: z.string(),
  }),
});

export const searchJobSchema = z.object({
  body: z.object({
    query: z.string(),
    filters: z.object({
      type: z.nativeEnum(JobType).optional(),
      status: z.nativeEnum(JobStatus).optional(),
      company: z.string().optional(),
      location: z.string().optional(),
      minExperience: z.number().min(0).optional(),
      maxExperience: z.number().min(0).optional(),
      skills: z.array(z.string()).optional(),
    }).optional(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
  params: z.object({}).strict(),
});