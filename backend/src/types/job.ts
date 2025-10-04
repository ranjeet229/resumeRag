export interface IJob {
  _id?: string;
  userId: string;         // Recruiter who posted the job
  title: string;
  company: string;
  location: string;
  type: JobType;         // Full-time, Part-time, Contract, etc.
  description: string;
  requirements: {
    skills: string[];
    experience: number;   // Years of experience
    education: string[];
    other: string[];
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: JobStatus;
  applicants?: string[]; // Array of Resume IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export type JobDocument = IJob;