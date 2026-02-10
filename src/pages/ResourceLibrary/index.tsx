import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Radio,
  Input,
  Empty,
  Image,
  Tag,
  Pagination,
  Spin,
  message,
  Popconfirm,
  Button,
  Space,
  Typography,
} from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

import { getResourceList, deleteResource } from '@/api/resource';
import { useUserStore } from '@/stores/useUserStore';

const { Title } = Typography;

/**
 * 资源库页面
 * 展示和管理所有资源（角色、场景、道具、融图）
 */
export default function ResourceLibrary() {
  const { currentUser } = useUserStore();
  const [resourceType, setResourceType] = useState<
    'character' | 'scene' | 'prop' | 'blend' | 'all'
  >('all');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [total, setTotal] = useState(0);

  // 获取资源列表
  const fetchResources = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await getResourceList({
          type: resourceType === 'all' ? undefined : resourceType,
          mediaType: mediaType === 'all' ? undefined : mediaType,
          keyword: keyword || undefined,
          page: pageNum,
          pageSize: pageSize,
        });

        if (res.success && res.data) {
          setResources(res.data.list || []);
          setPage(pageNum);
          setTotal(res.data.total || 0);

          if (res.message && res.data.list.length === 0) {
            console.log(res.message);
          }
        } else {
          message.error(res.message || '获取资源列表失败');
        }
      } catch (error: any) {
        console.error('获取资源列表失败:', error);
        message.error('获取资源列表失败');
      } finally {
        setLoading(false);
      }
    },
    [resourceType, mediaType, keyword, pageSize],
  );

  // 防抖的搜索函数
  const debouncedFetchResources = useMemo(
    () => debounce(() => fetchResources(1), 500),
    [fetchResources],
  );

  // 当 resourceType 变化时立即请求，keyword 变化时防抖请求
  useEffect(() => {
    fetchResources(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, mediaType]);

  useEffect(() => {
    debouncedFetchResources();
    return () => {
      debouncedFetchResources.cancel();
    };
  }, [keyword, debouncedFetchResources]);

  // 删除资源
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteResource(id);
      if (res.success) {
        message.success('删除成功');
        fetchResources(page);
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error: any) {
      console.error('删除资源失败:', error);
      message.error('删除失败');
    }
  };

  // 获取资源的显示图片
  const getResourceImage = (resource: any): string | null => {
    if (
      resource.images &&
      resource.images.length > 0 &&
      resource.images[0]?.url
    ) {
      return resource.images[0].url;
    }
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
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            我的资源库
          </Title>
          <div style={{ color: '#999', marginTop: 8 }}>
            管理和浏览我的资源（角色、场景、道具、融图）
          </div>
        </div>

        {/* 筛选条件 */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span style={{ marginRight: 8, fontWeight: 500 }}>
                  资源类型：
                </span>
                <Radio.Group
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  size="large"
                >
                  <Radio.Button value="all">全部</Radio.Button>
                  <Radio.Button value="character">角色</Radio.Button>
                  <Radio.Button value="scene">场景</Radio.Button>
                  <Radio.Button value="prop">道具</Radio.Button>
                  <Radio.Button value="blend">融图</Radio.Button>
                </Radio.Group>
              </div>
              <div>
                <span style={{ marginRight: 8, fontWeight: 500 }}>
                  媒体类型：
                </span>
                <Radio.Group
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  size="large"
                >
                  <Radio.Button value="all">全部</Radio.Button>
                  <Radio.Button value="image">图片</Radio.Button>
                  <Radio.Button value="video">视频</Radio.Button>
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
                size="large"
                style={{ maxWidth: 400 }}
              />
            </div>
          </Space>
        </Card>

        {/* 资源列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                !currentUser
                  ? '请登录后查看您的资源'
                  : keyword
                    ? '没有找到匹配的资源'
                    : resourceType === 'all'
                      ? '暂无资源'
                      : `暂无${getTypeName(resourceType)}资源`
              }
              style={{ padding: '60px 0' }}
            >
              <div style={{ color: '#999', fontSize: 14 }}>
                {!currentUser
                  ? '登录后可以创建和管理您的专属资源'
                  : keyword
                    ? '尝试调整搜索关键词'
                    : '请先创建资源并上传参考图'}
              </div>
            </Empty>
          </Card>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 20,
                marginBottom: 24,
              }}
            >
              {resources.map((resource) => {
                const imageUrl = getResourceImage(resource);

                return (
                  <Card
                    key={resource.id}
                    hoverable
                    style={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                    cover={
                      imageUrl ? (
                        <div
                          style={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          {resource.mediaType === 'video' ? (
                            <video
                              src={imageUrl}
                              controls
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Image
                              src={imageUrl}
                              alt={resource.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              preview={{
                                mask: (
                                  <div>
                                    <div style={{ color: '#fff', fontSize: 14 }}>
                                      {resource.name}
                                    </div>
                                  </div>
                                ),
                              }}
                              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E图片加载失败%3C/text%3E%3C/svg%3E"
                              placeholder={
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
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
                          )}
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              zIndex: 10,
                            }}
                          >
                            <Tag color={getTypeColor(resource.type)}>
                              {getTypeName(resource.type)}
                            </Tag>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 10,
                            }}
                          >
                            <Popconfirm
                              title="确定要删除这个资源吗？"
                              onConfirm={() => handleDelete(resource.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{
                                  background: 'rgba(255,255,255,0.9)',
                                }}
                              />
                            </Popconfirm>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            position: 'relative',
                            paddingTop: '100%',
                            background: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: 12,
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              zIndex: 10,
                            }}
                          >
                            <Tag color={getTypeColor(resource.type)}>
                              {getTypeName(resource.type)}
                            </Tag>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 10,
                            }}
                          >
                            <Popconfirm
                              title="确定要删除这个资源吗？"
                              onConfirm={() => handleDelete(resource.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{
                                  background: 'rgba(255,255,255,0.9)',
                                }}
                              />
                            </Popconfirm>
                          </div>
                          暂无图片
                        </div>
                      )
                    }
                  >
                    <Card.Meta
                      title={
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                        >
                          {resource.name}
                        </div>
                      }
                      description={
                        <div>
                          {resource.description && (
                            <div
                              style={{
                                fontSize: 12,
                                color: '#999',
                                marginTop: 4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {resource.description}
                            </div>
                          )}
                          {resource.tags && resource.tags.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                gap: 4,
                                flexWrap: 'wrap',
                              }}
                            >
                              {resource.tags
                                .slice(0, 3)
                                .map((tag: string, index: number) => (
                                  <Tag
                                    key={index}
                                    style={{ margin: 0, fontSize: 11 }}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                              {resource.tags.length > 3 && (
                                <Tag style={{ margin: 0, fontSize: 11 }}>
                                  +{resource.tags.length - 3}
                                </Tag>
                              )}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                );
              })}
            </div>

            {/* 分页 */}
            {total > pageSize && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={(p) => fetchResources(p)}
                  showSizeChanger
                  showTotal={(t) => `共 ${t} 项`}
                  pageSizeOptions={['12', '24', '48', '96']}
                  onShowSizeChange={(_, size) => {
                    setPageSize(size);
                    fetchResources(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
