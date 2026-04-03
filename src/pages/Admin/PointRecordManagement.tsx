import { useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { getAdminPointRecords } from '@/api/adminPointRecord';
import { getUserList } from '@/api/user';
import type { AdminPointRecord } from '@/api/adminPointRecord';

interface UserOption {
  label: string;
  value: number;
}

const pointTypeOptions = [
  { label: '充值', value: 'recharge' },
  { label: '消费', value: 'consume' },
  { label: '赠送', value: 'gift' },
  { label: '退款', value: 'refund' },
];

const taskTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
];

const businessTypeOptions = [
  { label: '支付充值', value: 'recharge_payment' },
  { label: '后台充值', value: 'admin_recharge' },
  { label: '图片生成扣费', value: 'image_generate' },
  { label: '图片退款', value: 'image_refund' },
  { label: '视频生成扣费', value: 'video_generate' },
  { label: '视频退款', value: 'video_refund' },
];

const sourceOptions = [
  { label: '图片队列', value: 'queue:image' },
  { label: '视频队列', value: 'queue:video' },
  { label: '后台用户管理', value: 'admin:user' },
  { label: '微信 JSAPI 支付', value: 'payment:wechat_jsapi' },
  { label: '微信 H5 支付', value: 'payment:wechat_h5' },
  { label: '微信扫码支付', value: 'payment:wechat_native' },
];

const pointTypeColorMap: Record<string, string> = {
  recharge: 'success',
  consume: 'processing',
  gift: 'gold',
  refund: 'warning',
};

const pointTypeTextMap: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  gift: '赠送',
  refund: '退款',
};

const taskTypeTextMap: Record<string, string> = {
  text: '文本',
  image: '图片',
  video: '视频',
};

const businessTypeTextMap: Record<string, string> = {
  recharge_payment: '支付充值',
  admin_recharge: '后台充值',
  image_generate: '图片生成扣费',
  image_refund: '图片生成退款',
  video_generate: '视频生成扣费',
  video_refund: '视频生成退款',
};

const sourceTextMap: Record<string, string> = {
  'queue:image': '图片队列',
  'queue:video': '视频队列',
  'admin:user': '后台用户管理',
  'payment:wechat_jsapi': '微信 JSAPI 支付',
  'payment:wechat_h5': '微信 H5 支付',
  'payment:wechat_native': '微信扫码支付',
};

/**
 * 管理后台积分流水页。
 * 筛选区和表格交互尽量对齐模型管理页，方便运营同学快速上手。
 */
