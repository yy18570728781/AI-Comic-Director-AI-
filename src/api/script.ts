import { request } from './request'

/**
 * 创建剧本
 */
export function createScript(data: {
    title: string
    content: string
    style?: string
    description?: string
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

/**
 * 从剧本提取角色信息
 */
export function extractCharacters(scriptId: number) {
    return request({
        url: '/api/character-library/extract',
        method: 'post',
        data: { scriptId },
        timeout: 60000, // 1分钟超时，AI分析需要时间
    })
}

/**
 * 批量保存角色到角色库
 */
export function batchSaveCharacters(characters: any[], userId: number) {
    return request({
        url: '/api/character-library/batch-save',
        method: 'post',
        data: { characters, userId },
    })
}

/**
 * 获取角色列表
 */
export function getCharacterList(params: {
    userId?: number;
    page?: number;
    pageSize?: number;
    keyword?: string;
}) {
    return request({
        url: '/api/character-library/list',
        method: 'get',
        params,
    })
}

/**
 * 获取角色详情
 */
export function getCharacterDetail(id: number) {
    return request({
        url: `/api/character-library/${id}`,
        method: 'get',
    })
}
