import request from './request'

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
        timeout: 120000, // 2分钟超时
    })
}

/**
 * 查询图像生成状态
 */
export function getImageStatus(taskId: string) {
    return request({
        url: '/api/ai/image/status',
        method: 'post',
        data: { taskId },
    })
}

/**
 * 批量查询图像任务状态
 */
export function batchGetImageStatus(tasks: Array<{ taskId: string; shotId: number }>) {
    return request({
        url: '/api/ai/image/batch-status',
        method: 'post',
        data: { tasks },
    })
}

/**
 * 为分镜生成图像
 */
export function generateShotImage(shotId: number, data: {
    prompt?: string
    referenceImages?: string[]
}) {
    return request({
        url: `/api/shot/${shotId}/image`,
        method: 'post',
        data,
        timeout: 120000,
    })
}

/**
 * AI 优化图像提示词
 */
export function optimizeImagePrompt(prompt: string) {
    return request({
        url: '/api/ai/image/optimize-prompt',
        method: 'post',
        data: { prompt },
        timeout: 30000,
    })
}
