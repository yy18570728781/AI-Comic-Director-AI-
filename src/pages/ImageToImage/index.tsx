import React, { useState, useEffect } from 'react';
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
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { getModelList } from '@/api/model';
import { generateImage, blendImages } from '@/api/image';

const { TextArea } = Input;

interface ModelConfig {
  id: string;
  name: string;
  description: string;
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
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<string | undefined>();
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 下载图片
  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('图片下载完成');
  };

  // 收藏图片（这里可以调用收藏 API）
  const handleFavorite = (imageUrl: string, index: number) => {
    // TODO: 调用收藏 API
    message.success('图片已收藏');
  };

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

    setGenerating(true);
    try {
      let response;
      
      // 判断是否为多图融合
      if (selectedImages.length > 1 && modelConfig?.supportMultiImageFusion) {
        // 多图融合
        console.log('🎨 发起多图融合请求');
        response = await blendImages({
          model: imageModel,
          prompt: prompt.trim(),
          referenceImages: selectedImages,
          aspectRatio: aspectRatio,
        });
      } else {
        // 单图生图或文生图
        const requestData: any = {
          prompt: prompt.trim(),
          model: imageModel,
          referenceImages: selectedImages,
        };

        // 如果有画质配置，转换为宽高
        if (quality) {
          switch (quality) {
            case '1K':
              requestData.width = 1024;
              requestData.height = 1024;
              break;
            case '2K':
              requestData.width = 2048;
              requestData.height = 2048;
              break;
            case '4K':
              requestData.width = 4096;
              requestData.height = 4096;
              break;
            default:
              requestData.width = 1024;
              requestData.height = 1024;
          }
        } else {
          // 默认 1024x1024
          requestData.width = 1024;
          requestData.height = 1024;
        }

        // 如果有画面比例，调整宽高
        if (aspectRatio && aspectRatio !== '1:1') {
          const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
          const baseSize = requestData.width;
          
          if (widthRatio > heightRatio) {
            // 横屏
            requestData.width = baseSize;
            requestData.height = Math.round(baseSize * heightRatio / widthRatio);
          } else {
            // 竖屏
            requestData.height = baseSize;
            requestData.width = Math.round(baseSize * widthRatio / heightRatio);
          }
        }

        console.log('🎨 发起图生图请求:', requestData);
        response = await generateImage(requestData);
      }

      if (response.success && response.data) {
        const { images, taskId } = response.data;
        
        if (images && images.length > 0) {
          // 同步返回结果（如 Seedream）
          const imageUrls = images.map((img: any) => img.url);
          setGeneratedImages(imageUrls);
          message.success(`图像生成完成！生成了 ${imageUrls.length} 张图片`);
        } else if (taskId) {
          // 异步任务（需要轮询状态）
          message.info('图像生成任务已提交，正在处理中...');
          // TODO: 实现轮询逻辑
          console.log('任务ID:', taskId);
        } else {
          throw new Error('响应数据格式错误');
        }
      } else {
        throw new Error(response.message || '生成失败');
      }
    } catch (error: any) {
      console.error('❌ 图像生成失败:', error);
      
      // 根据错误类型提供更友好的提示
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
    } finally {
      setGenerating(false);
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
                  disabled={!selectedImages.length || !prompt.trim()}
                >
                  {selectedImages.length > 1 && modelConfig?.supportMultiImageFusion
                    ? `多图融合 (${selectedImages.length}张图) - 消耗 30 点`
                    : '图生图 - 消耗 30 点'
                  }
                </Button>
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
            {generating && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}
              >
                <Spin tip="正在生成图像..." />
              </div>
            )}

            {!generating && generatedImages.length === 0 && (
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
                <div
                  style={{
                    fontSize: 48,
                    color: token.colorBorder,
                  }}
                >
                  📷
                </div>
                <div>点击"生成图像"开始创建</div>
              </div>
            )}

            {!generating && generatedImages.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 16,
                }}
              >
                {generatedImages.map((img, idx) => (
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
                    <img
                      src={img}
                      alt={`generated-${idx}`}
                      style={{
                        width: '100%',
                        height: 250,
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
                        onClick={() => handleDownload(img, idx)}
                      >
                        下载
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        block
                        onClick={() => handleFavorite(img, idx)}
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
        maxCount={modelConfig?.supportMultiImageFusion ? 10 : 1}
        defaultImages={selectedImages}
      />
    </div>
  );
}

export default ImageToImage;
