import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 任务类型
export interface ImageTask {
  taskId: string;
  shotId: number;
  isBlend?: boolean;
  createdAt: number;
}

export interface VideoTask {
  taskId: string;
  shotId: number;
  model: string;
  createdAt: number;
}

// 任务状态
export interface TaskState {
  imageTasks: ImageTask[];
  videoTasks: VideoTask[];
  
  // 添加任务
  addImageTask: (task: Omit<ImageTask, 'createdAt'>) => void;
  addVideoTask: (task: Omit<VideoTask, 'createdAt'>) => void;
  
  // 移除任务
  removeImageTask: (taskId: string) => void;
  removeVideoTask: (taskId: string) => void;
  
  // 清空任务
  clearImageTasks: () => void;
  clearVideoTasks: () => void;
  
  // 批量移除（已完成/失败）
  removeFinishedImageTasks: (finishedTaskIds: string[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      imageTasks: [],
      videoTasks: [],

      addImageTask: (task) =>
        set((state) => ({
          imageTasks: [
            ...state.imageTasks,
            { ...task, createdAt: Date.now() },
          ],
        })),

      addVideoTask: (task) =>
        set((state) => ({
          videoTasks: [
            ...state.videoTasks,
            { ...task, createdAt: Date.now() },
          ],
        })),

      removeImageTask: (taskId) =>
        set((state) => ({
          imageTasks: state.imageTasks.filter((t) => t.taskId !== taskId),
        })),

      removeVideoTask: (taskId) =>
        set((state) => ({
          videoTasks: state.videoTasks.filter((t) => t.taskId !== taskId),
        })),

      clearImageTasks: () => set({ imageTasks: [] }),
      clearVideoTasks: () => set({ videoTasks: [] }),

      removeFinishedImageTasks: (finishedTaskIds) =>
        set((state) => ({
          imageTasks: state.imageTasks.filter(
            (t) => !finishedTaskIds.includes(t.taskId)
          ),
        })),
    }),
    {
      name: 'task-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

