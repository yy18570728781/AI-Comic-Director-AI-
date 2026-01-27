import { request } from './request';

/**
 * 获取可用的 AI 模型列表
 */
export function getModelList() {
  return request({
    url: '/api/ai/models',
    method: 'get',
  });
}
