import { useState, useEffect, useMemo } from 'react';
import {
  Empty,
  Checkbox,
  Image,
  Spin,
  Radio,
  Input,
  Tag,
  Pagination,
  message,
} from 'antd';
import { debounce } from 'lodash';
import { SearchOutlined } from '@ant-design/icons';

import { getResourceList } from '@/api/resource';

interface ResourceLibraryTabProps {
  scriptId?: number;
  maxCount?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
}

/**
 * 资源库标签页
 * 展示剧本/分镜资源库中的资源
 */
export default function ResourceLibraryTab({
  scriptId,
  maxCount = 3,
  value = [],
  onChange,
}: ResourceLibraryTabProps) {
  const [resourceType, setResourceType] = useState<
    'all' | 'character' | 'scene' | 'prop' | 'blend'
  >('all');
  const [scope, setScope] = useState<'all' | 'script'>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(value);
  const [resources, setResources] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 获取资源列表
  const fetchResources = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getResourceList({
        ...(resourceType !== 'all' ? { type: resourceType } : {}),
        ...(scope === 'script' && scriptId ? { scriptId } : {}),
        keyword: keyword || undefined,
        page,
        pageSize: pagination.pageSize,
      });

      if (res && res.data) {
        setResources(res.data.list || []);
        setPagination({
          ...pagination,
          current: page,
          total: res.data.total || 0,
        });
      } else {
        message.error(res.message || '获取资源列表失败');
      }
    } catch (error: any) {
      console.error('获取资源列表失败:', error);
      message.error('获取资源列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 防抖的搜索函数
  const debouncedFetchResources = useMemo(
    () => debounce(() => fetchResources(1), 500),
    [fetchResources],
  );

  // 当条件变化时请求数据（筛选条件立即请求，搜索防抖请求）
  useEffect(() => {
    if (keyword) {
      debouncedFetchResources();
    } else {
      fetchResources(1);
    }
    return () => {
      debouncedFetchResources.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, scope, scriptId, keyword]);

  // 选择/取消选择图片
  const handleToggleImage = (url: string) => {
    let newSelected: string[];

    if (selectedImages.includes(url)) {
      // 取消选择
      newSelected = selectedImages.filter((img) => img !== url);
    } else {
      // 选择
      if (selectedImages.length >= maxCount) {
        message.warning(`最多只能选择 ${maxCount} 张图片`);
        return;
      }
      newSelected = [...selectedImages, url];
    }

    setSelectedImages(newSelected);
    onChange?.(newSelected);
  };

  // 获取资源的显示图片
  const getResourceImage = (resource: any): string | null => {
    // 使用 images 数组的第一个图片（后端已确保只有一个）
    if (
      resource.images &&
      resource.images.length > 0 &&
      resource.images[0]?.url
    ) {
      return resource.images[0].url;
    }
    // 其次使用 referenceImages（参考图）
    if (resource.referenceImages && resource.referenceImages.length > 0) {
      return resource.referenceImages[0];
    }
    return null;
  };

  // 获取资源类型标签颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      character: 'blue',
      scene: 'green',
      prop: 'orange',
      blend: 'purple',
    };
    return colors[type] || 'default';
  };

  // 获取资源类型中文名
  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      character: '角色',
      scene: '场景',
      prop: '道具',
      blend: '融图',
    };
    return names[type] || type;
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 筛选条件 */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span style={{ marginRight: 8 }}>资源类型：</span>
            <Radio.Group
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            >
              <Radio.Button value="all">全部</Radio.Button>
              <Radio.Button value="character">角色</Radio.Button>
              <Radio.Button value="scene">场景</Radio.Button>
              <Radio.Button value="prop">道具</Radio.Button>
              <Radio.Button value="blend">融图</Radio.Button>
            </Radio.Group>
          </div>
          <div>
            <span style={{ marginRight: 8 }}>范围：</span>
            <Radio.Group
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <Radio.Button value="all">全局</Radio.Button>
              <Radio.Button value="script" disabled={!scriptId}>
                当前剧本
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
        <div>
          <Input
            placeholder="搜索资源名称或描述..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin tip="加载中..." />
        </div>
      ) : resources.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            resourceType === 'all'
              ? '暂无资源'
              : `暂无${getTypeName(resourceType)}资源`
          }
          style={{ padding: '40px 0' }}
        >
          <div style={{ color: '#999', fontSize: 12 }}>
            {keyword ? '没有找到匹配的资源' : '请先创建资源并上传参考图'}
          </div>
        </Empty>
      ) : (
        <>
          {/* 资源列表 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {resources.map((resource) => {
              const imageUrl = getResourceImage(resource);

              // 如果没有图片，显示占位符
              if (!imageUrl) {
                return (
                  <div
                    key={resource.id}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: '2px solid #e8e8e8',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#f0f0f0',
                      height: 160,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div>暂无图片</div>
                      <div style={{ marginTop: 4, fontSize: 11 }}>
                        {resource.name}
                      </div>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                      }}
                    >
                      <Tag color={getTypeColor(resource.type)}>
                        {getTypeName(resource.type)}
                      </Tag>
                    </div>
                  </div>
                );
              }

              const isSelected = selectedImages.includes(imageUrl);

              return (
                <div
                  key={resource.id}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    border: isSelected
                      ? '2px solid #1890ff'
                      : '2px solid #e8e8e8',
                    borderRadius: 8,
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    background: '#fff',
                  }}
                  onClick={() => handleToggleImage(imageUrl)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={resource.name}
                    preview={false}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                    }}
                    placeholder={
                      <div
                        style={{
                          width: '100%',
                          height: 160,
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Spin size="small" />
                      </div>
                    }
                  />
                  <Checkbox
                    checked={isSelected}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    }}
                  >
                    <Tag color={getTypeColor(resource.type)}>
                      {getTypeName(resource.type)}
                    </Tag>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      color: '#fff',
                      padding: '24px 8px 8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {resource.name}
                    </div>
                    {resource.tags && resource.tags.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          flexWrap: 'wrap',
                          marginTop: 4,
                        }}
                      >
                        {resource.tags
                          .slice(0, 2)
                          .map((tag: string, index: number) => (
                            <Tag
                              key={index}
                              style={{
                                margin: 0,
                                fontSize: 10,
                                padding: '0 4px',
                                background: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                border: 'none',
                              }}
                            >
                              {tag}
                            </Tag>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {pagination.total > pagination.pageSize && (
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page) => fetchResources(page)}
                showSizeChanger={false}
                showTotal={(total) => `共 ${total} 项`}
              />
            </div>
          )}

          {/* 选择提示 */}
          <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
            已选择 {selectedImages.length} / {maxCount} 张
          </div>
        </>
      )}
    </div>
  );
}
