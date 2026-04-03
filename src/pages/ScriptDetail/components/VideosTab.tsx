import { Card, Button, Space, Tag, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface ShotVideo {
  id: number;
  url: string;
  model?: string;
  createdAt?: string;
}

interface Shot {
  id: number;
  shotNumber: number;
  scene?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  videos?: ShotVideo[];
}

interface VideosTabProps {
  shots: Shot[];
}

/**
 * 视频标签页
 */
export default function VideosTab({ shots }: VideosTabProps) {
  if (!shots || shots.length === 0) {
    return (
      <Card>
        <Empty description="请先生成分镜脚本" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const shotsWithVideos = shots.filter((shot) => (shot.videos?.length ?? 0) > 0);

  if (shotsWithVideos.length === 0) {
    return (
      <Card>
        <Empty
          description="暂无视频，请先在分镜图像页面生成视频"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {shotsWithVideos.map((shot) => (
        <Card
          key={shot.id}
          title={
            <Space>
              <Tag color="green">镜头 #{shot.shotNumber}</Tag>
              {shot.scene && <span>{shot.scene}</span>}
              <Tag color="blue">{shot.videos!.length} 个视频</Tag>
            </Space>
          }
        >
          {/* 提示词显示 */}
          {(shot.imagePrompt || shot.videoPrompt) && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              {shot.imagePrompt && (
                <div style={{ marginBottom: shot.videoPrompt ? 8 : 0 }}>
                  <strong>图像提示词：</strong>
                  <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                    {shot.imagePrompt}
                  </div>
                </div>
              )}
              {shot.videoPrompt && (
                <div>
                  <strong>视频提示词：</strong>
                  <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                    {shot.videoPrompt}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <strong>视频任务：</strong>
            <div style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {(shot.videos || []).map((video: any, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag
                        color={
                          video.status === 'completed'
                            ? 'green'
                            : video.status === 'failed'
                            ? 'red'
                            : 'blue'
                        }
                      >
                        视频 #{idx + 1}
                      </Tag>
                      {video?.model && <Tag>{video.model}</Tag>}
                      <Tag
                        color={
                          video.status === 'completed'
                            ? 'success'
                            : video.status === 'failed'
                            ? 'error'
                            : 'processing'
                        }
                      >
                        {video.status === 'completed'
                          ? '已完成'
                          : video.status === 'failed'
                          ? '失败'
                          : '处理中'}
                      </Tag>
                      {video?.createdAt && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#999',
                            marginLeft: 8,
                          }}
                        >
                          {new Date(video.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {video.status === 'completed' && video?.url ? (
                      <video
                        width={400}
                        controls
                        style={{
                          borderRadius: '4px',
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <source src={video.url} type="video/mp4" />
                        您的浏览器不支持视频播放
                      </video>
                    ) : video.status === 'failed' ? (
                      <div
                        style={{
                          width: 400,
                          padding: 16,
                          backgroundColor: '#fff2f0',
                          border: '1px solid #ffccc7',
                          borderRadius: '4px',
                          color: '#ff4d4f',
                        }}
                      >
                        <div style={{ fontWeight: 500, marginBottom: 8 }}>❌ 生成失败</div>
                        {video.errorMessage &&
                          (() => {
                            try {
                              const error = JSON.parse(video.errorMessage);
                              if (error.code === 'OutputVideoSensitiveContentDetected') {
                                return (
                                  <div style={{ fontSize: 12 }}>
                                    内容审核未通过，建议：
                                    <br />• 避免使用"颤抖"、"震惊"等强烈情绪词汇
                                    <br />• 使用更中性的描述，如"缓缓"、"专注"
                                    <br />• 点击"AI 优化"按钮自动优化提示词
                                  </div>
                                );
                              }
                              return <div style={{ fontSize: 12 }}>{error.message}</div>;
                            } catch (e) {
                              return <div style={{ fontSize: 12 }}>{video.errorMessage}</div>;
                            }
                          })()}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 400,
                          height: 225,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid #f0f0f0',
                          color: '#999',
                        }}
                      >
                        {video.status === 'processing' ? '🔄 视频生成中...' : '⏳ 等待处理'}
                      </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <Button
                          size="small"
                          disabled={!video?.url}
                          onClick={() => video?.url && window.open(video.url, '_blank')}
                        >
                          下载视频
                        </Button>
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            </div>
          </div>
        </Card>
      ))}
    </Space>
  );
}
