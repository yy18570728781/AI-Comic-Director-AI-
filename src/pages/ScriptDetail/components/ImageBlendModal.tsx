import { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

import ReferenceImageSelector from '@/components/ReferenceImageSelector';

const { TextArea } = Input;

interface ImageBlendModalProps {
  visible: boolean;
  scriptId?: number;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

/**
 * 多参考图融图弹窗
 */
export default function ImageBlendModal({
  visible,
  scriptId,
  onCancel,
  onSubmit,
}: ImageBlendModalProps) {
  const [form] = Form.useForm();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 当弹窗打开时，初始化表单
  const handleOpen = () => {
    form.setFieldsValue({
      model: 'seedream', // 默认使用豆包 Seedream（已配置）
      aspectRatio: '16:9',
      prompt: '',
    });
    setReferenceImages([]);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (referenceImages.length === 0) {
        message.warning('请至少选择一张参考图');
        return;
      }

      onSubmit({
        ...values,
        referenceImages,
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 选择参考图
  const handleSelectImages = (images: string[]) => {
    setReferenceImages(images);
    setSelectorVisible(false);
  };

  return (
    <>
      <Modal
        title="多参考图融图"
        open={visible}
        onCancel={onCancel}
        onOk={handleSubmit}
        afterOpenChange={(open) => open && handleOpen()}
        width={700}
        okText="生成图像"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
          输入提示词并添加多张参考图，生成新的图像
        </div>

        <Form form={form} layout="vertical">
          {/* 图像生成模型 */}
          <Form.Item
            label="图像生成模型"
            name="model"
            rules={[{ required: true, message: '请选择图像生成模型' }]}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div
                onClick={() => form.setFieldsValue({ model: 'seedream' })}
                style={{
                  padding: '16px',
                  border: '2px solid',
                  borderColor:
                    form.getFieldValue('model') === 'seedream'
                      ? '#1890ff'
                      : '#d9d9d9',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  豆包 Seedream4.5
                  {form.getFieldValue('model') === 'seedream' && (
                    <span style={{ color: '#1890ff', marginLeft: 8 }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  多图融合，角色一致（推荐）
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  border: '2px solid #d9d9d9',
                  borderRadius: 8,
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  nanoBanana Pro
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  支持多图融合，速度快（未配置）
                </div>
              </div>
            </div>
          </Form.Item>

          {/* 提示词 */}
          <Form.Item
            label="提示词"
            name="prompt"
            extra="描述你想生成的图像内容"
          >
            <TextArea
              rows={4}
              placeholder="例如：一个年轻女性在花园中散步，阳光明媚..."
            />
          </Form.Item>

          {/* 参考图选择 */}
          <Form.Item
            label="参考图"
            required
            extra="选择多张参考图片，AI 将融合这些图片的风格和元素"
          >
            <Button
              icon={<PictureOutlined />}
              onClick={() => setSelectorVisible(true)}
              style={{ marginBottom: 8 }}
            >
              选择参考图{' '}
              {referenceImages.length > 0 && `(${referenceImages.length})`}
            </Button>
            {referenceImages.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {referenceImages.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '1px solid #d9d9d9',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setPreviewImage(url);
                      setPreviewOpen(true);
                    }}
                  >
                    <img
                      src={url}
                      alt={`参考图 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          {/* 图像比例 */}
          <Form.Item
            label="图像比例"
            name="aspectRatio"
            rules={[{ required: true, message: '请选择图像比例' }]}
          >
            <Select>
              <Select.Option value="1:1">
                1:1（正方形 - 1024x1024）
              </Select.Option>
              <Select.Option value="16:9">
                16:9（横屏 - 1280x720）
              </Select.Option>
              <Select.Option value="9:16">
                9:16（竖屏 - 720x1280）
              </Select.Option>
              <Select.Option value="3:4">
                3:4（标准竖屏 - 768x1152）
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 参考图选择器 */}
      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={handleSelectImages}
        maxCount={10}
        scriptId={scriptId}
        defaultImages={referenceImages}
      />

      {/* 图片预览 Modal */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
}
