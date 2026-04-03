import { request } from './request';
import type { ApiResponse } from './request';

/**
 * 前端用户角色枚举
 * 这里单独导出枚举，方便页面、store、权限组件统一引用。
 */
export enum UserRoleEnum {
  /** 普通用户，只能访问前台功能 */
  USER = 'user',
  /** 管理员，可以进入后台 */
  ADMIN = 'admin',
  /** 超级管理员，可以设置管理员 */
  SUPER_ADMIN = 'super_admin',
}

export type UserRole = `${UserRoleEnum}`;

export function createUser(data: {
  username: string;
  password: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
}): Promise<ApiResponse> {
  return request({
    url: '/api/user/create',
    method: 'POST',
    data,
  });
}

export function getUserDetail(id: number): Promise<ApiResponse> {
  return request({
    url: `/api/user/${id}`,
    method: 'GET',
  });
}

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

export function ensureDefaultUser(): Promise<ApiResponse> {
  return request({
    url: '/api/user/ensure-default',
    method: 'POST',
  });
}

export function getUserPoints(userId: number): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/points`,
    method: 'GET',
  });
}

export function getPointRecords(
  userId: number,
  params?: { page?: number; pageSize?: number }
): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/point-records`,
    method: 'GET',
    params,
  });
}

export function rechargePoints(
  userId: number,
  points: number,
  bonus?: number
): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/recharge`,
    method: 'POST',
    data: { points, bonus },
  });
}

export function updateUserRole(
  userId: number,
  role: Exclude<UserRole, UserRoleEnum.SUPER_ADMIN>
): Promise<ApiResponse> {
  return request({
    url: `/api/user/${userId}/role`,
    method: 'POST',
    data: { role },
  });
}
