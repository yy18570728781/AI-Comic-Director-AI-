import { Upload, message, Modal } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { uploadFile } from '@/api/oss';
import { compressImage, shouldCompress } from '@/utils/imageCompress';

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

  // 当外部 value 变化时，同步内部状态
  useEffect(() => {
    setFileList(
      value.map((url, index) => ({
        uid: `${index}-${url}`,
        name: `image-${index}`,
        status: 'done',
        url,
      })),
    );
  }, [value]);

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
      let fileToUpload = file as File;
      
      // 检查是否需要压缩
      if (shouldCompress(fileToUpload)) {
        const sizeMB = (fileToUpload.size / 1024 / 1024).toFixed(1);
        message.info(`图片较大 (${sizeMB}MB)，正在智能压缩...`);
        
        // 使用自动质量调整的压缩
        fileToUpload = await compressImage(fileToUpload, {
          maxWidth: 1920,
          maxHeight: 1080,
          autoQuality: true // 启用自动质量调整
        });
        
        const compressedSizeMB = (fileToUpload.size / 1024 / 1024).toFixed(1);
        message.success(`压缩完成！${sizeMB}MB → ${compressedSizeMB}MB`);
        
        // 压缩后再次检查大小，确保不超过合理限制
        const finalSizeMB = fileToUpload.size / 1024 / 1024;
        if (finalSizeMB > 10) {
          message.error(`压缩后文件仍然过大 (${compressedSizeMB}MB)，请选择更小的图片`);
          return;
        }
      }
      
      const res: any = await uploadFile(fileToUpload, 'reference-images');



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

  // 上传前的校验（只做基本校验，不涉及压缩）
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    // 放宽原始文件限制，因为我们会压缩
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error('图片大小不能超过 50MB！');
      return false;
    }

    // 显示压缩提示
    if (shouldCompress(file)) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      message.info(`检测到大图片 (${sizeMB}MB)，将智能压缩优化`);
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
      <style>
        {`
          .custom-upload-tab .ant-upload-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
          }
          .custom-upload-tab .ant-upload-list-picture-card {
            display: contents;
          }
          .custom-upload-tab .ant-upload-list-picture-card .ant-upload-list-item-container {
            width: 150px !important;
            height: 150px !important;
            margin: 0 !important;
          }
          .custom-upload-tab .ant-upload-list-picture-card .ant-upload-list-item {
            width: 150px !important;
            height: 150px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .custom-upload-tab .ant-upload-list-picture-card .ant-upload-list-item-thumbnail img {
            object-fit: cover !important;
          }
          .custom-upload-tab .ant-upload.ant-upload-select {
            width: 150px !important;
            height: 150px !important;
            margin: 0 !important;
          }
        `}
      </style>
      <div className="custom-upload-tab">
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
            showDownloadIcon: false,
          }}
        >
          {fileList.length >= maxCount ? null : uploadButton}
        </Upload>
      </div>
      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        支持 jpg、png、webp、gif 格式，原始文件不超过 50MB，最多上传 {maxCount} 张
        <br />
        <span style={{ color: '#1890ff' }}>
          🤖 智能压缩：&gt;2MB自动压缩，保持高质量便于AI识别，最终不超过10MB
        </span>
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
