import { useEffect, useMemo, useState } from 'react';
import { getMaxImageCount, getRecommendedMode, modeLabels } from '@/pages/ImageToVideo/config';

export interface VideoComposerModel {
  id: string;
  name: string;
  description: string;
  pricing?: {
    billingMode?: 'per_second' | 'per_video';
    pricingTiers?: Array<{
      resolution: string;
      creditsPerSecond: number;
    }>;
    perVideo?: {
      creditsPerVideo?: number;
    };
  };
  config?: {
    supportedModes?: string[];
    resolutions?: string[];
    aspectRatios?: string[];
    maxDuration?: number;
    minDuration?: number;
    maxImages?: number;
  };
}

export interface ComposerOption {
  label: string;
  value: string | number;
  title?: string;
}

interface UseVideoComposerOptions {
  models: VideoComposerModel[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  currentPoints?: number;
}

/**
 * 结构化返回约定：
 * - model: 当前模型与模型配置
 * - fields: 输入区当前值
 * - derived: 派生选项与计算结果
 * - actions: 对 fields 的更新动作
 */
export function useVideoComposer({
  models,
  selectedModelId,
  onModelChange,
  currentPoints = 0,
}: UseVideoComposerOptions) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<string>('ref2v');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);

  const currentModel = useMemo(
    () => models.find(model => model.id === selectedModelId),
    [models, selectedModelId]
  );

  const modelConfig = currentModel?.config;
  const supportedModes = modelConfig?.supportedModes || [];
  const maxImageCount = getMaxImageCount(supportedModes, modelConfig?.maxImages);
  const minDuration = modelConfig?.minDuration ?? 1;
  const maxDuration = modelConfig?.maxDuration ?? 10;

  const durationOptions = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, maxDuration - minDuration + 1) },
        (_, index) => minDuration + index
      ),
    [maxDuration, minDuration]
  );

  const modelOptions: ComposerOption[] = useMemo(
    () =>
      models.map(model => ({
        label: model.name,
        value: model.id,
        title: model.description,
      })),
    [models]
  );

  const resolutionOptions: ComposerOption[] = useMemo(
    () =>
      (modelConfig?.resolutions || ['720p']).map(item => ({
        label: item,
        value: item,
      })),
    [modelConfig?.resolutions]
  );

  const aspectRatioOptions: ComposerOption[] = useMemo(
    () =>
      (modelConfig?.aspectRatios || ['16:9']).map(item => ({
        label: item,
        value: item,
      })),
    [modelConfig?.aspectRatios]
  );

  const modeOptions: ComposerOption[] = useMemo(
    () =>
      supportedModes.map(mode => ({
        label: modeLabels[mode] || mode,
        value: mode,
      })),
    [supportedModes]
  );

  const pricing = currentModel?.pricing;
  const billingMode = pricing?.billingMode ?? 'per_second';
  const pricingTiers = Array.isArray(pricing?.pricingTiers) ? pricing.pricingTiers : [];
  const matchedTier = pricingTiers.find(item => item.resolution === resolution) ?? pricingTiers[0];
  const creditsPerSecond = matchedTier?.creditsPerSecond ?? 2;
  const creditsPerVideo = pricing?.perVideo?.creditsPerVideo ?? creditsPerSecond;
  const totalCredits =
    billingMode === 'per_video'
      ? creditsPerVideo * batchCount
      : creditsPerSecond * duration * batchCount;
  const hasEnoughPoints = currentPoints >= totalCredits;

  useEffect(() => {
    const recommendedMode = getRecommendedMode(
      selectedImages.length,
      supportedModes,
      selectedMode
    );

    if (recommendedMode !== selectedMode) {
      setSelectedMode(recommendedMode);
    }
  }, [selectedImages.length, selectedMode, supportedModes]);

  useEffect(() => {
    if (modelConfig?.resolutions?.[0]) {
      setResolution(prev =>
        modelConfig.resolutions?.includes(prev) ? prev : modelConfig.resolutions[0]
      );
    }

    if (modelConfig?.aspectRatios?.[0]) {
      setAspectRatio(prev =>
        modelConfig.aspectRatios?.includes(prev) ? prev : modelConfig.aspectRatios[0]
      );
    }

    setDuration(prev => {
      if (prev < minDuration) return minDuration;
      if (prev > maxDuration) return maxDuration;
      return prev;
    });
  }, [maxDuration, minDuration, modelConfig?.aspectRatios, modelConfig?.resolutions]);

  const handleModelChange = (modelId: string) => {
    onModelChange(modelId);
  };

  const fields = {
    selectedImages,
    prompt,
    duration,
    resolution,
    aspectRatio,
    batchCount,
    selectedMode,
    saveToLibrary,
    generateAudio,
  };

  const derived = {
    supportedModes,
    maxImageCount,
    minDuration,
    maxDuration,
    durationOptions,
    modelOptions,
    resolutionOptions,
    aspectRatioOptions,
    modeOptions,
    totalCredits,
    hasEnoughPoints,
  };

  const actions = {
    setSelectedImages,
    setPrompt,
    setDuration,
    setResolution,
    setAspectRatio,
    setBatchCount,
    setSelectedMode,
    setSaveToLibrary,
    setGenerateAudio,
    handleModelChange,
  };

  const model = {
    current: currentModel,
    config: modelConfig,
    selectedId: selectedModelId,
  };

  return {
    model,
    fields,
    derived,
    actions,
  };
}

export default useVideoComposer;
