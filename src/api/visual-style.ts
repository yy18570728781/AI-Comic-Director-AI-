import request from './request'

export interface VisualStyle {
    id: number
    name: string
    promptSuffix: string
    previewImage?: string
    previewImageThumbnail?: string
    isSystemStyle: boolean
    userId?: number
    enabled: boolean
    sortOrder: number
    tags?: string[]
    description?: string
    createdAt: string
    updatedAt: string
}

/**
 * 获取风格列表
 */
export function getVisualStyleList(params?: {
    userId?: number
    isSystemStyle?: boolean
    enabled?: boolean
    page?: number
    pageSize?: number
}) {
    return request({
        url: '/api/visual-style/list',
        method: 'get',
        params,
    })
}

/**
 * 获取风格详情
 */
export function getVisualStyleDetail(id: number) {
    return request({
        url: `/api/visual-style/${id}`,
        method: 'get',
    })
}

/**
 * 创建风格
 */
export function createVisualStyle(data: {
    name: string
    promptSuffix: string
    previewImage?: string
    userId?: number
    tags?: string[]
    description?: string
}) {
    return request({
        url: '/api/visual-style/create',
        method: 'post',
        data,
    })
}

/**
 * 更新风格
 */
export function updateVisualStyle(id: number, data: {
    name?: string
    promptSuffix?: string
    previewImage?: string
    enabled?: boolean
    tags?: string[]
    description?: string
    sortOrder?: number
}) {
    return request({
        url: `/api/visual-style/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 删除风格
 */
export function deleteVisualStyle(id: number, userId?: number) {
    return request({
        url: `/api/visual-style/${id}`,
        method: 'delete',
        params: { userId },
    })
}

/**
 * 初始化系统风格
 */
export function initSystemStyles() {
    return request({
        url: '/api/visual-style/init-system',
        method: 'post',
    })
}
