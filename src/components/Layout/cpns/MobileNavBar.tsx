import { useState } from 'react';
import { Menu, Button, Avatar, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  SettingOutlined,
  WalletOutlined,
  TeamOutlined,
  MenuOutlined,
} from '@ant-design/icons';

import ModelSettingsModal from '@/components/ModelSettingsModal';
import UserProfileModal from '@/components/UserProfileModal';
import ContactModal from '@/components/ContactModal';
import { useUserStore } from '@/stores/useUserStore';
import { topMenuItems, } from '../menuConfig';

import './mobilenav.css';

export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser }: any = useUserStore();
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key.startsWith('/')) {
      navigate(currentUser ? e.key : '/login');
      setDrawerVisible(false);
    }
  };

  const selectedKey = location.pathname.startsWith('/script-management/')
    ? '/script-management'
    : location.pathname;

  const menuItems = currentUser?.role === 'admin' 
    ? [...(topMenuItems || [])]
    : topMenuItems;

  return (
    <>
      <header className="mobilenav-header">
        <div className="mobilenav-logo" onClick={() => navigate('/')}>
          <img src="/image/logo.png" alt="logo" />
          <span>跑跑漫剧</span>
        </div>
        <div className="mobilenav-actions">
          {currentUser ? (
            <Avatar 
              size={32} 
              icon={<UserOutlined />} 
              src={currentUser.avatar} 
              onClick={() => setUserModalVisible(true)}
              style={{ backgroundColor: '#7265e6', cursor: 'pointer' }}
            />
          ) : (
            <Button type="primary" size="small" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }}
          />
        </div>
      </header>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/image/logo.png" alt="logo" style={{ width: 32, height: 32 }} />
            <span>跑跑漫剧</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
        
        {currentUser && (
          <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
            <Button 
              block 
              icon={<TeamOutlined />} 
              onClick={() => {
                setContactModalVisible(true);
                setDrawerVisible(false);
              }}
              style={{ marginBottom: 8 }}
            >
              代理合作
            </Button>
            <Button 
              block 
              icon={<WalletOutlined />} 
              onClick={() => {
                navigate('/recharge');
                setDrawerVisible(false);
              }}
              style={{ marginBottom: 8 }}
            >
              积分充值
            </Button>
            <Button 
              block 
              icon={<SettingOutlined />} 
              onClick={() => {
                setModelModalVisible(true);
                setDrawerVisible(false);
              }}
            >
              模型设置
            </Button>
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>可用积分</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{currentUser.points ?? 0}</div>
            </div>
          </div>
        )}
      </Drawer>

      <ModelSettingsModal open={modelModalVisible} onClose={() => setModelModalVisible(false)} />
      <UserProfileModal open={userModalVisible} onClose={() => setUserModalVisible(false)} />
      <ContactModal open={contactModalVisible} onClose={() => setContactModalVisible(false)} />
    </>
  );
}
