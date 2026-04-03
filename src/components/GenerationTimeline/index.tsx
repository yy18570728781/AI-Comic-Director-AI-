import { Button, Card, Empty, Image, Space, Spin, Tag, Typography } from 'antd';

const { Text, Paragraph } = Typography;

/**
 * 滚动记录项类型枚举。
 * 这里先把文本、图片、视频三类统一收口，
 * 后面如果要扩成更完整的聊天流，可以继续在这里追加类型。
 */
export enum GenerationTimelineItemType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

/**
 * 统一的元信息标签结构。
 * 例如模型名、分辨率、比例、来源等，都可以通过同一套结构传进来。
 */
export interface GenerationTimelineMetaTag {
  label: string;
  color?: string;
}

/**
 * 所有滚动记录项共享的基础字段。
 */
interface GenerationTimelineBaseItem {
  id: string | number;
  type: GenerationTimelineItemType;

  /**
   * createdAt:
   * 预留时间字段，后面如果要做按日期分组、时间轴展示，可以直接复用。
   */
  createdAt?: string;

  /**
   * requestText:
   * 聊天式滚动里通常会先展示一次“用户输入”，再展示结果卡片。
   * 这个字段就是给那一段输入气泡预留的。
   */
  requestText?: string;

  /**
   * description:
   * 结果卡片里的补充说明。
   * 它和 requestText 分开，是为了区分“用户输入”和“结果描述”。
   */
  description?: string;

  /**
   * statusText:
   * 当前结果的状态文案。
   * 默认会显示“生成已完成”，但页面可以覆盖成更具体的状态。
   */
  statusText?: string;

  /**
   * metaTags:
   * 附加信息标签列表。
   */
  metaTags?: GenerationTimelineMetaTag[];
}

/**
 * 文本类型的滚动记录项。
 */
export interface GenerationTimelineTextItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.TEXT;
  content: string;
}

/**
 * 图片类型的滚动记录项。
 */
export interface GenerationTimelineImageItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.IMAGE;
  images: string[];
}

/**
 * 视频类型的滚动记录项。
 */
export interface GenerationTimelineVideoItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.VIDEO;
  url: string;
}

/**
 * 统一滚动流的数据联合类型。
 * 页面层只需要把自己的数据映射成这个结构，公共组件就能渲染。
 */
export type GenerationTimelineItem =
  | GenerationTimelineTextItem
  | GenerationTimelineImageItem
  | GenerationTimelineVideoItem;

interface GenerationTimelineProps {
  /**
   * items:
   * 页面最终要展示的统一消息流数据。
   */
  items: GenerationTimelineItem[];

  /**
   * loadingPlaceholders:
   * 当前还要展示多少个“生成中”的占位卡片。
   */
  loadingPlaceholders?: number;

  /**
   * minHeight:
   * 空态区域的最小高度，用于保持页面视觉稳定。
   */
  minHeight?: number;

  /**
   * bottomSafeSpace:
   * 给底部固定输入区预留的安全距离。
   * 这样最后一条内容不会被底部输入框挡住。
   */
  bottomSafeSpace?: number;

  /**
   * dayLabel / emptyDescription:
   * 标题和空态文案都交给页面层覆盖，避免公共组件写死。
   */
  dayLabel?: string;
  emptyDescription?: string;

  /**
   * credits:
   * 当前页面想展示的积分说明。
   * 这里先保留为页面级统一文案，后面如果要做成每条记录不同积分，也容易扩。
   */
  credits?: number;

  /**
   * generatingText / downloadText:
   * 生成中和下载按钮的文案覆盖能力。
   */
  generatingText?: string;
  downloadText?: string;

  /**
   * onDownload:
   * 下载动作仍交给页面层处理。
   * 这样文件名规则、埋点和权限策略都可以由业务页面决定。
   */
  onDownload?: (url: string) => void;
}

/**
 * 通用生成结果滚动流组件。
 *
 * 为什么不直接做成“纯视频列表”：
 * 1. 现在当前页面先用视频，但后面很可能还会接图片、文本结果
 * 2. 用户希望它更像聊天式滚动，而不是单一媒体列表
 * 3. 先把结构预留好，后面扩 agent 或更多内容类型时改动更小
 */
