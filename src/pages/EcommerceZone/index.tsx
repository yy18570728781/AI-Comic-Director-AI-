import { useEffect, useState } from 'react';
import { Button, Card, Empty, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedVideo } from '@/hooks/useAIGeneration';
import useVideoComposer from '@/hooks/useVideoComposer';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import GenerationComposer from '@/components/GenerationComposer';
import { storage } from '@/utils';
import { isModeAvailable } from '@/pages/ImageToVideo/config';

const { Text, Paragraph } = Typography;

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

interface EcommerceVideoRecord extends GeneratedVideo {
  createdAt: string;
  prompt: string;
  modelName: string;
  resolution: string;
  ratio: string;
}

// 这组常量只负责页面布局：
// 1. COMPOSER_HEIGHT: 底部固定输入区的预估高度
// 2. COMPOSER_BOTTOM_GAP: 输入区距离底部的悬浮距离
// 3. CONTENT_SAFE_GAP: 上方滚动区和输入区之间的额外安全间距
// 4. CONTENT_BOTTOM_SAFE_SPACE: 最终需要预留给滚动内容的底部空间
const COMPOSER_HEIGHT = 188;
const COMPOSER_BOTTOM_GAP = 24;
const CONTENT_SAFE_GAP = 28;
const CONTENT_BOTTOM_SAFE_SPACE = COMPOSER_HEIGHT + COMPOSER_BOTTOM_GAP + CONTENT_SAFE_GAP;

