import { message } from 'antd';
import axios from 'axios';
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

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

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    console.log(
      `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        status: response.status,
        success: data?.success,
        message: data?.message,
      }
    );

    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      const errorMessage = data.message || '操作失败';

      if (
        (errorMessage.includes('登录') || errorMessage.includes('Token') || errorMessage.includes('认证')) &&
        !errorMessage.includes('微信') &&
        !window.location.pathname.includes('/login')
      ) {
        console.log('[API] 认证失败，跳转到登录页');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error(errorMessage));
      }

      message.error(errorMessage);
      return data;
    }

    return data;
  },
  error => {
    console.error('响应错误:', error);

    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        console.log('[API] 401错误，跳转到登录页');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
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
