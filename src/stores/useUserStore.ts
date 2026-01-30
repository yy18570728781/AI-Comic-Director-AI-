import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  // 当前用户
  currentUser: User | null;
  
  // 认证状态
  isAuthenticated: boolean;
  token: string | null;
  
  // 用户列表
  users: User[];
  loading: boolean;
  
  // 操作方法
  setCurrentUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  
  // 登录登出
  login: (user: User, token: string) => void;
  logout: () => void;
  
  // 获取默认用户ID（用于角色保存等操作）
  getDefaultUserId: () => number;
  
  // 清空数据
  clearUsers: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      isAuthenticated: false,
      token: null,
      users: [],
      loading: false,
      
      // 操作方法
      setCurrentUser: (user) => set({ 
        currentUser: user,
        isAuthenticated: !!user 
      }),
      
      setToken: (token) => set({ token }),
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ loading }),
      
      // 登录
      login: (user, token) => set({
        currentUser: user,
        token,
        isAuthenticated: true
      }),
      
      // 登出
      logout: () => {
        // 清除localStorage中的token
        localStorage.removeItem('token');
        set({
          currentUser: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      // 获取默认用户ID
      getDefaultUserId: () => {
        const { currentUser } = get();
        // 如果有当前用户，返回当前用户ID
        if (currentUser) {
          return currentUser.id;
        }
        // 否则返回默认用户ID（1）
        return 1;
      },
      
      // 清空数据
      clearUsers: () => set({
        users: [],
      }),
    }),
    {
      name: 'user-storage',
      // 只持久化必要的数据
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);