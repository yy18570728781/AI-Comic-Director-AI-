import React, { useState } from 'react';
import { Button, message } from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import ImageGenerateModalQueue from '../../pages/ScriptDetail/components/ImageGenerateModalQueue';

interface CharacterImageActionsProps {
  character: any;
  onImageGenerated?: () => void;
}

/**
 * 角色图像操作组件
 * 复用现有的图像生成逻辑
 */
export default function CharacterImageActions({
  character,
  onImageGenerated,
}: CharacterImageActionsProps) {
  const [generateModalVisible, setGenerateModalVisible] = useState(false);

  // 构造一个类似 shot 的对象给图像生成组件使用
  const mockShot = {
    id: character.id,
    scriptId: character.scriptId || null,
    scene: character.name,
    imagePrompt: `${character.name}, ${character.description || ''}`,
    shotType: '角色图像',
  };

  const handleGenerateSuccess = (result: any) => {
    message.success('角色图像生成完成！');
    onImageGenerated?.();
  };

  const handleUploadImage = () => {
    message.info('图像上传功能开发中...');
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          size="small"
          type="primary"
          icon={<PictureOutlined />}
          onClick={() => setGenerateModalVisible(true)}
        >
          生成图像
        </Button>
        <Button
          size="small"
          icon={<UploadOutlined />}
          onClick={handleUploadImage}
        >
          上传图像
        </Button>
      </div>

      {/* 复用现有的图像生成弹窗 */}
      <ImageGenerateModalQueue
        visible={generateModalVisible}
        shot={mockShot}
        onCancel={() => setGenerateModalVisible(false)}
        onSuccess={handleGenerateSuccess}
      />
    </>
  );
}
