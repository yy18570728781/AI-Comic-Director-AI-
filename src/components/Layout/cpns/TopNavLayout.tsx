import { useEffect } from 'react';
import { Layout as AntdLayout, theme } from 'antd';
import { Outlet } from 'react-router-dom';

import AuthGuard from '@/components/AuthGuard';
import { useUserStore } from '@/stores/useUserStore';
import TopNavBar from './TopNavBar';

const { Content } = AntdLayout;

export default function TopNavLayout() {
  const { currentUser, refreshPoints } = useUserStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (currentUser?.id) refreshPoints();
  }, [currentUser?.id, refreshPoints]);

  return (
    <AuthGuard>
      <AntdLayout style={{ height: '100vh', background: '#06061a' }}>
        <TopNavBar />
        <Content style={{ flex: 1, overflow: 'auto', padding: '16px 24px', background: '#f5f5f5' }}>
          <div style={{ minHeight: '100%', background: '#f5f5f5' }}>
            <Outlet />
          </div>
        </Content>
      </AntdLayout>
    </AuthGuard>
  );
}
