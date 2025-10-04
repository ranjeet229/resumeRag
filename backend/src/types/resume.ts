export interface IResume {
  _id?: string;
  userId: string;
  originalFileName: string;
  fileKey: string;          // Cloud storage key
  fileType: string;         // MIME type
  fileSize: number;
  content: {
    raw: string;           // Original parsed text
    redacted?: string;     // PII-redacted version
    chunks: string[];      // Text chunks for embeddings
  };
  metadata: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    experience?: number;
    skills: string[];
    education: {
      degree: string;
      institution: string;
      year: number;
    }[];
  };
  vectorIds: string[];     // IDs in vector database
  processed: boolean;      // Whether processing is complete
  error?: string;         // Any processing errors
  createdAt?: Date;
  updatedAt?: Date;
}

export type ResumeDocument = IResume;