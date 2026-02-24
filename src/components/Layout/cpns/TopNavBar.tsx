import { useState } from 'react';
import { Menu, Button, Space, Avatar, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  SettingOutlined,
  WalletOutlined,
  SwapOutlined,
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import UserProfileModal from '@/components/UserProfileModal';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { topMenuItems } from '../menuConfig';

import './topnav.css';

interface TopNavBarProps {
  showThemeToggle?: boolean;
  showUserActions?: boolean;
}

export default function TopNavBar({ showThemeToggle = false, showUserActions = true }: TopNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { toggleTheme } = useThemeStore();
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key.startsWith('/')) {
      navigate(currentUser ? e.key : '/login');
    }
  };

  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;

  return (
    <>
      <header className="topnav-header">
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
          {showThemeToggle && (
            <Tooltip title="切换主题">
              <button className="topnav-theme-toggle" onClick={toggleTheme}><SwapOutlined /></button>
            </Tooltip>
          )}
          {showUserActions && currentUser ? (
            <>
              <Button className="topnav-recharge-btn" icon={<WalletOutlined />} onClick={() => navigate('/recharge')}>
                积分充值
              </Button>
              <span className="topnav-points">
                可用积分: <strong>{currentUser.points ?? 0}</strong>
              </span>
              <Button type="text" icon={<SettingOutlined />} className="topnav-icon-btn" onClick={() => setModelModalVisible(true)} />
              <div className="topnav-user" onClick={() => setUserModalVisible(true)}>
                <Avatar size={28} icon={<UserOutlined />} src={currentUser.avatar} style={{ backgroundColor: '#7265e6' }} />
                <span className="topnav-username">{currentUser.username || '用户'}</span>
              </div>
            </>
          ) : !currentUser && (
            <Button type="primary" onClick={() => navigate('/login')}>登录 / 注册</Button>
          )}
        </Space>
      </header>

      <ModelSettingsModal open={modelModalVisible} onClose={() => setModelModalVisible(false)} />
      <UserProfileModal open={userModalVisible} onClose={() => setUserModalVisible(false)} />
    </>
  );
}
