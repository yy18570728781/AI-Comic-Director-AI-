import { Card, Button, Space, Tag, Empty, Popconfirm } from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

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
}

interface ShotsTabProps {
  shots: Shot[];
  generateLoading: boolean;
  onGenerateStoryboard: () => void;
  onEditShot: (shot: Shot) => void;
  onDeleteShot: (shotId: number) => void;
}

/**
 * 分镜脚本标签页
 */
export default function ShotsTab({
  shots,
  generateLoading,
  onGenerateStoryboard,
  onEditShot,
  onDeleteShot,
}: ShotsTabProps) {
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
          {shot.imagePrompt && (
            <div style={{ marginBottom: 8 }}>
              <strong>图像提示词：</strong>
              <div style={{ marginTop: 4, color: '#1890ff', fontSize: 12 }}>
                {shot.imagePrompt}
              </div>
            </div>
          )}
          {shot.videoPrompt && (
            <div style={{ marginBottom: 8 }}>
              <strong>视频提示词：</strong>
              <div
                style={{
                  marginTop: 4,
                  color: '#52c41a',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {shot.videoPrompt}
              </div>
            </div>
          )}
        </Card>
      ))}
    </Space>
  );
}
