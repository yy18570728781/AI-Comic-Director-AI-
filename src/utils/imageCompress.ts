/**
 * 图片压缩工具函数
 */

export interface CompressOptions {
  /** 压缩质量 (0-1) */
  quality?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 输出格式 */
  outputType?: string;
  /** 是否自动调整质量 */
  autoQuality?: boolean;
}

/**
 * 根据文件大小自动计算压缩质量
 * @param fileSizeMB 文件大小（MB）
 * @returns 压缩质量 (0-1)
 */
const getAutoQuality = (fileSizeMB: number): number => {
  if (fileSizeMB < 2) {
    // 小于2MB，高质量压缩
    return 0.9;
  } else if (fileSizeMB >= 2 && fileSizeMB < 10) {
    // 2-5MB，中高质量压缩
    return 0.8;
  } else {
    // 大于10MB，中等质量压缩（保证AI识别）
    return 0.75;
  }
};

/**
 * 压缩图片
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 压缩后的文件
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    outputType = file.type,
    autoQuality = true
  } = options;

  // 计算文件大小（MB）
  const fileSizeMB = file.size / 1024 / 1024;
  
  // 自动计算压缩质量或使用指定质量
  const quality = autoQuality ? getAutoQuality(fileSizeMB) : (options.quality || 0.8);

  console.log(`📦 开始压缩图片: ${file.name}`);
  console.log(`📊 原始大小: ${fileSizeMB.toFixed(2)}MB`);
  console.log(`🎯 压缩质量: ${(quality * 100).toFixed(0)}%`);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        
        // 按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // 创建 canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              
              const compressedSizeMB = compressedFile.size / 1024 / 1024;
              const compressionRatio = ((fileSizeMB - compressedSizeMB) / fileSizeMB * 100).toFixed(1);
              
              console.log(`✅ 压缩完成: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);
              console.log(`📉 压缩率: ${compressionRatio}%`);
              
              resolve(compressedFile);
            } else {
              console.error('压缩失败，返回原文件');
              resolve(file);
            }
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        console.error('图片加载失败，返回原文件');
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      console.error('文件读取失败，返回原文件');
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 检查是否需要压缩
 * @param file 文件
 * @param maxSize 最大文件大小（字节）
 * @returns 是否需要压缩
 */
export const shouldCompress = (file: File, maxSize: number = 2 * 1024 * 1024): boolean => {
  return file.size > maxSize && file.type.startsWith('image/');
};

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns 图片尺寸
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error('无法获取图片尺寸'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};