export default function EcommerceZone() {
  const { videoModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();

  /**
   * models:
   * 页面拿到的全部视频模型列表。
   * 这里保留在页面层，因为模型列表本身是页面数据源，不属于公共输入组件内部。
   */
  const [models, setModels] = useState<ModelConfig[]>([]);

  /**
   * loading:
   * 当前是否正在拉取模型列表。
   */
  const [loading, setLoading] = useState(false);

  /**
   * selectorVisible:
   * 参考图选择器弹窗是否打开。
   */
  const [selectorVisible, setSelectorVisible] = useState(false);

  /**
   * targetGender:
   * 电商专区自己的业务字段。
   * 这个字段不会下沉到公共 hook，因为它不是“所有视频生成页都通用”的输入项。
   */
  const [targetGender, setTargetGender] = useState<'female' | 'male'>('female');

  /**
   * loadingPlaceholders:
   * 当前上方结果流里需要展示几个“生成中占位卡片”。
   * 用户一提交任务就先加占位，生成完成后再减掉。
   */
  const [loadingPlaceholders, setLoadingPlaceholders] = useState<number>(0);

  /**
   * isSubmitting:
   * 当前是否正在提交生成请求。
   * 作用：防止短时间重复点提交按钮。
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * generatedVideos:
   * 电商专区上方滚动区要展示的视频结果列表。
   * 这里做了本地持久化，页面刷新后仍能保留历史结果。
   */
  const [generatedVideos, setGeneratedVideos] = useState<EcommerceVideoRecord[]>(
    () => storage.get<EcommerceVideoRecord[]>('ecommerceZone_generatedVideos', []) ?? []
  );

  /**
   * useAIGeneration:
   * 负责真正的异步生成提交流程和全局任务完成回调。
   * 页面这里主要订阅：
   * 1. onVideoComplete: 任务成功后把结果塞进滚动区
   * 2. onError: 出错时把占位卡片数量修正回来
   */
  const { generateVideo, tasks, generatingVideoIds } = useAIGeneration({
    onVideoComplete: video => {
      const currentModel = models.find(item => item.id === videoModel);

      /**
       * nextRecord:
       * 页面层最终要展示的结果记录。
       * 这里额外把“提交当时”的 prompt / model / resolution / ratio 一起存下来，
       * 这样上方结果区回显时，不需要再反查当时的输入状态。
       */
      const nextRecord: EcommerceVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        modelName: currentModel?.name || videoModel,
        resolution,
        ratio: aspectRatio,
      };

      // 结果流按“时间从上到下”展示：
      // 旧结果在上，最新结果追加到下面，和当前页面的视觉阅读顺序保持一致。
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
   * generatedVideos 持久化到 localStorage。
   * 作用：用户刷新后仍能看到刚才生成的结果流。
   */
  useEffect(() => {
    storage.set('ecommerceZone_generatedVideos', generatedVideos);
  }, [generatedVideos]);

  /**
   * 页面初始化时拉取模型列表。
   * 这里只做两件事：
   * 1. 拿到 models 数据源
   * 2. 给 store 里的 videoModel 设置一个合法默认值
   *
   * 真正“模型切换后如何联动输入项”的逻辑，不在这里处理，
   * 而是交给 useVideoComposer。
   */
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        await loadModels();
        setModels(videoModels);

        const currentModel = videoModels.find(model => model.id === videoModel) || videoModels[0];
        if (!currentModel) return;

        if (!videoModel || currentModel.id !== videoModel) {
          setVideoModel(currentModel.id);
        }
      } catch (error) {
        message.error('获取视频模型失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [loadModels, setVideoModel, videoModel, videoModels]);

  /**
   * useVideoComposer:
   * 这一层是“通用输入状态适配层”。
   * 它负责：
   * 1. 管理输入区的通用状态
   * 2. 计算选项列表
   * 3. 做模型联动
   * 4. 计算积分预估
   *
   * 页面层则保留：
   * 1. 电商专属字段
   * 2. 提交校验
   * 3. 接口调用
   * 4. 结果流展示
   */
  const {
    fields,
    derived,
    actions,
  } = useVideoComposer({
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
   * pendingTasks:
   * 当前任务队列里，仍处于 pending 状态的视频任务。
   */
  const pendingTasks = tasks.filter(task => task.type === 'video');

  /**
   * generating:
   * 当前页面是否存在“生成进行中”的任务。
   * 这个值用于决定上方结果区是否展示生成中状态。
   */
  const generating =
    generatingVideoIds.size > 0 || pendingTasks.length > 0 || loadingPlaceholders > 0;

  /**
   * handleGenerate:
   * 页面层真正的提交函数。
   * 这里故意保留在页面层，而不是塞进公共组件 / hook，
   * 因为提交校验和提交参数是业务规则，不是公共输入区规则。
   */
  const handleGenerate = async () => {
    if (!selectedImages.length) {
      message.warning('请先选择商品参考图');
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
      // 提交前先放占位卡片，保证上方滚动区立刻有反馈。
      setLoadingPlaceholders(prev => prev + batchCount);

      for (let i = 0; i < batchCount; i += 1) {
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
                 * 这些属于“电商专区自己的素材管理策略”，
                 * 所以仍然留在页面层组装，而不是下沉到公共 hook 或公共组件。
                 */
                libraryName: `电商视频_${new Date().toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                libraryTags: [
                  '电商专区',
                  '视频生成',
                  targetGender === 'female' ? '女生' : '男生',
                ],
              }
            : {}),
        });
      }
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  /**
   * handleRemoveImage:
   * 删除指定索引的参考图。
   */
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  /**
   * handleDownload:
   * 下载结果视频。
   */
  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecommerce-video-${Date.now()}.mp4`;
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
      {/* 上半部分只负责结果流展示，不负责输入区细节。 */}
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            minHeight: `calc(100vh - ${CONTENT_BOTTOM_SAFE_SPACE + 48}px)`,
            padding: '8px 0',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 920,
              margin: '0 auto',
              // 这里要用完整的底部安全距离，而不只是一个小间隙，
              // 否则当内容刚好贴近底部时，会被固定输入区“吃掉”视觉空间。
              paddingBottom: CONTENT_BOTTOM_SAFE_SPACE,
            }}
          >
            {generatedVideos.length === 0 && loadingPlaceholders === 0 ? (
              <div
                style={{
                  minHeight: 520,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="这里先作为电商专区的滚动展示区域"
                />
              </div>
            ) : (
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <div style={{ paddingTop: 8 }}>
                  <Text style={{ fontSize: 28, fontWeight: 600, color: '#111827' }}>今天</Text>
                </div>

                {generatedVideos.map(video => (
                  <div key={`${video.id}-${video.createdAt}`} style={{ padding: '6px 0 12px' }}>
                    <div
                      style={{
                        marginBottom: 10,
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: 220,
                          padding: '10px 14px',
                          borderRadius: 18,
                          background: '#f0f1f3',
                          color: '#374151',
                          fontSize: 14,
                        }}
                      >
                        {video.prompt || '生成一个带货视频'}
                      </div>
                    </div>

                    <Card
                      bordered={false}
                      style={{
                        width: '100%',
                        borderRadius: 18,
                        background: '#ffffff',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <Space direction="vertical" size={14} style={{ width: '100%' }}>
                        <Tag
                          style={{
                            width: 'fit-content',
                            margin: 0,
                            borderRadius: 999,
                            background: '#eaf6fb',
                            borderColor: '#d7edf7',
                            color: '#4b5563',
                          }}
                        >
                          创意已完成
                        </Tag>
                        <video
                          src={video.url}
                          controls
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 14,
                            background: '#000',
                          }}
                        />
                        <Paragraph style={{ marginBottom: 0, color: '#374151' }}>
                          {video.prompt || '未记录描述'}
                        </Paragraph>
                        <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                          以上内容由 AI 生成，本次消耗约 {totalCredits} 积分
                        </Text>
                        <Space size={[8, 8]} wrap>
                          <Button onClick={() => handleDownload(video.url)}>下载视频</Button>
                          <Tag>{video.modelName}</Tag>
                          <Tag>{video.resolution}</Tag>
                          <Tag>{video.ratio}</Tag>
                        </Space>
                      </Space>
                    </Card>
                  </div>
                ))}

                {Array.from({ length: loadingPlaceholders }).map((_, index) => (
                  <div key={`loading-${index}`} style={{ padding: '16px 0 12px' }}>
                    <Card
                      bordered={false}
                      style={{
                        width: '100%',
                        borderRadius: 18,
                        background: '#ffffff',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Tag
                          color="processing"
                          style={{ width: 'fit-content', margin: 0, borderRadius: 999 }}
                        >
                          生成中
                        </Tag>
                        <div
                          style={{
                            height: 220,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 14,
                            background: '#f3f6f9',
                          }}
                        >
                          <Spin />
                        </div>
                        <Text style={{ color: '#6b7280' }}>任务已提交，正在生成视频内容...</Text>
                      </Space>
                    </Card>
                  </div>
                ))}
              </Space>
            )}
          </div>
        </div>
      </div>

      {/* 下半部分是固定悬浮的通用输入区。 */}
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
          promptPlaceholder="输入文字，描述你想创作的电商视频内容，比如：一个护肤品瓶身在柔光台面上缓慢旋转，突出通透质感和高级包装。"
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
           * 这里演示“页面专属配置如何插入公共组件”。
           * 电商专区现在插的是 gender，下次换成别的业务字段也还是这个位置。
           */
          extraConfigContent={
            <Select
              value={targetGender}
              onChange={value => setTargetGender(value)}
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
             * 如果以后电商专区固定成某个模型：
             * 1. 直接让页面持有固定的 model 值
             * 2. 把这里改成 model: false
             * 3. 如果还想显示模型名，再传 modelFixedLabel
             */
            model: true,
          }}
        />
      </div>

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
