import { Modal, Form, Input, Select, Upload, Button, message } from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import { optimizeImagePrompt } from '@/api/image';

const { TextArea } = Input;

interface ImageGenerateModalProps {
  visible: boolean;
  shot: any;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

/**
 * 图像生成配置弹窗
 */
export default function ImageGenerateModal({
  visible,
  shot,
  loading,
  onCancel,
  onSubmit,
}: ImageGenerateModalProps) {
  const [form] = Form.useForm();
  const [referenceImages, setReferenceImages] = useState<UploadFile[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  // 当弹窗打开时，初始化表单
  const handleOpen = () => {
    if (shot) {
      form.setFieldsValue({
        aspectRatio: '16:9',
        shotType: shot.shotType || '全景',
        cameraMovement: '固定',
        scene: shot.scene || '',
        imagePrompt: shot.imagePrompt || '',
      });
    }
  };

  // AI 优化图像提示词
  const handleOptimizePrompt = async () => {
    const imagePrompt = form.getFieldValue('imagePrompt');

    if (!imagePrompt || !imagePrompt.trim()) {
      message.warning('请先填写图像提示词');
      return;
    }

    setOptimizing(true);
    try {
      const res = await optimizeImagePrompt(imagePrompt);

      if (res.data?.optimizedPrompt) {
        // 将优化后的提示词填入 imagePrompt 字段
        form.setFieldsValue({
          imagePrompt: res.data.optimizedPrompt,
        });
        message.success('AI 优化完成！');
      } else {
        throw new Error('优化失败');
      }
    } catch (error: any) {
      console.error('AI 优化失败:', error);
      message.error(error.message || 'AI 优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 将参考图转换为 URL 数组
      const referenceImageUrls = referenceImages
        .filter((file) => file.status === 'done' && file.response?.url)
        .map((file) => file.response.url);

      onSubmit({
        ...values,
        referenceImages: referenceImageUrls,
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理图片上传
  const handleUploadChange = ({ fileList }: any) => {
    setReferenceImages(fileList);
  };

  // 上传前的校验
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB！');
      return false;
    }
    return true;
  };

  return (
    <Modal
      title={`生成图像 - 镜头 #${shot?.shotNumber}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      afterOpenChange={(open) => open && handleOpen()}
      width={700}
      okText="生成图像"
      cancelText="取消"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {/* 参考图上传 */}
        <Form.Item
          label="参考图（可选）"
          extra="上传参考图片，AI 将基于参考图生成相似风格的图像"
        >
          <Upload
            listType="picture-card"
            fileList={referenceImages}
            onChange={handleUploadChange}
            beforeUpload={beforeUpload}
            maxCount={3}
            accept="image/*"
          >
            {referenceImages.length < 3 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* 图像比例 */}
        <Form.Item
          label="图像比例"
          name="aspectRatio"
          rules={[{ required: true, message: '请选择图像比例' }]}
          extra="通义万相支持的尺寸：1024x1024、1280x720、720x1280、768x1152"
        >
          <Select>
            <Select.Option value="1:1">1:1（正方形 - 1024x1024）</Select.Option>
            <Select.Option value="16:9">16:9（横屏 - 1280x720）</Select.Option>
            <Select.Option value="9:16">9:16（竖屏 - 720x1280）</Select.Option>
            <Select.Option value="3:4">
              3:4（标准竖屏 - 768x1152）
            </Select.Option>
          </Select>
        </Form.Item>

        {/* 景别 */}
        <Form.Item
          label="景别"
          name="shotType"
          rules={[{ required: true, message: '请选择景别' }]}
        >
          <Select>
            <Select.Option value="特写">特写</Select.Option>
            <Select.Option value="近景">近景</Select.Option>
            <Select.Option value="全景">全景</Select.Option>
            <Select.Option value="中景">中景</Select.Option>
            <Select.Option value="远景">远景</Select.Option>
          </Select>
        </Form.Item>

        {/* 镜头运动 */}
        <Form.Item
          label="镜头运动"
          name="cameraMovement"
          rules={[{ required: true, message: '请选择镜头运动' }]}
        >
          <Select>
            <Select.Option value="固定">固定</Select.Option>
            <Select.Option value="推进">推进</Select.Option>
            <Select.Option value="拉远">拉远</Select.Option>
            <Select.Option value="摇移">摇移</Select.Option>
            <Select.Option value="跟随">跟随</Select.Option>
          </Select>
        </Form.Item>

        {/* 场景 */}
        <Form.Item label="场景" name="scene">
          <Input placeholder="例如：御花园清晨" />
        </Form.Item>

        {/* 图像提示词 */}
        <Form.Item
          label={
            <span>
              图像提示词
              <Button
                type="link"
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={handleOptimizePrompt}
                loading={optimizing}
                style={{ marginLeft: 8 }}
              >
                AI优化
              </Button>
            </span>
          }
          name="imagePrompt"
          rules={[{ required: true, message: '请填写图像提示词' }]}
          extra="详细描述画面内容，包括环境、人物、动作、光线、氛围等。点击「AI优化」可自动优化为更适合图像生成的提示词"
        >
          <TextArea
            rows={6}
            placeholder="例如：新中式宫廷写实风格，晨雾弥漫的御花园，青石板路上落叶堆积，林清漪身着粗布裙，低头扫地..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
