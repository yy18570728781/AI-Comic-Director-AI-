import { useEffect, useState } from 'react';
import ImageGenerateModal from '@/components/ImageGenerateModal';
import type {
  ImageGenerateSubmitValues,
  ImageGenerateFormValues,
} from '@/components/ImageGenerateModal';
import { updateShot } from '@/api/script';

interface ShotImageGenerateModalProps {
  visible: boolean;
  shot: any;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  onShotUpdate?: (shotId: number, data: any) => Promise<void>; // 新增：用于更新分镜数据
}

/**
 * 分镜专用的图像生成弹窗
 *
 * 功能特性：
 * 1. 在通用 ImageGenerateModal 基础上增加了分镜保存逻辑
 * 2. 自动从 shot.characterImageMappings 提取角色参考图
 * 3. 支持保存分镜配置到数据库
 * 4. 生成前自动保存表单配置
 */
export default function ShotImageGenerateModal({
  visible,
  shot,
  loading,
  onCancel,
  onSubmit,
  onShotUpdate, // 用于更新分镜数据的回调
}: ShotImageGenerateModalProps) {
  // === 角色参考图自动提取 ===
  const [initialReferenceImages, setInitialReferenceImages] = useState<string[]>([]);

  // 当弹窗打开时，从分镜的角色绑定中提取参考图
  useEffect(() => {
    if (visible && shot?.characterImageMappings?.length) {
      const characterImages = shot.characterImageMappings.map((mapping: any) => mapping.imageUrl);
      setInitialReferenceImages(characterImages);
      console.log(`🎭 [图像弹窗] 自动添加${characterImages.length}个角色参考图:`, characterImages);
    } else {
      setInitialReferenceImages([]);
    }
  }, [visible, shot?.characterImageMappings]);

  // === 分镜数据保存 ===
  // 保存分镜配置到数据库（表单保存功能）
  const handleSave = async (values: ImageGenerateFormValues) => {
    if (onShotUpdate) {
      await onShotUpdate(shot.id, {
        imagePrompt: values.imagePrompt,
        shotType: values.shotType,
        scene: values.scene,
      });
    } else {
      // 兼容旧版本，直接调用 API
      await updateShot(shot.id, {
        imagePrompt: values.imagePrompt,
        shotType: values.shotType,
        scene: values.scene,
      });
    }
  };

  // 生成图像前先保存配置，再提交生成请求
  const handleSubmit = async (values: ImageGenerateSubmitValues) => {
    // 先保存表单配置到数据库
    try {
      if (onShotUpdate) {
        await onShotUpdate(shot.id, {
          imagePrompt: values.imagePrompt,
          shotType: values.shotType,
          scene: values.scene,
        });
      } else {
        // 兼容旧版本，直接调用 API
        await updateShot(shot.id, {
          imagePrompt: values.imagePrompt,
          shotType: values.shotType,
          scene: values.scene,
        });
      }
    } catch (error) {
      console.error('保存表单失败:', error);
      // 不阻塞生成流程，继续执行
    }

    // 回调父组件执行实际的图像生成
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
      initialReferenceImages={initialReferenceImages} // 自动添加的角色参考图
      scriptId={shot?.scriptId}
      loading={loading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      onSave={handleSave}
    />
  );
}
