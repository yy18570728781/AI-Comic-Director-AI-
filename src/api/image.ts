import { request } from './request'

/**
 * 生成图像（同步）
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
 * 异步生成图像（使用队列）
 * 立即返回 jobId，任务在后台队列中处理
 */
export function generateImageAsync(data: {
  prompt: string
  model?: string
  width?: number
  height?: number
  style?: string
  referenceImages?: string[]
  seed?: number
  shotId?: number
  scriptId?: number
}) {
  return request({
    url: '/api/ai/image/generate-async',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时（立即返回）
  })
}

/**
 * 批量异步生成图像（使用队列）
 */
export function batchGenerateImagesAsync(data: {
  shots: Array<{
    id: number
    prompt: string
    model?: string
    params?: any
  }>
  scriptId?: number
}) {
  return request({
    url: '/api/ai/image/batch-generate-async',
    method: 'post',
    data,
    timeout: 30000,
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
 * 
 * 支持两种任务类型：
 * 1. 融图任务（taskId 以 blend- 开头）
 * 2. 分镜图片任务（其他 taskId）
 */
export function batchGetImageStatus(tasks: Array<{
  taskId: string;
  shotId: number;
  isBlend?: boolean;
}>) {
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
 * 多图融合
 * 
 * 后端立即返回 taskId，前端通过 batchGetImageStatus 轮询状态
 */
export function blendImages(data: {
  model: string
  prompt?: string
  referenceImages: string[]
  aspectRatio?: string
  scriptId?: number
  userId?: number
}) {
  return request({
    url: '/api/ai/image/blend',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时（后端立即返回）
  })
}
