import { useEffect, useMemo, useState } from 'react';
import { getMaxImageCount, getRecommendedMode, modeLabels } from '@/pages/ImageToVideo/config';

/**
 * 视频模型的最小结构约定。
 * 这里只保留输入区和积分计算真正关心的字段，避免 hook 和整个模型实体强耦合。
 */
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

/**
 * 给下拉组件使用的统一选项结构。
 */
export interface ComposerOption {
  label: string;
  value: string | number;
  title?: string;
}

interface UseVideoComposerOptions {
  /**
   * models:
   * 当前页面能用的视频模型列表。
   */
  models: VideoComposerModel[];

  /**
   * selectedModelId:
   * 页面层当前选中的模型 id。
   * 这里不自己维护模型选中状态，是为了和全局 store 保持单一数据源。
   */
  selectedModelId: string;

  /**
   * onModelChange:
   * 当 hook 判断要切模型，或者 UI 触发切模型时，回调给页面层处理。
   */
  onModelChange: (modelId: string) => void;

  /**
   * currentPoints:
   * 当前用户可用积分，用于生成前的前端预估提示。
   */
  currentPoints?: number;
}

/**
 * 通用视频输入状态 hook。
 *
 * 结构化返回约定：
 * 1. model: 当前模型和模型配置
 * 2. fields: 表单当前值
 * 3. derived: 由模型和字段推导出的选项、限制和积分结果
 * 4. actions: 对 fields 的更新动作
 *
 * 为什么这么拆：
 * 1. 页面读代码时能快速看出“原始状态”和“推导结果”的区别
 * 2. 公共组件可以直接拿 fields / derived 渲染
 * 3. 页面提交时也更容易只取自己关心的字段
 */
