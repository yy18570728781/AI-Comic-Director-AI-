import { useModelStore } from '@/stores/useModelStore';

/**
 * 检查当前视频模型是否支持特定功能
 */
export function useVideoModelSupport() {
  const { videoModel, videoModels } = useModelStore();
  const currentVideoModel = videoModels.find((m) => m.id === videoModel);

  // 检查是否支持首尾帧模式
  const supportsFirstLastFrame =
    (currentVideoModel as any)?.config?.supportedModes?.includes('flf2v') ?? false;

  // 检查是否支持参考图模式
  const supportsReferenceImages =
    (currentVideoModel as any)?.config?.supportedModes?.includes('ref2v') ?? false;

  // 检查是否支持文生视频
  const supportsTextToVideo =
    (currentVideoModel as any)?.config?.supportedModes?.includes('t2v') ?? false;

  // 检查是否支持图生视频
  const supportsImageToVideo =
    (currentVideoModel as any)?.config?.supportedModes?.includes('i2v') ?? false;

  return {
    supportsFirstLastFrame,
    supportsReferenceImages,
    supportsTextToVideo,
    supportsImageToVideo,
    currentVideoModel,
  };
}
