import { Modal, Tabs } from 'antd';
import { useState, useEffect } from 'react';
import CustomUploadTab from './CustomUploadTab';
import ProjectImagesTab from './ProjectImagesTab';
import ResourceLibraryTab from './ResourceLibraryTab';

interface ReferenceImageSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (images: string[]) => void;
  maxCount?: number; // 最多选择几张，默认 3
  projectId?: number; // 当前项目ID（用于"本项目图像"）
  scriptId?: number; // 当前剧本ID（用于筛选资源库）
  defaultImages?: string[]; // 默认选中的图片
}

/**
 * 参考图选择器
 * 支持三种方式选择参考图：
 * 1. 本项目图像 - 从当前项目已生成的图像中选择
 * 2. 资源库 - 从角色库/场景库/道具库中选择
 * 3. 自定义上传 - 直接上传新图片
 */
export default function ReferenceImageSelector({
  visible,
  onCancel,
  onConfirm,
  maxCount = 3,
  projectId,
  scriptId,
  defaultImages = [],
}: ReferenceImageSelectorProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedImages, setSelectedImages] = useState<string[]>(defaultImages);

  // 当弹窗打开时，重置选中的图片
  useEffect(() => {
    if (visible) {
      setSelectedImages(defaultImages);
    }
  }, [visible, defaultImages]);

  // 确认选择
  const handleConfirm = () => {
    onConfirm(selectedImages);
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'upload',
      label: '自定义上传',
      children: (
        <CustomUploadTab maxCount={maxCount} value={selectedImages} onChange={setSelectedImages} />
      ),
    },
    {
      key: 'resource',
      label: '资源库',
      children: (
        <ResourceLibraryTab
          scriptId={scriptId}
          maxCount={maxCount}
          value={selectedImages}
          onChange={setSelectedImages}
        />
      ),
    },
    {
      key: 'project',
      label: '本项目图像',
      children: (
        <ProjectImagesTab
          projectId={projectId}
          scriptId={scriptId}
          maxCount={maxCount}
          value={selectedImages}
          onChange={setSelectedImages}
        />
      ),
    },
  ];

  return (
    <Modal
      title="选择参考图"
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={800}
      okText="确定"
      cancelText="取消"
      okButtonProps={{
        disabled: selectedImages.length === 0,
      }}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <div style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>
        从项目图像、资源库或上传自定义图片
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#f5f5f5',
          borderRadius: 4,
        }}
      >
        <div style={{ fontSize: 12, color: '#666' }}>
          已选择 <strong>{selectedImages.length}</strong> / {maxCount} 张参考图
        </div>
      </div>
    </Modal>
  );
}
