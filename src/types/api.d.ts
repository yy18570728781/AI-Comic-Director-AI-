/**
 * API 响应类型定义
 */

/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

/**
 * 分页响应
 */
export interface PageResponse<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 任务响应
 */
export interface TaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: Array<{
    url: string;
    seed?: number;
  }>;
  videos?: Array<{
    url: string;
  }>;
  error?: string;
  progress?: number;
}
