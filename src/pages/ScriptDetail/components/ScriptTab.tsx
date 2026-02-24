import { Card, Button, Popconfirm, Alert, Collapse } from 'antd';
import { ThunderboltOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface ScriptTabProps {
  content: string;
  hasShots: boolean;
  generateLoading: boolean;
  generatingRawText?: string;
  onRegenerateStoryboard: () => void;
}

export default function ScriptTab({ 
  content, 
  hasShots, 
  generateLoading,
  generatingRawText = '',
  onRegenerateStoryboard 
}: ScriptTabProps) {
  const showGeneratingUI = generateLoading && generatingRawText;
  
  return (
    <Card
      extra={
        hasShots && !generateLoading && (
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
            >
              重新生成分镜脚本
            </Button>
          </Popconfirm>
        )
      }
    >
      {showGeneratingUI && (
        <Alert
          message={`正在生成分镜脚本... 已接收 ${generatingRawText.length} 字符`}
          description={
            <Collapse 
              style={{ marginTop: 12 }}
              defaultActiveKey={['raw']}
              items={[
                {
                  key: 'raw',
                  label: '查看流式生成的 JSON',
                  children: (
                    <div style={{ 
                      maxHeight: 500, 
                      overflow: 'auto', 
                      whiteSpace: 'pre-wrap',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 4,
                      lineHeight: 1.6
                    }}>
                      {generatingRawText}
                    </div>
                  )
                }
              ]}
            />
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{content}</div>
    </Card>
  );
}
