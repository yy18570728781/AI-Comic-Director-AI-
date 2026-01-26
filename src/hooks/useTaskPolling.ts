import { useEffect, useRef, useCallback } from 'react';
import { batchGetImageStatus } from '@/api/image';
import { batchGetVideoStatus } from '@/api/video';
import { useTaskStore } from '../stores/useTaskStore';

/**
 * 图片任务轮询 Hook
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
 * 视频任务轮询 Hook
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
 * 清除所有任务轮询
 */
export function clearAllPolling() {
    useTaskStore.getState().clearImageTasks();
    useTaskStore.getState().clearVideoTasks();
}
