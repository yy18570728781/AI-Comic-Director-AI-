import request from './request'

/**
 * 创建剧本
 */
export function createScript(data: {
    title: string
    content: string
    style?: string
    description?: string
    userId?: number
    teamId?: number
}) {
    return request({
        url: '/api/script/create',
        method: 'post',
        data,
    })
}

/**
 * 获取剧本列表
 */
export function getScriptList(params: {
    userId?: number
    teamId?: number
    page?: number
    pageSize?: number
    keyword?: string
}) {
    return request({
        url: '/api/script/list',
        method: 'get',
        params,
    })
}

/**
 * 获取剧本详情
 */
export function getScriptDetail(id: number) {
    return request({
        url: `/api/script/${id}`,
        method: 'get',
    })
}

/**
 * 更新剧本
 */
export function updateScript(id: number, data: any) {
    return request({
        url: `/api/script/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 删除剧本
 */
export function deleteScript(id: number) {
    return request({
        url: `/api/script/${id}`,
        method: 'delete',
    })
}

/**
 * 生成分镜脚本
 */
export function generateStoryboard(id: number, data: {
    provider?: string
    shotCount?: number
}) {
    return request({
        url: `/api/script/${id}/storyboard`,
        method: 'post',
        data,
        timeout: 300000, // 5 分钟超时，因为生成分镜需要较长时间
    })
}

/**
 * 更新分镜
 */
export function updateShot(shotId: number, data: any) {
    return request({
        url: `/api/script/shot/${shotId}`,
        method: 'put',
        data,
    })
}

/**
 * 删除分镜
 */
export function deleteShot(shotId: number) {
    return request({
        url: `/api/script/shot/${shotId}`,
        method: 'delete',
    })
}

/**
 * 批量更新分镜排序
 */
export function updateShotOrder(shots: Array<{ id: number; sortOrder: number }>) {
    return request({
        url: '/api/script/shot/order',
        method: 'post',
        data: { shots },
    })
}
