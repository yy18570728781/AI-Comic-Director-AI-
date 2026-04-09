import { useEffect, useState } from 'react';
import { Button, Card, Image, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { getUserList } from '@/api/user';
import { getAdminTasks } from '@/api/adminTask';
import type { AdminTaskRecord } from '@/api/adminTask';

interface UserOption {
  label: string;
  value: number;
}

const taskTypeOptions = [
  { label: '图片任务', value: 'image' },
  { label: '视频任务', value: 'video' },
];

const statusOptions = [
  { label: '处理中', value: 'processing' },
  { label: '已成功', value: 'completed' },
  { label: '已失败', value: 'failed' },
];

const taskTypeTextMap: Record<string, string> = {
  image: '图片',
  video: '视频',
};

const taskTypeColorMap: Record<string, string> = {
  image: 'blue',
  video: 'purple',
};

const bizTypeTextMap: Record<string, string> = {
  default: '通用',
  ecommerce: '电商',
};

const bizTypeColorMap: Record<string, string> = {
  default: 'default',
  ecommerce: 'gold',
};

const statusColorMap: Record<string, string> = {
  processing: 'processing',
  completed: 'success',
  failed: 'error',
};

const statusTextMap: Record<string, string> = {
  processing: '处理中',
  completed: '已成功',
  failed: '已失败',
};

/**
 * 管理后台任务表页面
 * 关键职责：统一展示图片任务表和视频任务表，并提供请求/结果快照查看能力。
 */
export default function TaskRecordManagement() {
  const [records, setRecords] = useState<AdminTaskRecord[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [taskTypeFilter, setTaskTypeFilter] = useState<'image' | 'video'>();
  const [statusFilter, setStatusFilter] = useState<'processing' | 'completed' | 'failed'>();
  const [userIdFilter, setUserIdFilter] = useState<number>();
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AdminTaskRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<AdminTaskRecord | null>(null);
  const [queryVersion, setQueryVersion] = useState(0);

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

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getAdminTasks({
        taskType: taskTypeFilter,
        status: statusFilter,
        userId: userIdFilter,
        keyword: keyword || undefined,
        page,
        pageSize,
      });

      if (response.success) {
        setRecords(response.data.records || []);
        setTotal(response.data.total || 0);
      } else {
        message.error(response.message || '获取任务记录失败');
      }
    } catch (error) {
      console.error('获取任务记录失败:', error);
      message.error('获取任务记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOptions();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, pageSize, taskTypeFilter, statusFilter, userIdFilter, keyword, queryVersion]);

  const handleSearch = () => {
    setPage(1);
    setKeyword(keywordInput.trim());
    setQueryVersion((value) => value + 1);
  };

  const handleReset = () => {
    setPage(1);
    setPageSize(20);
    setTaskTypeFilter(undefined);
    setStatusFilter(undefined);
    setUserIdFilter(undefined);
    setKeyword('');
    setKeywordInput('');
    setQueryVersion((value) => value + 1);
  };

  const openSnapshotModal = (record: AdminTaskRecord) => {
    setCurrentRecord(record);
    setSnapshotModalOpen(true);
  };

  const openPreviewModal = (record: AdminTaskRecord) => {
    setPreviewRecord(record);
    setPreviewModalOpen(true);
  };

  const columns: ColumnsType<AdminTaskRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      fixed: 'left',
    },
    {
      title: '类型',
      dataIndex: 'taskType',
      width: 100,
      render: (taskType: string) => (
        <Tag color={taskTypeColorMap[taskType] || 'default'}>
          {taskTypeTextMap[taskType] || taskType}
        </Tag>
      ),
    },
    {
      title: '业务',
      dataIndex: 'bizType',
      width: 100,
      render: (bizType?: string) => (
        <Tag color={bizTypeColorMap[bizType || 'default'] || 'default'}>
          {bizTypeTextMap[bizType || 'default'] || bizType || '通用'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{statusTextMap[status] || status}</Tag>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.user?.username || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>#{record.userId ?? '-'}</div>
        </div>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      width: 190,
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 100,
      render: (value?: number) => `${Math.round(value ?? 0)}%`,
    },
    {
      title: '任务快照',
      key: 'snapshot',
      width: 120,
      render: (_, record) =>
        record.requestSnapshot || record.resultSnapshot ? (
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
      title: 'Job ID',
      dataIndex: 'jobId',
      width: 160,
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '第三方任务ID',
      dataIndex: 'taskId',
      width: 180,
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '分镜ID',
      dataIndex: 'shotId',
      width: 100,
      render: (value?: number) => value ?? '-',
    },
    {
      title: '脚本ID',
      dataIndex: 'scriptId',
      width: 100,
      render: (value?: number) => value ?? '-',
    },
    {
      title: '结果地址',
      dataIndex: 'resultUrl',
      width: 180,
      render: (value: string | undefined, record) =>
        value ? (
          <Space size={4}>
            <Button type="link" size="small" onClick={() => openPreviewModal(record)}>
              在线预览
            </Button>
            <a href={value} target="_blank" rel="noreferrer">
              原链接
            </a>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      width: 220,
      ellipsis: true,
      render: (value?: string) => value || '-',
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
              placeholder="任务类型"
              value={taskTypeFilter}
              onChange={setTaskTypeFilter}
              options={taskTypeOptions}
              style={{ width: 140 }}
              allowClear
            />
            <Select
              placeholder="任务状态"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              style={{ width: 140 }}
              allowClear
            />
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
            <Input
              placeholder="搜索用户/Job ID/任务ID/模型/提示词"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
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
          rowKey={(record) => `${record.taskType}-${record.id}`}
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
          scroll={{ x: 1900 }}
        />
      </Card>

      <Modal
        title={`任务快照详情${
          currentRecord ? ` - ${taskTypeTextMap[currentRecord.taskType]} #${currentRecord.id}` : ''
        }`}
        open={snapshotModalOpen}
        footer={null}
        width={820}
        onCancel={() => {
          setSnapshotModalOpen(false);
          setCurrentRecord(null);
        }}
      >
        {/* 关键展示逻辑：请求快照和结果快照并排展示，排查时不用来回切换。 */}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div
            style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12 }}>请求快照</div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 13,
                lineHeight: 1.7,
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              {currentRecord?.requestSnapshot
                ? JSON.stringify(currentRecord.requestSnapshot, null, 2)
                : '暂无请求快照'}
            </pre>
          </div>

          <div
            style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12 }}>结果快照</div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 13,
                lineHeight: 1.7,
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              {currentRecord?.resultSnapshot
                ? JSON.stringify(currentRecord.resultSnapshot, null, 2)
                : '暂无结果快照'}
            </pre>
          </div>
        </Space>
      </Modal>

      <Modal
        title={`结果预览${previewRecord ? ` - ${taskTypeTextMap[previewRecord.taskType]} #${previewRecord.id}` : ''}`}
        open={previewModalOpen}
        footer={null}
        width={previewRecord?.taskType === 'video' ? 960 : 760}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewRecord(null);
        }}
      >
        {/* 关键展示逻辑：后台直接内嵌图片或视频预览，减少“打开链接/下载文件”这类低效操作。 */}
        {previewRecord?.resultUrl ? (
          previewRecord.taskType === 'image' ? (
            <div style={{ textAlign: 'center' }}>
              <Image
                src={previewRecord.resultUrl}
                alt={previewRecord.prompt || '任务结果图片'}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <video
                src={previewRecord.resultUrl}
                controls
                preload="metadata"
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  borderRadius: 8,
                  background: '#000',
                }}
              >
                您的浏览器暂不支持视频预览
              </video>
            </div>
          )
        ) : (
          <div>暂无可预览结果</div>
        )}
      </Modal>
    </div>
  );
}
