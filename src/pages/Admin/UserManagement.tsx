import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, message, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, WalletOutlined } from '@ant-design/icons';
import { getUserList, createUser, rechargePoints } from '@/api/user';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { success, data } = await getUserList({ page, pageSize, keyword });
      if (success) {
        setUsers(data.list || []);
        setTotal(data.total || 0);
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      const { success, message: msg } = await createUser(values);
      if (success) {
        message.success('创建成功');
        setModalVisible(false);
        form.resetFields();
        fetchUsers();
      } else {
        message.error(msg || '创建失败');
      }
    } catch (error: any) {
      console.error('创建用户失败:', error);
      if (error.errorFields) return;
      message.error('创建失败');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields();
      setRechargeLoading(true);
      const { success, message: msg } = await rechargePoints(
        selectedUser!.id,
        values.points,
        values.bonus
      );
      if (success) {
        message.success('充值成功');
        setRechargeModalVisible(false);
        rechargeForm.resetFields();
        fetchUsers();
      } else {
        message.error(msg || '充值失败');
      }
    } catch (error: any) {
      console.error('充值失败:', error);
      if (error.errorFields) return;
      message.error('充值失败');
    } finally {
      setRechargeLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      render: (email) => email || '-',
    },
    {
      title: '积分',
      dataIndex: 'points',
      width: 100,
      render: (points) => <Tag color="green">{points ?? 0}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<WalletOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setRechargeModalVisible(true);
            }}
          >
            充值
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => message.info('编辑功能开发中')}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => message.info('删除功能开发中')}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="搜索用户名或邮箱"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="新建用户"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`充值积分 - ${selectedUser?.username}`}
        open={rechargeModalVisible}
        onOk={handleRecharge}
        onCancel={() => {
          setRechargeModalVisible(false);
          rechargeForm.resetFields();
          setSelectedUser(null);
        }}
        confirmLoading={rechargeLoading}
      >
        <Form form={rechargeForm} layout="vertical">
          <Form.Item label="当前积分">
            <Tag color="green" style={{ fontSize: 16, padding: '4px 12px' }}>
              {selectedUser?.points ?? 0}
            </Tag>
          </Form.Item>
          <Form.Item
            label="充值积分"
            name="points"
            rules={[
              { required: true, message: '请输入充值积分' },
              { type: 'number', min: 1, message: '积分必须大于0' },
            ]}
          >
            <InputNumber
              placeholder="请输入充值积分"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>
          <Form.Item
            label="赠送积分"
            name="bonus"
            extra="可选，额外赠送的积分"
          >
            <InputNumber
              placeholder="请输入赠送积分（可选）"
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
