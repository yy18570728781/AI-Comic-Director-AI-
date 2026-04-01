import type { ReactNode } from 'react';
import {
  Button,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  ClockCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  RocketOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

export interface ComposerOption {
  label: string;
  value: string | number;
  title?: string;
}

export interface ComposerToggleConfig {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export interface ComposerVisibilityConfig {
  model?: boolean;
  resolution?: boolean;
  aspectRatio?: boolean;
  mode?: boolean;
  duration?: boolean;
  batchCount?: boolean;
  saveToLibrary?: boolean;
  generateAudio?: boolean;
  imageCountTag?: boolean;
  creditsTag?: boolean;
  currentPoints?: boolean;
}

export interface GenerationComposerProps {
  // prompt: 输入框里的文本内容。
  prompt: string;

  // onPromptChange: 输入框变化时回调给页面或 hook。
  onPromptChange: (value: string) => void;

  // promptPlaceholder: 输入框占位提示文案。
  promptPlaceholder?: string;

  // promptMaxLength: 输入框最大字符数。
  promptMaxLength?: number;

  // selectedImages: 当前已选参考图列表。
  selectedImages: string[];

  // maxImageCount: 当前模型允许的最大参考图数量，仅用于展示提示。
  maxImageCount: number;

  // onOpenImageSelector: 点击选图入口时调用。
  onOpenImageSelector: () => void;

  // onRemoveImage: 删除某一张参考图时调用。
  onRemoveImage: (index: number) => void;

  // modelValue / modelOptions / onModelChange:
  // 模型选择器的受控值、选项和变化回调。
  modelValue?: string;
  modelOptions?: ComposerOption[];
  onModelChange?: (value: string) => void;
  modelPlaceholder?: string;

  // modelFixedLabel:
  // 如果页面已经固定模型，就不显示下拉框，改成一个只读标签。
  modelFixedLabel?: string;

  // resolution 相关。
  resolutionValue?: string;
  resolutionOptions?: ComposerOption[];
  onResolutionChange?: (value: string) => void;

  // aspectRatio 相关。
  aspectRatioValue?: string;
  aspectRatioOptions?: ComposerOption[];
  onAspectRatioChange?: (value: string) => void;

  // mode 相关。
  modeValue?: string;
  modeOptions?: ComposerOption[];
  onModeChange?: (value: string) => void;

  // duration 相关。
  durationValue?: number;
  durationOptions?: number[];
  onDurationChange?: (value: number) => void;

  // batchCount 相关。
  batchCountValue?: number;
  batchCountMin?: number;
  batchCountMax?: number;
  onBatchCountChange?: (value: number) => void;

  // saveToLibrary / generateAudio:
  // 这两个开关都走同一套 toggle 配置结构，方便后面继续扩展类似开关。
  saveToLibraryConfig?: ComposerToggleConfig;
  generateAudioConfig?: ComposerToggleConfig;

  // credits: 当前前端预估的积分消耗。
  credits?: number;

  // currentPoints: 当前用户剩余积分。
  currentPoints?: number;

  // submitDisabled / submitLoading:
  // 页面控制提交按钮的禁用态和加载态。
  submitDisabled?: boolean;
  submitLoading?: boolean;

  // submitText: 当前主操作按钮的语义文案。
  submitText?: string;

  // onSubmit: 点击主按钮时触发。
  onSubmit: () => void;

  // extraConfigContent:
  // 业务专属配置插槽。
  // 例如：电商专区传 gender，其他专区传风格、人设、镜头语言。
  extraConfigContent?: ReactNode;

  // visibility:
  // 控制哪些常规配置项显示，哪些隐藏。
  visibility?: ComposerVisibilityConfig;
}

const DEFAULT_VISIBILITY: Required<ComposerVisibilityConfig> = {
  model: true,
  resolution: true,
  aspectRatio: true,
  mode: true,
  duration: true,
  batchCount: true,
  saveToLibrary: true,
  generateAudio: true,
  imageCountTag: true,
  creditsTag: true,
  currentPoints: true,
};

/**
 * `GenerationComposer` 是纯展示型受控组件。
 *
 * 它负责：
 * 1. 渲染统一风格的底部输入区。
 * 2. 把用户交互通过回调抛给外部。
 *
 * 它不负责：
 * 1. 管理业务状态。
 * 2. 计算模型联动。
 * 3. 发起提交接口。
 *
 * 这样做的好处是：
 * 1. 组件可以跨页面复用。
 * 2. 页面可以自由决定哪些配置项显示 / 隐藏 / 固定。
 * 3. 业务专属字段不会污染公共组件。
 */
export default function GenerationComposer({
  prompt,
  onPromptChange,
  promptPlaceholder = '请输入生成描述...',
  promptMaxLength = 1000,
  selectedImages,
  maxImageCount,
  onOpenImageSelector,
  onRemoveImage,
  modelValue,
  modelOptions = [],
  onModelChange,
  modelPlaceholder = '模型',
  modelFixedLabel,
  resolutionValue,
  resolutionOptions = [],
  onResolutionChange,
  aspectRatioValue,
  aspectRatioOptions = [],
  onAspectRatioChange,
  modeValue,
  modeOptions = [],
  onModeChange,
  durationValue = 1,
  durationOptions = [],
  onDurationChange,
  batchCountValue = 1,
  batchCountMin = 1,
  batchCountMax = 10,
  onBatchCountChange,
  saveToLibraryConfig,
  generateAudioConfig,
  credits,
  currentPoints,
  submitDisabled,
  submitLoading,
  submitText = '立即生成',
  onSubmit,
  extraConfigContent,
  visibility,
}: GenerationComposerProps) {
  // visible:
  // 把页面传入的 visibility 和默认展示配置合并。
  // 页面只需要关心“我要隐藏什么”，不需要把全部开关都传一遍。
  const visible = { ...DEFAULT_VISIBILITY, ...visibility };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          borderRadius: 24,
          border: '1px solid #eceff3',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
          background: 'rgba(255, 255, 255, 0.98)',
          padding: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '108px minmax(0, 1fr)',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 左侧是参考图区域。
                是否有图、图怎么删、点击后做什么，都由外层控制。 */}
            {selectedImages.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                }}
              >
                {selectedImages.slice(0, 2).map((image, index) => (
                  <div key={`${image}-${index}`} style={{ position: 'relative' }}>
                    <Image
                      src={image}
                      preview={false}
                      style={{
                        width: '100%',
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 14,
                        border: '1px solid #edf0f4',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 18,
                        height: 18,
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        cursor: 'pointer',
                        background: 'rgba(0,0,0,0.55)',
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={onOpenImageSelector}
                style={{
                  height: 154,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 16,
                  border: '1px dashed #d9dfe7',
                  color: '#9aa4b2',
                  cursor: 'pointer',
                  background: '#fafbfc',
                }}
              >
                <Space direction="vertical" size={6} style={{ alignItems: 'center' }}>
                  <PlusOutlined />
                  <Text style={{ fontSize: 12, color: '#9aa4b2' }}>参考图</Text>
                </Space>
              </div>
            )}

            {/* 左下角这个按钮是“重新选图 / 添加图片”的统一入口。 */}
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={onOpenImageSelector}
              style={{
                height: 32,
                borderRadius: 12,
                color: '#4b5563',
                background: '#f7f8fa',
              }}
            >
              {selectedImages.length ? '重选' : '添加'}
            </Button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {/* 主输入框只负责编辑 prompt。 */}
            <TextArea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={promptPlaceholder}
              maxLength={promptMaxLength}
              autoSize={{ minRows: 5, maxRows: 7 }}
              variant="borderless"
              style={{
                padding: 8,
                fontSize: 14,
                lineHeight: 1.7,
                color: '#111827',
                background: 'transparent',
              }}
            />

            {/* 这一排是“常规配置流”。
                页面可以：
                1. 隐藏某个项
                2. 固定某个项
                3. 插入自己的专属项 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {visible.model &&
                (modelFixedLabel ? (
                  // 模型固定时，直接展示只读标签，不再显示下拉框。
                  <Tag
                    icon={<VideoCameraOutlined />}
                    style={{
                      margin: 0,
                      height: 34,
                      lineHeight: '22px',
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: '#f7f8fa',
                      borderColor: '#f7f8fa',
                      color: '#4b5563',
                    }}
                  >
                    {modelFixedLabel}
                  </Tag>
                ) : (
                  <Select
                    value={modelValue}
                    onChange={value => onModelChange?.(String(value))}
                    options={modelOptions}
                    placeholder={modelPlaceholder}
                    variant="borderless"
                    suffixIcon={<VideoCameraOutlined style={{ color: '#6b7280' }} />}
                    style={{
                      minWidth: 148,
                      height: 34,
                      background: '#f7f8fa',
                      borderRadius: 999,
                    }}
                  />
                ))}

              {visible.resolution && (
                <Select
                  value={resolutionValue}
                  onChange={value => onResolutionChange?.(String(value))}
                  options={resolutionOptions}
                  variant="borderless"
                  style={{
                    minWidth: 92,
                    height: 34,
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                />
              )}

              {visible.aspectRatio && (
                <Select
                  value={aspectRatioValue}
                  onChange={value => onAspectRatioChange?.(String(value))}
                  options={aspectRatioOptions}
                  variant="borderless"
                  style={{
                    minWidth: 86,
                    height: 34,
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                />
              )}

              {visible.mode && (
                <Select
                  value={modeValue}
                  onChange={value => onModeChange?.(String(value))}
                  options={modeOptions}
                  variant="borderless"
                  style={{
                    minWidth: 110,
                    height: 34,
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                />
              )}

              {visible.duration && (
                <Select
                  value={durationValue}
                  onChange={value => onDurationChange?.(Number(value))}
                  variant="borderless"
                  suffixIcon={<ClockCircleOutlined style={{ color: '#6b7280' }} />}
                  popupMatchSelectWidth={172}
                  styles={{
                    popup: {
                      root: {
                        padding: 6,
                        borderRadius: 16,
                        background: '#ffffff',
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                      },
                    },
                  }}
                  optionRender={option => {
                    const active = Number(option.value) === durationValue;

                    return (
                      <div
                        style={{
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 10px',
                          borderRadius: 10,
                          color: '#374151',
                          background: active ? '#f4ecff' : 'transparent',
                        }}
                      >
                        <Space size={8}>
                          <ClockCircleOutlined style={{ color: '#111827' }} />
                          <span>{option.label}</span>
                        </Space>
                      </div>
                    );
                  }}
                  options={durationOptions.map(option => ({
                    label: `${option}s`,
                    value: option,
                  }))}
                  style={{
                    minWidth: 90,
                    height: 34,
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                />
              )}

              {visible.batchCount && (
                <InputNumber
                  min={batchCountMin}
                  max={batchCountMax}
                  value={batchCountValue}
                  onChange={value => onBatchCountChange?.(Number(value) || batchCountMin)}
                  style={{
                    width: 85,
                    height: 34,
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                  addonAfter="份"
                />
              )}

              {visible.saveToLibrary && saveToLibraryConfig && (
                <Space
                  size={6}
                  style={{
                    height: 34,
                    padding: '0 12px',
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                >
                  <Switch
                    size="small"
                    checked={saveToLibraryConfig.checked}
                    onChange={saveToLibraryConfig.onChange}
                  />
                  <Text style={{ fontSize: 12, color: '#4b5563' }}>
                    {saveToLibraryConfig.label}
                  </Text>
                </Space>
              )}

              {visible.generateAudio && generateAudioConfig && (
                <Space
                  size={6}
                  style={{
                    height: 34,
                    padding: '0 12px',
                    background: '#f7f8fa',
                    borderRadius: 999,
                  }}
                >
                  <Switch
                    size="small"
                    checked={generateAudioConfig.checked}
                    onChange={generateAudioConfig.onChange}
                  />
                  <Text style={{ fontSize: 12, color: '#4b5563' }}>
                    {generateAudioConfig.label}
                  </Text>
                </Space>
              )}

              {/* 业务专属配置直接插在配置流里，保持视觉和交互一致。 */}
              {extraConfigContent}

              {visible.imageCountTag && (
                <Tag
                  icon={<PictureOutlined />}
                  style={{
                    margin: 0,
                    height: 34,
                    lineHeight: '22px',
                    padding: '5px 12px',
                    borderRadius: 999,
                    background: '#f7f8fa',
                    borderColor: '#f7f8fa',
                    color: '#4b5563',
                  }}
                >
                  {selectedImages.length}/{maxImageCount} 图
                </Tag>
              )}

              {visible.creditsTag && typeof credits === 'number' && (
                <Tag
                  style={{
                    margin: 0,
                    height: 34,
                    lineHeight: '22px',
                    padding: '5px 12px',
                    borderRadius: 999,
                    background: '#f7f8fa',
                    borderColor: '#f7f8fa',
                    color: '#4b5563',
                  }}
                >
                  {credits} 积分
                </Tag>
              )}
            </div>

            {/* 底部左侧显示状态，右侧保留唯一主提交按钮。 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9aa4b2' }}>
                {visible.currentPoints ? `当前积分 ${currentPoints ?? 0}` : ''}
              </Text>
              <Button
                type="primary"
                shape="circle"
                icon={<RocketOutlined />}
                onClick={onSubmit}
                loading={submitLoading}
                disabled={submitDisabled}
                style={{
                  width: 38,
                  height: 38,
                  boxShadow: 'none',
                }}
                title={submitText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
