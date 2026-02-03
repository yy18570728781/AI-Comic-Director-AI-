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
} from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { useTaskStore } from '@/stores/useTaskStore';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { onTaskComplete, TaskCompleteEvent } from '@/components/GlobalTaskPoller';
import { getModelList } from '@/api/model';
import { generateVideoAsync } from '@/api/video';

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
  const { tasks, addTask } = useTaskStore();
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
  const [batchCount, setBatchCount] = useState<number>(1);

  // 监听全局任务完成事件
  useEffect(() => {
    const unsubscribe = onTaskComplete((event: TaskCompleteEvent) => {
      // 只处理视频任务
      if (event.type === 'video') {
        console.log('✅ [ImageToVideo] 收到任务完成事件:', event);
        
        if (event.result) {
          // 后端返回格式: { savedVideo: { id, url, shotId } }
          const videoUrl = event.result.savedVideo?.url || event.result.url;
          if (videoUrl) {
            setGeneratedVideos(prev => [...prev, videoUrl]);
          }
        }
        setGenerating(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 计算当前页面相关的任务数量
  const pendingTasks = tasks.filter(t => t.type === 'video');

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

      console.log(`🎬 发起视频生成请求 (批量: ${batchCount}个):`, requestData);

      // 批量提交任务到队列
      const jobIds: string[] = [];
      for (let i = 0; i < batchCount; i++) {
        const response = await generateVideoAsync(requestData);
        if (response.success && response.data?.jobId) {
          jobIds.push(response.data.jobId);
          // 添加到全局 store
          addTask({
            jobId: response.data.jobId,
            type: 'video',
            model: videoModel,
          });
        } else {
          throw new Error(response.message || '提交失败');
        }
      }

      message.info(`已提交 ${jobIds.length} 个视频生成任务，正在处理中...`);
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
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>时长 (秒)</div>
                  <InputNumber
                    min={1}
                    max={15}
                    value={duration}
                    onChange={(value) => setDuration(value || 5)}
                    style={{ width: '100%' }}
                    placeholder="输入视频时长（1-15秒）"
                    suffix="秒"
                  />
                  <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                    {modelConfig?.durations && modelConfig.durations.length > 0 ? (
                      <>💡 建议时长：{modelConfig.durations.join('、')}秒</>
                    ) : (
                      <>💡 建议时长：3-10秒，最长不超过15秒</>
                    )}
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