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
        return response.data
    },
    (error) => {
        console.error('响应错误:', error)
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
