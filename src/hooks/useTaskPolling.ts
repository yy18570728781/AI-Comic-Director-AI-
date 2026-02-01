import { useEffect, useRef, useCallback, useState } from 'react';
import { batchGetImageStatus } from '@/api/image';
import { batchGetVideoStatus, getGeneralTaskStatus } from '@/api/video';
import { batchGetQueueJobStatus } from '@/api/ai';
import { useTaskStore, GeneralTask } from '../stores/useTaskStore';

/**
 * 图片任务轮询 Hook（旧版，使用 taskId）
 * - 页面切换后继续轮询
 * - 刷新后从 localStorage 恢复任务并继续轮询
 */
export function useImagePolling(options?: {
    interval?: number;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
}) {
    const { imageTasks, removeFinishedImageTasks } = useTaskStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(options?.onComplete);

    // 更新 callback ref
    callbackRef.current = options?.onComplete;

    const pollTasks = useCallback(async () => {
        if (imageTasks.length === 0) {
            timerRef.current = null;
            return;
        }

        try {
            console.log(`🔄 批量查询 ${imageTasks.length} 个图片任务状态`);
            const res: any = await batchGetImageStatus(imageTasks);

            if (res.success && res.data) {
                const finishedTaskIds: string[] = [];

                res.data.forEach((result: any) => {
                    if (
                        result.status === 'completed' ||
                        result.status === 'failed' ||
                        result.status === 'error'
                    ) {
                        finishedTaskIds.push(result.taskId);
                    }
                });

                // 移除已完成的任务
                if (finishedTaskIds.length > 0) {
                    removeFinishedImageTasks(finishedTaskIds);
                    console.log(`✅ 移除 ${finishedTaskIds.length} 个已完成任务`);
                }

                // 通知完成（用于更新UI）
                if (callbackRef.current && res.data.length > 0) {
                    callbackRef.current(res.data);
                }
            }
        } catch (error: any) {
            console.error('批量查询图片任务失败:', error);
            options?.onError?.(error);
        }

        // 继续轮询
        if (imageTasks.length > 0) {
            timerRef.current = setTimeout(pollTasks, options?.interval || 3500);
        } else {
            timerRef.current = null;
        }
    }, [imageTasks, removeFinishedImageTasks, options?.interval, options?.onError]);

    // 启动轮询
    useEffect(() => {
        if (imageTasks.length > 0 && !timerRef.current) {
            console.log('🚀 启动图片任务轮询');
            timerRef.current = setTimeout(pollTasks, options?.interval || 3500);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [imageTasks.length, pollTasks, options?.interval]);
}

/**
 * 视频任务轮询 Hook（旧版，使用 taskId）
 */
export function useVideoPolling(options?: {
    interval?: number;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
}) {
    const { videoTasks, removeVideoTask } = useTaskStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(options?.onComplete);

    callbackRef.current = options?.onComplete;

    const pollTasks = useCallback(async () => {
        if (videoTasks.length === 0) {
            timerRef.current = null;
            return;
        }

        try {
            console.log(`🔄 批量查询 ${videoTasks.length} 个视频任务状态`);
            const res: any = await batchGetVideoStatus(videoTasks);

            if (res.success && res.data) {
                const finishedShotIds: string[] = [];

                res.data.forEach((result: any) => {
                    if (
                        result.status === 'completed' ||
                        result.status === 'failed' ||
                        result.status === 'error'
                    ) {
                        finishedShotIds.push(result.taskId);
                    }
                });

                // 移除已完成的任务
                if (finishedShotIds.length > 0) {
                    finishedShotIds.forEach((taskId) => removeVideoTask(taskId));
                    console.log(`✅ 移除 ${finishedShotIds.length} 个已完成视频任务`);
                }

                // 通知完成
                if (callbackRef.current && res.data.length > 0) {
                    callbackRef.current(res.data);
                }
            }
        } catch (error: any) {
            console.error('批量查询视频任务失败:', error);
            options?.onError?.(error);
        }

        // 继续轮询
        if (videoTasks.length > 0) {
            timerRef.current = setTimeout(pollTasks, options?.interval || 5000);
        } else {
            timerRef.current = null;
        }
    }, [videoTasks, removeVideoTask, options?.interval, options?.onError]);

    // 启动轮询
    useEffect(() => {
        if (videoTasks.length > 0 && !timerRef.current) {
            console.log('🚀 启动视频任务轮询');
            timerRef.current = setTimeout(pollTasks, options?.interval || 5000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [videoTasks.length, pollTasks, options?.interval]);
}

/**
 * 队列图片任务轮询 Hook（新版，使用 jobId）
 */
export function useQueueImagePolling(options?: {
    interval?: number;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
}) {
    const { queueImageJobs, removeFinishedQueueImageJobs } = useTaskStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(options?.onComplete);

    callbackRef.current = options?.onComplete;

    const pollJobs = useCallback(async () => {
        if (queueImageJobs.length === 0) {
            timerRef.current = null;
            return;
        }

        try {
            console.log(`🔄 [队列] 批量查询 ${queueImageJobs.length} 个图片任务状态`);

            // 批量查询：1个HTTP请求查询所有任务
            const jobIds = queueImageJobs.map(job => job.jobId);
            const batchRes: any = await batchGetQueueJobStatus('image', jobIds);

            if (!batchRes.success || !batchRes.data) {
                console.error('[队列] 批量查询失败:', batchRes);
                return;
            }

            // 处理批量查询结果
            const results = batchRes.data.map((item: any) => {
                const job = queueImageJobs.find(j => j.jobId == item.jobId);
                if (!job) return null;

                return {
                    jobId: item.jobId,
                    shotId: job.shotId,
                    status: item.state,
                    image: item.result?.savedImage,
                    error: item.failedReason || item.error,
                };
            }).filter((r: any) => r !== null);

            const finishedJobIds: (string | number)[] = [];

            results.forEach((result: any) => {
                if (result.status === 'completed' || result.status === 'failed') {
                    finishedJobIds.push(result.jobId);
                }
            });

            // 移除已完成的任务
            if (finishedJobIds.length > 0) {
                removeFinishedQueueImageJobs(finishedJobIds);
                console.log(`✅ [队列] 移除 ${finishedJobIds.length} 个已完成任务`);
            }

            // 通知完成
            if (callbackRef.current && results.length > 0) {
                callbackRef.current(results);
            }
        } catch (error: any) {
            console.error('[队列] 批量查询图片任务失败:', error);
            options?.onError?.(error);
        }

        // 继续轮询
        if (queueImageJobs.length > 0) {
            timerRef.current = setTimeout(pollJobs, options?.interval || 3500);
        } else {
            timerRef.current = null;
        }
    }, [queueImageJobs, removeFinishedQueueImageJobs, options?.interval, options?.onError]);

    // 启动轮询
    useEffect(() => {
        if (queueImageJobs.length > 0 && !timerRef.current) {
            console.log('🚀 [队列] 启动图片任务轮询');
            timerRef.current = setTimeout(pollJobs, options?.interval || 3500);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [queueImageJobs.length, pollJobs, options?.interval]);
}

/**
 * 队列视频任务轮询 Hook（新版，使用 jobId）
 */
export function useQueueVideoPolling(options?: {
    interval?: number;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
}) {
    const { queueVideoJobs, removeFinishedQueueVideoJobs } = useTaskStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(options?.onComplete);

    callbackRef.current = options?.onComplete;

    const pollJobs = useCallback(async () => {
        if (queueVideoJobs.length === 0) {
            timerRef.current = null;
            return;
        }

        try {
            console.log(`🔄 [队列] 批量查询 ${queueVideoJobs.length} 个视频任务状态`);

            // 批量查询：1个HTTP请求查询所有任务
            const jobIds = queueVideoJobs.map(job => job.jobId);
            const batchRes: any = await batchGetQueueJobStatus('video', jobIds);

            if (!batchRes.success || !batchRes.data) {
                console.error('[队列] 批量查询失败:', batchRes);
                return;
            }

            // 处理批量查询结果
            const results = batchRes.data.map((item: any) => {
                const job = queueVideoJobs.find(j => j.jobId == item.jobId);
                if (!job) return null;

                return {
                    jobId: item.jobId,
                    shotId: job.shotId,
                    status: item.state,
                    video: item.result?.savedVideo,
                    error: item.failedReason || item.error,
                };
            }).filter((r: any) => r !== null);

            const finishedJobIds: (string | number)[] = [];

            results.forEach((result: any) => {
                if (result.status === 'completed' || result.status === 'failed') {
                    finishedJobIds.push(result.jobId);
                }
            });

            // 移除已完成的任务
            if (finishedJobIds.length > 0) {
                removeFinishedQueueVideoJobs(finishedJobIds);
                console.log(`✅ [队列] 移除 ${finishedJobIds.length} 个已完成视频任务`);
            }

            // 通知完成
            if (callbackRef.current && results.length > 0) {
                callbackRef.current(results);
            }
        } catch (error: any) {
            console.error('[队列] 批量查询视频任务失败:', error);
            options?.onError?.(error);
        }

        // 继续轮询
        if (queueVideoJobs.length > 0) {
            timerRef.current = setTimeout(pollJobs, options?.interval || 5000);
        } else {
            timerRef.current = null;
        }
    }, [queueVideoJobs, removeFinishedQueueVideoJobs, options?.interval, options?.onError]);

    // 启动轮询
    useEffect(() => {
        if (queueVideoJobs.length > 0 && !timerRef.current) {
            console.log('🚀 [队列] 启动视频任务轮询');
            timerRef.current = setTimeout(pollJobs, options?.interval || 5000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [queueVideoJobs.length, pollJobs, options?.interval]);
}

/**
 * 通用任务轮询 Hook（用于独立页面）
 */
export function useTaskPolling(options: {
    interval?: number;
    onTaskComplete?: (taskId: string, result: any) => void;
    onTaskError?: (taskId: string, error: string) => void;
}) {
    const { generalTasks, addGeneralTask, removeGeneralTask } = useTaskStore();
    const [tasks, setTasks] = useState<GeneralTask[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 同步本地状态和全局状态
    useEffect(() => {
        setTasks(generalTasks);
    }, [generalTasks]);

    const addTask = useCallback((task: Omit<GeneralTask, 'createdAt'>) => {
        addGeneralTask(task);
    }, [addGeneralTask]);

    const removeTask = useCallback((taskId: string) => {
        removeGeneralTask(taskId);
    }, [removeGeneralTask]);

    const pollTasks = useCallback(async () => {
        if (tasks.length === 0) {
            timerRef.current = null;
            return;
        }

        console.log(`🔄 轮询 ${tasks.length} 个通用任务状态`);

        // 逐个查询任务状态
        for (const task of tasks) {
            try {
                const res = await getGeneralTaskStatus(task.taskId, task.type, task.model);

                if (res.success && res.data) {
                    const { status, videos, images, error } = res.data;

                    if (status === 'completed') {
                        console.log(`✅ 任务完成: ${task.taskId}`);
                        options.onTaskComplete?.(task.taskId, { videos, images });
                        removeTask(task.taskId);
                    } else if (status === 'failed' || status === 'error') {
                        console.error(`❌ 任务失败: ${task.taskId}`, error);
                        options.onTaskError?.(task.taskId, error || '任务失败');
                        removeTask(task.taskId);
                    }
                    // processing 状态继续轮询
                }
            } catch (error: any) {
                console.error(`❌ 查询任务状态失败: ${task.taskId}`, error);
                options.onTaskError?.(task.taskId, error.message || '查询失败');
                removeTask(task.taskId);
            }
        }

        // 继续轮询
        if (tasks.length > 0) {
            timerRef.current = setTimeout(pollTasks, options.interval || 5000);
        } else {
            timerRef.current = null;
        }
    }, [tasks, options, removeTask]);

    // 启动轮询
    useEffect(() => {
        if (tasks.length > 0 && !timerRef.current) {
            console.log('🚀 启动通用任务轮询');
            timerRef.current = setTimeout(pollTasks, options.interval || 5000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [tasks.length, pollTasks, options.interval]);

    return {
        tasks,
        addTask,
        removeTask,
    };
}

/**
 * 清除所有任务轮询
 */
export function clearAllPolling() {
    useTaskStore.getState().clearImageTasks();
    useTaskStore.getState().clearVideoTasks();
    useTaskStore.getState().clearGeneralTasks();
    useTaskStore.getState().clearQueueImageJobs();
    useTaskStore.getState().clearQueueVideoJobs();
}