export default function PointRecordManagement() {
  const [records, setRecords] = useState<AdminPointRecord[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userIdFilter, setUserIdFilter] = useState<number>();
  const [typeFilter, setTypeFilter] = useState<string>();
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>();
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>();
  const [sourceFilter, setSourceFilter] = useState<string>();
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [queryVersion, setQueryVersion] = useState(0);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [currentSnapshotRecord, setCurrentSnapshotRecord] = useState<AdminPointRecord | null>(null);

  const fetchPointRecords = async () => {
    setLoading(true);
    try {
      const response = await getAdminPointRecords({
        userId: userIdFilter,
        type: typeFilter,
        taskType: taskTypeFilter,
        businessType: businessTypeFilter,
        source: sourceFilter,
        keyword: keyword || undefined,
        page,
        pageSize,
      });

      if (response.success) {
        setRecords(response.data.records || []);
        setTotal(response.data.total || 0);
      } else {
        message.error(response.message || '获取积分流水失败');
      }
    } catch (error) {
      console.error('获取积分流水失败:', error);
      message.error('获取积分流水失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOptions = async () => {
    try {
      const response = await getUserList({ page: 1, pageSize: 200 });
      if (response.success) {
        const options = (response.data.list || []).map((user: any) => ({
          value: user.id,
          label: `${user.username || '未命名用户'} (#${user.id})`,
        }));
        setUserOptions(options);
      }
    } catch (error) {
      console.error('获取用户选项失败:', error);
    }
  };

  useEffect(() => {
    fetchUserOptions();
  }, []);

  useEffect(() => {
    fetchPointRecords();
  }, [
    page,
    pageSize,
    userIdFilter,
    typeFilter,
    taskTypeFilter,
    businessTypeFilter,
    sourceFilter,
    keyword,
    queryVersion,
  ]);

  const handleSearch = () => {
    setPage(1);
    setKeyword(keywordInput.trim());
    setQueryVersion((value) => value + 1);
  };

  const handleReset = () => {
    setPage(1);
    setPageSize(20);
    setUserIdFilter(undefined);
    setTypeFilter(undefined);
    setTaskTypeFilter(undefined);
    setBusinessTypeFilter(undefined);
    setSourceFilter(undefined);
    setKeyword('');
    setKeywordInput('');
    setQueryVersion((value) => value + 1);
  };

  const openSnapshotModal = (record: AdminPointRecord) => {
    setCurrentSnapshotRecord(record);
    setSnapshotModalOpen(true);
  };

  const columns: ColumnsType<AdminPointRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      fixed: 'left',
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.user?.username || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>#{record.userId}</div>
        </div>
      ),
    },
    {
      title: '流水类型',
      dataIndex: 'type',
      width: 110,
      render: (type: string) => (
        <Tag color={pointTypeColorMap[type] || 'default'}>{pointTypeTextMap[type] || type}</Tag>
      ),
    },
    {
      title: '变动积分',
      dataIndex: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
          {amount > 0 ? `+${amount}` : amount}
        </span>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 100,
      render: (balance: number) => <Tag color="green">{balance ?? 0}</Tag>,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      width: 100,
      render: (taskType?: string) =>
        taskType ? <Tag>{taskTypeTextMap[taskType] || taskType}</Tag> : '-',
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      width: 160,
      render: (businessType?: string) =>
        businessType ? (
          <Tag color="purple">{businessTypeTextMap[businessType] || businessType}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 160,
      render: (source?: string) => (source ? <Tag>{sourceTextMap[source] || source}</Tag> : '-'),
    },
    {
      title: '请求快照',
      dataIndex: 'requestSnapshot',
      width: 120,
      render: (requestSnapshot: AdminPointRecord['requestSnapshot'], record) =>
        requestSnapshot ? (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openSnapshotModal(record)}
          >
            查看详情
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      width: 180,
      ellipsis: true,
      render: (taskId?: string) => taskId || '-',
    },
    {
      title: '模型ID',
      dataIndex: 'modelId',
      width: 180,
      ellipsis: true,
      render: (modelId?: string) => modelId || '-',
    },
    {
      title: '订单号',
      dataIndex: 'relatedOrderNo',
      width: 180,
      ellipsis: true,
      render: (relatedOrderNo?: string) => relatedOrderNo || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 220,
      ellipsis: true,
      render: (remark?: string) => remark || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="用户"
              value={userIdFilter}
              onChange={setUserIdFilter}
              options={userOptions}
              style={{ width: 220 }}
              allowClear
              showSearch
              optionFilterProp="label"
            />
            <Select
              placeholder="流水类型"
              value={typeFilter}
              onChange={setTypeFilter}
              options={pointTypeOptions}
              style={{ width: 120 }}
              allowClear
            />
            <Select
              placeholder="任务类型"
              value={taskTypeFilter}
              onChange={setTaskTypeFilter}
              options={taskTypeOptions}
              style={{ width: 120 }}
              allowClear
            />
            <Select
              placeholder="业务类型"
              value={businessTypeFilter}
              onChange={setBusinessTypeFilter}
              options={businessTypeOptions}
              style={{ width: 180 }}
              allowClear
            />
            <Select
              placeholder="来源"
              value={sourceFilter}
              onChange={setSourceFilter}
              options={sourceOptions}
              style={{ width: 180 }}
              allowClear
            />
            <Input
              placeholder="搜索用户/任务ID/订单号/备注"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 260 }}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          scroll={{ x: 1800 }}
        />
      </Card>

      <Modal
        title={`请求快照详情${currentSnapshotRecord ? ` - #${currentSnapshotRecord.id}` : ''}`}
        open={snapshotModalOpen}
        footer={null}
        width={720}
        onCancel={() => {
          setSnapshotModalOpen(false);
          setCurrentSnapshotRecord(null);
        }}
      >
        <div
          style={{
            maxHeight: 520,
            overflow: 'auto',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {currentSnapshotRecord?.requestSnapshot
              ? JSON.stringify(currentSnapshotRecord.requestSnapshot, null, 2)
              : '暂无请求快照'}
          </pre>
        </div>
      </Modal>
    </div>
  );
}
