import request from './request';

/**
 * 上传单个文件到 OSS
 */
export const uploadFile = async (file: File, folder: string = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return request.post('/api/oss/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * 批量上传文件到 OSS
 */
export const uploadFiles = async (files: File[], folder: string = 'uploads') => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });
    formData.append('folder', folder);

    return request.post('/api/oss/upload-batch', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
