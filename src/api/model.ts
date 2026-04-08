import request, { ApiResponse } from './request';

export interface Platform {
  id: string;
  name: string;
  description: string;
}

export interface ModelConfig {
  // 图像模型配置
  sizes?: string[];
  qualities?: string[];
  styles?: string[];
  aspectRatios?: string[];
  supportImageToImage?: boolean;
  supportMultiImageFusion?: boolean;
  supportSeed?: boolean;
  supportNegativePrompt?: boolean;

  // 视频模型配置
  supportedModes?: string[];
  maxDuration?: number;
  minDuration?: number;
  maxImages?: number;
  resolutions?: string[];
  supportCameraMovement?: boolean;
  supportWatermark?: boolean;
  supportGenerateAudio?: boolean;

  // 文本模型配置
  temperature?: number;
  maxTokens?: number;
  supportSystemPrompt?: boolean;
  supportStream?: boolean;

  // 通用扩展配置
  ext?: Record<string, any>;
}

export interface PricingTier {
  resolution: string;
  cost1s?: number;
  cost5s: number;
  multiplier?: number;
  creditsPerSecond: number;
}

export interface AiModelPricing {
  modelType: 'image' | 'video' | 'text';
  billingMode?: 'per_second' | 'per_video';
  pricingTiers?: PricingTier[];
  perVideo?: {
    costPerVideo?: number;
    creditsPerVideo?: number;
    fixedDuration?: number;
    ext?: Record<string, any>;
  };
  image?: {
    costPerImage?: number;
    creditsPerImage?: number;
    ext?: Record<string, any>;
  };
  ext?: Record<string, any>;
}

export interface AiModel {
  id: string;
  name: string;
  description?: string;
  type: 'image' | 'video' | 'text';
  platform: 'tongyi' | 'volcengine' | 'toapis' | 'openai' | 'millionengine';
  enabled: boolean;
  priority: number;
  /** 模型级接口后缀路径，属于基础信息 */
  apiPath?: string;
  pricing?: AiModelPricing;
  config: ModelConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ModelListParams {
  type?: 'image' | 'video' | 'text';
  platform?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateModelRequest {
  id: string;
  name: string;
  description?: string;
  type: 'image' | 'video' | 'text';
  platform: 'tongyi' | 'volcengine' | 'toapis' | 'openai' | 'millionengine';
  enabled?: boolean;
  priority?: number;
  apiPath?: string;
  pricing?: AiModelPricing;
  config: ModelConfig;
}

export interface UpdateModelRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  apiPath?: string;
  pricing?: AiModelPricing;
  config?: ModelConfig;
}

// 获取可用平台列表
export const getPlatforms = (): Promise<ApiResponse<Platform[]>> => {
  return request.get('/api/admin/platforms');
};

// 获取模型列表
export const getModels = (
  params?: ModelListParams
): Promise<ApiResponse<PaginatedResult<AiModel>>> => {
  return request.get('/api/admin/models', { params });
};

// 获取单个模型
export const getModel = (id: string): Promise<ApiResponse<AiModel>> => {
  return request.get(`/api/admin/models/${id}`);
};

// 创建模型
export const createModel = (data: CreateModelRequest): Promise<ApiResponse<AiModel>> => {
  return request.post('/api/admin/models', data);
};

// 更新模型
export const updateModel = (
  id: string,
  data: UpdateModelRequest
): Promise<ApiResponse<AiModel>> => {
  return request.put(`/api/admin/models/${id}`, data);
};

// 删除模型
export const deleteModel = (id: string): Promise<ApiResponse<void>> => {
  return request.delete(`/api/admin/models/${id}`);
};

// 批量启用/禁用模型
export const toggleModels = (ids: string[], enabled: boolean): Promise<ApiResponse<void>> => {
  return request.put('/api/admin/models/batch/toggle', { ids, enabled });
};

// 获取可用模型列表（前端使用）
export const getModelList = (): Promise<
  ApiResponse<{
    imageModels: ModelOption[];
    videoModels: ModelOption[];
    textModels: ModelOption[];
  }>
> => {
  return request.get('/api/ai/models');
};

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
