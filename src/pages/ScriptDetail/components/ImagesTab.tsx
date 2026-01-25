import { Card, Button, Space, Tag, Empty, Popconfirm, Image } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import ImageGenerateModal from './ImageGenerateModal';

interface ShotImage {
  id: number;
  url: string;
}

interface ShotVideo {
  id: number;
  url: string;
}

interface Shot {
  id: number;
  shotNumber: number;
  scene?: string;
  shotType?: string;
  duration?: number;
  visualDescription?: string;
  imagePrompt?: string;
  images?: ShotImage[];
  videos?: ShotVideo[];
}

interface ImagesTabProps {
  shots: Shot[];
  generatingImages: Set<number>;
  generatingVideos: Set<number>;
  scriptId?: number;
  onGenerateImage: (shot: Shot, config: any) => void;
  onGenerateVideo: (shot: Shot) => void;
  onEditShot: (shot: Shot) => void;
  onDeleteShot: (shotId: number) => void;
}

/**
 * 分镜图像标签页 - 卡片网格布局
 */
export default function ImagesTab({
  shots,
  generatingImages,
  generatingVideos,
  scriptId,
  onGenerateImage,
  onGenerateVideo,
  onEditShot,
  onDeleteShot,
}: ImagesTabProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentShot, setCurrentShot] = useState<Shot | null>(null);

  // 打开图像生成弹窗
  const handleOpenImageModal = (shot: Shot) => {
    setCurrentShot(shot);
    setImageModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseImageModal = () => {
    setImageModalVisible(false);
    setCurrentShot(null);
  };

  // 提交图像生成
  const handleSubmitImageGenerate = (config: any) => {
    if (currentShot) {
      onGenerateImage(currentShot, config);
      handleCloseImageModal();
    }
  };

  if (!shots || shots.length === 0) {
    return (
      <Card>
        <Empty
          description="请先生成分镜脚本"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const content = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
      }}
    >
      {shots.map((shot) => (
        <Card
          key={shot.id}
          style={{ height: '100%' }}
          bodyStyle={{ padding: 0 }}
        >
          {/* 卡片头部 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <Tag color="green">镜头 #{shot.shotNumber}</Tag>
              {shot.shotType && <Tag>{shot.shotType}</Tag>}
              {shot.duration && <Tag color="blue">{shot.duration}秒</Tag>}
            </Space>
          </div>

          {/* 场景名称 */}
          {shot.scene && (
            <div
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {shot.scene}
            </div>
          )}

          {/* 图片展示区域 */}
          <div
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {shot.images && shot.images.length > 0 ? (
              <Image
                src={shot.images[shot.images.length - 1].url}
                alt={`镜头 ${shot.shotNumber}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                preview={{
                  mask: '查看大图',
                }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无图像"
              />
            )}
          </div>

          {/* 画面描述 */}
          <div
            style={{
              padding: '12px 16px',
              fontSize: 12,
              color: '#666',
              lineHeight: 1.6,
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {shot.visualDescription || shot.imagePrompt || '暂无描述'}
          </div>

          {/* 视频任务状态 */}
          {generatingVideos.has(shot.id) && (
            <div
              style={{
                padding: '0 16px 8px',
                fontSize: 12,
                color: '#999',
              }}
            >
              视频任务进行中
            </div>
          )}

          {shot.videos && shot.videos.length > 0 && (
            <div
              style={{
                padding: '0 16px 8px',
                fontSize: 12,
                color: '#52c41a',
              }}
            >
              已生成视频任务
            </div>
          )}

          {/* 操作按钮区域 */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {/* 主要操作 - 两个大按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Button
                style={{ flex: 1 }}
                type="primary"
                icon={<PictureOutlined />}
                onClick={() => handleOpenImageModal(shot)}
                loading={generatingImages.has(shot.id)}
              >
                生成图像
              </Button>
              <Button
                style={{ flex: 1 }}
                icon={<VideoCameraOutlined />}
                onClick={() => onGenerateVideo(shot)}
                loading={generatingVideos.has(shot.id)}
                disabled={!shot.images || shot.images.length === 0}
              >
                生成视频
              </Button>
            </div>

            {/* 次要操作 - 小按钮 */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between',
              }}
            >
              <Space size="small">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditShot(shot)}
                >
                  编辑
                </Button>
                {shot.images && shot.images.length > 1 && (
                  <Button size="small" icon={<PictureOutlined />}>
                    {shot.images.length} 张
                  </Button>
                )}
              </Space>
              <Popconfirm
                title="确定删除这个分镜吗？"
                onConfirm={() => onDeleteShot(shot.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {content}

      {/* 图像生成配置弹窗 */}
      <ImageGenerateModal
        visible={imageModalVisible}
        shot={currentShot}
        loading={currentShot ? generatingImages.has(currentShot.id) : false}
        onCancel={handleCloseImageModal}
        onSubmit={handleSubmitImageGenerate}
      />
    </>
  );
}
