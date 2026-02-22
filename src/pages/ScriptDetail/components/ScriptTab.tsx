import { Card, Button, Popconfirm } from 'antd';
import { ThunderboltOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface ScriptTabProps {
  content: string;
  hasShots: boolean;
  generateLoading: boolean;
  onRegenerateStoryboard: () => void;
}

/**
 * 剧本标签页
 */
export default function ScriptTab({ 
  content, 
  hasShots, 
  generateLoading,
  onRegenerateStoryboard 
}: ScriptTabProps) {
  return (
    <Card
      extra={
        hasShots && (
          <Popconfirm
            title="重新生成分镜脚本"
            description={
              <div style={{ maxWidth: 300 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                确定重新生成分镜脚本吗？重新生成会清除分镜脚本和分镜图像，请先备份好数据。
              </div>
            }
            onConfirm={onRegenerateStoryboard}
            okText="确定重新生成"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              icon={<ThunderboltOutlined />}
              loading={generateLoading}
            >
              重新生成分镜脚本
            </Button>
          </Popconfirm>
        )
      }
    >
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{content}</div>
    </Card>
  );
}
