import { useState, useEffect, useCallback, useRef } from 'react'
import { getQueueJobStatus } from '../api/ai'
import { message } from 'antd'

export interface QueueJob {
    id: string | number
    state: 'waiting' | 'active' | 'completed' | 'failed'
    progress?: number
    result?: any
    failedReason?: string
    data?: any
}

export interface UseQueuePollingOptions {
    queueName: 'image' | 'video' | 'storyboard'
    jobId: string | number
    interval?: number // 轮询间隔（毫秒），默认 2000
    onCompleted?: (result: any) => void
    onFailed?: (reason: string) => void
    onProgress?: (progress: number) => void
    enabled?: boolean // 是否启用轮询，默认 true
}

/**
 * 队列任务轮询 Hook
 * 
 * 用于轮询查询队列任务状态，直到任务完成或失败
 * 
 * @example
 * const { job, isPolling, error } = useQueuePolling({
 *   queueName: 'image',
 *   jobId: '123',
 *   onCompleted: (result) => {
 *     console.log('任务完成！', result)
 *   },
 *   onFailed: (reason) => {
 *     console.error('任务失败！', reason)
 *   }
 * })
 */
export function useQueuePolling(options: UseQueuePollingOptions) {
    const {
        queueName,
        jobId,
        interval = 2000,
        onCompleted,
        onFailed,
        onProgress,
        enabled = true,
    } = options

    const [job, setJob] = useState<QueueJob | null>(null)
    const [isPolling, setIsPolling] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const onCompletedRef = useRef(onCompleted)
    const onFailedRef = useRef(onFailed)
    const onProgressRef = useRef(onProgress)

    // 更新回调引用
    useEffect(() => {
        onCompletedRef.current = onCompleted
        onFailedRef.current = onFailed
        onProgressRef.current = onProgress
    }, [onCompleted, onFailed, onProgress])

    // 查询任务状态
    const fetchJobStatus = useCallback(async () => {
        try {
            const response = await getQueueJobStatus(queueName, jobId)

            if (response.success && response.data) {
                const jobData = response.data as QueueJob
                setJob(jobData)

                // 触发进度回调
                if (jobData.progress !== undefined) {
                    onProgressRef.current?.(jobData.progress)
                }

                // 任务完成
                if (jobData.state === 'completed') {
                    setIsPolling(false)
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = null
                    }
                    onCompletedRef.current?.(jobData.result)
                }

                // 任务失败
                if (jobData.state === 'failed') {
                    setIsPolling(false)
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = null
                    }
                    const reason = jobData.failedReason || '任务失败'
                    setError(reason)
                    onFailedRef.current?.(reason)
                }
            }
        } catch (err: any) {
            console.error('查询任务状态失败:', err)
            setError(err.message || '查询失败')
        }
    }, [queueName, jobId])

    // 开始轮询
    useEffect(() => {
        if (!enabled || !jobId) {
            return
        }

        setIsPolling(true)
        setError(null)

        // 立即查询一次
        fetchJobStatus()

        // 开始定时轮询
        intervalRef.current = setInterval(fetchJobStatus, interval)

        // 清理函数
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setIsPolling(false)
        }
    }, [enabled, jobId, interval, fetchJobStatus])

    return {
        job,
        isPolling,
        error,
    }
}

/**
 * 批量任务轮询 Hook
 * 
 * 用于轮询查询多个任务的状态
 * 
 * @example
 * const { jobs, allCompleted, completedCount, failedCount } = useBatchQueuePolling({
 *   queueName: 'image',
 *   jobIds: ['1', '2', '3'],
 *   onAllCompleted: (results) => {
 *     console.log('所有任务完成！', results)
 *   }
 * })
 */
export function useBatchQueuePolling(options: {
    queueName: 'image' | 'video' | 'storyboard'
    jobIds: Array<string | number>
    interval?: number
    onAllCompleted?: (results: any[]) => void
    onProgress?: (completed: number, total: number) => void
    enabled?: boolean
}) {
    const {
        queueName,
        jobIds,
        interval = 3000,
        onAllCompleted,
        onProgress,
        enabled = true,
    } = options

    const [jobs, setJobs] = useState<Map<string | number, QueueJob>>(new Map())
    const [isPolling, setIsPolling] = useState(false)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const onAllCompletedRef = useRef(onAllCompleted)
    const onProgressRef = useRef(onProgress)

    useEffect(() => {
        onAllCompletedRef.current = onAllCompleted
        onProgressRef.current = onProgress
    }, [onAllCompleted, onProgress])

    // 查询所有任务状态
    const fetchAllJobsStatus = useCallback(async () => {
        try {
            const responses = await Promise.all(
                jobIds.map(jobId => getQueueJobStatus(queueName, jobId))
            )

            const newJobs = new Map<string | number, QueueJob>()
            responses.forEach((response, index) => {
                if (response.success && response.data) {
                    newJobs.set(jobIds[index], response.data as QueueJob)
                }
            })

            setJobs(newJobs)

            // 统计完成和失败的任务
            const completed = Array.from(newJobs.values()).filter(
                job => job.state === 'completed'
            )
            const failed = Array.from(newJobs.values()).filter(
                job => job.state === 'failed'
            )

            // 触发进度回调
            onProgressRef.current?.(completed.length + failed.length, jobIds.length)

            // 所有任务都完成或失败
            if (completed.length + failed.length === jobIds.length) {
                setIsPolling(false)
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }

                // 触发完成回调
                const results = completed.map(job => job.result)
                onAllCompletedRef.current?.(results)

                // 显示统计信息
                if (failed.length > 0) {
                    message.warning(`批量任务完成：成功 ${completed.length}，失败 ${failed.length}`)
                } else {
                    message.success(`批量任务全部完成！共 ${completed.length} 个`)
                }
            }
        } catch (err: any) {
            console.error('查询批量任务状态失败:', err)
        }
    }, [queueName, jobIds])

    // 开始轮询
    useEffect(() => {
        if (!enabled || jobIds.length === 0) {
            return
        }

        setIsPolling(true)

        // 立即查询一次
        fetchAllJobsStatus()

        // 开始定时轮询
        intervalRef.current = setInterval(fetchAllJobsStatus, interval)

        // 清理函数
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setIsPolling(false)
        }
    }, [enabled, jobIds, interval, fetchAllJobsStatus])

    // 计算统计信息
    const completedCount = Array.from(jobs.values()).filter(
        job => job.state === 'completed'
    ).length
    const failedCount = Array.from(jobs.values()).filter(
        job => job.state === 'failed'
    ).length
    const allCompleted = completedCount + failedCount === jobIds.length

    return {
        jobs,
        isPolling,
        completedCount,
        failedCount,
        allCompleted,
        totalCount: jobIds.length,
    }
}
