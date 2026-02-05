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
  Image,
  theme,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedImage } from '@/hooks/useAIGeneration';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { getModelList } from '@/api/model';

const { TextArea } = Input;

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  creditsPerImage?: number;
  config?: {
    aspectRatios?: string[];
    qualities?: string[];
    supportImageToImage?: boolean;
    supportMultiImageFusion?: boolean;
  };
}

function ImageToImage() {
  const { token } = theme.useToken();
  const { imageModel, setImageModel } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<string | undefined>();
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [batchCount, setBatchCount] = useState<number>(1);

  // 使用统一的 AI 生成 hook
  const { generateImage, tasks, generatingImageIds } = useAIGeneration({
    onImageComplete: (image) => {
      setGeneratedImages(prev => [...prev, image]);
      // 任务完成后刷新积分
      refreshPoints();
    },
    showMessage: true,
  });

  // 计算状态
  const pendingTasks = tasks.filter(t => t.type === 'image');
  const generating = generatingImageIds.size > 0 || pendingTasks.length > 0;

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await getModelList();
        if (response.success && response.data) {
          // 后端返回的是 { imageModels: [...], videoModels: [...] }
          const imageModels = response.data.imageModels || [];
          setModels(imageModels);

          // 初始化当前模型的配置项
          const currentModel = imageModels.find(
            (m: any) => m.id === imageModel,
          ) as ModelConfig | undefined;
          const currentConfig = currentModel?.config;

          if (currentConfig?.qualities && currentConfig.qualities.length > 0) {
            setQuality(currentConfig.qualities[0]);
          }

          if (
            currentConfig?.aspectRatios &&
            currentConfig.aspectRatios.length > 0
          ) {
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
  }, [imageModel]);

  // 获取当前选中的模型配置
  const currentModel = models.find((m) => m.id === imageModel) as
    | ModelConfig
    | undefined;
  const modelConfig = currentModel?.config;

  // 计算当前积分消费
  const creditsPerImage = currentModel?.creditsPerImage ?? 5;  // 默认5积分
  const totalCredits = creditsPerImage * batchCount;
  const hasEnoughPoints = (currentUser?.points ?? 0) >= totalCredits;

  // 当模型改变时，重置配置
  const handleModelChange = (value: string) => {
    setImageModel(value);

    // 获取新模型的配置
    const newModel = models.find((m) => m.id === value) as
      | ModelConfig
      | undefined;
    const newConfig = newModel?.config;

    // 默认选中第一项（如果有的话）
    if (newConfig?.qualities && newConfig.qualities.length > 0) {
      setQuality(newConfig.qualities[0]);
    } else {
      setQuality(undefined);
    }

    if (newConfig?.aspectRatios && newConfig.aspectRatios.length > 0) {
      setAspectRatio(newConfig.aspectRatios[0]);
    } else {
      setAspectRatio(undefined);
    }
  };

  // 处理生成图像
  const handleGenerate = async () => {
    if (!selectedImages.length) {
      message.warning('请先选择参考图');
      return;
    }
    if (!prompt.trim()) {
      message.warning('请输入提示词');
      return;
    }

    // 计算宽高
    let width = 1024;
    let height = 1024;
    
    if (quality) {
      switch (quality) {
        case '2K': width = height = 2048; break;
        case '4K': width = height = 4096; break;
        default: width = height = 1024;
      }
    }

    // 根据比例调整
    if (aspectRatio && aspectRatio !== '1:1') {
      const [w, h] = aspectRatio.split(':').map(Number);
      if (w > h) {
        height = Math.round((width * h) / w);
      } else {
        width = Math.round((height * w) / h);
      }
    }

    // 批量提交任务
    for (let i = 0; i < batchCount; i++) {
      await generateImage({
        prompt: prompt.trim(),
        model: imageModel,
        width,
        height,
        referenceImages: selectedImages,
      });
    }
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
              <Space
                direction="vertical"
                style={{ width: '100%' }}
                size="large"
              >
                {/* 参考图部分 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    参考图片
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
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 8,
                            maxHeight: 150,
                            overflowY: 'auto',
                            marginBottom: 12,
                          }}
                        >
                          {selectedImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`reference-${idx}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                borderRadius: 4,
                              }}
                            />
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
                    value={imageModel}
                    onChange={handleModelChange}
                    style={{ width: '100%' }}
                    options={models.map((m) => ({
                      label: m.name,
                      value: m.id,
                      title: m.description,
                    }))}
                  />
                </div>

                {/* 画质选择（如果模型支持） */}
                {modelConfig?.qualities && modelConfig.qualities.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>
                      画质
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {modelConfig.qualities.map((q) => (
                        <Tag
                          key={q}
                          color={quality === q ? 'blue' : 'default'}
                          onClick={() =>
                            setQuality(quality === q ? undefined : q)
                          }
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                        >
                          {q}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* 画面比例选择 */}
                {modelConfig?.aspectRatios &&
                  modelConfig.aspectRatios.length > 0 && (
                    <div>
                      <div style={{ marginBottom: 12, fontWeight: 500 }}>
                        画面比例
                      </div>
                      <div
                        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                      >
                        {modelConfig.aspectRatios.map((ratio) => (
                          <Tag
                            key={ratio}
                            color={aspectRatio === ratio ? 'blue' : 'default'}
                            onClick={() =>
                              setAspectRatio(
                                aspectRatio === ratio ? undefined : ratio,
                              )
                            }
                            style={{ cursor: 'pointer', padding: '4px 12px' }}
                          >
                            {ratio}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 生成数量 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    生成数量
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <Tag
                        key={count}
                        color={batchCount === count ? 'blue' : 'default'}
                        onClick={() => setBatchCount(count)}
                        style={{ cursor: 'pointer', padding: '4px 12px' }}
                      >
                        {count}张
                      </Tag>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextTertiary,
                      marginTop: 4,
                    }}
                  >
                    💡 每次最多生成5张图片，消耗积分 = {creditsPerImage} × 数量
                  </div>
                </div>

                {/* 提示词 */}
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>提示词</div>
                  <TextArea
                    placeholder="描述你想要生成的图像特征，支持中文和英文"
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
                  disabled={!selectedImages.length || !prompt.trim() || !hasEnoughPoints}
                >
                  {selectedImages.length > 1 &&
                  modelConfig?.supportMultiImageFusion
                    ? `多图融合 (${selectedImages.length}张图) - 消耗 ${totalCredits} 积分`
                    : `图生图 (${batchCount}张) - 消耗 ${totalCredits} 积分`}
                </Button>
                
                {/* 积分不足提示 */}
                {!hasEnoughPoints && (
                  <div style={{ 
                    color: '#ff4d4f', 
                    fontSize: 12, 
                    marginTop: 8,
                    textAlign: 'center',
                  }}>
                    ⚠️ 积分不足，当前余额 {currentUser?.points ?? 0} 积分
                  </div>
                )}

                {/* 任务状态显示 */}
                {pendingTasks.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>
                      处理中的任务 ({pendingTasks.length})
                    </div>
                    {pendingTasks.slice(0, 5).map((task: any) => (
                      <div
                        key={task.jobId}
                        style={{
                          padding: 8,
                          backgroundColor: token.colorBgElevated,
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: token.colorTextSecondary,
                          }}
                        >
                          {task.model || '图片'} -
                          {String(task.jobId).substring(0, 8)}...
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Spin size="small" />
                          <span style={{ fontSize: 12 }}>生成中...</span>
                        </div>
                      </div>
                    ))}
                    {pendingTasks.length > 5 && (
                      <div
                        style={{ fontSize: 12, color: token.colorTextTertiary }}
                      >
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
            {!generating && generatedImages.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 16,
                }}
              >
                <Image.PreviewGroup>
                  {generatedImages.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      style={{
                        borderRadius: token.borderRadiusLG,
                        overflow: 'hidden',
                        border: `1px solid ${token.colorBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Image
                        src={img.url}
                        alt={`generated-${idx}`}
                        style={{
                          width: '100%',
                          height: 250,
                          objectFit: 'cover',
                        }}
                        preview={{ mask: '预览' }}
                        fallback="/images/placeholder.png"
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
                        <Button type="link" size="small" block>
                          下载
                        </Button>
                        <Button type="link" size="small" block>
                          收藏
                        </Button>
                      </div>
                    </div>
                  ))}
                </Image.PreviewGroup>
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
        maxCount={modelConfig?.supportMultiImageFusion ? 10 : 1}
        defaultImages={selectedImages}
      />
    </div>
  );
}

export default ImageToImage;
