/**
 * 全局任务轮询组件
 * 
 * 在 App 层级挂载，无论用户在哪个页面都会持续轮询任务状态
 * 
 * 特点：
 * - 单次 HTTP 请求查询所有类型的任务状态
 * - 统一使用队列 jobId
 * - 通过事件机制通知各页面更新 UI
 */

import { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { useTaskStore, Task } from '@/stores/useTaskStore';
import { batchGetAllTaskStatus } from '@/api/ai';

// 轮询间隔（毫秒）
const POLL_INTERVAL = 3000;

// 事件类型
export type TaskCompleteEvent = {
  type: 'image' | 'video';
  jobId: string | number;
  shotId?: number;
  result: any;
};

// 全局事件监听器
type TaskCompleteListener = (event: TaskCompleteEvent) => void;
const listeners: Set<TaskCompleteListener> = new Set();

// 订阅任务完成事件
export function onTaskComplete(listener: TaskCompleteListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// 触发任务完成事件
function emitTaskComplete(event: TaskCompleteEvent) {
  listeners.forEach(listener => listener(event));
}

export function GlobalTaskPoller() {
  const { tasks, removeTasks } = useTaskStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 统一轮询所有任务
  const pollAllTasks = useCallback(async () => {
    if (tasks.length === 0) {
      timerRef.current = null;
      return;
    }

    try {
      console.log(`🔄 [统一轮询] 查询 ${tasks.length} 个任务`);

      const res: any = await batchGetAllTaskStatus({
        tasks: tasks.map(t => ({ jobId: t.jobId, type: t.type })),
      });

      if (res.success && res.data) {
        const finishedJobIds: (string | number)[] = [];

        res.data.forEach((item: any) => {
          const task = tasks.find(t => t.jobId == item.jobId);
          if (!task) return;

          if (item.state === 'completed') {
            finishedJobIds.push(item.jobId);
            console.log(`✅ [统一轮询] 任务完成: type=${item.type}, jobId=${item.jobId}`);

            // 触发完成事件
            emitTaskComplete({
              type: item.type,
              jobId: item.jobId,
              shotId: task.shotId,
              result: item.result?.savedImage || item.result?.savedVideo || item.result,
            });

            // 显示成功消息
            const typeNames: Record<string, string> = {
              image: '图片',
              video: '视频',
              blend: '融图',
            };
            message.success(`${typeNames[item.type] || '任务'}生成完成！`);
          } else if (item.state === 'failed') {
            finishedJobIds.push(item.jobId);
            console.error(`❌ [统一轮询] 任务失败: type=${item.type}, jobId=${item.jobId}`, item.failedReason);
            message.error(`生成失败: ${item.failedReason || '未知错误'}`);
          }
          // waiting, active 状态继续轮询
        });

        // 批量移除已完成的任务
        if (finishedJobIds.length > 0) {
          removeTasks(finishedJobIds);
        }
      }
    } catch (error: any) {
      console.error('[统一轮询] 查询任务失败:', error);
    }

    // 继续轮询（如果还有任务）
    if (tasks.length > 0) {
      timerRef.current = setTimeout(pollAllTasks, POLL_INTERVAL);
    } else {
      timerRef.current = null;
    }
  }, [tasks, removeTasks]);

  // 启动轮询
  useEffect(() => {
    if (tasks.length > 0 && !timerRef.current) {
      console.log(`🚀 [统一轮询] 启动轮询，共 ${tasks.length} 个任务`);
      timerRef.current = setTimeout(pollAllTasks, POLL_INTERVAL);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tasks.length, pollAllTasks]);

  // 不渲染任何 UI
  return null;
}

export default GlobalTaskPoller;
