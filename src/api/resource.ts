import { request } from './request'

/**
 * 创建资源（Resource 实体 - 统一资源库）
 */
export function createResource(data: {
    name: string
    type: 'character' | 'scene' | 'prop' | 'blend'
    description?: string
    prompt?: string
    scriptId?: number | null // 关联的剧本ID，null 表示全局资源
    userId?: number
    referenceImages?: string[]
    tags?: string[]
    metadata?: any
}) {
    return request({
        url: '/api/resource/create',
        method: 'post',
        data,
    })
}

/**
 * 更新角色
 */
export function updateCharacter(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 更新场景
 */
export function updateScene(id: number, data: any) {
    return request({
        url: `/api/resource/scene/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 生成角色图像
 */
export function generateCharacterImage(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}/image`,
        method: 'post',
        data,
    })
}

/**
 * 生成场景图像
 */
export function generateSceneImage(id: number, data: any) {
    return request({
        url: `/api/resource/scene/${id}/image`,
        method: 'post',
        data,
    })
}

/**
 * 生成单角色视频
 */
export function generateCharacterVideo(id: number, data: any) {
    return request({
        url: `/api/resource/character/${id}/video`,
        method: 'post',
        data,
    })
}

/**
 * 保存到资源库（Resource 实体 - 统一资源库）
 */
export function saveToLibrary(data: {
    name: string
    type: 'character' | 'scene' | 'prop' | 'blend'
    url: string
    description?: string
    prompt?: string
    scriptId?: number | null // 关联的剧本ID，null 表示全局资源
    userId?: number
    referenceImages?: string[]
    tags?: string[]
    metadata?: any
}) {
    return request({
        url: '/api/resource/library/save',
        method: 'post',
        data,
    })
}

/**
 * 获取资源列表（剧本/分镜资源库）
 */
export function getResourceList(params: {
    scriptId?: number | null
    type?: 'character' | 'scene' | 'prop' | 'blend'
    mediaType?: 'image' | 'video'
    tags?: string[]
    page?: number
    pageSize?: number
    keyword?: string
}) {
    return request({
        url: '/api/resource/list',
        method: 'get',
        params: {
            ...params,
            scriptId: params.scriptId === null ? 'null' : params.scriptId,
            tags: params.tags?.join(','),
        },
    })
}

/**
 * 删除资源（Resource 实体 - 统一资源库）
 */
export function deleteResource(id: number) {
    return request({
        url: `/api/resource/${id}`,
        method: 'delete',
    })
}
