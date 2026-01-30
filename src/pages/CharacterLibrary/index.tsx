import { useEffect } from 'react';
import { Button, Table, Space, Card, Input, message, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getScriptList } from '../../api/script';
import { useNavigate } from 'react-router-dom';
import { useScriptStore, Script } from '../../stores/useScriptStore';
import { 
  getScriptTableColumns, 
  statusFilterOptions, 
  tableConfig, 
  searchConfig, 
  usageInstructions 
} from './config';

function CharacterLibrary() {
  const navigate = useNavigate();
  const {
    loading,
    searchKeyword,
    statusFilter,
    setScripts,
    setLoading,
    setSearchKeyword,
    setStatusFilter,
    getFilteredScripts,
  } = useScriptStore();

  // 获取剧本列表
  const fetchScripts = async () => {
    setLoading(true);
    try {
      const response = await getScriptList({
        page: 1,
        pageSize: 100,
        keyword: searchKeyword,
      });
      if (response.success) {
        setScripts(response.data.list || []);
      } else {
        message.error('获取剧本列表失败');
      }
    } catch (error) {
      console.error('获取剧本列表失败:', error);
      message.error('获取剧本列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  // 搜索处理
  const handleSearch = () => {
    fetchScripts();
  };

  // 进入剧本角色页面
  const handleViewScriptCharacters = (script: Script) => {
    navigate(`/character-library/script/${script.id}`, {
      state: { script }
    });
  };

  // 获取筛选后的剧本列表
  const filteredScripts = getFilteredScripts();

  // 表格列配置
  const columns = getScriptTableColumns(handleViewScriptCharacters);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>角色库</h2>
        <Space>
          <Button icon={<PlusOutlined />}>
            手动添加角色
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Input.Search
              placeholder={searchConfig.placeholder}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              style={searchConfig.style}
              allowClear={searchConfig.allowClear}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              style={{ width: 120 }}
            />
            <Button onClick={fetchScripts} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredScripts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...tableConfig.pagination,
            total: filteredScripts.length,
          }}
          locale={{
            emptyText: searchKeyword || statusFilter !== 'all' 
              ? '没有找到匹配的剧本' 
              : tableConfig.locale.emptyText,
          }}
        />
      </Card>

      <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
        <p>{usageInstructions.title}</p>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.6 }}>
          {usageInstructions.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CharacterLibrary;