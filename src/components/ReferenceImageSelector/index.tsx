import { Modal, Tabs } from 'antd';
import { useEffect, useState } from 'react';

import AIComposeTab from './AIComposeTab';
import CustomUploadTab from './CustomUploadTab';
import ResourceLibraryTab from './ResourceLibraryTab';
import type { AIBizType } from '@/types/ai-task';
import './style.less';

interface ReferenceImageSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (images: string[]) => void;
  maxCount?: number;
  projectId?: number;
  scriptId?: number;
  defaultImages?: string[];
  bizType?: AIBizType;
}

/**
 * 参考图选择器
 * 支持 AI 合成、自定义上传、资源库三种来源。
 */
export default function ReferenceImageSelector({
  visible,
  onCancel,
  onConfirm,
  maxCount = 3,
  scriptId,
  defaultImages = [],
  bizType = 'default',
}: ReferenceImageSelectorProps) {
  const [activeTab, setActiveTab] = useState('ai-compose');

  /**
   * 弹窗内统一的最终选中结果，所有 tab 都往这里回填。
   */
  const [selectedImages, setSelectedImages] = useState<string[]>(defaultImages);

  useEffect(() => {
    if (visible) {
      setSelectedImages(defaultImages);
    }
  }, [defaultImages, visible]);

  const handleConfirm = () => {
    onConfirm(selectedImages);
  };

  const tabItems = [
    {
      key: 'ai-compose',
      label: 'AI合成',
      children: (
        <AIComposeTab
          scriptId={scriptId}
          maxCount={maxCount}
          value={selectedImages}
          onChange={setSelectedImages}
          bizType={bizType}
        />
      ),
    },
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
      <div className="reference-image-selector__helper-text">
        从 AI 合成、资源库或上传图片中选择参考图
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <div className="reference-image-selector__summary">
        <div className="reference-image-selector__summary-text">
          已选择 <strong>{selectedImages.length}</strong> / {maxCount} 张参考图
        </div>
      </div>
    </Modal>
  );
}
