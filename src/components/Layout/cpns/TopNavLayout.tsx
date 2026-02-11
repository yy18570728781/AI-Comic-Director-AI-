import { useState, useEffect } from 'react';
import { Layout as AntdLayout, Menu, Button, Space, Avatar, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  SettingOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import UserProfileModal from '@/components/UserProfileModal';
import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';
import { topMenuItems } from '../menuConfig';

import './topnav.css';

const { Header, Content } = AntdLayout;

export default function TopNavLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshPoints } = useUserStore();
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    if (currentUser?.id) refreshPoints();
  }, [currentUser?.id, refreshPoints]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key.startsWith('/')) navigate(e.key);
  };

  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;

  return (
    <AuthGuard>
      <AntdLayout style={{ height: '100vh', background: '#06061a' }}>
        <Header className="topnav-header">
          <div className="topnav-left">
            <div className="topnav-logo" onClick={() => navigate('/')}>
              <img src="/image/logo2.png" alt="logo" className="topnav-logo-img" />
              <span className="topnav-logo-text">AI 漫剧工作台</span>
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={topMenuItems}
              onClick={handleMenuClick}
              className="topnav-menu"
            />
          </div>
          <Space className="topnav-right">
            <Button className="topnav-recharge-btn" size="small" icon={<WalletOutlined />} onClick={() => navigate('/recharge')}>
              积分充值
            </Button>
            <span className="topnav-points">
              可用积分: <strong>{currentUser?.points ?? 0}</strong>
            </span>
            <Button type="text" icon={<SettingOutlined />} className="topnav-icon-btn" onClick={() => setModelModalVisible(true)} />
            <div className="topnav-user" onClick={() => setUserModalVisible(true)}>
              <Avatar size={28} icon={<UserOutlined />} src={currentUser?.avatar} style={{ backgroundColor: '#7265e6' }} />
              <span className="topnav-username">{currentUser?.username || '用户'}</span>
            </div>
          </Space>
        </Header>

        <Content style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <div style={{ padding: 24, minHeight: '100%', background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>

        <ModelSettingsModal open={modelModalVisible} onClose={() => setModelModalVisible(false)} />
        <UserProfileModal open={userModalVisible} onClose={() => setUserModalVisible(false)} />
      </AntdLayout>
    </AuthGuard>
  );
}
