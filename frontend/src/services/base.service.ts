import axiosInstance from './axios';

export interface ApiResponse<T> {
  data: T;
  message: string;
}

/**
 * Base service class with common CRUD operations
 */
export abstract class BaseService<T> {
  protected client;

  constructor(protected endpoint: string) {
    this.client = axiosInstance;
  }

  async getAll(): Promise<ApiResponse<T[]>> {
    const response = await this.client.get<ApiResponse<T[]>>(this.endpoint);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }
}