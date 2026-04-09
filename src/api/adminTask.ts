import { request } from './request';
import type { ApiResponse } from './request';

export interface AdminTaskUser {
  id: number;
  username?: string;
  email?: string;
}

export interface AdminTaskRecord {
  id: number;
  taskType: 'image' | 'video';
  bizType?: 'default' | 'ecommerce';
  userId?: number;
  scriptId?: number;
  shotId?: number;
  characterId?: number;
  jobId?: string;
  taskId?: string;
  model?: string;
  prompt?: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  errorMessage?: string;
  requestSnapshot?: Record<string, any>;
  resultSnapshot?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: AdminTaskUser;
}

export interface AdminTaskQuery {
  taskType?: 'image' | 'video';
  status?: 'processing' | 'completed' | 'failed';
  userId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminTaskListResponse {
  records: AdminTaskRecord[];
  total: number;
}

/**
 * 管理后台获取任务表列表。
 * 关键逻辑：后端已经把图片和视频任务聚合到一个接口，前端直接按统一结构消费即可。
 */
export function getAdminTasks(params: AdminTaskQuery): Promise<ApiResponse<AdminTaskListResponse>> {
  return request({
    url: '/api/admin/tasks',
    method: 'GET',
    params,
  });
}
