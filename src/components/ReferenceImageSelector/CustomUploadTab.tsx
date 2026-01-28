import { Upload, message, Modal } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { uploadFile } from '@/api/oss';

interface CustomUploadTabProps {
  maxCount?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
}

/**
 * 自定义上传标签页
 */
export default function CustomUploadTab({
  maxCount = 3,
  value = [],
  onChange,
}: CustomUploadTabProps) {
  const [fileList, setFileList] = useState<UploadFile[]>(
    value.map((url, index) => ({
      uid: `${index}`,
      name: `image-${index}`,
      status: 'done',
      url,
    })),
  );
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 预览图片
  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url || '');
    setPreviewOpen(true);
  };

  // 自定义上传逻辑
  const customUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    setUploading(true);
    try {
      const res: any = await uploadFile(file as File, 'reference-images');

      console.log('上传响应:', res);

      if (res.success) {
        const url = res.data.url;
        onSuccess?.(res.data);

        // 更新文件列表
        const newFileList = [
          ...fileList,
          {
            uid: Date.now().toString(),
            name: (file as File).name,
            status: 'done' as const,
            url,
          },
        ];
        setFileList(newFileList);

        // 通知父组件
        const urls = newFileList.map((f) => f.url).filter(Boolean) as string[];
        onChange?.(urls);

        message.success('上传成功');
      } else {
        throw new Error(res.message || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      onError?.(error);
      message.error(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid);
    setFileList(newFileList);

    // 通知父组件
    const urls = newFileList.map((f) => f.url).filter(Boolean) as string[];
    onChange?.(urls);
  };

  // 上传前的校验
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error('图片大小不能超过 20MB！');
      return false;
    }

    return true;
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      <Upload
        listType="picture-card"
        fileList={fileList}
        customRequest={customUpload}
        beforeUpload={beforeUpload}
        onRemove={handleRemove}
        onPreview={handlePreview}
        maxCount={maxCount}
        accept="image/*"
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: true,
          showDownloadIcon: false, // 禁用下载按钮
        }}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        支持 jpg、png、webp、gif 格式，单张图片不超过 10MB，最多上传 {maxCount}{' '}
        张
      </div>

      {/* 图片预览 Modal */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
}
