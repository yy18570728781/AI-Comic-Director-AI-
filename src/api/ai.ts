import { request } from './request';

// AI 创作相关接口

/**
 * 流式生成小说
 */
export async function generateNovelStream(
  data: {
    theme: string;
    outline?: string;
    length?: number;
    model?: string;
  },
  onChunk: (content: string) => void,
  onError?: (error: string) => void,
  onDone?: () => void
) {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${apiBaseURL}/api/ai/novel/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(`请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.substring(6);

        if (payload === '[DONE]') {
          onDone?.();
          break;
        }

        try {
          const json = JSON.parse(payload);
          if (json.content) onChunk(json.content);
          if (json.error) onError?.(json.error);
        } catch {
          // 关键逻辑：SSE 分片可能被拆断，解析失败时忽略本片段。
        }
      }
    }
  } catch (error: any) {
    onError?.(error.message || '生成失败');
    throw error;
  }
}

/**
 * 流式生成剧本
 */
export async function generateScriptStream(
  data: {
    novel: string;
    style?: string;
    cameraStyle?: string;
    model?: string;
  },
  onChunk: (content: string) => void,
  onError?: (error: string) => void,
  onDone?: () => void
) {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${apiBaseURL}/api/ai/script/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(`请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.substring(6);

        if (payload === '[DONE]') {
          onDone?.();
          break;
        }

        try {
          const json = JSON.parse(payload);
          if (json.content) onChunk(json.content);
          if (json.error) onError?.(json.error);
        } catch {
          // 关键逻辑：SSE 分片可能被拆断，解析失败时忽略本片段。
        }
      }
    }
  } catch (error: any) {
    onError?.(error.message || '生成失败');
    throw error;
  }
}

/**
 * 生成小说
 */
export function generateNovel(data: {
  theme: string;
  outline?: string;
  provider?: string;
  length?: number;
  model?: string;
}) {
  return request({
    url: '/api/ai/novel/generate',
    method: 'post',
    data,
  });
}

/**
 * 生成剧本
 */
export function generateScript(data: {
  novel: string;
  provider?: string;
  style?: string;
  model?: string;
}) {
  return request({
    url: '/api/ai/script/generate',
    method: 'post',
    data,
  });
}

/**
 * 生成分镜脚本
 */
export function generateStoryboard(data: {
  script: string;
  provider?: string;
  shotCount?: number;
  model?: string;
}) {
  return request({
    url: '/api/ai/storyboard/generate',
    method: 'post',
    data,
  });
}

/**
 * 提取角色和场景
 */
export function extractCharactersAndScenes(data: {
  script: string;
  provider?: string;
  model?: string;
}) {
  return request({
    url: '/api/ai/extract/characters-scenes',
    method: 'post',
    data,
  });
}

/**
 * 优化图像提示词
 */
export function optimizeImagePrompt(data: {
  prompt: string;
  style?: string;
  provider?: string;
  model?: string;
}) {
  return request({
    url: '/api/ai/prompt/optimize/image-chinese',
    method: 'post',
    data,
  });
}

/**
 * 优化图像提示词，转英文
 */
export function optimizeImagePromptToEnglish(data: {
  prompt: string;
  style?: string;
  provider?: string;
  model?: string;
}) {
  return request({
    url: '/api/ai/prompt/optimize/image',
    method: 'post',
    data,
  });
}

/**
 * 优化视频提示词
 */
export function optimizeVideoPrompt(data: {
  prompt: string;
  duration?: number;
  modelId?: string;
  provider?: string;
  model?: string;
}) {
  return request({
    url: '/api/ai/prompt/optimize/video',
    method: 'post',
    data,
  });
}

/**
 * 生成图像
 */
export function generateImage(data: {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  style?: string;
  referenceImages?: string[];
  seed?: number;
}) {
  return request({
    url: '/api/ai/image/generate',
    method: 'post',
    data,
  });
}

export function batchGenerateImages(data: { requests: any[] }) {
  return request({
    url: '/api/ai/image/batch-generate',
    method: 'post',
    data,
  });
}

