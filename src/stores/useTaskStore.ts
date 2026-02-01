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

// 队列任务类型（使用 jobId）
export interface QueueImageJob {
  jobId: string | number;
  shotId: number;
  createdAt: number;
}

export interface QueueVideoJob {
  jobId: string | number;
  shotId: number;
  model: string;
  createdAt: number;
}

// 通用任务类型（用于独立页面）
export interface GeneralTask {
  taskId: string;
  type: 'image' | 'video';
  model: string;
  createdAt: number;
}

// 任务状态
export interface TaskState {
  imageTasks: ImageTask[];
  videoTasks: VideoTask[];
  generalTasks: GeneralTask[];

  // 队列任务（新增）
  queueImageJobs: QueueImageJob[];
  queueVideoJobs: QueueVideoJob[];

  // 添加任务
  addImageTask: (task: Omit<ImageTask, 'createdAt'>) => void;
  addVideoTask: (task: Omit<VideoTask, 'createdAt'>) => void;
  addGeneralTask: (task: Omit<GeneralTask, 'createdAt'>) => void;

  // 添加队列任务（新增）
  addQueueImageJob: (job: Omit<QueueImageJob, 'createdAt'>) => void;
  addQueueVideoJob: (job: Omit<QueueVideoJob, 'createdAt'>) => void;

  // 移除任务
  removeImageTask: (taskId: string) => void;
  removeVideoTask: (taskId: string) => void;
  removeGeneralTask: (taskId: string) => void;

  // 移除队列任务（新增）
  removeQueueImageJob: (jobId: string | number) => void;
  removeQueueVideoJob: (jobId: string | number) => void;

  // 清空任务
  clearImageTasks: () => void;
  clearVideoTasks: () => void;
  clearGeneralTasks: () => void;

  // 清空队列任务（新增）
  clearQueueImageJobs: () => void;
  clearQueueVideoJobs: () => void;

  // 批量移除（已完成/失败）
  removeFinishedImageTasks: (finishedTaskIds: string[]) => void;
  removeFinishedGeneralTasks: (finishedTaskIds: string[]) => void;

  // 批量移除队列任务（新增）
  removeFinishedQueueImageJobs: (finishedJobIds: (string | number)[]) => void;
  removeFinishedQueueVideoJobs: (finishedJobIds: (string | number)[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      imageTasks: [],
      videoTasks: [],
      generalTasks: [],
      queueImageJobs: [],
      queueVideoJobs: [],

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

      addGeneralTask: (task) =>
        set((state) => ({
          generalTasks: [
            ...state.generalTasks,
            { ...task, createdAt: Date.now() },
          ],
        })),

      addQueueImageJob: (job) =>
        set((state) => ({
          queueImageJobs: [
            ...state.queueImageJobs,
            { ...job, createdAt: Date.now() },
          ],
        })),

      addQueueVideoJob: (job) =>
        set((state) => ({
          queueVideoJobs: [
            ...state.queueVideoJobs,
            { ...job, createdAt: Date.now() },
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

      removeGeneralTask: (taskId) =>
        set((state) => ({
          generalTasks: state.generalTasks.filter((t) => t.taskId !== taskId),
        })),

      removeQueueImageJob: (jobId) =>
        set((state) => ({
          queueImageJobs: state.queueImageJobs.filter((j) => j.jobId !== jobId),
        })),

      removeQueueVideoJob: (jobId) =>
        set((state) => ({
          queueVideoJobs: state.queueVideoJobs.filter((j) => j.jobId !== jobId),
        })),

      clearImageTasks: () => set({ imageTasks: [] }),
      clearVideoTasks: () => set({ videoTasks: [] }),
      clearGeneralTasks: () => set({ generalTasks: [] }),
      clearQueueImageJobs: () => set({ queueImageJobs: [] }),
      clearQueueVideoJobs: () => set({ queueVideoJobs: [] }),

      removeFinishedImageTasks: (finishedTaskIds) =>
        set((state) => ({
          imageTasks: state.imageTasks.filter(
            (t) => !finishedTaskIds.includes(t.taskId)
          ),
        })),

      removeFinishedGeneralTasks: (finishedTaskIds) =>
        set((state) => ({
          generalTasks: state.generalTasks.filter(
            (t) => !finishedTaskIds.includes(t.taskId)
          ),
        })),

      removeFinishedQueueImageJobs: (finishedJobIds) =>
        set((state) => ({
          queueImageJobs: state.queueImageJobs.filter(
            (j) => !finishedJobIds.includes(j.jobId)
          ),
        })),

      removeFinishedQueueVideoJobs: (finishedJobIds) =>
        set((state) => ({
          queueVideoJobs: state.queueVideoJobs.filter(
            (j) => !finishedJobIds.includes(j.jobId)
          ),
        })),
    }),
    {
      name: 'task-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
