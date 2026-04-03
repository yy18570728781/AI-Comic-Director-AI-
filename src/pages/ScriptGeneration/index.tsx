import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, message, Space, Tag } from 'antd';
import { CopyOutlined, FileAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { generateScriptStream } from '@/api/ai';
import { getScriptTags } from '@/api/script';

const { TextArea } = Input;

interface TagOption {
  label: string;
  value: string;
}

interface TagCategory {
  name: string;
  key: string;
  options: TagOption[];
}

function ScriptGeneration() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [scriptResult, setScriptResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagConfig, setTagConfig] = useState<TagCategory[]>([]);
  const [tagSelection, setTagSelection] = useState<Record<string, string>>({
    cameraStyle: '漫画感',
    shotCount: '适中（25-30镜）',
  });
  const [novelContent, setNovelContent] = useState('');

  useEffect(() => {
    loadTagConfig();
  }, []);

  const loadTagConfig = async () => {
    try {
      const { data } = await getScriptTags();
      setTagConfig(data);
    } catch (error: any) {
      message.error('加载配置失败');
    }
  };

  const handleGenerate = async (values: any) => {
    setLoading(true);
    setScriptResult('');

    let accumulatedText = '';

    try {
      await generateScriptStream(
        {
          novel: values.novel,
          style: tagSelection.cameraStyle,
        },
        (content: string) => {
          accumulatedText += content;
          setScriptResult(accumulatedText);
        },
        (error: string) => message.error(error),
        () => message.success('剧本生成成功')
      );
    } catch (error: any) {
      message.error(error.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptResult);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleCreateScript = () => {
    if (!scriptResult) {
      message.warning('请先生成剧本');
      return;
    }

    const { novel } = form.getFieldsValue();

    localStorage.setItem('pendingScriptContent', scriptResult);
    localStorage.setItem('pendingScriptStyle', tagSelection.cameraStyle);
    localStorage.setItem('pendingScriptTitle', novel.substring(0, 20) + '...');

    navigate('/script-management');
    message.success('正在跳转到剧本管理...');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        style={{
          padding: '24px',
          maxWidth: 1400,
          margin: '0 auto',
          paddingBottom: 100,
        }}
      >
        <Card>
          <Form form={form} layout="vertical" onFinish={handleGenerate}>
            <Form.Item
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>小说内容</span>
                  <span style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
                    已输入 {novelContent.length} 字
                  </span>
                </div>
              }
              name="novel"
              rules={[{ required: true, message: '请输入小说内容' }]}
            >
              <TextArea
                rows={8}
                placeholder="粘贴生成好的小说内容"
                value={novelContent}
                onChange={(e) => setNovelContent(e.target.value)}
              />
            </Form.Item>

            {/* 配置选项 */}
            <div style={{ marginBottom: 24 }}>
              {tagConfig.map((category) => {
                const selected = tagSelection[category.key] || '';
                return (
                  <div key={category.key} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>{category.name}：</div>
                    <Space wrap>
                      {category.options.map((option) => (
                        <Tag
                          key={option.value}
                          color={selected === option.label ? 'blue' : 'default'}
                          style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
                          onClick={() =>
                            setTagSelection((prev) => ({ ...prev, [category.key]: option.label }))
                          }
                        >
                          {option.label}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                );
              })}
            </div>

            {scriptResult && (
              <Card
                title="生成结果"
                size="small"
                style={{ marginBottom: 24 }}
                extra={
                  <Button icon={<CopyOutlined />} onClick={handleCopy} size="small">
                    复制全文
                  </Button>
                }
              >
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    maxHeight: 600,
                    overflow: 'auto',
                  }}
                >
                  {scriptResult}
                </div>
                <div style={{ marginTop: 16, color: '#999' }}>字数：{scriptResult.length}</div>
              </Card>
            )}
          </Form>
        </Card>
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          padding: '16px 24px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => form.submit()}
            loading={loading}
            style={{ flex: 1 }}
          >
            {loading ? '生成中...' : scriptResult ? '重新生成' : '生成剧本'}
          </Button>
          {scriptResult && (
            <Button
              size="large"
              icon={<FileAddOutlined />}
              onClick={handleCreateScript}
              disabled={loading}
            >
              创建剧本
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScriptGeneration;
