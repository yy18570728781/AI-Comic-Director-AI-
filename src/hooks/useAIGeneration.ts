/**
 * AI 生成统一 Hook
 * 
 * 整合图片和视频生成：
 * - 提交任务到队列
 * - 监听全局轮询事件
 * - 任务完成时触发回调
 * 
 * 使用方式：
 * const { generateImage, generateVideo, generatingImageIds } = useAIGeneration({
 *   onImageComplete: (image, shotId) => updateUI(image),
 *   onVideoComplete: (video, shotId) => updateUI(video),
 * });
 */

import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useTaskStore } from '@/stores/useTaskStore';
import { generateImageAsync } from '@/api/ai';
import { generateVideoAsync } from '@/api/video';
import { onTaskComplete, onTaskFailed } from '@/components/GlobalTaskPoller';

// ==================== 类型定义 ====================

export interface GeneratedImage {
  id: number;
  url: string;
  shotId?: number;
}

export interface GeneratedVideo {
  id: number;
  url: string;
  shotId?: number;
}

export interface ImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  referenceImages?: string[];
  shotId?: number;
  scriptId?: number;
}

export interface VideoParams {
  prompt?: string;
  model?: string;
  mode?: 't2v' | 'i2v' | 'flf2v' | 'ref2v';  // 视频生成模式
  duration?: number;
  resolution?: string;
  ratio?: string;  // 画面比例
  referenceImages?: string[];
  shotId?: number;
  scriptId?: number;
}

export interface UseAIGenerationOptions {
  onImageComplete?: (image: GeneratedImage, shotId?: number) => void;
  onVideoComplete?: (video: GeneratedVideo, shotId?: number) => void;
  onError?: (error: string, type: 'image' | 'video', shotId?: number) => void;
  showMessage?: boolean;
}

// ==================== Hook ====================

export function useAIGeneration(options: UseAIGenerationOptions = {}) {
  const { 
    onImageComplete, 
    onVideoComplete, 
    onError,
    showMessage = true 
  } = options;
  
  const { tasks, addTask } = useTaskStore();

  // 监听全局任务完成事件
  useEffect(() => {
    const unsubComplete = onTaskComplete((event) => {
      if (event.type === 'image') {
        const image: GeneratedImage = {
          id: event.result?.savedImage?.id || Date.now(),
          url: event.result?.savedImage?.url || event.result?.images?.[0]?.url,
          shotId: event.shotId,
        };
        if (image.url) {
          onImageComplete?.(image, event.shotId);
          if (showMessage) message.success('图片生成完成！');
        }
      } else if (event.type === 'video') {
        const video: GeneratedVideo = {
          id: event.result?.savedVideo?.id || Date.now(),
          url: event.result?.savedVideo?.url || event.result?.url,
          shotId: event.shotId,
        };
        if (video.url) {
          onVideoComplete?.(video, event.shotId);
          if (showMessage) message.success('视频生成完成！');
        }
      }
    });

    const unsubFailed = onTaskFailed((event) => {
      onError?.(event.error, event.type, event.shotId);
      if (showMessage) message.error(`生成失败: ${event.error}`);
    });

    return () => {
      unsubComplete();
      unsubFailed();
    };
  }, [onImageComplete, onVideoComplete, onError, showMessage]);

  // 生成图片
  const generateImage = useCallback(async (params: ImageParams): Promise<string | null> => {
    const { shotId, scriptId, aspectRatio, ...rest } = params;

    // 解析宽高
    let width = rest.width || 1024;
    let height = rest.height || 1024;
    
    if (aspectRatio) {
      const map: Record<string, [number, number]> = {
        '1:1': [1024, 1024],
        '16:9': [1280, 720],
        '9:16': [720, 1280],
        '4:3': [1024, 768],
        '3:4': [768, 1024],
      };
      [width, height] = map[aspectRatio] || [1024, 1024];
    }

    try {
      const res = await generateImageAsync({
        prompt: rest.prompt,
        model: rest.model || 'seedream',
        width,
        height,
        referenceImages: rest.referenceImages,
        shotId,
        scriptId,
      });

      if (res.success && res.data?.jobId) {
        addTask({ jobId: res.data.jobId, type: 'image', shotId });
        if (showMessage) message.info('图片任务已提交');
        return res.data.jobId;
      }
      throw new Error(res.message || '提交失败');
    } catch (error: any) {
      if (showMessage) message.error(error.message || '图片生成失败');
      onError?.(error.message, 'image', shotId);
      return null;
    }
  }, [addTask, showMessage, onError]);

  // 生成视频
  const generateVideo = useCallback(async (params: VideoParams): Promise<string | null> => {
    const { shotId, scriptId, referenceImages, ...rest } = params;

    // 根据图片数量自动推断 mode（如果没传的话）
    const imageCount = referenceImages?.length || 0;
    let mode = rest.mode;
    if (!mode) {
      if (imageCount === 0) mode = 't2v';
      else if (imageCount === 1) mode = 'i2v';
      else if (imageCount === 2) mode = 'flf2v';
      else mode = 'ref2v';
    }

    const requestData: any = {
      prompt: rest.prompt || '',
      model: rest.model || 'doubao-seedance-1-0-lite-i2v-250428',
      mode,
      duration: rest.duration || 5,
      resolution: rest.resolution || '720p',
      ratio: rest.ratio,  // 画面比例
      shotId,
      scriptId,
    };

    // 统一使用 referenceImages 数组
    if (referenceImages?.length) {
      requestData.referenceImages = referenceImages;
    }

    try {
      const res = await generateVideoAsync(requestData);

      if (res.success && res.data?.jobId) {
        addTask({ jobId: res.data.jobId, type: 'video', shotId, model: requestData.model });
        if (showMessage) message.info('视频任务已提交');
        return res.data.jobId;
      }
      throw new Error(res.message || '提交失败');
    } catch (error: any) {
      if (showMessage) message.error(error.message || '视频生成失败');
      onError?.(error.message, 'video', shotId);
      return null;
    }
  }, [addTask, showMessage, onError]);

  // 检查是否正在生成
  const isGenerating = useCallback((shotId: number, type?: 'image' | 'video') => {
    return tasks.some(t => t.shotId === shotId && (!type || t.type === type));
  }, [tasks]);

  // 获取正在生成的 ID 集合
  const getGeneratingIds = useCallback((type: 'image' | 'video') => {
    const ids = new Set<number | string>();
    tasks.forEach(t => {
      if (t.type === type && t.shotId) ids.add(t.shotId);
    });
    return ids;
  }, [tasks]);

  return {
    generateImage,
    generateVideo,
    isGenerating,
    tasks,
    generatingImageIds: getGeneratingIds('image'),
    generatingVideoIds: getGeneratingIds('video'),
  };
}

export default useAIGeneration;
