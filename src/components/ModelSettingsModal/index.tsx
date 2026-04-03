import { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, Spin } from 'antd';

import { useModelStore } from '@/stores/useModelStore';

interface ModelSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ModelSettingsModal({ open, onClose }: ModelSettingsModalProps) {
  const {
    imageModel,
    videoModel,
    imageModels,
    videoModels,
    loading: modelLoading,
    setImageModel,
    setVideoModel,
    loadModels,
  } = useModelStore();

  // 打开弹窗时加载模型列表
  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  return (
    <Modal
      title="模型设置"
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" onClick={onClose}>
            确认
          </Button>
        </div>
      }
      width={500}
    >
      {modelLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="加载模型列表中..." />
        </div>
      ) : (
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label={<span style={{ fontWeight: 500 }}>图片生成模型</span>}
            style={{ marginBottom: 16 }}
          >
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
              选择用于生成静态图片的 AI 模型
            </div>
            <Select
              value={imageModel}
              onChange={setImageModel}
              style={{ width: '100%', height: 48 }}
              listItemHeight={60}
              listHeight={200}
              dropdownStyle={{ padding: 8 }}
            >
              {imageModels.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 500, lineHeight: 1.5 }}>{m.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#999',
                        lineHeight: 1.5,
                        marginTop: 2,
                      }}
                    >
                      {m.description}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>视频生成模型</span>}
            style={{ marginBottom: 16 }}
          >
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
              选择用于生成视频的 AI 模型
            </div>
            <Select
              value={videoModel}
              onChange={setVideoModel}
              style={{ width: '100%', height: 48 }}
              listItemHeight={60}
              listHeight={200}
              dropdownStyle={{ padding: 8 }}
            >
              {videoModels.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 500, lineHeight: 1.5 }}>{m.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#999',
                        lineHeight: 1.5,
                        marginTop: 2,
                      }}
                    >
                      {m.description}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
