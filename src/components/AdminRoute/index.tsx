import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useUserStore } from '@/stores/useUserStore';
import { UserRoleEnum } from '@/api/user';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // admin 和 super_admin 都允许进入后台页面。
  // 更高阶的提权动作，再在具体页面或接口里继续细分。
  if (![UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN].includes((currentUser?.role as UserRoleEnum) || UserRoleEnum.USER)) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="当前账号不是管理员，无法进入管理后台。"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
