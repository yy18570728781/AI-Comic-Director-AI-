import { Modal, Form, Input, Select, Button, message, Progress } from 'antd';
import {
  ThunderboltOutlined,
  PictureOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { optimizeImagePrompt, generateImageAsync } from '@/api/ai';
import { useQueuePolling } from '@/hooks/useQueuePolling';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { useModelStore } from '@/stores/useModelStore';

const { TextArea } = Input;

interface ImageGenerateModalProps {
  visible: boolean;
  shot: any;
  onCancel: () => void;
  onSuccess: (result: any) => void;
}

/**
 * 图像生成配置弹窗（使用队列）
 *
 * 改造要点：
 * 1. 调用异步接口 generateImageAsync
 * 2. 获取 jobId
 * 3. 使用 useQueuePolling 轮询查询状态
 * 4. 显示生成进度
 */
export default function ImageGenerateModalQueue({
  visible,
  shot,
  onCancel,
  onSuccess,
}: ImageGenerateModalProps) {
  const [form] = Form.useForm();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | number | null>(null);

  // 获取全局选择的图像模型
  const { imageModel } = useModelStore();

  // 使用队列轮询 Hook
  const { job, isPolling, error } = useQueuePolling({
    queueName: 'image',
    jobId: jobId || '',
    enabled: !!jobId, // 只有当 jobId 存在时才启用轮询
    onCompleted: (result) => {
      message.success('图像生成完成！');
      setGenerating(false);
      setJobId(null);
      onSuccess(result);
      onCancel();
    },
    onFailed: (reason) => {
      message.error(`图像生成失败：${reason}`);
      setGenerating(false);
      setJobId(null);
    },
  });

  // 当弹窗打开时，初始化表单
  useEffect(() => {
    if (visible && shot) {
      form.setFieldsValue({
        aspectRatio: '16:9',
        shotType: shot.shotType || '全景',
        cameraMovement: '固定',
        scene: shot.scene || '',
        imagePrompt: shot.imagePrompt || '',
      });
    }
  }, [visible, shot, form]);

  // AI 优化图像提示词
  const handleOptimizePrompt = async () => {
    const imagePrompt = form.getFieldValue('imagePrompt');

    if (!imagePrompt || !imagePrompt.trim()) {
      message.warning('请先填写图像提示词');
      return;
    }

    setOptimizing(true);
    try {
      const res = await optimizeImagePrompt({
        prompt: imagePrompt,
      });

      if (res.data?.optimized) {
        form.setFieldsValue({
          imagePrompt: res.data.optimized,
        });
        message.success('AI 优化完成！');
      }
    } catch (error: any) {
      console.error('AI 优化失败:', error);
      message.error(error.message || 'AI 优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  };

  // 生成图像（使用队列）
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();

      setGenerating(true);

      // 调用异步接口
      const res = await generateImageAsync({
        prompt: values.imagePrompt,
        model: imageModel,
        width: 1024,
        height: 1024,
        referenceImages:
          referenceImages.length > 0 ? referenceImages : undefined,
        shotId: shot.id,
        scriptId: shot.scriptId,
      });

      if (res.success && res.data?.jobId) {
        // 获取 jobId，开始轮询
        setJobId(res.data.jobId);
        message.info('任务已提交到队列，正在生成中...');
      } else {
        throw new Error('提交任务失败');
      }
    } catch (error: any) {
      console.error('生成图像失败:', error);
      message.error(error.message || '生成图像失败');
      setGenerating(false);
    }
  };

  // 获取任务状态文本
  const getStatusText = () => {
    if (!job) return '准备中...';

    switch (job.state) {
      case 'waiting':
        return '排队等待中...';
      case 'active':
        return '正在生成图像...';
      case 'completed':
        return '生成完成！';
      case 'failed':
        return '生成失败';
      default:
        return '未知状态';
    }
  };

  return (
    <>
      <Modal
        title="生成图像"
        open={visible}
        onCancel={onCancel}
        width={600}
        footer={[
          <Button key="cancel" onClick={onCancel} disabled={generating}>
            取消
          </Button>,
          <Button
            key="generate"
            type="primary"
            icon={generating ? <LoadingOutlined /> : <PictureOutlined />}
            onClick={handleGenerate}
            loading={generating}
          >
            {generating ? '生成中...' : '生成图像'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="图像提示词"
            name="imagePrompt"
            rules={[{ required: true, message: '请输入图像提示词' }]}
          >
            <TextArea
              rows={4}
              placeholder="描述你想要生成的图像..."
              disabled={generating}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleOptimizePrompt}
              loading={optimizing}
              disabled={generating}
            >
              AI 优化提示词
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setSelectorVisible(true)}
              disabled={generating}
            >
              选择参考图
            </Button>
            {referenceImages.length > 0 && (
              <span style={{ marginLeft: 8, color: '#1890ff' }}>
                已选择 {referenceImages.length} 张参考图
              </span>
            )}
          </div>

          {/* 显示生成进度 */}
          {generating && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <LoadingOutlined style={{ marginRight: 8 }} />
                {getStatusText()}
              </div>
              {job && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  任务ID: {jobId}
                  <br />
                  状态: {job.state}
                </div>
              )}
              <Progress
                percent={
                  job?.state === 'completed'
                    ? 100
                    : job?.state === 'active'
                      ? 50
                      : 10
                }
                status={job?.state === 'failed' ? 'exception' : 'active'}
                showInfo={false}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 4,
                color: '#ff4d4f',
              }}
            >
              错误: {error}
            </div>
          )}
        </Form>
      </Modal>

      {/* 参考图选择器 */}
      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={(images) => {
          setReferenceImages(images);
          setSelectorVisible(false);
        }}
        maxCount={2}
      />
    </>
  );
}
