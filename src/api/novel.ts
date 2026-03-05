import request from './request';

/**
 * 获取小说标签配置
 */
export const getNovelTags = () => request.get('/api/novel/tags');
