import type { MenuProps } from 'antd';
import {
  EditOutlined,
  FileTextOutlined,
  PictureOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  WalletOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ShopOutlined,
} from '@ant-design/icons';

export const topMenuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: 'creation',
    icon: <AppstoreOutlined />,
    label: '创作中心',
    children: [
      { key: '/ai-creation', icon: <EditOutlined />, label: '剧本创作' },
      { key: '/script-management', icon: <FileTextOutlined />, label: '剧本管理' },
      { key: '/image-to-image', icon: <CameraOutlined />, label: '图片创作' },
      { key: '/image-to-video', icon: <VideoCameraOutlined />, label: '视频创作' },
    ],
  },
  {
    key: '/creation-studio',
    icon: <ShopOutlined />,
    label: '创作工作台',
  },
  {
    key: 'resources',
    icon: <PictureOutlined />,
    label: '资源库',
    children: [
      { key: '/resource-library', icon: <PictureOutlined />, label: '资源库' },
      { key: '/character-library', icon: <UserOutlined />, label: '角色库' },
    ],
  },
  {
    key: 'compute',
    icon: <TeamOutlined />,
    label: '充值中心',
    children: [
      { key: '/recharge', icon: <WalletOutlined />, label: '积分充值' },
      { key: '/team-space', icon: <TeamOutlined />, label: '团队空间' },
    ],
  },
];

export const adminMenuItems: MenuProps['items'] = [
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
      { key: '/admin/point-records', icon: <WalletOutlined />, label: '积分记录' },
      { key: '/admin/models', icon: <DatabaseOutlined />, label: '模型管理' },
    ],
  },
];
