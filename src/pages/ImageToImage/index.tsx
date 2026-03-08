import { useState, useEffect, useCallback } from 'react';
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
  Switch,
} from 'antd';
import { PlusOutlined, PictureOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedImage } from '@/hooks/useAIGeneration';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { storage } from '@/utils';

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
  const [quality, setQuality] = useState<string>('standard');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => 
    storage.get<GeneratedImage[]>('imageToImage_generatedImages', []) ?? []
  );
  const [batchCount, setBatchCount] = useState<number>(1);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [loadingPlaceholders, setLoadingPlaceholders] = useState<number>(0);

  // 持久化生成的图片到 localStorage（使用 debounce 优化性能）
  const saveToStorage = useCallback(
    debounce((images: GeneratedImage[]) => {
      storage.set('imageToImage_generatedImages', images);
    }, 500),
    []
  );

  useEffect(() => {
    saveToStorage(generatedImages);
  }, [generatedImages, saveToStorage]);

  // 使用统一的 AI 生成 hook
  const { generateImage, tasks, generatingImageIds } = useAIGeneration({
    onImageComplete: (image) => {
      setGeneratedImages(prev => [...prev, image]);
      setLoadingPlaceholders(prev => Math.max(0, prev - 1));
      refreshPoints();
    },
    showMessage: true,
  });

  // 计算状态
  const pendingTasks = tasks.filter(t => t.type === 'image');
  const generating = generatingImageIds.size > 0 || pendingTasks.length > 0;
  const { imageModels, loadModels } = useModelStore();

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        await loadModels();
        setModels(imageModels);

        // 初始化当前模型的配置项
        const currentModel = imageModels.find(m => m.id === imageModel);
        const currentConfig = currentModel?.config;

        // 只有当模型配置中有 qualities 时才覆盖默认值
        if (currentConfig?.qualities?.length) {
          setQuality(currentConfig.qualities[0]);
        }

        // 只有当模型配置中有 aspectRatios 时才覆盖默认值
        if (currentConfig?.aspectRatios?.length) {
          setAspectRatio(currentConfig.aspectRatios[0]);
        }
      } catch (error) {
        message.error('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [imageModel, imageModels, loadModels]);

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

    // 如果新模型有配置，使用第一项；否则保持默认值
    if (newConfig?.qualities?.length) {
      setQuality(newConfig.qualities[0]);
    } else {
      setQuality('hd'); // 恢复默认值
    }

    if (newConfig?.aspectRatios?.length) {
      setAspectRatio(newConfig.aspectRatios[0]);
    } else {
      setAspectRatio('16:9'); // 恢复默认值
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

    // 立即添加占位图
    setLoadingPlaceholders(prev => prev + batchCount);

    // 批量提交任务
    for (let i = 0; i < batchCount; i++) {
      await generateImage({
        prompt: prompt.trim(),
        model: imageModel,
        quality,
        aspectRatio,
        referenceImages: selectedImages,
        ...(saveToLibrary ? {
          saveToLibrary: true,
          libraryName: `融图_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
          libraryTags: ['融图', 'AI生成'],
        } : {}),
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

                {/* 画质选择 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    画质
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag
                      color={quality === 'standard' ? 'blue' : 'default'}
                      onClick={() => setQuality('standard')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      标准画质
                    </Tag>
                    <Tag
                      color={quality === 'hd' ? 'blue' : 'default'}
                      onClick={() => setQuality('hd')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      高清画质（推荐）
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextTertiary,
                      marginTop: 4,
                    }}
                  >
                    💡 高清画质生成效果更好，但消耗积分更多
                  </div>
                </div>

                {/* 画面比例选择 */}
                <div>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    画面比例
                  </div>
                  <div
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                  >
                    <Tag
                      color={aspectRatio === '1:1' ? 'blue' : 'default'}
                      onClick={() => setAspectRatio('1:1')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      1:1（正方形）
                    </Tag>
                    <Tag
                      color={aspectRatio === '16:9' ? 'blue' : 'default'}
                      onClick={() => setAspectRatio('16:9')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      16:9（横屏）
                    </Tag>
                    <Tag
                      color={aspectRatio === '9:16' ? 'blue' : 'default'}
                      onClick={() => setAspectRatio('9:16')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      9:16（竖屏）
                    </Tag>
                    <Tag
                      color={aspectRatio === '3:4' ? 'blue' : 'default'}
                      onClick={() => setAspectRatio('3:4')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      3:4（标准竖屏）
                    </Tag>
                    <Tag
                      color={aspectRatio === '4:3' ? 'blue' : 'default'}
                      onClick={() => setAspectRatio('4:3')}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                    >
                      4:3（标准横屏）
                    </Tag>
                  </div>
                </div>

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

                {/* 保存到资源库开关 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <span style={{ fontWeight: 500 }}>保存到资源库</span>
                    <Switch 
                      checked={saveToLibrary} 
                      onChange={setSaveToLibrary}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextTertiary,
                    }}
                  >
                    开启后，生成的图片将自动保存到资源库（融图类型）
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
                  onClick={handleGenerate}
                  disabled={!selectedImages.length || !prompt.trim() || !hasEnoughPoints || generating}
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
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>生成结果 {generatedImages.length > 0 && `(${generatedImages.length})`}</span>
                {generatedImages.length > 0 && (
                  <Button 
                    size="small" 
                    danger
                    onClick={() => {
                      setGeneratedImages([]);
                      setLoadingPlaceholders(0);
                      message.success('已清空生成结果');
                    }}
                  >
                    清空列表
                  </Button>
                )}
              </div>
            }
            style={{
              borderRadius: token.borderRadiusLG,
              backgroundColor: token.colorBgContainer,
              height: '100%',
              minHeight: 500,
            }}
          >
            {generatedImages.length === 0 && loadingPlaceholders === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '100px 20px',
                color: token.colorTextTertiary,
              }}>
                <PictureOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div>暂无生成结果</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  选择参考图并输入提示词后，点击生成按钮开始创作
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 16,
                }}
              >
                <Image.PreviewGroup>
                  {/* 加载中的占位图 */}
                  {Array.from({ length: loadingPlaceholders }).map((_, idx) => (
                    <div
                      key={`loading-${idx}`}
                      style={{
                        borderRadius: token.borderRadiusLG,
                        overflow: 'hidden',
                        border: `1px solid ${token.colorBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: 250,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: token.colorBgElevated,
                        }}
                      >
                        <Spin size="large" tip="生成中..." />
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderTop: `1px solid ${token.colorBorder}`,
                          backgroundColor: token.colorBgElevated,
                          textAlign: 'center',
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      >
                        正在生成第 {idx + 1} 张...
                      </div>
                    </div>
                  ))}
                  
                  {/* 已生成的图片 */}
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
