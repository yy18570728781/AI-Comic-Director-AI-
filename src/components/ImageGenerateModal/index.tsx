import { Modal, Form, Input, Select, Button, message, Spin } from 'antd';
import { ThunderboltOutlined, PictureOutlined, UserOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { optimizeImagePrompt } from '@/api/ai';
import { getCharacterList } from '@/api/script';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';

const { TextArea } = Input;

export interface ImageGenerateFormValues {
  shotType: string;
  scene: string;
  imagePrompt: string;
  aspectRatio: string;
  cameraMovement: string;
  quality?: string;
}

export interface ImageGenerateSubmitValues extends ImageGenerateFormValues {
  referenceImages: string[];
  model: string;
}

interface ImageGenerateModalProps {
  visible: boolean;
  title?: string;
  initialValues?: Partial<ImageGenerateFormValues>;
  initialReferenceImages?: string[]; // 新增：初始参考图
  scriptId?: number;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: ImageGenerateSubmitValues) => void;
  /** 可选：传了就显示"保存"按钮，不传就不显示 */
  onSave?: (values: ImageGenerateFormValues) => Promise<void> | void;
}

/**
 * 通用图像生成配置弹窗
 * 不包含任何业务逻辑（不调 updateShot 等），业务由父组件通过回调处理
 */
