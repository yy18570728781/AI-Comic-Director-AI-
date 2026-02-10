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
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import UserProfileModal from '@/components/UserProfileModal';
import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';

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
  {
    key: '/recharge',
    icon: <WalletOutlined />,
    label: '积分充值',
  },
];

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, refreshPoints } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 登录后获取积分
  useEffect(() => {
    if (currentUser?.id) {
      refreshPoints();
    }
  }, [currentUser?.id, refreshPoints]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

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
            <img
              style={{ width: 40 }}
              src="../../../public/image/logo2.png"
              alt=""
            />
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

                {/* 积分显示 - 点击打开用户弹窗 */}
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
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ color: '#666', fontSize: 13 }}>
                      可用积分
                    </span>
                    <span
                      style={{
                        color: '#52c41a',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
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

          {/* 模型设置弹窗 */}
          <ModelSettingsModal
            open={modelModalVisible}
            onClose={() => setModelModalVisible(false)}
          />

          {/* 用户信息弹窗 */}
          <UserProfileModal
            open={userModalVisible}
            onClose={() => setUserModalVisible(false)}
          />
        </AntdLayout>
      </AntdLayout>
    </AuthGuard>
  );
}

export default Layout;
