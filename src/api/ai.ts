import { request } from './request'

// AI 创作相关接口

/**
 * 生成小说
 */
export function generateNovel(data: {
    theme: string
    outline?: string
    provider?: string
    length?: number
}) {
    return request({
        url: '/api/ai/novel/generate',
        method: 'post',
        data,
    })
}

/**
 * 生成剧本
 */
export function generateScript(data: {
    novel: string
    provider?: string
    style?: string
}) {
    return request({
        url: '/api/ai/script/generate',
        method: 'post',
        data,
    })
}

/**
 * 生成分镜脚本
 */
export function generateStoryboard(data: {
    script: string
    provider?: string
    shotCount?: number
}) {
    return request({
        url: '/api/ai/storyboard/generate',
        method: 'post',
        data,
    })
}

/**
 * 提取角色和场景
 */
export function extractCharactersAndScenes(data: {
    script: string
    provider?: string
}) {
    return request({
        url: '/api/ai/extract/characters-scenes',
        method: 'post',
        data,
    })
}

/**
 * 优化图像提示词
 */
export function optimizeImagePrompt(data: {
    prompt: string
    style?: string
    provider?: string
}) {
    return request({
        url: '/api/ai/prompt/optimize/image',
        method: 'post',
        data,
    })
}

/**
 * 优化视频提示词
 */
export function optimizeVideoPrompt(data: {
    prompt: string
    duration?: number
    provider?: string
}) {
    return request({
        url: '/api/ai/prompt/optimize/video',
        method: 'post',
        data,
    })
}

/**
 * 生成图像
 */
export function generateImage(data: {
    prompt: string
    model?: string
    width?: number
    height?: number
    style?: string
    referenceImages?: string[]
    seed?: number
}) {
    return request({
        url: '/api/ai/image/generate',
        method: 'post',
        data,
    })
}

/**
 * 批量生成图像
 */
export function batchGenerateImages(data: { requests: any[] }) {
    return request({
        url: '/api/ai/image/batch-generate',
        method: 'post',
        data,
    })
}

/**
 * 生成视频
 */
export function generateVideo(data: {
    prompt: string
    model?: string
    duration?: number
    referenceImage?: string
    fps?: number
    resolution?: string
}) {
    return request({
        url: '/api/ai/video/generate',
        method: 'post',
        data,
    })
}

/**
 * 查询视频状态
 */
export function getVideoStatus(data: { taskId: string; model: string }) {
    return request({
        url: '/api/ai/video/status',
        method: 'post',
        data,
    })
}