export default function GenerationTimeline({
  items,
  loadingPlaceholders = 0,
  minHeight = 520,
  bottomSafeSpace = 0,
  dayLabel = '今天',
  emptyDescription = '这里作为滚动展示区域',
  credits,
  generatingText = '任务已提交，正在生成内容...',
  downloadText = '下载内容',
  onDownload,
}: GenerationTimelineProps) {
  /**
   * isEmpty:
   * 只有当没有历史内容，并且也没有生成中占位时，才展示空态。
   */
  const isEmpty = items.length === 0 && loadingPlaceholders === 0;

  /**
   * 根据不同内容类型渲染对应主体内容。
   * 把这段逻辑收口在组件内部，调用方就不用在外面重复写分支判断。
   */
  const renderContent = (item: GenerationTimelineItem) => {
    if (item.type === GenerationTimelineItemType.TEXT) {
      return (
        <Paragraph style={{ marginBottom: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>
          {item.content}
        </Paragraph>
      );
    }

    if (item.type === GenerationTimelineItemType.IMAGE) {
      return (
        <Image.PreviewGroup>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {item.images.map((image, index) => (
              <Image
                key={`${item.id}-image-${index}`}
                src={image}
                style={{
                  width: '100%',
                  height: 220,
                  objectFit: 'cover',
                  borderRadius: 14,
                }}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      );
    }

    return (
      <video
        src={item.url}
        controls
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 14,
          background: '#000',
        }}
      />
    );
  };

  /**
   * 下载按钮只在“存在视频项”且外部确实传了下载动作时显示。
   * 这样文本/图片页复用这个组件时，不会无意义地出现下载按钮。
   */
  const canDownload =
    typeof onDownload === 'function' &&
    items.some((item) => item.type === GenerationTimelineItemType.VIDEO);

  return (
    <div
      style={{
        maxWidth: 920,
        margin: '0 auto',
        paddingBottom: bottomSafeSpace,
      }}
    >
      {isEmpty ? (
        <div
          style={{
            minHeight,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
        </div>
      ) : (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <div style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: 600, color: '#111827' }}>{dayLabel}</Text>
          </div>

          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}-${item.createdAt || ''}`}
              style={{ padding: '6px 0 12px' }}
            >
              {item.requestText ? (
                <div
                  style={{
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      maxWidth: 320,
                      padding: '10px 14px',
                      borderRadius: 18,
                      background: '#f0f1f3',
                      color: '#374151',
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {item.requestText}
                  </div>
                </div>
              ) : null}

              <Card
                bordered={false}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <Tag
                    style={{
                      width: 'fit-content',
                      margin: 0,
                      borderRadius: 999,
                      background: '#eaf6fb',
                      borderColor: '#d7edf7',
                      color: '#4b5563',
                    }}
                  >
                    {item.statusText || '生成已完成'}
                  </Tag>

                  {renderContent(item)}

                  {item.description ? (
                    <Paragraph
                      style={{ marginBottom: 0, color: '#374151', whiteSpace: 'pre-wrap' }}
                    >
                      {item.description}
                    </Paragraph>
                  ) : null}

                  {typeof credits === 'number' ? (
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      以上内容由 AI 生成，本次预计消耗约 {credits} 积分
                    </Text>
                  ) : null}

                  <Space size={[8, 8]} wrap>
                    {item.type === GenerationTimelineItemType.VIDEO && canDownload ? (
                      <Button onClick={() => onDownload?.(item.url)}>{downloadText}</Button>
                    ) : null}
                    {item.metaTags?.map((tag, index) => (
                      <Tag key={`${item.id}-meta-${index}`} color={tag.color}>
                        {tag.label}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Card>
            </div>
          ))}

          {Array.from({ length: loadingPlaceholders }).map((_, index) => (
            <div key={`loading-${index}`} style={{ padding: '16px 0 12px' }}>
              <Card
                bordered={false}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Tag
                    color="processing"
                    style={{ width: 'fit-content', margin: 0, borderRadius: 999 }}
                  >
                    生成中
                  </Tag>
                  <div
                    style={{
                      height: 220,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 14,
                      background: '#f3f6f9',
                    }}
                  >
                    <Spin />
                  </div>
                  <Text style={{ color: '#6b7280' }}>{generatingText}</Text>
                </Space>
              </Card>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
}
