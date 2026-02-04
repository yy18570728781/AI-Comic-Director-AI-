import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Select,
  Space,
  Input,
  Row,
  Col,
  Spin,
  message,
  Tag,
  theme,
  Switch,
  InputNumber,
  Image,
} from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { useAIGeneration, GeneratedVideo } from '@/hooks/useAIGeneration';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { getModelList } from '@/api/model';

const { TextArea } = Input;

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  config?: {
    supportedModes?: string[];  // 支持的生成模式
    resolutions?: string[];
    aspectRatios?: string[];
    maxDuration?: number;
    maxImages?: number;  // 最大参考图数量
    supportFirstLastFrame?: boolean;  // 兼容旧字段
    supportCameraMovement?: boolean;
    supportWatermark?: boolean;
  };
}

function ImageToVideo() {
  const { token } = theme.useToken();
  const { videoModel, setVideoModel } = useModelStore();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<string>('720p');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [cameraFixed, setCameraFixed] = useState<boolean>(false);
  const [watermark, setWatermark] = useState<boolean>(true);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);

  // 使用统一的 AI 生成 hook
  const { generateVideo, tasks, generatingVideoIds } = useAIGeneration({
    onVideoComplete: (video) => {
      setGeneratedVideos(prev => [...prev, video]);
    },
    showMessage: true,
  });

  // 计算状态
  const pendingTasks = tasks.filter(t => t.type === 'video');
  const generating = generatingVideoIds.size > 0 || pendingTasks.length > 0;

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await getModelList();
        if (response.success && response.data) {
          const videoModels = response.data.videoModels || [];
          setModels(videoModels);

          // 检查当前选择的视频模型是否存在
          const currentModel = videoModels.find((m: any) => m.id === videoModel) as ModelConfig | undefined;
          
          if (!currentModel && videoModels.length > 0) {
            // 如果当前模型不存在（比如选择了图像模型），重置为默认视频模型
            console.warn(`当前选择的模型 "${videoModel}" 不是视频模型，重置为默认模型`);
            const defaultVideoModel = videoModels[0].id;
            setVideoModel(defaultVideoModel);
            
            // 使用默认模型的配置初始化
            const defaultConfig = videoModels[0].config;
            if (defaultConfig?.resolutions && defaultConfig.resolutions.length > 0) {
              setResolution(defaultConfig.resolutions[0]);
            }
            if (defaultConfig?.aspectRatios && defaultConfig.aspectRatios.length > 0) {
              setAspectRatio(defaultConfig.aspectRatios[0]);
            }
            return;
          }
          
          // 使用当前模型的配置
          const currentConfig = currentModel?.config;
          
          if (currentConfig?.resolutions && currentConfig.resolutions.length > 0) {
            setResolution(currentConfig.resolutions[0]);
          }
          
          if (currentConfig?.aspectRatios && currentConfig.aspectRatios.length > 0) {
            setAspectRatio(currentConfig.aspectRatios[0]);
          }
          
          console.log('当前模型配置:', currentConfig);
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
        message.error('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [videoModel, setVideoModel]);

  // 获取当前选中的模型配置
  const currentModel = models.find((m) => m.id === videoModel) as ModelConfig | undefined;
  const modelConfig = currentModel?.config;

  // 根据模型支持的 mode 计算最大图片数量
  const getMaxImageCount = () => {
    const modes = modelConfig?.supportedModes || [];
    if (modes.includes('ref2v')) return modelConfig?.maxImages || 4;
    if (modes.includes('flf2v')) return 2;
    return 1;
  };
  const maxImageCount = getMaxImageCount();
 
  

  // 当模型改变时，重置配置
  const handleModelChange = (value: string) => {
    setVideoModel(value);
    
    const newModel = models.find((m) => m.id === value) as ModelConfig | undefined;
    const newConfig = newModel?.config;

    // 重置为新模型的默认配置
    if (newConfig?.resolutions && newConfig.resolutions.length > 0) {
      setResolution(newConfig.resolutions[0]);
    }
    if (newConfig?.aspectRatios && newConfig.aspectRatios.length > 0) {
      setAspectRatio(newConfig.aspectRatios[0]);
    }
  };

  // 处理生成视频
  const handleGenerate = async () => {
    if (!selectedImages.length) {
      message.warning('请先选择参考图');
      return;
    }
    if (!prompt.trim()) {
      message.warning('请输入提示词');
      return;
    }

    // 图生视频页面：2张以上用参考图模式
    const mode = selectedImages.length >= 2 ? 'ref2v' : 'i2v';

    // 批量提交任务
    for (let i = 0; i < batchCount; i++) {
      await generateVideo({
        prompt: prompt.trim(),
        model: videoModel,
        mode,
        referenceImages: selectedImages,
        duration,
        resolution,
      });
    }
  };

  // 下载视频
  const handleDownload = (videoUrl: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `generated-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('视频下载完成');
  };

  // 收藏视频
  const handleFavorite = (videoUrl: string) => {
    // TODO: 调用收藏 API
    message.success('视频已收藏');
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Row gutter={[24, 24]} style={{ minHeight: '100vh' }}>
        {/* 左侧：输入控件 */}
        <Col xs={24} lg={10}>
          <Card
            title="输入配置"
            style={{
              borderRadius: token.borderRadiusLG,
              backgroundColor: token.colorBgContainer,
              height: '100%',
            }}
          >
            <Spin spinning={loading}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 参考图部分 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    参考图片 (最多{maxImageCount}张)
                  </div>
                  <div
                    style={{
                      border: `1px dashed ${token.colorBorder}`,
                      borderRadius: token.borderRadiusLG,
                      padding: 24,
                      textAlign: 'center',
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: token.colorBgElevated,
                    }}
                  >
                    {selectedImages.length > 0 ? (
                      <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: 12, textAlign: 'center' }}>
                          已选择 {selectedImages.length} 张参考图
                        </div>
                        <Image.PreviewGroup>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-start',
                              gap: 16,
                              marginBottom: 12,
                            }}
                          >
                            {selectedImages.map((img, idx) => (
                              <div key={idx} style={{ textAlign: 'center' }}>
                                <Image
                                  src={img}
                                  alt={`reference-${idx}`}
                                  width={200}
                                  height={200}
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                  }}
                                />
                                <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                                  第{idx + 1}张
                                </div>
                              </div>
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      </div>
                    ) : (
                      <div style={{ color: token.colorTextTertiary }}>
                        暂未选择参考图
                      </div>
                    )}
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setSelectorVisible(true)}
                    >
                      {selectedImages.length > 0 ? '更换参考图' : '选择参考图'}
                    </Button>
                  </div>
                </div>

                {/* 模型选择 */}
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>模型</div>
                  <Select
                    value={videoModel}
                    onChange={handleModelChange}
                    style={{ width: '100%' }}
                    options={models.map((m) => ({
                      label: m.name,
                      value: m.id,
                      title: m.description,
                    }))}
                  />
                </div>

                {/* 时长选择 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>时长 (秒)</div>
                  <InputNumber
                    min={1}
                    max={modelConfig?.maxDuration || 15}
                    value={duration}
                    onChange={(value) => setDuration(value || 5)}
                    style={{ width: '100%' }}
                    placeholder={`输入视频时长（1-${modelConfig?.maxDuration || 15}秒）`}
                    suffix="秒"
                  />
                  <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                    💡 默认 5 秒，最长不超过 {modelConfig?.maxDuration || 15} 秒
                  </div>
                </div>

                {/* 分辨率选择 */}
                {modelConfig?.resolutions && modelConfig.resolutions.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>分辨率</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {modelConfig.resolutions.map((res) => (
                        <Tag
                          key={res}
                          color={resolution === res ? 'blue' : 'default'}
                          onClick={() => setResolution(res)}
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                        >
                          {res}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* 画面比例选择 */}
                {modelConfig?.aspectRatios && modelConfig.aspectRatios.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>画面比例</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {modelConfig.aspectRatios.map((ratio) => (
                        <Tag
                          key={ratio}
                          color={aspectRatio === ratio ? 'blue' : 'default'}
                          onClick={() => setAspectRatio(ratio)}
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                        >
                          {ratio === '16:9' ? '16:9 (电脑)' : ratio === '9:16' ? '9:16 (手机)' : ratio}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seedance 特有参数 */}
                {videoModel.includes('seedance') && (
                  <>
                    {/* 镜头运动 */}
                    {modelConfig?.supportCameraMovement && (
                      <div>
                        <div style={{ marginBottom: 12, fontWeight: 500 }}>镜头运动</div>
                        <Switch
                          checked={!cameraFixed}
                          onChange={(checked) => setCameraFixed(!checked)}
                          checkedChildren="运动镜头"
                          unCheckedChildren="固定镜头"
                        />
                      </div>
                    )}

                    {/* 水印控制 */}
                    {modelConfig?.supportWatermark && (
                      <div>
                        <div style={{ marginBottom: 12, fontWeight: 500 }}>水印</div>
                        <Switch
                          checked={watermark}
                          onChange={setWatermark}
                          checkedChildren="显示水印"
                          unCheckedChildren="无水印"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* 提示词 */}
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>提示词</div>
                  <TextArea
                    placeholder="描述你想要的视频内容和运动效果，支持中文和英文"
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    style={{
                      backgroundColor: token.colorBgElevated,
                      borderColor: token.colorBorder,
                    }}
                  />
                </div>

                {/* 生成数量 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>生成数量</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <Tag
                        key={count}
                        color={batchCount === count ? 'blue' : 'default'}
                        onClick={() => setBatchCount(count)}
                        style={{ cursor: 'pointer', padding: '4px 12px' }}
                      >
                        {count}个
                      </Tag>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                    💡 每次最多生成5个视频，消耗点数 = 50 × 数量
                  </div>
                </div>

                {/* 生成按钮 */}
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={generating}
                  onClick={handleGenerate}
                  disabled={!selectedImages.length || !prompt.trim()}
                  icon={<PlayCircleOutlined />}
                >
                  生成视频 ({batchCount}个) - 消耗 {50 * batchCount} 点
                </Button>

                {/* 任务状态显示 */}
                {pendingTasks.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>处理中的任务 ({pendingTasks.length})</div>
                    {pendingTasks.slice(0, 5).map((task: any) => (
                      <div
                        key={task.taskId}
                        style={{
                          padding: 8,
                          backgroundColor: token.colorBgElevated,
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          {task.model} - {String(task.taskId).substring(0, 8)}...
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Spin size="small" />
                          <span style={{ fontSize: 12 }}>生成中...</span>
                        </div>
                      </div>
                    ))}
                    {pendingTasks.length > 5 && (
                      <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
                        还有 {pendingTasks.length - 5} 个任务...
                      </div>
                    )}
                  </div>
                )}
              </Space>
            </Spin>
          </Card>
        </Col>

        {/* 右侧：输出结果 */}
        <Col xs={24} lg={14}>
          <Card
            title="生成结果"
            style={{
              borderRadius: token.borderRadiusLG,
              backgroundColor: token.colorBgContainer,
              height: '100%',
              minHeight: 500,
            }}
          >
            {generating && pendingTasks.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}
              >
                <Spin tip="正在生成视频..." />
              </div>
            )}

            {!generating && generatedVideos.length === 0 && pendingTasks.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                  color: token.colorTextTertiary,
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 48, color: token.colorBorder }}>🎬</div>
                <div>点击"生成视频"开始创建</div>
              </div>
            )}

            {generatedVideos.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                {generatedVideos.map((video, idx) => (
                  <div
                    key={video.id || idx}
                    style={{
                      borderRadius: token.borderRadiusLG,
                      overflow: 'hidden',
                      border: `1px solid ${token.colorBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <video
                      src={video.url}
                      controls
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        padding: 12,
                        borderTop: `1px solid ${token.colorBorder}`,
                        backgroundColor: token.colorBgElevated,
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      <Button
                        type="link"
                        size="small"
                        block
                        onClick={() => handleDownload(video.url)}
                      >
                        下载
                      </Button>
                      {/* <Button
                        type="link"
                        size="small"
                        block
                        onClick={() => handleFavorite(video.url)}
                      >
                        收藏
                      </Button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 参考图选择器 */}
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

export default ImageToVideo;