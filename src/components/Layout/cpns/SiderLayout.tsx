import { useState, useEffect } from 'react';
import { Layout as AntdLayout, Menu, theme, Button, Space, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  EditOutlined,
  FileTextOutlined,
  PictureOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  WalletOutlined,
  HomeOutlined,
  DatabaseOutlined,
  ShopOutlined,
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import UserProfileModal from '@/components/UserProfileModal';
import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';
import { UserRoleEnum } from '@/api/user';

import './sider.css';

const { Header, Sider, Content } = AntdLayout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/ai-creation', icon: <EditOutlined />, label: 'AI创作' },
  { key: '/script-management', icon: <FileTextOutlined />, label: '剧本管理' },
  { key: '/image-to-video', icon: <VideoCameraOutlined />, label: '图生视频' },
  { key: '/image-to-image', icon: <CameraOutlined />, label: '图生图' },
  { key: '/creation-studio', icon: <ShopOutlined />, label: '创作工作台' },
  { key: '/resource-library', icon: <PictureOutlined />, label: '资源库' },
  { key: '/character-library', icon: <UserOutlined />, label: '角色库' },
  { key: '/team-space', icon: <TeamOutlined />, label: '团队空间' },
  { key: '/recharge', icon: <WalletOutlined />, label: '积分充值' },
];

export default function SiderLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshPoints } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (currentUser?.id) refreshPoints();
  }, [currentUser?.id, refreshPoints]);

  const handleMenuClick: MenuProps['onClick'] = (e) => navigate(e.key);

  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;
  const allMenuItems: MenuProps['items'] = [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN].includes(
    (currentUser?.role as UserRoleEnum) || UserRoleEnum.USER
  )
    ? [
        ...(menuItems ?? []),
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
      ]
    : menuItems;

  return (
    <AuthGuard>
      <AntdLayout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div className="sider-logo">
            <h2>{collapsed ? 'AI' : 'AI漫剧工作台'}</h2>
            <img style={{ width: 40 }} src="/image/logo2.png" alt="" />
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={allMenuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <AntdLayout style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Header style={{ padding: 0, background: colorBgContainer, flexShrink: 0 }}>
            <div className="sider-header-content">
              <h3>AI漫剧一站式服务工作台</h3>
              <Space>
                <Button icon={<SettingOutlined />} onClick={() => setModelModalVisible(true)}>
                  模型设置
                </Button>
                <div
                  onClick={() => setUserModalVisible(true)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '4px 12px',
                    borderRadius: 8,
                  }}
                >
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    src={currentUser?.avatar}
                    style={{ backgroundColor: '#7265e6' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#666', fontSize: 13 }}>可用积分</span>
                    <span style={{ color: '#52c41a', fontSize: 16, fontWeight: 600 }}>
                      {currentUser?.points ?? 0}
                    </span>
                  </div>
                </div>
              </Space>
            </div>
          </Header>
          <Content style={{ flex: 1, overflow: 'auto', margin: '16px' }}>
            <div
              style={{
                padding: 24,
                minHeight: '100%',
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Outlet />
            </div>
          </Content>
          <ModelSettingsModal
            open={modelModalVisible}
            onClose={() => setModelModalVisible(false)}
          />
          <UserProfileModal open={userModalVisible} onClose={() => setUserModalVisible(false)} />
        </AntdLayout>
      </AntdLayout>
    </AuthGuard>
  );
}
