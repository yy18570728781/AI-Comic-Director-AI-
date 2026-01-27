import { message } from 'antd'
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

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

// 创建自定义的 axios 实例类型
interface CustomAxiosInstance extends AxiosInstance {
    <T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>>
    <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
}

const service = axios.create({
    baseURL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
}) as CustomAxiosInstance

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

// 导出便捷方法
export const request = service
export const get = service.get
export const post = service.post
export const put = service.put
export const del = service.delete

export default service
