import ImageGenerateModal from '@/components/ImageGenerateModal';
import type { ImageGenerateSubmitValues, ImageGenerateFormValues } from '@/components/ImageGenerateModal';
import { updateShot } from '@/api/script';

interface ShotImageGenerateModalProps {
  visible: boolean;
  shot: any;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

/**
 * 分镜专用的图像生成弹窗
 * 在通用 ImageGenerateModal 基础上增加了 shot 保存逻辑
 */
export default function ShotImageGenerateModal({
  visible,
  shot,
  loading,
  onCancel,
  onSubmit,
}: ShotImageGenerateModalProps) {
  // 保存分镜配置到数据库
  const handleSave = async (values: ImageGenerateFormValues) => {
    await updateShot(shot.id, {
      imagePrompt: values.imagePrompt,
      shotType: values.shotType,
      scene: values.scene,
    });
  };

  // 生成图像前先保存，再回调父组件
  const handleSubmit = async (values: ImageGenerateSubmitValues) => {
    // 先保存到数据库
    try {
      await updateShot(shot.id, {
        imagePrompt: values.imagePrompt,
        shotType: values.shotType,
        scene: values.scene,
      });
    } catch (error) {
      console.error('保存表单失败:', error);
      // 不阻塞生成流程
    }

    onSubmit(values);
  };

  return (
    <ImageGenerateModal
      visible={visible}
      title={`生成图像 - 镜头 #${shot?.shotNumber}`}
      initialValues={{
        shotType: shot?.shotType || '全景',
        scene: shot?.scene || '',
        imagePrompt: shot?.imagePrompt || '',
      }}
      scriptId={shot?.scriptId}
      loading={loading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      onSave={handleSave}
    />
  );
}
