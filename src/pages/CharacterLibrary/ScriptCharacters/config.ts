import React from 'react';
import { TableColumnsType, DescriptionsProps } from 'antd';
import { Tag } from 'antd';

export interface ExtractedCharacter {
  name: string;
  description: string;
  appearance?: string;
  personality?: string;
  role?: string;
  scenes: string[];
  dialogueCount: number;
  imagePrompt?: string;
  variant?: string;
  characterGroup?: string;
  tags?: string[];
}

export interface SavedCharacter {
  id: number;
  name: string;
  characterId: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  variant?: string;
  characterGroup?: string;
  tags?: string[];
}

/**
 * 已保存角色列表表格配置
 */
export const savedCharacterTableColumns: TableColumnsType<SavedCharacter> = [
  {
    title: '角色名称',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => React.createElement('strong', null, name),
  },
  {
    title: '角色ID',
    dataIndex: 'characterId',
    key: 'characterId',
    width: 120,
    render: (characterId: string) =>
      React.createElement(
        Tag,
        {
          color: 'blue',
        },
        characterId
      ),
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 120,
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
];

/**
 * 角色列表表格配置
 */
export const characterTableColumns: TableColumnsType<ExtractedCharacter> = [
  {
    title: '角色名称',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => React.createElement('strong', null, name),
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    width: 300,
  },
  {
    title: '出现场景',
    dataIndex: 'scenes',
    key: 'scenes',
    render: (scenes: string[]) =>
      React.createElement(
        'div',
        null,
        scenes.slice(0, 3).map((scene, index) =>
          React.createElement(
            Tag,
            {
              key: index,
              color: 'blue',
              style: { marginBottom: 4 },
            },
            scene
          )
        ),
        scenes.length > 3 &&
          React.createElement(
            Tag,
            {
              color: 'default',
            },
            `+${scenes.length - 3}`
          )
      ),
  },
  {
    title: '对话数量',
    dataIndex: 'dialogueCount',
    key: 'dialogueCount',
    width: 100,
    render: (count: number) =>
      React.createElement(
        Tag,
        {
          color: getDialogueCountColor(count),
        },
        count
      ),
  },
];

/**
 * 对话数量颜色映射
 */
export const getDialogueCountColor = (count: number): string => {
  if (count > 5) return 'red';
  if (count > 2) return 'orange';
  return 'default';
};

/**
 * 角色详情展开配置
 */
export const getCharacterExpandedContent = (
  record: ExtractedCharacter
): DescriptionsProps['items'] => {
  const items: DescriptionsProps['items'] = [
    {
      key: 'description',
      label: '详细描述',
      children: record.description,
    },
  ];

  if (record.appearance) {
    items.push({
      key: 'appearance',
      label: '外观描述',
      children: record.appearance,
    });
  }

  if (record.scenes.length > 0) {
    items.push({
      key: 'scenes',
      label: '出现场景',
      children: record.scenes.join(', '),
    });
  }

  if (record.imagePrompt) {
    items.push({
      key: 'imagePrompt',
      label: 'AI绘画提示词',
      children: record.imagePrompt,
    });
  }

  return items;
};

/**
 * 表格配置
 */
export const characterTableConfig = {
  rowKey: 'name',
  size: 'small' as const,
  pagination: false as const,
};

/**
 * 已保存角色表格配置
 */
export const savedCharacterTableConfig = {
  rowKey: 'id',
  size: 'small' as const,
  pagination: {
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false,
  },
};

/**
 * 剧本信息描述配置
 */
export const getScriptDescriptionItems = (script: any): DescriptionsProps['items'] => [
  {
    key: 'title',
    label: '剧本标题',
    children: script.title,
  },
  {
    key: 'shotCount',
    label: '分镜数量',
    children: React.createElement(
      Tag,
      {
        color: script.shotCount > 0 ? 'green' : 'default',
      },
      `${script.shotCount} 个分镜`
    ),
  },
  {
    key: 'style',
    label: '风格',
    children: script.style
      ? React.createElement(Tag, { color: 'blue' }, script.style)
      : React.createElement('span', { style: { color: '#ccc' } }, '未设置'),
  },
  {
    key: 'status',
    label: '状态',
    children: React.createElement(
      Tag,
      {
        color: script.status === 'published' ? 'green' : 'orange',
      },
      script.status === 'published' ? '已发布' : '草稿'
    ),
  },
];

/**
 * 空状态配置
 */
export const emptyStates = {
  initial: {
    icon: '👥',
    title: '点击"提取角色信息"开始分析该剧本的角色',
    description: '系统会从剧本内容和分镜数据中自动识别和提取角色信息',
  },
  loading: {
    title: '正在分析剧本内容和分镜数据，提取角色信息...请勿离开',
  },
  noCharacters: {
    title: '未能从该剧本中提取到角色信息',
    reasons: ['剧本内容为空或格式不规范', '分镜数据中没有角色信息', 'AI分析服务暂时不可用'],
  },
};

/**
 * 按钮文本配置
 */
export const buttonTexts = {
  back: '返回角色库',
  extract: '提取角色信息',
  reExtract: '重新提取',
  save: '保存选中角色',
  refresh: '刷新',
  refreshSaved: '刷新已保存角色',
};

/**
 * 消息提示配置
 */
export const messages = {
  extractSuccess: (count: number) => `成功提取到 ${count} 个角色`,
  extractError: '提取角色失败',
  saveSuccess: (count: number) => `成功保存 ${count} 个角色到角色库`,
  saveError: '保存角色失败',
  noSelection: '请选择要保存的角色',
  noScriptId: '剧本ID不存在',
};

/**
 * 确认对话框配置
 */
export const confirmDialogs = {
  saveSuccess: {
    title: '保存成功',
    content: '角色已保存到角色库。是否要重新提取角色信息？',
    okText: '保持当前',
    cancelText: '重新提取',
  },
};
