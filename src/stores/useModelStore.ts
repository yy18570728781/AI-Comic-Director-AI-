import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getModelList } from '@/api/model';

// 模型配置，需要持久化到本地
export interface ModelConfig {
  imageModel: string;
  videoModel: string;
  textModel: string;
}

// 默认模型配置
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  imageModel: 'doubao-seedream-4-5-251128',
  videoModel: 'doubao-seedance-1-0-pro-fast-251015',
  // 关键逻辑：智能生成要走多模态模型，所以默认文本模型改成支持识图的火山模型。
  textModel: 'doubao-seed-2-0-pro-260215',
};

// 配置版本号，用于强制刷新本地缓存
const CONFIG_VERSION = 8;

// 模型选项结构，与后端 /api/ai/models 返回保持一致
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  platform: string;
  enabled?: boolean;
  tags?: string[];
  pricing?: {
    billingMode?: 'per_second' | 'per_video';
    pricingTiers?: Array<{
      resolution: string;
      cost5s?: number;
      creditsPerSecond: number;
    }>;
    perVideo?: {
      creditsPerVideo?: number;
      fixedDuration?: number;
    };
    image?: {
      costPerImage?: number;
      creditsPerImage?: number;
    };
  };
  config?: {
    sizes?: string[];
    qualities?: string[];
    styles?: string[];
    aspectRatios?: string[];
    resolutions?: string[];
    supportImageToImage?: boolean;
    supportMultiImageFusion?: boolean;
    supportSeed?: boolean;
    supportNegativePrompt?: boolean;
    supportedModes?: string[];
    maxDuration?: number;
    minDuration?: number;
    maxImages?: number;
    supportCameraMovement?: boolean;
    supportWatermark?: boolean;
    supportGenerateAudio?: boolean;
    temperature?: number;
    maxTokens?: number;
    supportSystemPrompt?: boolean;
    supportStream?: boolean;
  };
}

// 纯内存的模型列表状态
interface ModelListState {
  imageModels: ModelOption[];
  videoModels: ModelOption[];
  textModels: ModelOption[];
  loading: boolean;
  error: string | null;
  loadModels: () => Promise<void>;
}

// 模型选择状态
export interface ModelState extends ModelConfig, ModelListState {
  setImageModel: (model: string) => void;
  setVideoModel: (model: string) => void;
  setTextModel: (model: string) => void;
  resetModelConfig: () => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_MODEL_CONFIG,
      imageModels: [],
      videoModels: [],
      textModels: [],
      loading: false,
      error: null,

      // 关键逻辑：模型列表只缓存到内存，页面刷新后重新拉最新配置。
      loadModels: async () => {
        const { imageModels, videoModels, textModels } = get();
        if (imageModels.length > 0 && videoModels.length > 0 && textModels.length > 0) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const res = await getModelList();
          if (res.success && res.data) {
            set({
              imageModels: res.data.imageModels || [],
              videoModels: res.data.videoModels || [],
              textModels: res.data.textModels || [],
              loading: false,
            });
            return;
          }

          set({ loading: false, error: '获取模型列表失败' });
        } catch (error: any) {
          set({ loading: false, error: error.message || '获取模型列表失败' });
        }
      },

      setImageModel: (imageModel) => set({ imageModel }),
      setVideoModel: (videoModel) => set({ videoModel }),
      setTextModel: (textModel) => set({ textModel }),

      resetModelConfig: () => set({ ...DEFAULT_MODEL_CONFIG }),
    }),
    {
      name: 'model-config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // 关键逻辑：只持久化用户选择，不持久化模型列表本身。
        imageModel: state.imageModel,
        videoModel: state.videoModel,
        textModel: state.textModel,
        version: CONFIG_VERSION,
      }),
      onRehydrateStorage: () => state => {
        if (state && (state as any).version !== CONFIG_VERSION) {
          console.log('模型配置版本已更新，重置为默认配置');
          Object.assign(state, DEFAULT_MODEL_CONFIG);
        }
      },
    }
  )
);
