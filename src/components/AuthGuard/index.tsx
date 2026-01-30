import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useUserStore } from '../../stores/useUserStore';
import { getCurrentUser } from '../../api/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const { currentUser, isAuthenticated, setCurrentUser, logout } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 验证token有效性
        const response = await getCurrentUser();
        if (response.success) {
          setCurrentUser(response.data);
        } else {
          // token无效，清除登录状态
          logout();
        }
      } catch (error) {
        // 请求失败，清除登录状态
        logout();
      } finally {
        setLoading(false);
      }
    };

    // 如果已经有用户信息，直接完成加载
    if (currentUser && isAuthenticated) {
      setLoading(false);
    } else {
      checkAuth();
    }
  }, [currentUser, isAuthenticated, setCurrentUser, logout]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录后跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default AuthGuard;