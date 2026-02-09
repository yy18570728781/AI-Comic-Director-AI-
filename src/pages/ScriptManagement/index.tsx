import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
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
import { getScriptList, createScript, updateScript, deleteScript } from '@/api/script';
import { useUserStore } from '@/stores/useUserStore';
import ScriptModal from './cpns/ScriptModal';
import dayjs from 'dayjs';

function ScriptManagement() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);

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

  // 检查是否有待创建的剧本（从AI创作页面跳转过来）
  useEffect(() => {
    const pendingContent = localStorage.getItem('pendingScriptContent');
    const pendingStyle = localStorage.getItem('pendingScriptStyle');
    const pendingTitle = localStorage.getItem('pendingScriptTitle');

    if (pendingContent) {
      // 设置待填充的数据作为编辑对象（但id为空表示创建）
      setEditingScript({
        title: pendingTitle || '',
        content: pendingContent,
        style: pendingStyle || '',
        description: '',
      });
      setModalVisible(true);

      // 清除 localStorage
      localStorage.removeItem('pendingScriptContent');
      localStorage.removeItem('pendingScriptStyle');
      localStorage.removeItem('pendingScriptTitle');

      message.info('已自动填充剧本标题和内容，请补充简介');
    }
  }, []);

  // 打开创建弹窗
  const handleOpenCreate = () => {
    setEditingScript(null);
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleOpenEdit = (script: any) => {
    setEditingScript(script);
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingScript(null);
  };

  // 创建或更新剧本
  const handleSubmit = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setModalLoading(true);
    try {
      if (editingScript?.id) {
        // 编辑模式（有id才是真正的编辑）
        await updateScript(editingScript.id, values);
        message.success('剧本更新成功');
      } else {
        // 创建模式
        await createScript(values);
        message.success('剧本创建成功');
      }
      handleCloseModal();
      loadScripts();
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
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
          onClick={handleOpenCreate}
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
                    onClick={() => handleOpenEdit(script)}
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

      {/* 创建/编辑剧本弹窗 */}
      <ScriptModal
        open={modalVisible}
        loading={modalLoading}
        script={editingScript}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default ScriptManagement;
