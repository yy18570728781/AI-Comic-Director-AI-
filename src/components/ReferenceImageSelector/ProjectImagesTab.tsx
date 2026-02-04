import { useState, useEffect } from 'react';
import { Empty, Checkbox, Image, Spin } from 'antd';

interface ProjectImagesTabProps {
  projectId?: number;
  scriptId?: number;
  maxCount?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
}

/**
 * 本项目图像标签页
 */
export default function ProjectImagesTab({
  projectId,
  scriptId,
  maxCount = 3,
  value = [],
  onChange,
}: ProjectImagesTabProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(value);

  // TODO: 从后端获取项目图像
  useEffect(() => {
    // 暂时显示空状态
    setImages([]);
  }, [projectId, scriptId]);

  // 选择/取消选择图片
  const handleToggleImage = (url: string) => {
    let newSelected: string[];

    if (selectedImages.includes(url)) {
      // 取消选择
      newSelected = selectedImages.filter((img) => img !== url);
    } else {
      // 选择
      if (selectedImages.length >= maxCount) {
        // 已达到最大数量，替换最后一个
        newSelected = [...selectedImages.slice(0, maxCount - 1), url];
      } else {
        newSelected = [...selectedImages, url];
      }
    }

    setSelectedImages(newSelected);
    onChange?.(newSelected);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="本项目暂无已生成的图像"
          style={{ padding: '40px 0' }}
        >
          <div style={{ color: '#999', fontSize: 12 }}>
            请先生成黄色或场景图像
          </div>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {images.map((url) => (
          <div
            key={url}
            style={{
              position: 'relative',
              cursor: 'pointer',
              border: selectedImages.includes(url)
                ? '2px solid #1890ff'
                : '2px solid transparent',
              borderRadius: 4,
              overflow: 'hidden',
              width: 150,
              height: 150,
              flexShrink: 0,
            }}
            onClick={() => handleToggleImage(url)}
          >
            <Image
              src={url}
              alt="项目图像"
              width={150}
              height={150}
              preview={false}
              style={{ objectFit: 'cover' }}
            />
            <Checkbox
              checked={selectedImages.includes(url)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        已选择 {selectedImages.length} / {maxCount} 张
      </div>
    </div>
  );
}
