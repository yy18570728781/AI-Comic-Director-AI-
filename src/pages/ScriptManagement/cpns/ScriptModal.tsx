import { useEffect } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';

const { TextArea } = Input;

interface ScriptModalProps {
  open: boolean;
  loading: boolean;
  script: any | null; // null表示创建，有值表示编辑
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

function ScriptModal({ open, loading, script, onCancel, onSubmit }: ScriptModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!script?.id; // 有id才是编辑模式

  // 打开弹窗时填充数据
  useEffect(() => {
    if (open && script) {
      form.setFieldsValue({
        title: script.title,
        style: script.style,
        description: script.description,
        content: script.content,
      });
    } else if (open && !script) {
      form.resetFields();
    }
  }, [open, script, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEdit ? '编辑剧本' : '创建剧本'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="80%"
      style={{ maxWidth: 900, top: 20 }}
      styles={{
        body: { maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="剧本标题"
          name="title"
          rules={[{ required: true, message: '请输入剧本标题' }]}
        >
          <Input placeholder="例如：未世异能" />
        </Form.Item>
        <Form.Item label="剧本风格" name="style">
          <Input placeholder="例如：奇幻、科幻、恋爱等" />
        </Form.Item>
        <Form.Item label="简介" name="description">
          <TextArea rows={3} placeholder="简单描述一下剧本内容" />
        </Form.Item>
        <Form.Item
          label="剧本内容"
          name="content"
          rules={[{ required: true, message: '请输入剧本内容' }]}
        >
          <TextArea 
            rows={20} 
            placeholder="粘贴从AI创作工坊生成的剧本内容"
            style={{ minHeight: 400 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '保存' : '创建'}
            </Button>
            <Button onClick={handleCancel}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ScriptModal;
