import request from './request';

/**
 * 设置首帧
 */
export async function setFirstFrame(imageId: number) {
    return request.put(`/api/shot/image/${imageId}/first`);
}

/**
 * 设置尾帧
 */
export async function setLastFrame(imageId: number) {
    return request.put(`/api/shot/image/${imageId}/last`);
}

/**
 * 删除图片
 */
export async function deleteImage(imageId: number) {
    return request.delete(`/api/shot/image/${imageId}`);
}
