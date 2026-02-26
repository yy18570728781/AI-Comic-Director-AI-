import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  InputNumber,
  Tag,
  Switch,
} from 'antd';
import { ThunderboltOutlined, SyncOutlined } from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { getModelList } from '@/api/model';

const { TextArea } = Input;

interface VideoGenerateModalProps {
  visible: boolean;
  shot: any;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (config: any) => void;
}

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
    supportGenerateAudio?: boolean;
  };
}

/**
 * 视频生成配置弹窗
 */
export default function VideoGenerateModal({
  visible,
  shot,
  loading = false,
  onCancel,
  onSubmit,
}: VideoGenerateModalProps) {
  const [form] = Form.useForm();
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  // 获取全局选择的视频模型
  const { videoModel, videoModels } = useModelStore();

  // 计算所需积分（基于当前表单的时长和分辨率）
  const duration = Form.useWatch('duration', form) || 5;
  const resolution = Form.useWatch('resolution', form) || '720p';
  
  const selectedModel = videoModels.find(m => m.id === videoModel);
  const pricingTier = selectedModel?.pricing?.find(p => p.resolution === resolution);
  const creditsPerSecond = pricingTier?.creditsPerSecond || 2;
  const requiredCredits = creditsPerSecond * duration;

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getModelList();
        if (response.success && response.data) {
          const videoModels = response.data.videoModels || [];
          setModels(videoModels);

          // 初始化当前模型的配置项
          const currentModel = videoModels.find((m: any) => m.id === videoModel) as ModelConfig | undefined;
          const currentConfig = currentModel?.config;
          
          if (currentConfig?.aspectRatios && currentConfig.aspectRatios.length > 0) {
            setAspectRatio(currentConfig.aspectRatios[0]);
          }
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
      }
    };

    if (visible) {
      fetchModels();
    }
  }, [visible, videoModel]);

  // 获取当前选中的模型配置
  const currentModel = models.find((m) => m.id === videoModel) as ModelConfig | undefined;
  const modelConfig = currentModel?.config;

  // 当弹窗打开时，初始化表单
  useEffect(() => {
    if (visible && shot) {
      form.setFieldsValue({
        videoPrompt: shot.videoPrompt || shot.visualDescription || '',
        duration: shot.duration || 5,
        generateAudio: false,  // 默认不生成音频
      });
    }
  }, [visible, shot, form]);

  // AI 优化视频提示词
  const handleOptimizePrompt = async () => {
    const videoPrompt = form.getFieldValue('videoPrompt');
    if (!videoPrompt) {
      message.warning('请先输入视频提示词');
      return;
    }

    setOptimizing(true);
    try {
      const { optimizeVideoPrompt } = await import('@/api/ai');
      const duration = form.getFieldValue('duration') || 5;
      
      const res = await optimizeVideoPrompt({
        prompt: videoPrompt,
        duration,
        modelId: videoModel,
      });

      if (res.success && res.data.optimized) {
        form.setFieldsValue({
          videoPrompt: res.data.optimized,
        });
        message.success('提示词优化成功');
      } else {
        message.error(res.message || '优化失败');
      }
    } catch (error: any) {
      console.error('优化提示词失败:', error);
      message.error('优化失败');
    } finally {
      setOptimizing(false);
    }
  };

  // 保存表单到后端（不生成视频）
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);
      try {
        const { updateShot } = await import('@/api/script');
        const res = await updateShot(shot.id, {
          videoPrompt: values.videoPrompt,
          duration: values.duration,
        });

        // 全局拦截器已经处理了 success: false 的情况
        // 这里只需要处理成功的情况
        if (res.success) {
          message.success('保存成功');
        }
      } catch (error: any) {
        console.error('保存失败:', error);
        // 全局拦截器已经显示了错误消息
      } finally {
        setSaving(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 生成视频前先保存表单
      console.log('💾 生成视频前保存表单到数据库');
      try {
        const { updateShot } = await import('@/api/script');
        await updateShot(shot.id, {
          videoPrompt: values.videoPrompt,
          duration: values.duration,
        });
      } catch (error) {
        console.error('保存表单失败:', error);
        // 不阻塞生成流程
      }

      // 使用全局选择的视频模型
      onSubmit({
        ...values,
        model: videoModel, // 使用全局模型配置
        aspectRatio, // 添加画面比例参数
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 获取首帧和尾帧
  const firstFrame = shot?.images?.find((img: any) => img.isFirstFrame);
  const lastFrame = shot?.images?.find((img: any) => img.isLastFrame);

  return (
    <Modal
      title={`生成视频 - 镜头 #${shot?.shotNumber || ''}`}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" onClick={handleSave} loading={saving}>
          保存
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<ThunderboltOutlined />}
        >
          生成视频 ({requiredCredits}积分)
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* 首帧和尾帧预览 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
            参考帧
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* 首帧 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 4,
                }}
              >
                首帧 {!firstFrame && '(未设置)'}
              </div>
              {firstFrame ? (
                <img
                  src={firstFrame.url}
                  alt="首帧"
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '2px solid #faad14',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 150,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  未设置首帧
                </div>
              )}
            </div>

            {/* 尾帧 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 4,
                }}
              >
                尾帧 {lastFrame ? '(已设置)' : '(可选)'}
              </div>
              {lastFrame ? (
                <img
                  src={lastFrame.url}
                  alt="尾帧"
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '2px solid #1890ff',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 150,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  未设置尾帧
                  <br />
                  (将使用单图生成)
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#999',
            }}
          >
            {lastFrame
              ? '✅ 将使用首尾帧生成视频（更精确控制）'
              : 'ℹ️ 将使用单图（首帧）生成视频'}
          </div>
        </div>

        {/* 分镜配置区域 */}
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            backgroundColor: '#f0f7ff',
            borderRadius: 8,
            border: '1px solid #91d5ff',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 12,
              color: '#0958d9',
            }}
          >
            📝 分镜配置（保存到数据库）
          </div>

          {/* 视频提示词 */}
          <Form.Item
            label={
              <Space>
                <span>视频提示词</span>
                <Button
                  type="link"
                  size="small"
                  icon={<SyncOutlined spin={optimizing} />}
                  onClick={handleOptimizePrompt}
                  loading={optimizing}
                  style={{ padding: 0, height: 'auto' }}
                >
                  AI 优化
                </Button>
              </Space>
            }
            name="videoPrompt"
            rules={[{ required: true, message: '请输入视频提示词' }]}
            extra={
              <div style={{ color: '#999', fontSize: 12 }}>
                💡 AI 优化会将提示词转换为时间轴格式，更适合视频生成
              </div>
            }
          >
            <TextArea
              rows={6}
              placeholder="描述视频中的动作、运镜、氛围等&#10;例如：镜头缓缓推进，角色转身看向远方，背景光线逐渐变暗&#10;&#10;AI 优化后会自动转换为时间轴格式"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* 视频时长 */}
          <Form.Item
            label="视频时长（秒）"
            name="duration"
            rules={[{ required: true, message: '请输入视频时长' }]}
            extra={
              modelConfig?.durations && modelConfig.durations.length > 0 ? (
                <div style={{ color: '#999', fontSize: 12 }}>
                  💡 建议时长：{modelConfig.durations.join('、')}秒
                </div>
              ) : (
                <div style={{ color: '#999', fontSize: 12 }}>
                  💡 建议时长：3-10秒，最长不超过15秒
                </div>
              )
            }
          >
            <InputNumber
              min={1}
              max={15}
              style={{ width: '100%' }}
              placeholder="输入视频时长（1-15秒）"
              suffix="秒"
            />
          </Form.Item>

        </div>

        {/* 生成配置区域 */}
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#f6ffed',
            borderRadius: 8,
            border: '1px solid #b7eb8f',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 12,
              color: '#389e0d',
            }}
          >
            ⚙️ 生成配置（仅用于本次生成）
          </div>

          {/* 画面比例选择 */}
          {modelConfig?.aspectRatios && modelConfig.aspectRatios.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>画面比例</div>
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

          {/* 输出声音开关 - 仅支持的模型显示 */}
          {modelConfig?.supportGenerateAudio && (
            <Form.Item
              label="输出声音"
              name="generateAudio"
              valuePropName="checked"
              extra="开启后将生成带声音的视频"
            >
              <Switch />
            </Form.Item>
          )}
        </div>

        <div
          style={{
            padding: 12,
            backgroundColor: '#f0f7ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#666',
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>💡 提示</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>视频生成需要 1-2 分钟，请耐心等待</li>
            <li>提示词越详细，生成效果越好</li>
            <li>建议使用 AI 优化功能优化提示词</li>
            <li>设置尾帧可以更精确控制视频结束画面</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
}
