import { Schema, model } from 'mongoose';
import { IResume, ResumeDocument } from '../types/resume';

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    content: {
      raw: {
        type: String,
        required: true,
      },
      redacted: String,
      chunks: [String],
    },
    metadata: {
      name: String,
      email: String,
      phone: String,
      location: String,
      experience: Number,
      skills: [String],
      education: [{
        degree: String,
        institution: String,
        year: Number,
      }],
    },
    vectorIds: [String],
    processed: {
      type: Boolean,
      default: false,
    },
    error: String,
  },
  {
    timestamps: true,
  }
);

// Create text index for basic search
resumeSchema.index({ 
  'content.raw': 'text',
  'metadata.skills': 'text',
  'metadata.location': 'text',
});

// Index for user-based queries
resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = model<ResumeDocument>('Resume', resumeSchema);