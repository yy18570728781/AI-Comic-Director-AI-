import { useState } from 'react';
import { Layout as AntdLayout, Menu, theme, Button, Space, Dropdown, Avatar } from 'antd';
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
  LogoutOutlined,
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';
import { logout as logoutApi } from '@/api/auth';

import './index.css';

const { Header, Sider, Content } = AntdLayout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/ai-creation',
    icon: <EditOutlined />,
    label: 'AI创作',
  },
  {
    key: '/script-management',
    icon: <FileTextOutlined />,
    label: '剧本管理',
  },
  {
    key: '/image-to-video',
    icon: <VideoCameraOutlined />,
    label: '图生视频',
  },
  {
    key: '/image-to-image',
    icon: <CameraOutlined />,
    label: '图生图',
  },
  {
    key: '/resource-library',
    icon: <PictureOutlined />,
    label: '资源库',
  },
  {
    key: '/character-library',
    icon: <UserOutlined />,
    label: '角色库',
  },
  {
    key: '/team-space',
    icon: <TeamOutlined />,
    label: '团队空间',
  },
];

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // 即使API调用失败，也要清除本地状态
    } finally {
      logout();
      navigate('/login');
    }
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => {
        // TODO: 跳转到个人信息页面
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 获取当前选中的菜单项
  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;

  return (
    <AuthGuard>
      <AntdLayout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div className="logo">
            <h2>{collapsed ? 'AI' : 'AI漫剧工作台'}</h2>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <AntdLayout
          style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
        >
          <Header
            style={{ padding: 0, background: colorBgContainer, flexShrink: 0 }}
          >
            <div className="header-content">
              <h3>AI漫剧一站式服务工作台</h3>
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setModelModalVisible(true)}
                >
                  模型设置
                </Button>
                
                {/* 用户信息 */}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />} 
                      src={currentUser?.avatar}
                    />
                    <span>{currentUser?.username || currentUser?.email || '用户'}</span>
                  </div>
                </Dropdown>
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

          {/* 模型设置弹窗 */}
          <ModelSettingsModal
            open={modelModalVisible}
            onClose={() => setModelModalVisible(false)}
          />
        </AntdLayout>
      </AntdLayout>
    </AuthGuard>
  );
}

export default Layout;
