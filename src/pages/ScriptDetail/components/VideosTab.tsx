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
  visualDescription?: string;
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
        <Empty
          description="请先生成分镜脚本"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const shotsWithVideos = shots.filter(
    (shot) => shot.videos && shot.videos.length > 0,
  );

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
          {shot.visualDescription && (
            <div style={{ marginBottom: 12 }}>
              <strong>画面描述：</strong>
              <div style={{ marginTop: 4, color: '#666' }}>
                {shot.visualDescription}
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <strong>生成的视频：</strong>
            <div style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {shot.videos!.map((video, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="green">视频 #{idx + 1}</Tag>
                      {video.model && <Tag>{video.model}</Tag>}
                      {video.createdAt && (
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
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <Button
                          size="small"
                          onClick={() => window.open(video.url, '_blank')}
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
