import { useState } from 'react';
import { Card, Form, Input, Button, Select, message } from 'antd';
import { CopyOutlined, FileAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { generateScriptStream } from '@/api/ai';

const { TextArea } = Input;

function ScriptGeneration() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [scriptResult, setScriptResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (values: any) => {
    setLoading(true);
    setScriptResult('');

    let accumulatedText = '';

    try {
      await generateScriptStream(
        { novel: values.novel, style: values.style },
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

    const { novel, style } = form.getFieldsValue();
    
    localStorage.setItem('pendingScriptContent', scriptResult);
    localStorage.setItem('pendingScriptStyle', style);
    localStorage.setItem('pendingScriptTitle', novel.substring(0, 20) + '...');

    navigate('/script-management');
    message.success('正在跳转到剧本管理...');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ 
        padding: '24px', 
        maxWidth: 1400, 
        margin: '0 auto',
        paddingBottom: 100,
      }}>
        <Card>
          <Form form={form} layout="vertical" onFinish={handleGenerate}>
            <Form.Item
              label="小说内容"
              name="novel"
              rules={[{ required: true, message: '请输入小说内容' }]}
            >
              <TextArea
                rows={8}
                placeholder="粘贴生成好的小说内容"
              />
            </Form.Item>

            <Form.Item label="剧本风格" name="style" initialValue="奇幻">
              <Select>
                <Select.Option value="奇幻">奇幻</Select.Option>
                <Select.Option value="科幻">科幻</Select.Option>
                <Select.Option value="恋爱">恋爱</Select.Option>
                <Select.Option value="悬疑">悬疑</Select.Option>
                <Select.Option value="武侠">武侠</Select.Option>
              </Select>
            </Form.Item>

            {scriptResult && (
              <Card 
                title="生成结果" 
                size="small"
                style={{ marginBottom: 24 }}
                extra={
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={handleCopy}
                    size="small"
                  >
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
                <div style={{ marginTop: 16, color: '#999' }}>
                  字数：{scriptResult.length}
                </div>
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
