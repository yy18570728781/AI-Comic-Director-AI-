import { message } from 'antd';
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number | string;
}

const service = axios.create({
  baseURL,
  timeout: 240000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 统一清理前端本地登录态。
 * 为什么除了 token 还要清掉 user-storage：
 * 因为项目里把 currentUser 持久化到了 localStorage，
 * 如果只删 token，不删旧用户资料，页面恢复时仍可能继续拿旧 userId 发请求。
 */
const clearLocalAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user-storage');
};

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      success: data?.success,
      message: data?.message,
    });

    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      const errorMessage = data.message || '操作失败';

      // 兼容后端返回 200 + success:false 的鉴权失败场景。
      // 只要语义上已经明确是登录态问题，前端就按统一的过期流程处理。
      if (
        (errorMessage.includes('登录') ||
          errorMessage.includes('Token') ||
          errorMessage.includes('认证')) &&
        !errorMessage.includes('微信') &&
        !window.location.pathname.includes('/login')
      ) {
        console.log('[API] 认证失败，跳转到登录页');
        clearLocalAuthState();
        window.location.href = '/login';
        return Promise.reject(new Error(errorMessage));
      }

      message.error(errorMessage);
      return data;
    }

    return data;
  },
  (error) => {
    console.error('响应错误:', error);

    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录');
      // 401 说明登录态已经失效，前端应立即清缓存并跳登录页。
      clearLocalAuthState();
      if (!window.location.pathname.includes('/login')) {
        console.log('[API] 401 错误，跳转到登录页');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      // 403 只保留给“已登录但无权限”的场景，例如普通用户访问管理员接口。
      message.error(error.response?.data?.message || '没有权限访问');
      return Promise.reject(error);
    }

    const errorMessage = error.response?.data?.message || error.message || '网络错误';
    message.error(errorMessage);
    return Promise.reject(error);
  }
);

export const request = <T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return service(config);
};

export const get = <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
  return service.get(url, { params });
};

export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return service.post(url, data, config);
};

export const put = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return service.put(url, data);
};

export const del = <T = any>(url: string): Promise<ApiResponse<T>> => {
  return service.delete(url);
};

export default service;
