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

/**
 * 下拉选项的统一结构。
 * 这里统一成 label / value / title，避免不同页面传不同字段名，增加组件理解成本。
 */
export interface ComposerOption {
  label: string;
  value: string | number;
  title?: string;
}

/**
 * 开关型配置的统一结构。
 * 比如“存素材库”“生成音频”这类配置，本质都是布尔值开关，
 * 统一成一个类型后，后面扩更多开关时就不需要继续加零散 props。
 */
export interface ComposerToggleConfig {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

/**
 * 控制各个配置区块是否显示。
 * 这里不是把配置逻辑写死，而是把“显示权”交给页面层，
 * 这样公共组件既能服务通用场景，也能适配不同业务页的裁剪版场景。
 */
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

/**
 * 公共底部输入组件的全部受控参数。
 *
 * 为什么这里 props 会比较多：
 * 1. 这个组件明确定位为“展示组件 + 受控组件”，不在内部保存业务状态。
 * 2. 业务状态全部由页面或 hook 管，组件只负责把当前值渲染出来，并把交互回调抛出去。
 * 3. 这样虽然参数多一点，但业务边界清晰，不容易把不同页面的规则揉进同一个组件内部。
 */
export interface GenerationComposerProps {
  /**
   * prompt:
   * 当前输入框里的主描述文本。
   */
  prompt: string;

  /**
   * onPromptChange:
   * 文本变化时抛给外层。
   */
  onPromptChange: (value: string) => void;

  /**
   * promptPlaceholder:
   * 输入框占位提示文案。
   */
  promptPlaceholder?: string;

  /**
   * promptMaxLength:
   * 输入框最大字数限制。
   */
  promptMaxLength?: number;

  /**
   * selectedImages:
   * 当前已经选中的参考图列表。
   */
  selectedImages: string[];

  /**
   * maxImageCount:
   * 当前模式或模型允许的最大参考图数量。
   * 这里主要用于界面提示，不在公共组件内部做业务校验。
   */
  maxImageCount: number;

  /**
   * onOpenImageSelector:
   * 点击“添加图片/重新选择”入口时触发。
   */
  onOpenImageSelector: () => void;

  /**
   * onRemoveImage:
   * 删除指定索引图片时触发。
   */
  onRemoveImage: (index: number) => void;

  /**
   * modelValue / modelOptions / onModelChange:
   * 模型选择器的受控值、候选项和变化回调。
   */
  modelValue?: string;
  modelOptions?: ComposerOption[];
  onModelChange?: (value: string) => void;
  modelPlaceholder?: string;

  /**
   * modelFixedLabel:
   * 某些页面会把模型固定死，不允许用户切换。
   * 这时就不显示下拉，而是显示一个只读标签，告诉用户当前用的是哪个模型。
   */
  modelFixedLabel?: string;

  /**
   * resolution 相关配置。
   */
  resolutionValue?: string;
  resolutionOptions?: ComposerOption[];
  onResolutionChange?: (value: string) => void;

  /**
   * aspectRatio 相关配置。
   */
  aspectRatioValue?: string;
  aspectRatioOptions?: ComposerOption[];
  onAspectRatioChange?: (value: string) => void;

  /**
   * mode 相关配置。
   */
  modeValue?: string;
  modeOptions?: ComposerOption[];
  onModeChange?: (value: string) => void;

  /**
   * duration 相关配置。
   */
  durationValue?: number;
  durationOptions?: number[];
  onDurationChange?: (value: number) => void;

  /**
   * batchCount 相关配置。
   */
  batchCountValue?: number;
  batchCountMin?: number;
  batchCountMax?: number;
  onBatchCountChange?: (value: number) => void;

  /**
   * saveToLibrary / generateAudio:
   * 开关类配置统一走 ToggleConfig，避免 props 风格不一致。
   */
  saveToLibraryConfig?: ComposerToggleConfig;
  generateAudioConfig?: ComposerToggleConfig;

  /**
   * credits:
   * 当前前端估算的积分消耗。
   */
  credits?: number;

  /**
   * currentPoints:
   * 当前用户剩余积分。
   */
  currentPoints?: number;

  /**
   * submitDisabled / submitLoading:
   * 提交按钮的禁用态和 loading 态。
   * 这里继续由页面控制，而不是组件内部根据某些规则自动推断，避免公共组件偷偷带业务判断。
   */
  submitDisabled?: boolean;
  submitLoading?: boolean;

  /**
   * submitText:
   * 主按钮的语义说明。
   * 当前按钮是圆形图标按钮，所以这个文本更多用于 title 和语义提示。
   */
  submitText?: string;

  /**
   * onSubmit:
   * 点击主按钮时触发的提交动作。
   */
  onSubmit: () => void;

  /**
   * extraConfigContent:
   * 业务专属配置插槽。
   * 比如“目标人群”“镜头风格”这类页面专属字段，都可以插在这里，而不需要继续改公共组件接口。
   */
  extraConfigContent?: ReactNode;

  /**
   * visibility:
   * 控制默认配置区块的显示与隐藏。
   */
  visibility?: ComposerVisibilityConfig;
}

/**
 * 默认全部显示。
 * 页面层只需要声明“我要隐藏什么”，不用把每个开关都重复传一遍。
 */
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
 * 通用底部输入组件。
 *
 * 组件职责：
 * 1. 负责渲染统一风格的底部输入区
 * 2. 负责承接用户交互并把结果通过回调交还给页面
 *
 * 组件不负责：
 * 1. 不保存业务状态
 * 2. 不发起接口请求
 * 3. 不做模型联动、积分计算这类业务推导
 *
 * 为什么这么设计：
 * 1. 公共组件越“傻”，复用时越稳定
 * 2. 页面可以自由决定哪些配置显示、哪些固定
 * 3. 配合自定义 hook 使用时，可读性比“组件内部全包”更好
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
  /**
   * visible:
   * 把页面层传入的裁剪配置和默认显示配置合并。
   * 这样页面只关心“我要隐藏什么”，不用关心整套默认值。
   */
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
            {/* 左侧是参考图预览区。
                是否有图、图怎么删、点按钮后打开什么选择器，全部交给页面控制。 */}
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

            {/* 这个按钮统一承担“首次添加”和“重新选择”的入口，避免左侧交互分散。 */}
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
            {/* 主文本输入区只负责展示和回传 prompt，不做业务理解。 */}
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

            {/* 这一排是标准配置流。
                页面可以隐藏某些配置，也可以插入自己的业务专属配置。 */}
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
                  // 模型固定时直接显示标签，不允许用户再切换。
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
                    // 这里用自定义 optionRender，是为了让时长选择更像卡片而不是默认下拉项。
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

              {/* 业务专属配置插到这里，是为了和默认配置保持同一视觉层级。 */}
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

            {/* 底部左边展示积分信息，右边保留一个唯一主操作按钮。 */}
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
