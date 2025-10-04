import { Schema, model } from 'mongoose';
import { IJob, JobDocument, JobType, JobStatus } from '../types/job';

const jobSchema = new Schema<IJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      skills: {
        type: [String],
        required: true,
      },
      experience: {
        type: Number,
        required: true,
        min: 0,
      },
      education: {
        type: [String],
        required: true,
      },
      other: {
        type: [String],
        default: [],
      },
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
    },
    applicants: [{
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    }],
  },
  {
    timestamps: true,
  }
);

// Create text index for search
jobSchema.index({ 
  title: 'text',
  company: 'text',
  description: 'text',
  'requirements.skills': 'text',
  location: 'text',
});

// Index for status-based queries
jobSchema.index({ status: 1, createdAt: -1 });

// Index for recruiter-based queries
jobSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Job = model<JobDocument>('Job', jobSchema);