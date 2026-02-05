import { useState, useEffect } from 'react';
import { Layout as AntdLayout, Menu, theme, Button, Space, Avatar, Modal, Divider, message } from 'antd';
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
  LockOutlined,
  WalletOutlined,
  FileTextOutlined as RecordOutlined,
  CustomerServiceOutlined,
  RightOutlined,
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

  // 处理登出
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // 即使API调用失败，也要清除本地状态
    } finally {
      logout();
      setUserModalVisible(false);
      navigate('/login');
    }
  };

  // 用户弹窗菜单项
  const userMenuList = [
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => message.info('功能开发中'),
    },
    {
      key: 'recharge',
      icon: <WalletOutlined />,
      label: '点数充值',
      onClick: () => message.info('功能开发中'),
    },
    {
      key: 'records',
      icon: <RecordOutlined />,
      label: '充值记录',
      onClick: () => message.info('功能开发中'),
    },
    {
      key: 'service',
      icon: <CustomerServiceOutlined />,
      label: '联系客服',
      onClick: () => message.info('功能开发中'),
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#666', fontSize: 13 }}>可用积分</span>
                    <span style={{ 
                      color: '#52c41a', 
                      fontSize: 16,
                      fontWeight: 600,
                    }}>
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
          <Modal
            open={userModalVisible}
            onCancel={() => setUserModalVisible(false)}
            footer={null}
            width={360}
            centered
            styles={{
              content: {
                backgroundColor: '#1a1a1a',
                padding: 0,
                borderRadius: 16,
              },
            }}
            closeIcon={<span style={{ color: '#999' }}>×</span>}
          >
            <div style={{ padding: '32px 24px 24px', textAlign: 'center' }}>
              {/* 头像 */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  src={currentUser?.avatar}
                  style={{ backgroundColor: '#7265e6' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 12,
                  height: 12,
                  backgroundColor: '#52c41a',
                  borderRadius: '50%',
                  border: '2px solid #1a1a1a',
                }} />
              </div>
              
              {/* 用户名/手机号 */}
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {currentUser?.phone || currentUser?.username || currentUser?.email || '用户'}
              </div>
              
              {/* 会员标签 */}
              <div style={{
                display: 'inline-block',
                padding: '4px 16px',
                backgroundColor: '#2a2a2a',
                borderRadius: 16,
                color: '#999',
                fontSize: 12,
                marginBottom: 24,
              }}>
                AI 创意工坊会员
              </div>
              
              {/* 积分和到期时间 */}
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginBottom: 24,
              }}>
                <div style={{
                  flex: 1,
                  backgroundColor: '#2a2a2a',
                  borderRadius: 12,
                  padding: '16px 12px',
                  textAlign: 'left',
                }}>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <WalletOutlined /> 剩余点数
                  </div>
                  <div style={{ color: '#fff', fontSize: 28, fontWeight: 600 }}>
                    {currentUser?.points ?? 0}
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  backgroundColor: '#2a2a2a',
                  borderRadius: 12,
                  padding: '16px 12px',
                  textAlign: 'left',
                }}>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    📅 到期时间
                  </div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
                    2099-12-31
                  </div>
                </div>
              </div>
              
              {/* 常用功能 */}
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>常用功能</div>
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {userMenuList.map((item, index) => (
                    <div
                      key={item.key}
                      onClick={item.onClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        borderBottom: index < userMenuList.length - 1 ? '1px solid #333' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
                        <span style={{ color: '#999' }}>{item.icon}</span>
                        {item.label}
                      </div>
                      <RightOutlined style={{ color: '#666', fontSize: 12 }} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 退出按钮 */}
              <Button
                block
                size="large"
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #d4a574',
                  color: '#d4a574',
                  borderRadius: 24,
                  height: 48,
                  fontSize: 15,
                }}
                icon={<LogoutOutlined />}
              >
                退出当前账号
              </Button>
            </div>
          </Modal>
        </AntdLayout>
      </AntdLayout>
    </AuthGuard>
  );
}

export default Layout;
