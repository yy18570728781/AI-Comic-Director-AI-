import { request } from './request'

// 视频生成模式
export type VideoMode = 't2v' | 'i2v' | 'flf2v' | 'ref2v'

/**
 * 生成视频（同步）
 */
export function generateVideo(data: {
    prompt: string
    model?: string
    mode: VideoMode  // 必传！
    duration?: number
    referenceImages?: string[]
    resolution?: string
    aspectRatio?: string
}) {
    return request({
        url: '/api/ai/video/generate',
        method: 'post',
        data,
        timeout: 120000, // 2分钟超时
    })
}

/**
 * 异步生成视频（使用队列）
 * 立即返回 jobId，任务在后台队列中处理
 */
export function generateVideoAsync(data: {
    prompt: string
    model?: string
    mode: VideoMode  // 必传！
    duration?: number
    referenceImages?: string[]
    resolution?: string
    aspectRatio?: string
    shotId?: number
    scriptId?: number
}) {
    return request({
        url: '/api/ai/video/generate-async',
        method: 'post',
        data,
        timeout: 30000, // 30秒超时（立即返回）
    })
}

/**
 * 批量异步生成视频（使用队列）
 */
export function batchGenerateVideosAsync(data: {
    shots: Array<{
        id: number
        imageUrl: string
        lastImageUrl?: string  // 首尾帧模式的尾帧图
        mode: VideoMode  // 必传！
        model?: string
        params?: any
    }>
    scriptId?: number
}) {
    return request({
        url: '/api/ai/video/batch-generate-async',
        method: 'post',
        data,
        timeout: 30000,
    })
}

/**
 * 查询视频生成状态
 */
export function getVideoStatus(taskId: string, model: string) {
    return request({
        url: '/api/ai/video/status',
        method: 'post',
        data: { taskId, model },
    })
}

/**
 * 批量查询视频任务状态
 */
export function batchGetVideoStatus(tasks: Array<{ taskId: string; shotId: number; model: string }>) {
    return request({
        url: '/api/ai/video/batch-status',
        method: 'post',
        data: { tasks },
    })
}

/**
 * 查询通用任务状态（用于独立页面）
 */
export function getGeneralTaskStatus(taskId: string, type: 'image' | 'video', model: string) {
    const url = type === 'image' ? '/api/ai/image/status' : '/api/ai/video/status';
    return request({
        url,
        method: 'post',
        data: { taskId, model },
    })
}
