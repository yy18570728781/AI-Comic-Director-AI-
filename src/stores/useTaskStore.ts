import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 统一任务类型
 * 
 * 所有任务都走队列，使用 jobId 标识
 * type 区分队列类型：image（图片生成，包含融图）、video（视频生成）
 */
export interface Task {
  jobId: string | number;
  type: 'image' | 'video';
  shotId?: number;      // 关联的分镜ID（可选）
  characterId?: number; // 关联的角色ID（可选）
  model?: string;       // 使用的模型
  videoId?: number;     // 视频任务的数据库记录ID（用于查询状态）
  createdAt: number;
}

/**
 * 任务状态
 */
export interface TaskState {
  // 统一任务列表
  tasks: Task[];

  // 添加任务
  addTask: (task: Omit<Task, 'createdAt'>) => void;

  // 批量添加任务
  addTasks: (tasks: Omit<Task, 'createdAt'>[]) => void;

  // 移除任务
  removeTask: (jobId: string | number) => void;

  // 批量移除任务
  removeTasks: (jobIds: (string | number)[]) => void;

  // 清空所有任务
  clearTasks: () => void;

  // 获取指定类型的任务
  getTasksByType: (type: 'image' | 'video' | 'blend') => Task[];

  // 获取指定分镜的任务
  getTasksByShotId: (shotId: number) => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, createdAt: Date.now() },
          ],
        })),

      addTasks: (tasks) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            ...tasks.map(task => ({ ...task, createdAt: Date.now() })),
          ],
        })),

      removeTask: (jobId) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.jobId !== jobId),
        })),

      removeTasks: (jobIds) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => !jobIds.includes(t.jobId)),
        })),

      clearTasks: () => set({ tasks: [] }),

      getTasksByType: (type) => get().tasks.filter((t) => t.type === type),

      getTasksByShotId: (shotId) => get().tasks.filter((t) => t.shotId === shotId),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