export function useVideoComposer({
  models,
  selectedModelId,
  onModelChange,
  currentPoints = 0,
}: UseVideoComposerOptions) {
  /**
   * 这几组 state 都是“输入区本身”的受控字段。
   * 它们属于通用视频创作面板，不属于某个具体页面的业务扩展字段。
   */
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<string>('ref2v');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);

  /**
   * currentModel:
   * 根据页面层当前选中的模型 id，找出完整模型对象。
   * 用 useMemo 是因为后面很多派生值都依赖它，集中缓存更清晰。
   */
  const currentModel = useMemo(
    () => models.find((model) => model.id === selectedModelId),
    [models, selectedModelId]
  );

  /**
   * modelConfig:
   * 当前模型的能力配置，后面的模式、分辨率、比例、时长限制都基于它推导。
   */
  const modelConfig = currentModel?.config;
  const supportedModes = modelConfig?.supportedModes || [];
  const maxImageCount = getMaxImageCount(supportedModes, modelConfig?.maxImages);
  const minDuration = modelConfig?.minDuration ?? 1;
  const maxDuration = modelConfig?.maxDuration ?? 10;

  /**
   * durationOptions:
   * 根据模型返回的最小时长和最大时长，生成前端可选时长列表。
   */
  const durationOptions = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, maxDuration - minDuration + 1) },
        (_, index) => minDuration + index
      ),
    [maxDuration, minDuration]
  );

  /**
   * modelOptions / resolutionOptions / aspectRatioOptions / modeOptions:
   * 统一把模型配置转成 Select 可直接消费的结构，减少页面层重复 map。
   */
  const modelOptions: ComposerOption[] = useMemo(
    () =>
      models.map((model) => ({
        label: model.name,
        value: model.id,
        title: model.description,
      })),
    [models]
  );

  const resolutionOptions: ComposerOption[] = useMemo(
    () =>
      (modelConfig?.resolutions || ['720p']).map((item) => ({
        label: item,
        value: item,
      })),
    [modelConfig?.resolutions]
  );

  const aspectRatioOptions: ComposerOption[] = useMemo(
    () =>
      (modelConfig?.aspectRatios || ['16:9']).map((item) => ({
        label: item,
        value: item,
      })),
    [modelConfig?.aspectRatios]
  );

  const modeOptions: ComposerOption[] = useMemo(
    () =>
      supportedModes.map((mode) => ({
        label: modeLabels[mode] || mode,
        value: mode,
      })),
    [supportedModes]
  );

  /**
   * 积分估算逻辑。
   *
   * 为什么放在 hook 里而不是页面层：
   * 1. 这是通用视频输入区能力，不是某个页面专属规则
   * 2. 公共组件要展示积分标签，需要一个稳定的统一来源
   * 3. 后面别的页面复用时就不用再复制一份计费推导
   */
  const pricing = currentModel?.pricing;
  const billingMode = pricing?.billingMode ?? 'per_second';
  const pricingTiers = Array.isArray(pricing?.pricingTiers) ? pricing.pricingTiers : [];
  const matchedTier =
    pricingTiers.find((item) => item.resolution === resolution) ?? pricingTiers[0];
  const creditsPerSecond = matchedTier?.creditsPerSecond ?? 2;
  const creditsPerVideo = pricing?.perVideo?.creditsPerVideo ?? creditsPerSecond;
  const totalCredits =
    billingMode === 'per_video'
      ? creditsPerVideo * batchCount
      : creditsPerSecond * duration * batchCount;
  const hasEnoughPoints = currentPoints >= totalCredits;

  /**
   * 当参考图数量变化时，自动修正当前模式。
   *
   * 为什么需要这个 effect：
   * 比如用户原来选的是“首尾帧模式”，后来删成 1 张图了，
   * 如果不自动纠正，前端会保留一个实际上已经不合法的模式值。
   */
  useEffect(() => {
    const recommendedMode = getRecommendedMode(selectedImages.length, supportedModes, selectedMode);

    if (recommendedMode !== selectedMode) {
      setSelectedMode(recommendedMode);
    }
  }, [selectedImages.length, selectedMode, supportedModes]);

  /**
   * 当模型变化时，同步修正分辨率、比例和时长。
   *
   * 为什么不是直接重置成默认值：
   * 因为如果当前值在新模型里仍然合法，就应该尽量保留用户选择，减少打断感。
   */
  useEffect(() => {
    if (modelConfig?.resolutions?.[0]) {
      setResolution((prev) =>
        modelConfig.resolutions
          ? modelConfig.resolutions.includes(prev)
            ? prev
            : modelConfig.resolutions[0]
          : prev
      );
    }

    if (modelConfig?.aspectRatios?.[0]) {
      setAspectRatio((prev) =>
        modelConfig.aspectRatios
          ? modelConfig.aspectRatios.includes(prev)
            ? prev
            : modelConfig.aspectRatios[0]
          : prev
      );
    }

    setDuration((prev) => {
      if (prev < minDuration) return minDuration;
      if (prev > maxDuration) return maxDuration;
      return prev;
    });
  }, [maxDuration, minDuration, modelConfig?.aspectRatios, modelConfig?.resolutions]);

  /**
   * 目前模型切换动作只是简单转发。
   * 单独保留这个函数，是为了后面如果切模型前后还要埋点、清状态、弹确认，改这里即可。
   */
  const handleModelChange = (modelId: string) => {
    onModelChange(modelId);
  };

  /**
   * fields:
   * 原始输入状态集合。
   */
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

  /**
   * derived:
   * 由模型能力和输入状态共同推导出来的结果。
   * 页面和公共组件优先消费这里，而不是自己再重复做二次计算。
   */
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

  /**
   * actions:
   * 对外暴露的状态修改动作。
   * 统一收口到这里，是为了让页面读起来像在使用一个“小型表单状态机”。
   */
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

  /**
   * model:
   * 当前模型上下文。
   * 单独返回这个对象，是为了页面如果后面要读更多模型级信息时，有一个集中入口。
   */
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
