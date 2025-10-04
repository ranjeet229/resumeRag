import { BaseService } from './base.service';

// Resume types
interface Resume {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    startDate: string;
    endDate?: string;
  }[];
  metadata: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    uploadDate: string;
  };
}

class ResumeService extends BaseService<Resume> {
  constructor() {
    super('/resumes');
  }

  async search(query: string) {
    const response = await this.client.post(`${this.endpoint}/search`, { query });
    return response.data;
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(
      `${this.endpoint}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async uploadBulk(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await this.client.post(
      `${this.endpoint}/bulk`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export const resumeService = new ResumeService();