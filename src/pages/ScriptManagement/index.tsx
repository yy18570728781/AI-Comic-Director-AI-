import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  message,
  Empty,
  Spin,
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getScriptList, createScript, deleteScript } from '@/api/script';
import { useUserStore } from '@/stores/useUserStore';
import dayjs from 'dayjs';

const { TextArea } = Input;

function ScriptManagement() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  // 加载剧本列表
  const loadScripts = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      const res = await getScriptList({
        // 不需要传递userId，后端会从token中获取
        page,
        pageSize,
        keyword: keyword || undefined,
      });
      setScripts(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadScripts();
    }
  }, [page, keyword, currentUser]);

  // 创建剧本
  const handleCreate = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setCreateLoading(true);
    try {
      await createScript({
        ...values,
        // 不需要传递userId，后端会从token中获取
      });
      message.success('剧本创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadScripts();
    } catch (error) {
      console.error(error);
    } finally {
      setCreateLoading(false);
    }
  };

  // 删除剧本
  const handleDelete = async (id: number) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    try {
      await deleteScript(id); // 不需要传递userId，后端会从token中获取
      message.success('剧本删除成功');
      loadScripts();
    } catch (error) {
      console.error(error);
    }
  };

  // 查看剧本详情
  const handleView = (id: number) => {
    navigate(`/script-management/${id}`);
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Input
            placeholder="搜索剧本标题或简介"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建剧本
        </Button>
      </div>

      <Spin spinning={loading}>
        {scripts.length === 0 ? (
          <Empty
            description="暂无剧本，点击右上角创建剧本"
            style={{ marginTop: 100 }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {scripts.map((script) => (
              <Card
                key={script.id}
                hoverable
                actions={[
                  <EyeOutlined
                    key="view"
                    onClick={() => handleView(script.id)}
                  />,
                  <EditOutlined
                    key="edit"
                    onClick={() => handleView(script.id)}
                  />,
                  <Popconfirm
                    title="确定删除这个剧本吗？"
                    onConfirm={() => handleDelete(script.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteOutlined key="delete" />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={script.title}
                  description={
                    <div>
                      <div
                        style={{ marginBottom: 8, color: '#666', fontSize: 12 }}
                      >
                        {dayjs(script.createdAt).format('YYYY年MM月DD日')}
                      </div>
                      <div style={{ marginBottom: 8, minHeight: 40 }}>
                        {script.description || '暂无简介'}
                      </div>
                      <Space>
                        {script.style && <Tag color="blue">{script.style}</Tag>}
                        {script.shotCount > 0 && (
                          <Tag color="green">共 {script.shotCount} 个镜头</Tag>
                        )}
                      </Space>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {/* 创建剧本弹窗 */}
      <Modal
        title="创建剧本"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
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
            <TextArea rows={10} placeholder="粘贴从AI创作工坊生成的剧本内容" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ScriptManagement;
