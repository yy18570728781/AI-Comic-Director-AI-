import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
    token: string
    user: any
    userInfo: any
    setToken: (token: string) => void
    setUserInfo: (userInfo: any) => void
    logout: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            token: '',
            user: null,
            userInfo: null,
            setToken: (token) => set({ token }),
            setUserInfo: (userInfo) => set({ userInfo, user: userInfo }),
            logout: () => set({ token: '', userInfo: null, user: null }),
        }),
        {
            name: 'user-storage',
        }
    )
)
