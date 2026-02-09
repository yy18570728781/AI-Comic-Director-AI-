/**
 * 全局任务轮询组件
 *
 * 在 App 层级挂载，负责：
 * 1. 轮询所有任务状态
 * 2. 任务完成时触发全局事件
 * 3. 自动清理已完成任务
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { batchGetAllTaskStatus } from '@/api/ai';

// 轮询间隔
const POLL_INTERVAL = 3000;

// ==================== 全局事件系统 ====================

export type TaskType = 'image' | 'video';

export interface TaskCompleteEvent {
  type: TaskType;
  jobId: string | number;
  shotId?: number;
  characterId?: number;
  result: any;
}

export interface TaskFailedEvent {
  type: TaskType;
  jobId: string | number;
  shotId?: number;
  characterId?: number;
  error: string;
}

type TaskCompleteListener = (event: TaskCompleteEvent) => void;
type TaskFailedListener = (event: TaskFailedEvent) => void;

const completeListeners = new Set<TaskCompleteListener>();
const failedListeners = new Set<TaskFailedListener>();

/** 订阅任务完成事件 */
export function onTaskComplete(listener: TaskCompleteListener): () => void {
  completeListeners.add(listener);
  return () => completeListeners.delete(listener);
}

/** 订阅任务失败事件 */
export function onTaskFailed(listener: TaskFailedListener): () => void {
  failedListeners.add(listener);
  return () => failedListeners.delete(listener);
}

function emitComplete(event: TaskCompleteEvent) {
  completeListeners.forEach(fn => fn(event));
}

function emitFailed(event: TaskFailedEvent) {
  failedListeners.forEach(fn => fn(event));
}

// ==================== 轮询组件 ====================

export function GlobalTaskPoller() {
  const { tasks, removeTasks } = useTaskStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    const currentTasks = useTaskStore.getState().tasks;
    
    if (currentTasks.length === 0) {
      timerRef.current = null;
      return;
    }

    try {
      const res: any = await batchGetAllTaskStatus({
        tasks: currentTasks.map(t => ({
          jobId: t.jobId,
          type: t.type,
          videoId: t.videoId,
        })),
      });

      if (res.success && res.data) {
        const finishedIds: (string | number)[] = [];

        res.data.forEach((item: any) => {
          const task = currentTasks.find(t => String(t.jobId) === String(item.jobId));
          if (!task) return;

          if (item.state === 'completed') {
            finishedIds.push(item.jobId);
            emitComplete({
              type: item.type,
              jobId: item.jobId,
              shotId: task.shotId,
              characterId: task.characterId,
              result: item.result,
            });
          } else if (item.state === 'failed') {
            finishedIds.push(item.jobId);
            emitFailed({
              type: item.type,
              jobId: item.jobId,
              shotId: task.shotId,
              characterId: task.characterId,
              error: item.failedReason || '生成失败',
            });
          }
        });

        if (finishedIds.length > 0) {
          removeTasks(finishedIds);
        }
      }
    } catch (error) {
      console.error('[GlobalTaskPoller] 轮询失败:', error);
    }

    // 继续轮询
    if (useTaskStore.getState().tasks.length > 0) {
      timerRef.current = setTimeout(poll, POLL_INTERVAL);
    } else {
      timerRef.current = null;
    }
  }, [removeTasks]);

  useEffect(() => {
    if (tasks.length > 0 && !timerRef.current) {
      timerRef.current = setTimeout(poll, POLL_INTERVAL);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tasks.length, poll]);

  return null;
}

export default GlobalTaskPoller;
