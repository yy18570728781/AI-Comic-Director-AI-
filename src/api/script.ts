import { request } from './request';

/**
 * 获取剧本配置标签
 */
export function getScriptTags() {
  return request({
    url: '/api/script/tags',
    method: 'get',
  });
}

/**
 * 创建剧本
 */
export function createScript(data: {
  title: string;
  content: string;
  style?: string;
  description?: string;
  teamId?: number;
}) {
  return request({
    url: '/api/script/create',
    method: 'post',
    data,
  });
}

/**
 * 获取剧本列表
 */
export function getScriptList(params: {
  teamId?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return request({
    url: '/api/script/list',
    method: 'get',
    params,
  });
}

/**
 * 获取剧本详情
 */
export function getScriptDetail(id: number) {
  return request({
    url: `/api/script/${id}`,
    method: 'get',
  });
}

/**
 * 更新剧本
 */
export function updateScript(id: number, data: any) {
  return request({
    url: `/api/script/${id}`,
    method: 'put',
    data,
  });
}

/**
 * 删除剧本
 */
export function deleteScript(id: number) {
  return request({
    url: `/api/script/${id}`,
    method: 'delete',
  });
}

/**
 * 生成分镜脚本
 */
export function generateStoryboard(
  id: number,
  data: {
    provider?: string;
    shotCount?: number;
  }
) {
  return request({
    url: `/api/script/${id}/storyboard`,
    method: 'post',
    data,
    timeout: 300000,
  });
}

/**
 * 流式生成分镜脚本
 */
export async function generateStoryboardStream(
  id: number,
  data: {
    provider?: string;
    shotCount?: number;
    characters?: Array<{
      name: string;
      variants: Array<{ variant: string; tags: string[] }>;
    }>; // 角色参考信息
  },
  onChunk: (content: string, accumulated: string) => void,
  onError?: (error: string) => void,
  onDone?: (result: any) => void
) {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${apiBaseURL}/api/script/${id}/storyboard-stream`, {
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
        if (line.startsWith('data: ')) {
          const data = line.substring(6);

          if (data === '[DONE]') {
            break;
          }

          try {
            const json = JSON.parse(data);
            if (json.content) {
              onChunk(json.content, json.accumulated);
            } else if (json.done && json.data) {
              onDone?.(json.data);
            } else if (json.error) {
              onError?.(json.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error: any) {
    onError?.(error.message || '生成失败');
    throw error;
  }
}

/**
 * 更新分镜
 */
export function updateShot(shotId: number, data: any) {
  return request({
    url: `/api/script/shot/${shotId}`,
    method: 'put',
    data,
  });
}

/**
 * 删除分镜
 */
export function deleteShot(shotId: number) {
  return request({
    url: `/api/script/shot/${shotId}`,
    method: 'delete',
  });
}

/**
 * 批量更新分镜排序
 */
export function updateShotOrder(shots: Array<{ id: number; sortOrder: number }>) {
  return request({
    url: '/api/script/shot/order',
    method: 'post',
    data: { shots },
  });
}

/**
 * 从剧本提取角色信息
 */
export function extractCharacters(scriptId: number) {
  return request({
    url: '/api/character-library/extract',
    method: 'post',
    data: { scriptId },
    timeout: 240000, // 4分钟超时，AI分析复杂剧本需要较长时间
  });
}

/**
 * 批量保存角色到角色库
 */
export function batchSaveCharacters(characters: any[], userId: number, scriptId?: number) {
  return request({
    url: '/api/character-library/batch-save',
    method: 'post',
    data: { characters, userId, scriptId },
  });
}

/**
 * 批量保存场景到资源库
 */
export function batchSaveScenes(scenes: any[], userId: number, scriptId?: number) {
  return request({
    url: '/api/character-library/batch-save-scenes',
    method: 'post',
    data: { scenes, userId, scriptId },
  });
}

/**
 * 获取场景列表
 */
export function getSceneList(params: {
  userId?: number;
  scriptId?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return request({
    url: '/api/resource/list',
    method: 'get',
    params: { ...params, type: 'scene' },
  });
}

/**
 * 获取角色列表
 */
export function getCharacterList(params: {
  userId?: number;
  scriptId?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return request({
    url: '/api/character-library/list',
    method: 'get',
    params,
  });
}

/**
 * 获取角色详情
 */
export function getCharacterDetail(id: number) {
  return request({
    url: `/api/character-library/${id}`,
    method: 'get',
  });
}

/**
 * 删除角色
 */
export function deleteCharacter(id: number, userId: number) {
  return request({
    url: `/api/character-library/${id}`,
    method: 'delete',
    params: { userId },
  });
}

/**
 * 更新角色
 */
export function updateCharacterLibrary(id: number, data: any) {
  return request({
    url: `/api/character-library/${id}`,
    method: 'put',
    data,
  });
}

/**
 * 为剧本的所有分镜绑定角色图像
 */
export function bindCharactersForScript(
  scriptId: number,
  options?: {
    overwriteExisting?: boolean;
  }
) {
  return request({
    url: `/api/script/${scriptId}/bind-characters`,
    method: 'post',
    data: options || {},
  });
}

/**
 * 为单个分镜绑定角色图像
 */
export function bindCharactersForShot(shotId: number) {
  return request({
    url: `/api/shot/${shotId}/bind-characters`,
    method: 'post',
  });
}

/**
 * 获取分镜的角色图像映射
 */
export function getCharacterMappings(shotId: number) {
  return request({
    url: `/api/shot/${shotId}/character-mappings`,
    method: 'get',
  });
}
