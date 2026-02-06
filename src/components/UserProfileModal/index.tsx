import { Modal, Avatar, Button, message } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  WalletOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import { logout as logoutApi } from '@/api/auth';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();

  // 处理登出
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // 即使API调用失败，也要清除本地状态
    } finally {
      logout();
      onClose();
      navigate('/login');
    }
  };

  // 菜单项
  const menuList = [
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => message.info('功能开发中'),
    },
    {
      key: 'recharge',
      icon: <WalletOutlined />,
      label: '积分充值',
      onClick: () => {
        onClose();
        navigate('/recharge');
      },
    },
    {
      key: 'records',
      icon: <FileTextOutlined />,
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
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
            {menuList.map((item, index) => (
              <div
                key={item.key}
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: index < menuList.length - 1 ? '1px solid #333' : 'none',
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
  );
}

export default UserProfileModal;
