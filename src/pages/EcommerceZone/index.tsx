import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  RocketOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedVideo } from '@/hooks/useAIGeneration';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { storage } from '@/utils';
import {
  getMaxImageCount,
  getRecommendedMode,
  isModeAvailable,
  modeLabels,
} from '@/pages/ImageToVideo/config';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

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

// 底部输入区固定悬浮时，给上方滚动内容预留安全距离，避免最后一张卡片被遮住。
const COMPOSER_HEIGHT = 188;
const COMPOSER_BOTTOM_GAP = 24;
const CONTENT_SAFE_GAP = 28;
const CONTENT_BOTTOM_SAFE_SPACE = COMPOSER_HEIGHT + COMPOSER_BOTTOM_GAP + CONTENT_SAFE_GAP;

export default function EcommerceZone() {
  const { videoModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();

  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [loadingPlaceholders, setLoadingPlaceholders] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('ref2v');
  const [generatedVideos, setGeneratedVideos] = useState<EcommerceVideoRecord[]>(
    () => storage.get<EcommerceVideoRecord[]>('ecommerceZone_generatedVideos', []) ?? []
  );

  const { generateVideo, tasks, generatingVideoIds } = useAIGeneration({
    onVideoComplete: (video) => {
      const currentModel = models.find((item) => item.id === videoModel);

      // 保存生成时的表单快照，方便电商专区上方的内容区直接展示最近结果。
      const nextRecord: EcommerceVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        modelName: currentModel?.name || videoModel,
        resolution,
        ratio: aspectRatio,
      };

      setGeneratedVideos((prev) => [nextRecord, ...prev]);
      setLoadingPlaceholders((prev) => Math.max(0, prev - 1));
      refreshPoints();
    },
    onError: () => {
      setLoadingPlaceholders((prev) => Math.max(0, prev - 1));
    },
    showMessage: true,
  });

  useEffect(() => {
    storage.set('ecommerceZone_generatedVideos', generatedVideos);
  }, [generatedVideos]);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        await loadModels();
        setModels(videoModels);

        const currentModel = videoModels.find((model) => model.id === videoModel) || videoModels[0];
        if (!currentModel) return;

        if (!videoModel || currentModel.id !== videoModel) {
          setVideoModel(currentModel.id);
        }

        if (currentModel.config?.resolutions?.[0]) {
          setResolution(currentModel.config.resolutions[0]);
        }
        if (currentModel.config?.aspectRatios?.[0]) {
          setAspectRatio(currentModel.config.aspectRatios[0]);
        }
      } catch (error) {
        message.error('获取视频模型失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [loadModels, setVideoModel, videoModel, videoModels]);

  const currentModel = useMemo(
    () => models.find((model) => model.id === videoModel),
    [models, videoModel]
  );

  const modelConfig = currentModel?.config;
  const supportedModes = modelConfig?.supportedModes || [];
  const maxImageCount = getMaxImageCount(supportedModes, modelConfig?.maxImages);
  const minDuration = modelConfig?.minDuration ?? 1;
  const maxDuration = modelConfig?.maxDuration ?? 10;
  const durationOptions = Array.from(
    { length: Math.max(1, maxDuration - minDuration + 1) },
    (_, index) => minDuration + index
  );
  const pendingTasks = tasks.filter((task) => task.type === 'video');
  const generating =
    generatingVideoIds.size > 0 || pendingTasks.length > 0 || loadingPlaceholders > 0;

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
  const hasEnoughPoints = (currentUser?.points ?? 0) >= totalCredits;

  useEffect(() => {
    const recommended = getRecommendedMode(selectedImages.length, supportedModes, selectedMode);
    if (recommended !== selectedMode) {
      setSelectedMode(recommended);
    }
  }, [selectedImages.length, selectedMode, supportedModes]);

  const handleModelChange = (value: string) => {
    setVideoModel(value);

    const nextModel = models.find((model) => model.id === value);
    if (nextModel?.config?.resolutions?.[0]) {
      setResolution(nextModel.config.resolutions[0]);
    }
    if (nextModel?.config?.aspectRatios?.[0]) {
      setAspectRatio(nextModel.config.aspectRatios[0]);
    }

    const nextMinDuration = nextModel?.config?.minDuration ?? 1;
    const nextMaxDuration = nextModel?.config?.maxDuration ?? 10;
    setDuration((prev) => {
      if (prev < nextMinDuration) return nextMinDuration;
      if (prev > nextMaxDuration) return nextMaxDuration;
      return prev;
    });
  };

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
      // 先增加占位数量，让上方内容区能立即感知到任务已提交。
      setLoadingPlaceholders((prev) => prev + batchCount);

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
                libraryName: `电商视频_${new Date().toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                libraryTags: ['电商专区', '视频生成'],
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

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

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
              paddingBottom: CONTENT_SAFE_GAP,
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

                {Array.from({ length: loadingPlaceholders }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    style={{
                      padding: '16px 0 12px',
                    }}
                  >
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

                {generatedVideos.map((video) => (
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
              </Space>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 24,
          right: 24,
          bottom: 24,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <Card
            bordered={false}
            style={{
              maxWidth: 920,
              margin: '0 auto',
              borderRadius: 24,
              border: '1px solid #eceff3',
              boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
              background: 'rgba(255, 255, 255, 0.98)',
            }}
            styles={{ body: { padding: 14 } }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '108px minmax(0, 1fr)',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedImages.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    {selectedImages.slice(0, 2).map((image, index) => (
                      <div key={`${image}-${index}`} style={{ position: 'relative' }}>
                        <Image
                          src={image}
                          preview={false}
                          style={{
                            width: '100%',
                            height: 72,
                            objectFit: 'cover',
                            borderRadius: 14,
                            border: '1px solid #edf0f4',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 18,
                            height: 18,
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            background: 'rgba(0,0,0,0.55)',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setSelectorVisible(true)}
                    style={{
                      height: 154,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 16,
                      border: '1px dashed #d9dfe7',
                      color: '#9aa4b2',
                      cursor: 'pointer',
                      background: '#fafbfc',
                    }}
                  >
                    <Space direction="vertical" size={6} style={{ alignItems: 'center' }}>
                      <PlusOutlined />
                      <Text style={{ fontSize: 12, color: '#9aa4b2' }}>参考图</Text>
                    </Space>
                  </div>
                )}

                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => setSelectorVisible(true)}
                  style={{
                    height: 32,
                    borderRadius: 12,
                    color: '#4b5563',
                    background: '#f7f8fa',
                  }}
                >
                  {selectedImages.length ? '重选' : '添加'}
                </Button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <TextArea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="输入文字，描述你想创作的电商视频内容，比如：一个护肤品瓶身在柔光台面上缓慢旋转，突出通透质感和高级包装。"
                  maxLength={1000}
                  autoSize={{ minRows: 5, maxRows: 7 }}
                  variant="borderless"
                  style={{
                    padding: 8,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#111827',
                    background: 'transparent',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <Select
                    value={videoModel}
                    onChange={handleModelChange}
                    options={models.map((model) => ({
                      label: model.name,
                      value: model.id,
                      title: model.description,
                    }))}
                    placeholder="模型"
                    variant="borderless"
                    suffixIcon={<VideoCameraOutlined style={{ color: '#6b7280' }} />}
                    style={{
                      minWidth: 148,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                  <Select
                    value={resolution}
                    onChange={setResolution}
                    options={(modelConfig?.resolutions || ['720p']).map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    variant="borderless"
                    style={{
                      minWidth: 92,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                  <Select
                    value={aspectRatio}
                    onChange={setAspectRatio}
                    options={(modelConfig?.aspectRatios || ['16:9']).map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    variant="borderless"
                    style={{
                      minWidth: 86,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                  <Select
                    value={selectedMode}
                    onChange={setSelectedMode}
                    options={supportedModes.map((mode) => ({
                      label: modeLabels[mode] || mode,
                      value: mode,
                    }))}
                    variant="borderless"
                    style={{
                      minWidth: 110,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                  <Select
                    value={duration}
                    onChange={setDuration}
                    variant="borderless"
                    suffixIcon={<ClockCircleOutlined style={{ color: '#6b7280' }} />}
                    popupMatchSelectWidth={172}
                    styles={{
                      popup: {
                        root: {
                          padding: 6,
                          borderRadius: 16,
                          background: '#ffffff',
                          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                        },
                      },
                    }}
                    optionRender={(option) => {
                      const active = Number(option.value) === duration;

                      return (
                        <div
                          style={{
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            borderRadius: 10,
                            color: '#374151',
                            background: active ? '#f4ecff' : 'transparent',
                          }}
                        >
                          <Space size={8}>
                            <ClockCircleOutlined style={{ color: '#111827' }} />
                            <span>{option.label}</span>
                          </Space>
                        </div>
                      );
                    }}
                    options={durationOptions.map((option) => ({
                      label: `${option}s`,
                      value: option,
                    }))}
                    style={{
                      minWidth: 90,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                  <InputNumber
                    min={1}
                    max={10}
                    value={batchCount}
                    onChange={(value) => setBatchCount(value || 1)}
                    style={{
                      width: 85,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                    addonAfter="份"
                  />
                  <Space
                    size={6}
                    style={{
                      height: 34,
                      padding: '0 12px',
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  >
                    <Switch size="small" checked={saveToLibrary} onChange={setSaveToLibrary} />
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>存素材库</Text>
                  </Space>
                  <Space
                    size={6}
                    style={{
                      height: 34,
                      padding: '0 12px',
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  >
                    <Switch size="small" checked={generateAudio} onChange={setGenerateAudio} />
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>生成音频</Text>
                  </Space>
                  <Tag
                    icon={<PictureOutlined />}
                    style={{
                      margin: 0,
                      height: 34,
                      lineHeight: '22px',
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: '#f7f8fa',
                      borderColor: '#f7f8fa',
                      color: '#4b5563',
                    }}
                  >
                    {selectedImages.length}/{maxImageCount} 图
                  </Tag>
                  <Tag
                    style={{
                      margin: 0,
                      height: 34,
                      lineHeight: '22px',
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: '#f7f8fa',
                      borderColor: '#f7f8fa',
                      color: '#4b5563',
                    }}
                  >
                    {totalCredits} 积分
                  </Tag>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, color: '#9aa4b2' }}>
                    当前积分 {currentUser?.points ?? 0}
                  </Text>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<RocketOutlined />}
                    onClick={handleGenerate}
                    loading={isSubmitting}
                    disabled={loading || !hasEnoughPoints}
                    style={{
                      width: 38,
                      height: 38,
                      boxShadow: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={(images) => {
          setSelectedImages(images);
          setSelectorVisible(false);
        }}
        maxCount={maxImageCount}
        defaultImages={selectedImages}
      />
    </div>
  );
}
