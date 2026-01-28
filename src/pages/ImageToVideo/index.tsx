import React from 'react';
import { Button, Typography, Space } from 'antd';

const { Title, Paragraph } = Typography;

function ImageToVideo() {
  return (
    <div>
      <Title level={3}>图生视频</Title>
      <Paragraph>将图片/图像序列转换为视频的功能页面（占位）。</Paragraph>
      <Space>
        <Button type="primary">选择参考图</Button>
        <Button>配置生成参数</Button>
        <Button>开始生成</Button>
      </Space>
    </div>
  );
}

export default ImageToVideo;
