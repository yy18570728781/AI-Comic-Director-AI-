import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCachedEmailSuffix, setCachedEmailSuffix } from '@/utils/emailUtils';

interface EmailState {
  // 全局邮箱后缀
  emailSuffix: string;

  // 设置邮箱后缀
  setEmailSuffix: (suffix: string) => void;
}

export const useEmailStore = create<EmailState>()(
  persist(
    (set) => ({
      // 初始状态
      emailSuffix: getCachedEmailSuffix(),

      // 设置邮箱后缀
      setEmailSuffix: (suffix: string) => {
        setCachedEmailSuffix(suffix); // 同时保存到localStorage
        set({ emailSuffix: suffix });
      },
    }),
    {
      name: 'email-store',
      // 只持久化邮箱后缀
      partialize: (state) => ({
        emailSuffix: state.emailSuffix,
      }),
    }
  )
);
