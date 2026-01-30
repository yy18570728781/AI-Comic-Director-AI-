import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  InputNumber,
  Select,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { useAICreationStore } from '@/stores/useAICreationStore';
import { useUserStore } from '@/stores/useUserStore';

const { TextArea } = Input;

function AICreation() {
  const { currentUser } = useUserStore();
  const [novelForm] = Form.useForm();
  const [scriptForm] = Form.useForm();

  // 从 store 获取状态
  const {
    novelTheme,
    novelOutline,
    novelLength,
    novelResult,
    scriptNovel,
    scriptStyle,
    scriptResult,
    activeTab,
    setNovelTheme,
    setNovelOutline,
    setNovelLength,
    setNovelResult,
    setScriptNovel,
    setScriptStyle,
    setScriptResult,
    setActiveTab,
  } = useAICreationStore();

  const [novelLoading, setNovelLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);

  // 初始化表单值
  useEffect(() => {
    novelForm.setFieldsValue({
      theme: novelTheme,
      outline: novelOutline,
      length: novelLength,
    });
  }, [novelForm, novelTheme, novelOutline, novelLength]);

  useEffect(() => {
    scriptForm.setFieldsValue({
      novel: scriptNovel,
      style: scriptStyle,
    });
  }, [scriptForm, scriptNovel, scriptStyle]);

  // 生成小说（流式）
  const handleGenerateNovel = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setNovelLoading(true);
    setNovelResult(''); // 清空之前的结果

    try {
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(
        `${apiBaseURL}/api/ai/novel/generate-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: values.theme,
            outline: values.outline,
            length: values.length || 2000,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            if (data === '[DONE]') {
              message.success('小说生成成功');
              break;
            }

            try {
              const json = JSON.parse(data);
              if (json.content) {
                accumulatedText += json.content;
                setNovelResult(accumulatedText); // 保存到 store
              } else if (json.error) {
                message.error(json.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      message.error(error.message || '生成失败');
      console.error(error);
    } finally {
      setNovelLoading(false);
    }
  };

  // 复制小说
  const handleCopyNovel = () => {
    navigator.clipboard.writeText(novelResult);
    message.success('已复制到剪贴板');
  };

  // 生成剧本（流式）
  const handleGenerateScript = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setScriptLoading(true);
    setScriptResult(''); // 清空之前的结果

    try {
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
      const response = await fetch(
        `${apiBaseURL}/api/ai/script/generate-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            novel: values.novel,
            style: values.style,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            if (data === '[DONE]') {
              message.success('剧本生成成功');
              break;
            }

            try {
              const json = JSON.parse(data);
              if (json.content) {
                accumulatedText += json.content;
                setScriptResult(accumulatedText); // 保存到 store
              } else if (json.error) {
                message.error(json.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      message.error(error.message || '生成失败');
      console.error(error);
    } finally {
      setScriptLoading(false);
    }
  };

  // 复制剧本
  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptResult);
    message.success('已复制到剪贴板');
  };

  const tabItems = [
    {
      key: 'novel',
      label: '小说生成',
      children: (
        <div>
          <Form
            form={novelForm}
            layout="vertical"
            onFinish={handleGenerateNovel}
          >
            <Form.Item
              label="小说主题"
              name="theme"
              rules={[{ required: true, message: '请输入小说主题' }]}
            >
              <Input
                placeholder="例如：boss异能"
                onChange={(e) => setNovelTheme(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="小说大纲" name="outline">
              <TextArea
                rows={4}
                placeholder="可选，输入小说大纲"
                onChange={(e) => setNovelOutline(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="期望字数" name="length" initialValue={2000}>
              <InputNumber
                min={500}
                max={5000}
                step={500}
                style={{ width: '100%' }}
                onChange={(value) => setNovelLength(value || 2000)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={novelLoading}>
                生成小说
              </Button>
              {novelResult && (
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyNovel}
                  style={{ marginLeft: 8 }}
                >
                  复制小说
                </Button>
              )}
            </Form.Item>
          </Form>
          {novelResult && (
            <Card title="生成结果" style={{ marginTop: 16 }}>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                {novelResult}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'script',
      label: '剧本生成',
      children: (
        <div>
          <Form
            form={scriptForm}
            layout="vertical"
            onFinish={handleGenerateScript}
          >
            <Form.Item
              label="小说内容"
              name="novel"
              rules={[{ required: true, message: '请输入小说内容' }]}
            >
              <TextArea
                rows={8}
                placeholder="粘贴生成好的小说内容"
                onChange={(e) => setScriptNovel(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="剧本风格" name="style" initialValue="奇幻">
              <Select onChange={(value) => setScriptStyle(value)}>
                <Select.Option value="奇幻">奇幻</Select.Option>
                <Select.Option value="科幻">科幻</Select.Option>
                <Select.Option value="恋爱">恋爱</Select.Option>
                <Select.Option value="悬疑">悬疑</Select.Option>
                <Select.Option value="武侠">武侠</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={scriptLoading}>
                生成剧本
              </Button>
              {scriptResult && (
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyScript}
                  style={{ marginLeft: 8 }}
                >
                  复制剧本
                </Button>
              )}
            </Form.Item>
          </Form>
          {scriptResult && (
            <Card title="生成结果" style={{ marginTop: 16 }}>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                {scriptResult}
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>AI创作</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}

export default AICreation;
