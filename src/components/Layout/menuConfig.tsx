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
