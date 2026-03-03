import { useState } from 'react';
import { Card, Button, Space, Tag, Empty, Popconfirm, Image } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

import VideoGenerateModal from './VideoGenerateModal';
import { useVideoModelSupport } from '@/hooks/useVideoModelSupport';

interface ShotImage {
  id: number;
  url: string;
}

interface ShotVideo {
  id: number;
  url: string;
  status?: string;
  errorMessage?: string;
}

interface Shot {
  id: number;
  shotNumber: number;
  scene?: string;
  shotType?: string;
  duration?: number;
  visualDescription?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  images?: ShotImage[];
  videos?: ShotVideo[];
}

interface ImagesTabProps {
  shots: Shot[];
  generatingImages: Set<number | string>;
  generatingVideos: Set<number | string>;
  scriptId?: number;
  onGenerateVideo: (shot: Shot, config: any) => void;
  onEditShot: (shot: Shot) => void;
  onDeleteShot: (shotId: number) => void;
  onShotUpdate?: (shotId: number, data: any) => Promise<void>; // 新增：用于更新分镜数据
}

/**
 * 分镜图像标签页 - 卡片网格布局
 */
export default function ImagesTab({
  shots,
  generatingImages,
  generatingVideos,
  scriptId,
  onGenerateVideo,
  onEditShot,
  onDeleteShot,
  onShotUpdate,
}: ImagesTabProps) {
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentShot, setCurrentShot] = useState<Shot | null>(null);

  // 获取当前视频模型支持的功能
  const { supportsFirstLastFrame } = useVideoModelSupport();

  // 打开视频生成弹窗
  const handleOpenVideoModal = (shot: Shot) => {
    setCurrentShot(shot);
    setVideoModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseVideoModal = () => {
    setVideoModalVisible(false);
    setCurrentShot(null);
  };

  // 提交视频生成
  const handleSubmitVideoGenerate = (config: any) => {
    if (currentShot) {
      onGenerateVideo(currentShot, config);
      handleCloseVideoModal();
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

          {/* 图片展示区域 - 首帧和尾帧 */}
          <div
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              gap: '2px',
              overflow: 'hidden',
            }}
          >
            {/* 首帧 */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#fff7e6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag
                color="#faad14"
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  zIndex: 10,
                  margin: 0,
                }}
              >
                首帧
              </Tag>
              {shot.images?.find((img: any) => img && img.isFirstFrame) ? (
                <Image
                  src={
                    shot.images.find((img: any) => img && img.isFirstFrame)?.url
                  }
                  alt="首帧"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  preview={{
                    mask: '首帧',
                  }}
                />
              ) : (
                <span style={{ color: '#d48806', fontSize: 12 }}>未设置</span>
              )}
            </div>

            {/* 尾帧 - 仅支持首尾帧的模型显示 */}
            {supportsFirstLastFrame && (
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  backgroundColor: '#e6f7ff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tag
                  color="#1890ff"
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    zIndex: 10,
                    margin: 0,
                  }}
                >
                  尾帧
                </Tag>
                {shot.images?.find((img: any) => img && img.isLastFrame) ? (
                  <Image
                    src={
                      shot.images.find((img: any) => img && img.isLastFrame)?.url
                    }
                    alt="尾帧"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    preview={{
                      mask: '尾帧',
                    }}
                  />
                ) : (
                  <span style={{ color: '#096dd9', fontSize: 12 }}>未设置</span>
                )}
              </div>
            )}
          </div>

          {/* 提示词显示 */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {shot.imagePrompt && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                  图像提示词：
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#666',
                    lineHeight: 1.6,
                    maxHeight: '48px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {shot.imagePrompt}
                </div>
              </div>
            )}
            {shot.videoPrompt && (
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                  视频提示词：
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#666',
                    lineHeight: 1.6,
                    maxHeight: '48px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {shot.videoPrompt}
                </div>
              </div>
            )}
            {!shot.imagePrompt && !shot.videoPrompt && (
              <div style={{ fontSize: 12, color: '#999' }}>暂无提示词</div>
            )}
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

          {(shot.videos?.length ?? 0) > 0 && (() => {
            const hasSuccessVideo = shot.videos?.some((video: any) => video.status === 'completed' && video.url);
            const hasFailedVideo = shot.videos?.some((video: any) => video.status === 'failed');
            const hasPendingVideo = shot.videos?.some((video: any) => video.status === 'pending' || video.status === 'processing');

            if (hasSuccessVideo) {
              return (
                <div
                  style={{
                    padding: '0 16px 8px',
                    fontSize: 12,
                    color: '#52c41a',
                  }}
                >
                  ✅ 视频生成成功
                </div>
              );
            } else if (hasFailedVideo) {
              const failedVideo = shot.videos?.find((video: any) => video.status === 'failed');
              const errorMsg = failedVideo?.errorMessage;
              let displayMsg = '❌ 视频生成失败';
              
              if (errorMsg) {
                try {
                  const error = JSON.parse(errorMsg);
                  if (error.code === 'OutputVideoSensitiveContentDetected') {
                    displayMsg = '❌ 内容审核未通过，请优化提示词';
                  }
                } catch (e) {
                  // 解析失败，使用默认消息
                }
              }
              
              return (
                <div
                  style={{
                    padding: '0 16px 8px',
                    fontSize: 12,
                    color: '#ff4d4f',
                  }}
                >
                  {displayMsg}
                </div>
              );
            } else if (hasPendingVideo) {
              return (
                <div
                  style={{
                    padding: '0 16px 8px',
                    fontSize: 12,
                    color: '#1890ff',
                  }}
                >
                  🔄 视频处理中
                </div>
              );
            }
            return null;
          })()}

          {/* 操作按钮区域 */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              type="primary"
              size="middle"
              icon={<VideoCameraOutlined />}
              onClick={() => handleOpenVideoModal(shot)}
              loading={generatingVideos.has(shot.id)}
              disabled={
                !shot.images?.some((img: any) => img && img.isFirstFrame)
              }
            >
              生成视频
            </Button>
            <Button
              type="default"
              size="middle"
              icon={<EditOutlined />}
              onClick={() => onEditShot(shot)}
              style={{ color: '#1890ff', borderColor: '#1890ff' }}
            >
              编辑
            </Button>
            {shot.images && shot.images.length > 1 && (
              <Button
                type="default"
                size="middle"
                icon={<PictureOutlined />}
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
              >
                {shot.images.length} 张
              </Button>
            )}
            <Popconfirm
              title="确定删除这个分镜吗？"
              onConfirm={() => onDeleteShot(shot.id)}
            >
              <Button
                type="primary"
                danger
                size="middle"
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {content}

      {/* 视频生成配置弹窗 */}
      <VideoGenerateModal
        visible={videoModalVisible}
        shot={currentShot}
        loading={currentShot ? generatingVideos.has(currentShot.id) : false}
        onCancel={handleCloseVideoModal}
        onSubmit={handleSubmitVideoGenerate}
        onShotUpdate={onShotUpdate}
      />
    </>
  );
}