export default function ImageGenerateModal({
  visible,
  title = '生成图像',
  initialValues,
  initialReferenceImages = [],
  scriptId,
  loading = false,
  onCancel,
  onSubmit,
  onSave,
}: ImageGenerateModalProps) {
  const [form] = Form.useForm();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([]);

  const { imageModel } = useModelStore();
  const { currentUser } = useUserStore();

  // 加载角色列表
  useEffect(() => {
    if (visible && currentUser?.id) {
      loadCharacters();
    }
  }, [visible, currentUser?.id, scriptId]);

  const loadCharacters = async () => {
    setLoadingCharacters(true);
    try {
      const res = await getCharacterList({
        userId: currentUser?.id,
        ...(scriptId ? { scriptId } : {}),
        pageSize: 100,
      });
      setCharacters(res.data?.list || []);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      setLoadingCharacters(false);
    }
  };

  // 当弹窗打开时，初始化表单
  const handleOpen = () => {
    form.setFieldsValue({
      aspectRatio: '16:9',
      shotType: '全景',
      cameraMovement: '固定',
      quality: 'hd',
      scene: '',
      imagePrompt: '',
      ...initialValues,
    });
    setReferenceImages(initialReferenceImages);
    setSelectedCharacterIds([]);
  };

  // 处理角色选择变化
  const handleCharacterChange = (characterIds: number[]) => {
    const prevIds = selectedCharacterIds;
    setSelectedCharacterIds(characterIds);
    
    // 找出新增和删除的角色
    const addedIds = characterIds.filter(id => !prevIds.includes(id));
    const removedIds = prevIds.filter(id => !characterIds.includes(id));
    
    // 获取新增角色的图片 URL
    const addedImages = characters
      .filter(char => addedIds.includes(char.id) && char.imageUrl)
      .map(char => char.imageUrl);
    
    // 获取删除角色的图片 URL
    const removedImages = characters
      .filter(char => removedIds.includes(char.id) && char.imageUrl)
      .map(char => char.imageUrl);
    
    // 更新参考图列表
    setReferenceImages(prev => {
      // 先移除被删除角色的图片
      let updated = prev.filter(url => !removedImages.includes(url));
      // 再添加新增角色的图片（去重）
      const allImages = [...updated, ...addedImages];
      return Array.from(new Set(allImages));
    });
  };

  // 处理删除参考图
  const handleRemoveReferenceImage = (index: number) => {
    const removedUrl = referenceImages[index];
    
    // 从参考图列表中删除
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    
    // 如果删除的图片是某个角色的图片，也要取消选中该角色
    const characterToRemove = characters.find(char => char.imageUrl === removedUrl);
    if (characterToRemove) {
      setSelectedCharacterIds(prev => prev.filter(id => id !== characterToRemove.id));
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
      const res = await optimizeImagePrompt({ prompt: imagePrompt });
      if (res.data?.optimized) {
        form.setFieldsValue({ imagePrompt: res.data.optimized });
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

  // 保存（仅当父组件传了 onSave 时可用）
  const handleSave = async () => {
    if (!onSave) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      try {
        await onSave(values);
        message.success('保存成功');
      } catch (error: any) {
        console.error('保存失败:', error);
      } finally {
        setSaving(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 提交生成
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...values,
        referenceImages,
        model: imageModel,
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleSelectImages = (images: string[]) => {
    setReferenceImages(images);
    setSelectorVisible(false);
  };

  const footerButtons = [
    <Button key="cancel" onClick={onCancel}>
      取消
    </Button>,
  ];
  if (onSave) {
    footerButtons.push(
      <Button key="save" onClick={handleSave} loading={saving}>
        保存
      </Button>,
    );
  }
  footerButtons.push(
    <Button
      key="submit"
      type="primary"
      onClick={handleSubmit}
      loading={loading}
      icon={<ThunderboltOutlined />}
    >
      生成图像
    </Button>,
  );

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      afterOpenChange={(open) => open && handleOpen()}
      width={700}
      footer={footerButtons}
    >
      <Form form={form} layout="vertical">
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
            📝 画面配置
          </div>

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

          <Form.Item label="场景" name="scene">
            <Input placeholder="例如：御花园清晨" />
          </Form.Item>

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

          <Form.Item
            label="参考图（可选）"
            extra="选择参考图片，AI 将基于参考图生成相似风格的图像"
          >
            {/* 角色选择器 */}
            <Form.Item noStyle>
              <Select
                mode="multiple"
                placeholder="选择角色（可多选）"
                value={selectedCharacterIds}
                onChange={handleCharacterChange}
                loading={loadingCharacters}
                style={{ width: '100%', marginBottom: 8 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={characters.map(char => ({
                  label: `${char.name}${char.variant && char.variant !== '默认' ? ` (${char.variant})` : ''}`,
                  value: char.id,
                  disabled: !char.imageUrl,
                }))}
                suffixIcon={<UserOutlined />}
                notFoundContent={loadingCharacters ? <Spin size="small" /> : '暂无角色'}
              />
            </Form.Item>

            <Button
              icon={<PictureOutlined />}
              onClick={() => setSelectorVisible(true)}
              style={{ marginBottom: 8 }}
            >
              选择其他参考图{' '}
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
                      position: 'relative',
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '1px solid #d9d9d9',
                      cursor: 'pointer',
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
                      onClick={() => {
                        setPreviewImage(url);
                        setPreviewOpen(true);
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        padding: '0 4px',
                        fontSize: 12,
                        background: 'rgba(255,255,255,0.9)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveReferenceImage(index);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="画质"
            name="quality"
            rules={[{ required: true, message: '请选择画质' }]}
            extra="高清画质生成效果更好，但消耗积分更多"
          >
            <Select>
              <Select.Option value="standard">标准画质</Select.Option>
              <Select.Option value="hd">高清画质（推荐）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="图像比例"
            name="aspectRatio"
            rules={[{ required: true, message: '请选择图像比例' }]}
            extra="支持的尺寸：1024x1024、1280x720、720x1280、768x1152"
          >
            <Select>
              <Select.Option value="1:1">1:1（正方形 - 1024x1024）</Select.Option>
              <Select.Option value="16:9">16:9（横屏 - 1280x720）</Select.Option>
              <Select.Option value="9:16">9:16（竖屏 - 720x1280）</Select.Option>
              <Select.Option value="3:4">3:4（标准竖屏 - 768x1152）</Select.Option>
            </Select>
          </Form.Item>

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
        </div>
      </Form>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={handleSelectImages}
        maxCount={3}
        scriptId={scriptId}
        defaultImages={referenceImages}
      />

      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Modal>
  );
}
