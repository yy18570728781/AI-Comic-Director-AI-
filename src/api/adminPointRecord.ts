import { request } from './request';
import type { ApiResponse } from './request';

export interface AdminPointRecordUser {
  id: number;
  username?: string;
  email?: string;
}

export interface AdminPointRecord {
  id: number;
  userId: number;
  type: 'recharge' | 'consume' | 'gift' | 'refund';
  amount: number;
  balance: number;
  taskType?: 'text' | 'image' | 'video';
  taskId?: string;
  modelId?: string;
  businessType?: string;
  requestSnapshot?: Record<string, any>;
  source?: string;
  operatorUserId?: number;
  relatedOrderNo?: string;
  remark?: string;
  createdAt: string;
  user?: AdminPointRecordUser;
}

export interface AdminPointRecordQuery {
  userId?: number;
  type?: string;
  taskType?: string;
  businessType?: string;
  source?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPointRecordListResponse {
  records: AdminPointRecord[];
  total: number;
}

/**
 * 管理后台获取积分流水列表
 */
export function getAdminPointRecords(
  params: AdminPointRecordQuery
): Promise<ApiResponse<AdminPointRecordListResponse>> {
  return request({
    url: '/api/admin/point-records',
    method: 'GET',
    params,
  });
}
