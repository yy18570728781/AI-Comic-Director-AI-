import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Script {
  id: number;
  title: string;
  content: string;
  style?: string;
  description?: string;
  shotCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  teamId?: number;
}

interface ScriptState {
  // 剧本列表
  scripts: Script[];
  loading: boolean;

  // 当前选中的剧本
  currentScript: Script | null;

  // 搜索和筛选
  searchKeyword: string;
  statusFilter: string;

  // 操作方法
  setScripts: (scripts: Script[]) => void;
  addScript: (script: Script) => void;
  updateScript: (id: number, updates: Partial<Script>) => void;
  deleteScript: (id: number) => void;
  setCurrentScript: (script: Script | null) => void;

  // 搜索和筛选
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;

  // 加载状态
  setLoading: (loading: boolean) => void;

  // 清空数据
  clearScripts: () => void;

  // 获取筛选后的剧本列表
  getFilteredScripts: () => Script[];
}

export const useScriptStore = create<ScriptState>()(
  persist(
    (set, get) => ({
      // 初始状态
      scripts: [],
      loading: false,
      currentScript: null,
      searchKeyword: '',
      statusFilter: 'all',

      // 操作方法
      setScripts: (scripts) => set({ scripts }),

      addScript: (script) =>
        set((state) => ({
          scripts: [script, ...state.scripts],
        })),

      updateScript: (id, updates) =>
        set((state) => ({
          scripts: state.scripts.map((script) =>
            script.id === id ? { ...script, ...updates } : script
          ),
          currentScript:
            state.currentScript?.id === id
              ? { ...state.currentScript, ...updates }
              : state.currentScript,
        })),

      deleteScript: (id) =>
        set((state) => ({
          scripts: state.scripts.filter((script) => script.id !== id),
          currentScript: state.currentScript?.id === id ? null : state.currentScript,
        })),

      setCurrentScript: (script) => set({ currentScript: script }),

      // 搜索和筛选
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      // 加载状态
      setLoading: (loading) => set({ loading }),

      // 清空数据
      clearScripts: () =>
        set({
          scripts: [],
          currentScript: null,
          searchKeyword: '',
          statusFilter: 'all',
        }),

      // 获取筛选后的剧本列表
      getFilteredScripts: () => {
        const { scripts, searchKeyword, statusFilter } = get();

        return scripts.filter((script) => {
          // 状态筛选
          if (statusFilter !== 'all' && script.status !== statusFilter) {
            return false;
          }

          // 关键词搜索
          if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            return (
              script.title.toLowerCase().includes(keyword) ||
              (script.description && script.description.toLowerCase().includes(keyword))
            );
          }

          return true;
        });
      },
    }),
    {
      name: 'script-storage',
      // 只持久化必要的数据，不持久化loading状态
      partialize: (state) => ({
        scripts: state.scripts,
        currentScript: state.currentScript,
        searchKeyword: state.searchKeyword,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
