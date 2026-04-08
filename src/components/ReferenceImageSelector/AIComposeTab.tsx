import { useEffect, useMemo, useState } from 'react';
import { Empty, Image, Input, message, Modal, Tabs } from 'antd';
import {
  CloseOutlined,
  LoadingOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { useAIGeneration, type GeneratedImage } from '@/hooks/useAIGeneration';
import { useModelStore } from '@/stores/useModelStore';
import type { AIBizType } from '@/types/ai-task';
import { storage } from '@/utils';
import CustomUploadTab from './CustomUploadTab';
import ResourceLibraryTab from './ResourceLibraryTab';

interface AIComposeTabProps {
  scriptId?: number;
  maxCount?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
  bizType?: AIBizType;
}

type SlotKey = 'character' | 'product' | 'background';

interface AIComposeHistoryItem extends GeneratedImage {
  createdAt: string;
  prompt: string;
}

const SLOT_CONFIGS: Array<{ key: SlotKey; label: string }> = [
  { key: 'character', label: '人物' },
  { key: 'product', label: '商品' },
  { key: 'background', label: '背景' },
];

const HISTORY_STORAGE_KEY = 'referenceImageSelector_aiCompose_history';

/**
 * AI 合成标签页
 * 负责固定槽位选图、触发生图、展示历史结果，并把结果图同步给外层。
 */
export default function AIComposeTab({
  scriptId,
  maxCount = 3,
  value = [],
  onChange,
  bizType = 'default',
}: AIComposeTabProps) {
  const { imageModel, imageModels, loadModels, setImageModel } = useModelStore();

  /**
   * 固定参考图槽位，分别对应人物 / 商品 / 背景。
   */
  const [slots, setSlots] = useState<Record<SlotKey, string>>({
    character: '',
    product: '',
    background: '',
  });

  /**
   * 当前最终选中的结果图，会回填给外层 ReferenceImageSelector。
   */
  const [selectedImages, setSelectedImages] = useState<string[]>(value);

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [batchCount, setBatchCount] = useState(4);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyImages, setHistoryImages] = useState<AIComposeHistoryItem[]>(
    () => storage.get<AIComposeHistoryItem[]>(HISTORY_STORAGE_KEY, []) ?? []
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTab, setPickerTab] = useState('upload');
  const [pickerTarget, setPickerTarget] = useState<SlotKey>('character');
  const [pickerValue, setPickerValue] = useState<string[]>([]);

  useEffect(() => {
    setSelectedImages(value);
  }, [value]);

  useEffect(() => {
    storage.set(HISTORY_STORAGE_KEY, historyImages);
  }, [historyImages]);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const currentImageModel = useMemo(() => {
    return imageModels.find((model) => model.id === imageModel) || imageModels[0];
  }, [imageModel, imageModels]);

  useEffect(() => {
    if (!currentImageModel && imageModels[0]) {
      setImageModel(imageModels[0].id);
      return;
    }

    const supportedRatios = currentImageModel?.config?.aspectRatios ?? [];
    if (supportedRatios.length > 0 && !supportedRatios.includes(aspectRatio)) {
      setAspectRatio(supportedRatios[0]);
    }
  }, [aspectRatio, currentImageModel, imageModels, setImageModel]);

  const { generateImage } = useAIGeneration({
    onImageComplete: (image) => {
      setHistoryImages((prev) => [
        {
          ...image,
          createdAt: new Date().toISOString(),
          prompt: prompt.trim(),
        },
        ...prev,
      ]);
      setLoadingPlaceholders((prev) => Math.max(0, prev - 1));
    },
    onError: () => {
      setLoadingPlaceholders((prev) => Math.max(0, prev - 1));
    },
    showMessage: true,
  });

  const filteredHistoryImages = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return historyImages;
    return historyImages.filter((item) => item.prompt.toLowerCase().includes(keyword));
  }, [historyImages, searchKeyword]);

  const supportedAspectRatios = currentImageModel?.config?.aspectRatios?.length
    ? currentImageModel.config.aspectRatios
    : ['1:1', '3:4', '4:3', '16:9', '9:16'];

  const selectedSlotCount = SLOT_CONFIGS.filter(({ key }) => Boolean(slots[key])).length;

  const openSlotPicker = (slotKey: SlotKey) => {
    setPickerTarget(slotKey);
    setPickerTab('upload');
    setPickerValue(slots[slotKey] ? [slots[slotKey]] : []);
    setPickerVisible(true);
  };

  const handlePickerConfirm = () => {
    setSlots((prev) => ({
      ...prev,
      [pickerTarget]: pickerValue[0] || '',
    }));
    setPickerVisible(false);
  };

  const handleToggleSelectedImage = (url: string) => {
    let nextImages: string[];

    if (selectedImages.includes(url)) {
      nextImages = selectedImages.filter((item) => item !== url);
    } else {
      if (selectedImages.length >= maxCount) {
        message.warning(`最多只能选择 ${maxCount} 张图片`);
        return;
      }
      nextImages = [...selectedImages, url];
    }

    setSelectedImages(nextImages);
    onChange?.(nextImages);
  };

  const buildComposePrompt = () => {
    if (prompt.trim()) return prompt.trim();

    const slotLabels = SLOT_CONFIGS.filter(({ key }) => Boolean(slots[key])).map(
      ({ label }) => label
    );

    if (!slotLabels.length) return '';

    return `基于已选${slotLabels.join('、')}参考图，生成一组适合电商展示的合成图片`;
  };

  const handleGenerate = async () => {
    const referenceImages = SLOT_CONFIGS.map(({ key }) => slots[key]).filter(Boolean);
    const finalPrompt = buildComposePrompt();

    if (!referenceImages.length) {
      message.warning('请先选择至少一张参考图');
      return;
    }

    if (!finalPrompt) {
      message.warning('请先输入合成描述');
      return;
    }

    if (isSubmitting) {
      message.warning('正在提交生成任务，请稍候');
      return;
    }

    setIsSubmitting(true);
    setLoadingPlaceholders((prev) => prev + batchCount);

    try {
      for (let index = 0; index < batchCount; index += 1) {
        await generateImage({
          prompt: finalPrompt,
          model: currentImageModel?.id,
          bizType,
          quality: currentImageModel?.config?.qualities?.[0] || 'hd',
          aspectRatio,
          referenceImages,
        });
      }
    } finally {
      window.setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  return (
    <div className="reference-image-selector__ai-compose">
      <div className="reference-image-selector__compose-panel">
        <div className="reference-image-selector__slot-list">
          {SLOT_CONFIGS.map(({ key, label }) => {
            const imageUrl = slots[key];

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                className={`reference-image-selector__slot-card ${imageUrl ? 'is-filled' : ''}`}
                onClick={() => openSlotPicker(key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSlotPicker(key);
                  }
                }}
              >
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt={`${label}参考图`} />
                    <span className="reference-image-selector__slot-badge">{label}</span>
                  </>
                ) : (
                  <>
                    <PlusOutlined />
                    <span>{label}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="reference-image-selector__compose-tip">
          人物/商品/背景可选。先选参考图，再输入描述，点击生成图片后会在下方生成一组结果。
        </div>

        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          autoSize={{ minRows: 4, maxRows: 6 }}
          maxLength={1000}
          className="reference-image-selector__compose-textarea"
          placeholder="参考图1中的人物，手持参考图2中的商品，背景参考图3，生成一组电商合成图。"
        />

        <div className="reference-image-selector__compose-toolbar">
          <div className="reference-image-selector__toolbar-left">
            <div className="reference-image-selector__ratio-list">
              {supportedAspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  className={`reference-image-selector__ratio-chip ${
                    aspectRatio === ratio ? 'is-active' : ''
                  }`}
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <div className="reference-image-selector__batch-list">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`reference-image-selector__batch-chip ${
                    batchCount === count ? 'is-active' : ''
                  }`}
                  onClick={() => setBatchCount(count)}
                >
                  {count}张
                </button>
              ))}
            </div>
          </div>

          <div className="reference-image-selector__toolbar-right">
            <span>{prompt.length}/1000</span>
            <button type="button" onClick={() => setPrompt('')}>
              清空
            </button>
            <button
              type="button"
              className="reference-image-selector__generate-button"
              onClick={handleGenerate}
              disabled={!selectedSlotCount || isSubmitting}
            >
              {isSubmitting ? '生成中...' : '生成图片'}
            </button>
          </div>
        </div>
      </div>

      <div className="reference-image-selector__result-header">
        <div className="reference-image-selector__result-title">
          <span />
          <div>以下是生成结果</div>
          <span />
        </div>
        <Input
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder="在历史生成中搜索"
          className="reference-image-selector__result-search"
        />
      </div>

      <div className="reference-image-selector__result-body">
        {loadingPlaceholders > 0 && (
          <div className="reference-image-selector__result-grid">
            {Array.from({ length: loadingPlaceholders }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="reference-image-selector__result-card is-loading"
              >
                <div className="reference-image-selector__loading-visual">
                  <LoadingOutlined />
                </div>
                <div className="reference-image-selector__loading-text">生成中...</div>
              </div>
            ))}
          </div>
        )}

        {filteredHistoryImages.length > 0 ? (
          <div className="reference-image-selector__result-grid">
            {filteredHistoryImages.map((item) => {
              const isSelected = selectedImages.includes(item.url);

              return (
                <div
                  key={`${item.id}-${item.url}`}
                  className={`reference-image-selector__result-card ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  onClick={() => handleToggleSelectedImage(item.url)}
                >
                  <Image
                    src={item.url}
                    alt="AI合成结果"
                    preview={false}
                    className="reference-image-selector__result-image"
                  />
                  <div className="reference-image-selector__result-meta">
                    <div className="reference-image-selector__result-time">
                      {new Date(item.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="reference-image-selector__result-prompt">{item.prompt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : loadingPlaceholders === 0 ? (
          <Empty description="暂无生成结果" className="reference-image-selector__empty" />
        ) : null}
      </div>

      <div className="reference-image-selector__selected-strip">
        <div className="reference-image-selector__selected-label">已选择</div>
        {selectedImages.length > 0 ? (
          <div className="reference-image-selector__selected-list">
            {selectedImages.map((url) => (
              <div key={url} className="reference-image-selector__selected-card">
                <img src={url} alt="已选结果图" />
                <button type="button" onClick={() => handleToggleSelectedImage(url)}>
                  <CloseOutlined />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="reference-image-selector__selected-empty">
            暂未选择结果图，点击下方图片即可加入确认列表
          </div>
        )}
      </div>

      <Modal
        title={`选择${SLOT_CONFIGS.find((item) => item.key === pickerTarget)?.label || '参考图'}`}
        open={pickerVisible}
        onCancel={() => setPickerVisible(false)}
        onOk={handlePickerConfirm}
        width={820}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ disabled: pickerValue.length === 0 }}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
          },
        }}
      >
        <div className="reference-image-selector__picker-desc">
          从上传图片或资源库中选择 1 张参考图
        </div>
        <Tabs
          activeKey={pickerTab}
          onChange={setPickerTab}
          items={[
            {
              key: 'upload',
              label: '自定义上传',
              children: (
                <CustomUploadTab maxCount={1} value={pickerValue} onChange={setPickerValue} />
              ),
            },
            {
              key: 'resource',
              label: '资源库',
              children: (
                <ResourceLibraryTab
                  scriptId={scriptId}
                  maxCount={1}
                  value={pickerValue}
                  onChange={setPickerValue}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
