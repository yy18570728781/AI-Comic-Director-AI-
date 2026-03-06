import { useState, useEffect } from 'react';
import { Card, Input, Button, Space, Tag, Divider, message, Spin, Radio } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, CopyOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useNovelStore } from '@/stores/useNovelStore';
import { generateNovelStream } from '@/api/ai';
import { getNovelTags } from '@/api/novel';

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

function NovelGeneration() {
  const [tagConfig, setTagConfig] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const {
    tagSelection,
    outlineInput,
    wordCount,
    generatedContent,
    isGenerating,
    selectTag,
    setOutlineInput,
    setWordCount,
    setGeneratedContent,
    setIsGenerating,
    reset,
  } = useNovelStore();

  useEffect(() => {
    loadTagConfig();
  }, []);

  const loadTagConfig = async () => {
    try {
      const { data } = await getNovelTags();
      setTagConfig(data);
    } catch (error: any) {
      message.error('加载标签配置失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCoreRequirements = () => {
    const lines: string[] = [];
    
    tagConfig.forEach((category) => {
      const selected = tagSelection[category.key];
      const value = Array.isArray(selected) ? selected.join('、') : selected || '';
      lines.push(value ? `${category.name}：${value}；` : `${category.name}：；`);
    });

    return lines.join('\n');
  };

  const handleGenerate = async () => {
    const coreReq = formatCoreRequirements();
    if (!coreReq.trim()) {
      message.warning('请至少选择一个标签');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    let accumulatedText = '';

    try {
      await generateNovelStream(
        { theme: coreReq, outline: outlineInput, length: wordCount },
        (content) => {
          accumulatedText += content;
          setGeneratedContent(accumulatedText);
        },
        (error) => message.error(error),
        () => message.success('小说生成完成')
      );
    } catch (error: any) {
      message.error(error.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载配置中..." />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ 
        padding: '24px', 
        maxWidth: 1400, 
        margin: '0 auto',
        paddingBottom: 100,
      }}>
        <Card
          extra={
            <Button icon={<ReloadOutlined />} onClick={reset}>
              重置
            </Button>
          }
        >
          {/* 核心要求预览区 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              核心要求
              <span style={{ fontSize: 12, color: '#999' }}>可任意增改</span>
            </div>
            <TextArea
              rows={8}
              value={formatCoreRequirements()}
              readOnly
              style={{ 
                background: '#f5f5f5', 
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.8,
              }}
            />
          </div>

          <Divider />
          {/* 大纲输入 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>小说大纲（可选）：</div>
            <TextArea
              rows={4}
              placeholder="输入小说大纲，如：主角身份、主要情节、结局走向等"
              value={outlineInput}
              onChange={(e) => setOutlineInput(e.target.value)}
            />
          </div>
          {/* 标签选择区 */}
          <div style={{ marginBottom: 24 }}>
            {tagConfig.map((category) => {
              const selected = tagSelection[category.key];
              const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];
              const needsCollapse = ['tone', 'maleRole', 'cheatCodeType', 'femaleRole', 'villainRole'].includes(category.key);
              const isExpanded = expandedCategories[category.key] ?? false;
              const isMultiSelect = category.multiSelect ?? false;
              
              return (
                <div key={category.key} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {category.name}：
                    {isMultiSelect && <span style={{ fontSize: 12, color: '#999' }}>（可多选）</span>}
                    {needsCollapse && (
                      <Button
                        type="link"
                        size="small"
                        icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [category.key]: !isExpanded }))}
                        style={{ padding: 0, height: 'auto' }}
                      >
                        {isExpanded ? '收起' : '展开'}
                      </Button>
                    )}
                  </div>
                  <Space 
                    wrap 
                    style={{ 
                      maxHeight: needsCollapse && !isExpanded ? '30px' : 'none',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    {category.options.map((option) => (
                      <Tag
                        key={option.value}
                        color={selectedArray.includes(option.label) ? 'blue' : 'default'}
                        style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
                        onClick={() => selectTag(category.key, option.label, isMultiSelect)}
                      >
                        {option.label}
                      </Tag>
                    ))}
                  </Space>
                </div>
              );
            })}
          </div>

          <Divider />

          {/* 字数选择 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              字数要求
              <span style={{ fontSize: 12, color: '#999' }}>豆包模型建议 2500 字以内效果最佳</span>
            </div>
            <Radio.Group value={wordCount} onChange={(e) => setWordCount(e.target.value)}>
              <Space wrap>
                <Radio.Button value={1500}>短篇（1500字）</Radio.Button>
                <Radio.Button value={2000}>中篇（2000字）</Radio.Button>
                <Radio.Button value={2500}>长篇（2500字）</Radio.Button>
              </Space>
            </Radio.Group>
          </div>

          <Divider />

          

          {/* 生成结果 */}
          {generatedContent && (
            <>
              <Divider />
              <Card 
                title="生成结果" 
                size="small"
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
                  {generatedContent}
                </div>
                <div style={{ marginTop: 16, color: '#999' }}>
                  字数：{generatedContent.length}
                </div>
              </Card>
            </>
          )}
        </Card>
      </div>

      {/* 底部悬浮按钮 */}
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
        <Button
          type="primary"
          size="large"
          block
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          loading={isGenerating}
        >
          {isGenerating ? '生成中...' : '生成小说'}
        </Button>
      </div>
    </div>
  );
}

export default NovelGeneration;
