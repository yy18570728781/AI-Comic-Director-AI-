import { request } from './request';
import type { ApiResponse } from './request';

/**
 * 创建用户
 */
export function createUser(data: {
  username: string;
  password: string;
  email?: string;
  avatar?: string;
  role?: 'user' | 'admin';
}): Promise<ApiResponse> {
  return request({
    url: '/api/user/create',
    method: 'POST',
    data,
  });
}

/**
 * 获取用户详情
 */
export function getUserDetail(id: number): Promise<ApiResponse> {
  return request({
    url: `/api/user/${id}`,
    method: 'GET',
  });
}

/**
 * 获取用户列表
 */
export function getUserList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<ApiResponse> {
  return request({
    url: '/api/user/list',
    method: 'GET',
    params,
  });
}

/**
 * 确保默认用户存在
 */
export function ensureDefaultUser(): Promise<ApiResponse> {
  return request({
    url: '/api/user/ensure-default',
    method: 'POST',
  });
}

/**
 * 获取用户积分余额
 */
export function getUserPoints(userId: number): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/points`,
    method: 'GET',
  });
}

/**
 * 获取用户积分流水
 */
export function getPointRecords(userId: number, params?: { page?: number; pageSize?: number }): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/point-records`,
    method: 'GET',
    params,
  });
}

/**
 * 充值积分
 */
export function rechargePoints(userId: number, points: number, bonus?: number): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/recharge`,
    method: 'POST',
    data: { points, bonus },
  });
}
