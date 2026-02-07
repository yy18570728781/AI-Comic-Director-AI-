import { message } from 'antd'
import axios from 'axios'
import type { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001'

/**
 * 统一 API 响应类型
 */
export interface ApiResponse<T = any> {
    success: boolean
    data: T
    message?: string
    code?: number
}

const service = axios.create({
    baseURL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const data = response.data

        // 调试日志
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            success: data?.success,
            message: data?.message
        });

        // 检查业务错误（success: false）
        if (data && typeof data === 'object' && 'success' in data && data.success === false) {
            const errorMessage = data.message || '操作失败'

            // 如果是认证相关错误，跳转到登录页（排除微信绑定提示，且不在登录页时才跳转）
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

            message.error(errorMessage)
            // 返回数据，让调用方可以处理
            return data
        }

        return data
    },
    (error) => {
        console.error('响应错误:', error)

        // 处理HTTP状态码错误
        if (error.response?.status === 401) {
            message.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            // 只有不在登录页时才跳转
            if (!window.location.pathname.includes('/login')) {
                console.log('[API] 401错误，跳转到登录页');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        const errorMessage = error.response?.data?.message || error.message || '网络错误'
        message.error(errorMessage)
        return Promise.reject(error)
    }
)

// 导出类型安全的请求方法
export const request = <T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service(config)
}

export const get = <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
    return service.get(url, { params })
}

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.post(url, data, config)
}

export const put = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return service.put(url, data)
}

export const del = <T = any>(url: string): Promise<ApiResponse<T>> => {
    return service.delete(url)
}

export default service