export function generateVideo(data: {
  prompt: string;
  model?: string;
  mode: 't2v' | 'i2v' | 'flf2v' | 'ref2v';
  duration?: number;
  referenceImages?: string[];
  fps?: number;
  resolution?: string;
}) {
  return request({
    url: '/api/ai/video/generate',
    method: 'post',
    data,
  });
}

export function getVideoStatus(data: { taskId: string; model: string }) {
  return request({
    url: '/api/ai/video/status',
    method: 'post',
    data,
  });
}

export function getModels() {
  return request({
    url: '/api/ai/models',
    method: 'get',
  });
}

export function generateImageAsync(data: {
  prompt: string;
  model?: string;
  quality?: string;
  aspectRatio?: string;
  style?: string;
  referenceImages?: string[];
  seed?: number;
  shotId?: number;
  scriptId?: number;
  saveToLibrary?: boolean;
  libraryName?: string;
  libraryTags?: string[];
  userId?: number;
  characterId?: number;
  promptType?: 'character' | 'scene' | 'general';
  characterName?: string;
}) {
  return request({
    url: '/api/ai/image/generate-async',
    method: 'post',
    data,
  });
}

export function batchGenerateImagesAsync(data: {
  shots: Array<{
    id: number;
    prompt: string;
    model?: string;
    params?: any;
  }>;
  scriptId?: number;
}) {
  return request({
    url: '/api/ai/image/batch-generate-async',
    method: 'post',
    data,
  });
}

export function generateVideoAsync(data: {
  prompt: string;
  model?: string;
  duration?: number;
  referenceImages?: string[];
  fps?: number;
  resolution?: string;
  shotId?: number;
  scriptId?: number;
}) {
  return request({
    url: '/api/ai/video/generate-async',
    method: 'post',
    data,
  });
}

export function batchGenerateVideosAsync(data: {
  tasks: Array<{
    shotId?: number;
    referenceImages: string[];
    mode: 't2v' | 'i2v' | 'flf2v' | 'ref2v';
    model?: string;
    prompt?: string;
    duration?: number;
    resolution?: string;
  }>;
  scriptId?: number;
}) {
  return request({
    url: '/api/ai/video/batch-generate-async',
    method: 'post',
    data,
    timeout: 30000,
  });
}

export function getQueueJobStatus(
  queueName: 'image' | 'video' | 'storyboard',
  jobId: string | number
) {
  return request({
    url: `/api/queue/job/${queueName}/${jobId}`,
    method: 'get',
  });
}

export function batchGetQueueJobStatus(
  queueName: 'image' | 'video' | 'storyboard',
  jobIds: (string | number)[]
) {
  return request({
    url: `/api/queue/jobs/${queueName}`,
    method: 'post',
    data: { jobIds },
  });
}

export function getQueueStats(queueName?: 'image' | 'video' | 'storyboard') {
  return request({
    url: queueName ? `/api/queue/stats/${queueName}` : '/api/queue/stats',
    method: 'get',
  });
}

export interface UnifiedTaskStatusItem {
  jobId: string | number;
  type: 'image' | 'video';
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'not_found';
  progress?: number;
  failedReason?: string;
  videoId?: number;
  taskTable?: 'image_tasks' | 'shot_videos';
  taskDetail?: {
    id: number;
    taskId?: string;
    model?: string;
    prompt?: string;
    shotId?: number;
    scriptId?: number;
    characterId?: number;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  requestSnapshot?: Record<string, any>;
  resultSnapshot?: Record<string, any>;
  result?: {
    taskId?: string;
    savedImage?: {
      id?: number;
      url?: string;
      shotId?: number;
    };
    savedVideo?: {
      id?: number;
      url?: string;
      shotId?: number;
    };
  };
}

export function batchGetAllTaskStatus(data: {
  tasks: Array<{
    jobId: string | number;
    type: 'image' | 'video';
    videoId?: number;
  }>;
}) {
  return request({
    url: '/api/tasks/batch-status',
    method: 'post',
    data,
  });
}
