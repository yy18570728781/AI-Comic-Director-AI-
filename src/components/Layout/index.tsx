import { useState } from 'react';
import { Layout as AntdLayout, Menu, theme, Button, Space } from 'antd';
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
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';

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
  const [collapsed, setCollapsed] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  // 获取当前选中的菜单项
  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;

  return (
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
  );
}

export default Layout;
