import { useEffect, useMemo, useState } from 'react';
import { Select, message } from 'antd';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedVideo } from '@/hooks/useAIGeneration';
import useVideoComposer from '@/hooks/useVideoComposer';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import GenerationComposer from '@/components/GenerationComposer';
import GenerationTimeline, {
  GenerationTimelineItem,
  GenerationTimelineItemType,
} from '@/components/GenerationTimeline';
import { storage } from '@/utils';
import { isModeAvailable } from '@/pages/ImageToVideo/config';

interface ModelConfig {
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

interface CreationVideoRecord extends GeneratedVideo {
  createdAt: string;
  prompt: string;
  modelName: string;
  resolution: string;
  ratio: string;
}

// 这一组常量只负责页面布局。
// 1. COMPOSER_HEIGHT: 底部固定输入区的大致高度
// 2. COMPOSER_BOTTOM_GAP: 输入区距离浏览器底部的悬浮间距
// 3. CONTENT_SAFE_GAP: 滚动结果区和底部输入区之间的额外安全距离
// 4. CONTENT_BOTTOM_SAFE_SPACE: 最终留给滚动内容的总底部留白
const COMPOSER_HEIGHT = 188;
const COMPOSER_BOTTOM_GAP = 24;
const CONTENT_SAFE_GAP = 28;
const CONTENT_BOTTOM_SAFE_SPACE = COMPOSER_HEIGHT + COMPOSER_BOTTOM_GAP + CONTENT_SAFE_GAP;

export default function CreationStudio() {
  const { videoModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();

  /**
   * models:
   * 页面层拿到的视频模型列表。
   * 这里保留在页面层，是因为模型属于业务数据源，而不是公共输入组件内部状态。
   */
  const [models, setModels] = useState<ModelConfig[]>([]);

  /**
   * loading:
   * 当前是否正在加载模型列表。
   */
  const [loading, setLoading] = useState(false);

  /**
   * selectorVisible:
   * 参考图选择弹窗是否打开。
   */
  const [selectorVisible, setSelectorVisible] = useState(false);

  /**
   * targetAudience:
   * 这里先保留一个通用的“目标人群”示例字段，
   * 用来演示公共输入区如何挂接页面专属配置。
   * 后面真正的业务页可以替换成更具体的字段，不需要再改公共组件结构。
   */
  const [targetAudience, setTargetAudience] = useState<'female' | 'male'>('female');

  /**
   * loadingPlaceholders:
   * 上方滚动流里需要展示几个“生成中占位卡片”。
   * 提交任务时先加，任务完成或失败后再减，目的是让用户立刻看到反馈。
   */
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(0);

  /**
   * isSubmitting:
   * 当前是否正在提交生成请求。
   * 这里保留一个短时提交态，避免同一批参数被用户在极短时间内连续触发多次。
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * generatedVideos:
   * 创作工作台当前页面保存的历史视频结果。
   * 这里做了本地持久化，页面刷新后仍然可以保留最近的滚动记录。
   */
  const [generatedVideos, setGeneratedVideos] = useState<CreationVideoRecord[]>(
    () => storage.get<CreationVideoRecord[]>('creationStudio_generatedVideos', []) ?? []
  );

  /**
   * useAIGeneration:
   * 负责提交生成任务、监听任务状态，以及在任务完成时回调页面。
   * 页面层只关心“完成后的结果怎么写入自己的滚动流”。
   */
  const { generateVideo } = useAIGeneration({
    onVideoComplete: (video) => {
      const currentModel = models.find(item => item.id === videoModel);

      /**
       * nextRecord:
       * 这里把提交当时的 prompt、模型、分辨率、比例一起固化下来。
       * 这样上方滚动区回显时不需要反查“当时页面输入框是什么状态”。
       */
      const nextRecord: CreationVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        modelName: currentModel?.name || videoModel,
        resolution,
        ratio: aspectRatio,
      };

      // 历史结果按“旧的在上，新的追加到底部”的顺序保存，
      // 这样滚动流天然就是越新的内容越靠下，符合聊天区阅读习惯。
      setGeneratedVideos(prev => [...prev, nextRecord]);
      setLoadingPlaceholders(prev => Math.max(0, prev - 1));
      refreshPoints();
    },
    onError: () => {
      setLoadingPlaceholders(prev => Math.max(0, prev - 1));
    },
    showMessage: true,
  });

  /**
   * 把历史结果持久化到 localStorage。
   * 这里不依赖后端历史记录，是因为当前只是保留当前浏览上下文。
   */
  useEffect(() => {
    storage.set('creationStudio_generatedVideos', generatedVideos);
  }, [generatedVideos]);

  /**
   * 页面初始化时加载模型列表，并兜底设置一个有效默认模型。
   */
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        await loadModels();
      } catch (error) {
        message.error('获取视频模型失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [loadModels]);

  /**
   * useModelStore 的 loadModels 是异步写入 store 的，
   * 所以这里单独监听 store 里的 videoModels，同步到页面局部状态和默认选中值。
   */
  useEffect(() => {
    setModels(videoModels);

    const currentModel = videoModels.find(model => model.id === videoModel) || videoModels[0];
    if (!currentModel) return;

    if (!videoModel || currentModel.id !== videoModel) {
      setVideoModel(currentModel.id);
    }
  }, [setVideoModel, videoModel, videoModels]);

  /**
   * useVideoComposer:
   * 负责通用的视频输入状态、模型联动和积分估算。
   * 页面层只保留自己的业务字段、提交校验和接口调用。
   */
  const { fields, derived, actions } = useVideoComposer({
    models,
    selectedModelId: videoModel,
    onModelChange: setVideoModel,
    currentPoints: currentUser?.points ?? 0,
  });

  const {
    selectedImages,
    prompt,
    duration,
    resolution,
    aspectRatio,
    batchCount,
    selectedMode,
    saveToLibrary,
    generateAudio,
  } = fields;

  const {
    supportedModes,
    maxImageCount,
    durationOptions,
    modelOptions,
    resolutionOptions,
    aspectRatioOptions,
    modeOptions,
    totalCredits,
    hasEnoughPoints,
  } = derived;

  const {
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
  } = actions;

  /**
   * timelineItems:
   * 把当前页面自己的视频记录映射成通用滚动流结构。
   * 现在先传 VIDEO 类型，后面如果要插入图片分析结果、文本建议，
   * 直接继续往这个数组里放 IMAGE / TEXT 类型即可，不需要重写组件。
   */
  const timelineItems = useMemo<GenerationTimelineItem[]>(
    () =>
      generatedVideos.map(item => ({
        id: item.id,
        type: GenerationTimelineItemType.VIDEO,
        createdAt: item.createdAt,
        requestText: item.prompt || '生成一段创作内容',
        description: item.prompt || '未记录描述',
        statusText: '创意已完成',
        url: item.url,
        metaTags: [
          { label: item.modelName },
          { label: item.resolution },
          { label: item.ratio },
        ].filter(tag => Boolean(tag.label)),
      })),
    [generatedVideos]
  );

  /**
   * handleGenerate:
   * 页面层真正的提交函数。
   * 业务校验和业务参数拼装保留在这里，而不是塞进公共组件。
   */
  const handleGenerate = async () => {
    if (!selectedImages.length) {
      message.warning('请先选择参考图');
      return;
    }

    if (!prompt.trim()) {
      message.warning('请先填写生成描述');
      return;
    }

    if (isSubmitting) {
      message.warning('任务提交中，请稍候');
      return;
    }

    if (!isModeAvailable(selectedMode, selectedImages.length, supportedModes)) {
      message.error('当前模式和参考图数量不匹配');
      return;
    }

    if (!hasEnoughPoints) {
      message.warning('积分不足，暂时无法生成');
      return;
    }

    setIsSubmitting(true);

    try {
      // 提交前先增加占位卡片，保证上方滚动区立刻出现“生成中”的反馈。
      setLoadingPlaceholders(prev => prev + batchCount);

      for (let index = 0; index < batchCount; index += 1) {
        await generateVideo({
          prompt: prompt.trim(),
          model: videoModel,
          mode: selectedMode as 't2v' | 'i2v' | 'flf2v' | 'ref2v',
          referenceImages: selectedImages,
          duration,
          resolution,
          ratio: aspectRatio,
          generateAudio,
          ...(saveToLibrary
            ? {
                saveToLibrary: true,
                /**
                 * libraryName / libraryTags:
                 * 这里只是演示一个通用落库策略。
                 * 后面不同业务页如果有自己的素材归档逻辑，可以在页面层自行替换。
                 */
                libraryName: `创作视频_${new Date().toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                libraryTags: ['创作工作台', '视频生成', targetAudience === 'female' ? '女生' : '男生'],
              }
            : {}),
        });
      }
    } finally {
      // 这里故意保留一个极短延迟，再恢复提交态，
      // 目的是避免按钮 loading 闪一下就消失，导致交互观感过于生硬。
      window.setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  /**
   * 删除指定索引的参考图。
   */
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  /**
   * 下载生成好的视频。
   * 下载逻辑继续放在页面层，是为了方便不同页面自定义文件名、埋点或权限处理。
   */
  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `creation-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('视频已开始下载');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: `24px 24px ${CONTENT_BOTTOM_SAFE_SPACE}px`,
        background: '#f7f8fa',
      }}
    >
      {/* 上半部分只负责滚动展示区。
          这里已经切到统一的消息流模型，不再和“视频列表”强绑定。 */}
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            minHeight: `calc(100vh - ${CONTENT_BOTTOM_SAFE_SPACE + 48}px)`,
            padding: '8px 0',
            overflowY: 'auto',
          }}
        >
          <GenerationTimeline
            items={timelineItems}
            loadingPlaceholders={loadingPlaceholders}
            bottomSafeSpace={CONTENT_BOTTOM_SAFE_SPACE}
            emptyDescription="这里先作为创作工作台的滚动展示区域"
            credits={totalCredits}
            generatingText="任务已提交，正在生成视频内容..."
            downloadText="下载视频"
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* 下半部分是固定悬浮的公共输入区。 */}
      <div
        style={{
          position: 'fixed',
          left: 24,
          right: 24,
          bottom: 24,
          zIndex: 20,
        }}
      >
        <GenerationComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          promptPlaceholder="输入文字，描述你想创作的视频内容，比如：一个玻璃香水瓶在柔光台面上缓慢旋转，镜头从近景推进到特写，突出通透质感和包装细节。"
          selectedImages={selectedImages}
          maxImageCount={maxImageCount}
          onOpenImageSelector={() => setSelectorVisible(true)}
          onRemoveImage={handleRemoveImage}
          modelValue={videoModel}
          modelOptions={modelOptions}
          onModelChange={handleModelChange}
          resolutionValue={resolution}
          resolutionOptions={resolutionOptions}
          onResolutionChange={value => setResolution(value)}
          aspectRatioValue={aspectRatio}
          aspectRatioOptions={aspectRatioOptions}
          onAspectRatioChange={value => setAspectRatio(value)}
          modeValue={selectedMode}
          modeOptions={modeOptions}
          onModeChange={value => setSelectedMode(value)}
          durationValue={duration}
          durationOptions={durationOptions}
          onDurationChange={value => setDuration(value)}
          batchCountValue={batchCount}
          batchCountMax={10}
          onBatchCountChange={value => setBatchCount(value)}
          saveToLibraryConfig={{
            checked: saveToLibrary,
            label: '存素材库',
            onChange: setSaveToLibrary,
          }}
          generateAudioConfig={{
            checked: generateAudio,
            label: '生成音频',
            onChange: setGenerateAudio,
          }}
          credits={totalCredits}
          currentPoints={currentUser?.points ?? 0}
          submitDisabled={loading || !hasEnoughPoints}
          submitLoading={isSubmitting}
          onSubmit={handleGenerate}
          /**
           * extraConfigContent:
           * 演示页面专属配置如何插入到公共输入区里。
           * 当前先放一个“目标人群”示例，后面真实业务页可以替换为自己的专属字段。
           */
          extraConfigContent={
            <Select
              value={targetAudience}
              onChange={value => setTargetAudience(value)}
              variant="borderless"
              options={[
                { label: '女生', value: 'female' },
                { label: '男生', value: 'male' },
              ]}
              style={{
                minWidth: 86,
                height: 34,
                background: '#f7f8fa',
                borderRadius: 999,
              }}
            />
          }
          visibility={{
            /**
             * 这里先保留模型选择。
             * 如果后面某个业务页固定成某一个模型：
             * 1. 页面层直接持有固定 model
             * 2. 这里改成 model: false
             * 3. 如果需要只读展示模型名，再传 modelFixedLabel
             */
            model: true,
          }}
        />
      </div>

      {/* 参考图选择器仍然留在页面层，因为它和业务图片来源、选择回填强相关。 */}
      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={images => {
          setSelectedImages(images);
          setSelectorVisible(false);
        }}
        maxCount={maxImageCount}
        defaultImages={selectedImages}
      />
    </div>
  );
}
