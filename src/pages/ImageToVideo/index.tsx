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
} from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { getModelList } from '@/api/model';
import { generateVideo } from '@/api/video';
import { useTaskPolling } from '@/hooks/useTaskPolling';

const { TextArea } = Input;

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  config?: {
    resolutions?: string[];
    aspectRatios?: string[];
    durations?: number[];
    supportFirstLastFrame?: boolean;
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
  const [generating, setGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);

  // 使用任务轮询 Hook
  const { addTask, tasks } = useTaskPolling({
    onTaskComplete: (taskId: string, result: any) => {
      console.log('✅ 视频生成完成:', taskId, result);
      if (result.videos && result.videos.length > 0) {
        const videoUrls = result.videos.map((video: any) => video.url);
        setGeneratedVideos(prev => [...prev, ...videoUrls]);
        message.success(`视频生成完成！生成了 ${videoUrls.length} 个视频`);
      }
      setGenerating(false);
    },
    onTaskError: (taskId: string, error: string) => {
      console.error('❌ 视频生成失败:', taskId, error);
      message.error(`视频生成失败: ${error}`);
      setGenerating(false);
    },
  });

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await getModelList();
        if (response.success && response.data) {
          const videoModels = response.data.videoModels || [];
          setModels(videoModels);

          // 初始化当前模型的配置项
          const currentModel = videoModels.find((m: any) => m.id === videoModel) as ModelConfig | undefined;
          const currentConfig = currentModel?.config;
          
          if (currentConfig?.durations && currentConfig.durations.length > 0) {
            setDuration(currentConfig.durations[0]);
          }
          if (currentConfig?.resolutions && currentConfig.resolutions.length > 0) {
            setResolution(currentConfig.resolutions[0]);
          }
          console.log(currentConfig);
          
          if (currentConfig?.aspectRatios && currentConfig.aspectRatios.length > 0) {
            setAspectRatio(currentConfig.aspectRatios[0]);
          }
        }
      } catch (error) {
        message.error('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [videoModel]);

  // 获取当前选中的模型配置
  const currentModel = models.find((m) => m.id === videoModel) as ModelConfig | undefined;
  const modelConfig = currentModel?.config;
 
  

  // 当模型改变时，重置配置
  const handleModelChange = (value: string) => {
    setVideoModel(value);
    
    const newModel = models.find((m) => m.id === value) as ModelConfig | undefined;
    const newConfig = newModel?.config;

    // 重置为新模型的默认配置
    if (newConfig?.durations && newConfig.durations.length > 0) {
      setDuration(newConfig.durations[0]);
    }
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

    setGenerating(true);
    try {
      // 构建请求参数
      const requestData: any = {
        prompt: prompt.trim(),
        model: videoModel,
        referenceImages: selectedImages,
        duration,
      };

      // 根据模型添加特定参数
      if (modelConfig?.resolutions) {
        requestData.resolution = resolution;
      }
      if (modelConfig?.aspectRatios) {
        requestData.aspectRatio = aspectRatio;
      }

      // Seedance 特有参数
      if (videoModel.includes('seedance')) {
        requestData.cameraFixed = cameraFixed;
        requestData.watermark = watermark;
      }

      console.log('🎬 发起视频生成请求:', requestData);

      // 调用后端 API
      const response = await generateVideo(requestData);

      if (response.success && response.data) {
        const { videos, taskId } = response.data;
        
        if (videos && videos.length > 0) {
          // 同步返回结果
          const videoUrls = videos.map((video: any) => video.url);
          setGeneratedVideos(videoUrls);
          message.success(`视频生成完成！生成了 ${videoUrls.length} 个视频`);
          setGenerating(false);
        } else if (taskId) {
          // 异步任务，添加到轮询队列
          addTask({
            taskId,
            type: 'video',
            model: videoModel,
          });
          message.info('视频生成任务已提交，正在处理中...');
        } else {
          throw new Error('响应数据格式错误');
        }
      } else {
        throw new Error(response.message || '生成失败');
      }
    } catch (error: any) {
      console.error('❌ 视频生成失败:', error);
      
      let errorMessage = '生成失败，请重试';
      if (error.message?.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接后重试';
      } else if (error.message?.includes('API key')) {
        errorMessage = 'API 密钥配置错误，请联系管理员';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API 配额不足，请稍后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      setGenerating(false);
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
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
                    参考图片 {modelConfig?.supportFirstLastFrame && '(支持首尾帧)'}
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
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          已选择 {selectedImages.length} 张参考图
                          {selectedImages.length === 2 && ' (首帧 + 尾帧)'}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 8,
                            maxHeight: 150,
                            overflowY: 'auto',
                            marginBottom: 12,
                          }}
                        >
                          {selectedImages.map((img, idx) => (
                            <div key={idx} style={{ textAlign: 'center' }}>
                              <img
                                src={img}
                                alt={`reference-${idx}`}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: 80,
                                  borderRadius: 4,
                                }}
                              />
                              <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                                {idx === 0 ? '首帧' : '尾帧'}
                              </div>
                            </div>
                          ))}
                        </div>
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
                {modelConfig?.durations && modelConfig.durations.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>时长 (秒)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {modelConfig.durations.map((d) => (
                        <Tag
                          key={d}
                          color={duration === d ? 'blue' : 'default'}
                          onClick={() => setDuration(d)}
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                        >
                          {d}s
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

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
                          {ratio === '16:9' ? '16:9 (横屏)' : '9:16 (竖屏)'}
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
                  生成视频 - 消耗 50 点
                </Button>

                {/* 任务状态显示 */}
                {tasks.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>处理中的任务</div>
                    {tasks.map((task: any) => (
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
                          {task.model} - {task.taskId.substring(0, 8)}...
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Spin size="small" />
                          <span style={{ fontSize: 12 }}>生成中...</span>
                        </div>
                      </div>
                    ))}
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
            {generating && tasks.length === 0 && (
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

            {!generating && generatedVideos.length === 0 && tasks.length === 0 && (
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
                    key={idx}
                    style={{
                      borderRadius: token.borderRadiusLG,
                      overflow: 'hidden',
                      border: `1px solid ${token.colorBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <video
                      src={video}
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
                        onClick={() => handleDownload(video)}
                      >
                        下载
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        block
                        onClick={() => handleFavorite(video)}
                      >
                        收藏
                      </Button>
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
        maxCount={modelConfig?.supportFirstLastFrame ? 2 : 1}
        defaultImages={selectedImages}
      />
    </div>
  );
}

export default ImageToVideo;