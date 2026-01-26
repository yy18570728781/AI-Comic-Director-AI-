import { useState } from 'react';
import { Card, Button, Space, Tag, Empty, Popconfirm, Image } from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

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
  characters?: string[];
  dialogue?: string;
  visualDescription?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  images?: ShotImage[];
  videos?: ShotVideo[];
}

interface ShotsTabProps {
  shots: Shot[];
  generateLoading: boolean;
  generatingImages: Set<number>;
  generatingVideos: Set<number>;
  onGenerateStoryboard: () => void;
  onEditShot: (shot: Shot) => void;
  onDeleteShot: (shotId: number) => void;
  onGenerateImage: (shot: Shot, config: any) => void;
  onGenerateVideo: (shot: Shot) => void;
}

/**
 * 分镜脚本标签页 - 显示脚本信息 + 已生成图片 + 生成图像按钮
 */
export default function ShotsTab({
  shots,
  generateLoading,
  generatingImages,
  generatingVideos,
  onGenerateStoryboard,
  onEditShot,
  onDeleteShot,
  onGenerateImage,
  onGenerateVideo,
}: ShotsTabProps) {
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
          description="还没有生成分镜脚本"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={onGenerateStoryboard}
            loading={generateLoading}
          >
            生成分镜脚本
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {shots.map((shot) => (
          <Card
            key={shot.id}
            title={
              <Space>
                <Tag color="green">镜头 #{shot.shotNumber}</Tag>
                {shot.scene && <span>{shot.scene}</span>}
                {shot.shotType && <Tag>{shot.shotType}</Tag>}
                {shot.duration && <Tag color="blue">{shot.duration}秒</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditShot(shot)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除这个分镜吗？"
                  onConfirm={() => onDeleteShot(shot.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            {/* 脚本信息 */}
            {shot.characters && shot.characters.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <strong>角色：</strong>
                {shot.characters.map((char: string, idx: number) => (
                  <Tag key={idx} color="purple">
                    {char}
                  </Tag>
                ))}
              </div>
            )}
            {shot.dialogue && (
              <div style={{ marginBottom: 8 }}>
                <strong>对白：</strong>
                <div style={{ marginTop: 4, color: '#666' }}>{shot.dialogue}</div>
              </div>
            )}
            {shot.visualDescription && (
              <div style={{ marginBottom: 8 }}>
                <strong>画面描述：</strong>
                <div style={{ marginTop: 4, color: '#666' }}>
                  {shot.visualDescription}
                </div>
              </div>
            )}

            {/* 已生成的图片列表 */}
            {shot.images && shot.images.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  已生成图片 ({shot.images.length})
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    maxHeight: 220,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {shot.images.map((img, idx) => (
                    <Image
                      src={img.url}
                      alt={`图片 ${idx + 1}`}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                      }}
                      preview={{ mask: `图片 ${idx + 1}` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button
                type="primary"
                icon={<PictureOutlined />}
                onClick={() => handleOpenImageModal(shot)}
                loading={generatingImages.has(shot.id)}
              >
                生成图像
              </Button>
              <Button
                icon={<VideoCameraOutlined />}
                onClick={() => onGenerateVideo(shot)}
                loading={generatingVideos.has(shot.id)}
                disabled={!shot.images || shot.images.length === 0}
              >
                生成视频
              </Button>
            </div>
          </Card>
        ))}
      </Space>

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
