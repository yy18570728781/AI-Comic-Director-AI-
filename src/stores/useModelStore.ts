import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getModelList } from '@/api/model';

// 模型配置（需要持久化）
export interface ModelConfig {
    imageModel: string;
    videoModel: string;
}

// 默认模型配置
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
    imageModel: 'doubao-seedream-4-5-251128', // 默认使用即梦4.5
    videoModel: 'doubao-seedance-1-0-pro-fast-251015', // 默认使用 Seedance Pro Fast
};

// 配置版本号，用于强制更新
const CONFIG_VERSION = 6; // 增加版本号，强制重置配置

// 模型选项接口（与后端返回的格式一致）
export interface ModelOption {
    id: string;
    name: string;
    description: string;
    platform: string;
    cost?: number;
    creditsPerImage?: number;
    creditsPerSecond?: number;
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
    };
}

// 模型列表状态（纯内存，不持久化）
interface ModelListState {
    imageModels: ModelOption[];
    videoModels: ModelOption[];
    loading: boolean;
    error: string | null;
    loadModels: () => Promise<void>;
}

// 模型选择状态
export interface ModelState extends ModelConfig, ModelListState {
    setImageModel: (model: string) => void;
    setVideoModel: (model: string) => void;
    resetModelConfig: () => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_MODEL_CONFIG,
            imageModels: [],
            videoModels: [],
            loading: false,
            error: null,

            // 加载模型列表（纯内存存储，页面刷新后重新获取）
            loadModels: async () => {
                const { imageModels, videoModels } = get();
                // 如果内存中已有数据，不再重复加载
                if (imageModels.length > 0 && videoModels.length > 0) {
                    return;
                }

                set({ loading: true, error: null });
                try {
                    const res = await getModelList();
                    if (res.success && res.data) {
                        // 直接使用后端返回的数据结构，不做转换
                        set({
                            imageModels: res.data.imageModels || [],
                            videoModels: res.data.videoModels || [],
                            loading: false,
                        });
                    } else {
                        set({ loading: false, error: '获取模型列表失败' });
                    }
                } catch (error: any) {
                    set({ loading: false, error: error.message || '获取模型列表失败' });
                }
            },

            setImageModel: (imageModel) =>
                set({ imageModel }),

            setVideoModel: (videoModel) =>
                set({ videoModel }),

            resetModelConfig: () =>
                set({ ...DEFAULT_MODEL_CONFIG }),
        }),
        {
            name: 'model-config-storage', // 只持久化这个配置对象
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // 只持久化用户选择的模型，模型列表不持久化
                imageModel: state.imageModel,
                videoModel: state.videoModel,
                version: CONFIG_VERSION, // 添加版本号
            }),
            // 添加版本检查
            onRehydrateStorage: () => (state) => {
                if (state && (state as any).version !== CONFIG_VERSION) {
                    console.log('🔄 模型配置版本更新，重置为默认配置');
                    // 版本不匹配，重置为默认配置
                    Object.assign(state, DEFAULT_MODEL_CONFIG);
                }
            },
        }
    )
);
