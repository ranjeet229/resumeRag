import { BaseService } from './base.service';

// Job types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'manager';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'active' | 'closed';
  postedBy: string;
  postedDate: string;
  expiryDate?: string;
}

class JobService extends BaseService<Job> {
  constructor() {
    super('/jobs');
  }

  async search(query: string) {
    const response = await this.client.post(`${this.endpoint}/search`, { query });
    return response.data;
  }

  async findMatches(jobId: string, limit?: number) {
    const response = await this.client.get(`${this.endpoint}/${jobId}/matches`, {
      params: { limit },
    });
    return response.data;
  }

  async updateStatus(jobId: string, status: Job['status']) {
    const response = await this.client.patch(
      `${this.endpoint}/${jobId}/status`,
      { status }
    );
    return response.data;
  }
}

export const jobService = new JobService();