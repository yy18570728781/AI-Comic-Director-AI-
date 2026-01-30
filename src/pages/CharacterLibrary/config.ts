import React from 'react';
import { TableColumnsType } from 'antd';
import { Tag, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Script } from '../../stores/useScriptStore';

/**
 * 剧本列表表格配置
 */
export const getScriptTableColumns = (
  onViewCharacters: (script: Script) => void
): TableColumnsType<Script> => [
  {
    title: '剧本标题',
    dataIndex: 'title',
    key: 'title',
    render: (title: string, record: Script) => React.createElement(
      'div',
      null,
      React.createElement('div', { 
        style: { fontWeight: 500, marginBottom: 4 } 
      }, title),
      record.description && React.createElement('div', {
        style: { fontSize: 12, color: '#666', lineHeight: 1.4 }
      }, record.description)
    ),
  },
  {
    title: '风格',
    dataIndex: 'style',
    key: 'style',
    width: 100,
    render: (style: string) => style ? 
      React.createElement(Tag, { color: 'blue' }, style) : 
      React.createElement('span', { style: { color: '#ccc' } }, '未设置'),
  },
  {
    title: '分镜数量',
    dataIndex: 'shotCount',
    key: 'shotCount',
    width: 100,
    render: (count: number) => React.createElement(Tag, {
      color: count > 0 ? 'green' : 'default'
    }, `${count} 个分镜`),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => React.createElement(Tag, {
      color: getStatusColor(status)
    }, getStatusText(status)),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 120,
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (_: any, record: Script) => React.createElement(
      Space,
      null,
      React.createElement(Button, {
        type: 'primary',
        size: 'small',
        icon: React.createElement(UserOutlined),
        onClick: () => onViewCharacters(record)
      }, '查看角色')
    ),
  },
];

/**
 * 状态颜色映射
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    published: 'green',
    draft: 'orange',
    archived: 'default',
  };
  return colorMap[status] || 'default';
};

/**
 * 状态文本映射
 */
export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档',
  };
  return textMap[status] || status;
};

/**
 * 状态筛选选项
 */
export const statusFilterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' },
];

/**
 * 表格分页配置
 */
export const tableConfig = {
  pagination: {
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 个剧本`,
  },
  locale: {
    emptyText: '暂无剧本数据',
  },
};

/**
 * 搜索配置
 */
export const searchConfig = {
  placeholder: '搜索剧本标题或描述',
  style: { width: 300 },
  allowClear: true,
};

/**
 * 使用说明配置
 */
export const usageInstructions = {
  title: '💡 使用说明：',
  items: [
    '点击"查看角色"进入该剧本的角色管理页面',
    '在角色管理页面可以提取、编辑和管理该剧本的角色信息',
    '角色信息会从剧本内容和分镜数据中自动提取',
  ],
};