import { useEffect } from 'react';
import { Layout as AntdLayout, theme } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';
import TopNavBar from './TopNavBar';

const { Content } = AntdLayout;

export default function TopNavLayout() {
  const { currentUser, refreshPoints } = useUserStore();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const isEcommerceZonePage = location.pathname === '/ecommerce-zone';

  useEffect(() => {
    if (currentUser?.id) refreshPoints();
  }, [currentUser?.id, refreshPoints]);

  return (
    <AuthGuard>
      <AntdLayout style={{ height: '100vh', background: '#06061a' }}>
        <TopNavBar />
        <Content
          style={{
            flex: 1,
            overflow: isEcommerceZonePage ? 'hidden' : 'auto',
            padding: isEcommerceZonePage ? '0' : '16px 24px',
            background: isEcommerceZonePage ? '#1a1520' : '#f5f5f5',
          }}
        >
          <div
            style={{
              height: '100%',
              minHeight: 0,
              background: isEcommerceZonePage ? '#1a1520' : '#f5f5f5',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntdLayout>
    </AuthGuard>
  );
}
