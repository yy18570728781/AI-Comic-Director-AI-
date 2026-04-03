import { create } from 'zustand';

interface AICreationState {
  // 小说生成相关
  novelTheme: string;
  novelOutline: string;
  novelLength: number;
  novelResult: string;

  // 剧本生成相关
  scriptNovel: string;
  scriptStyle: string;
  scriptResult: string;

  // 当前激活的 tab
  activeTab: string;

  // 更新方法
  setNovelTheme: (theme: string) => void;
  setNovelOutline: (outline: string) => void;
  setNovelLength: (length: number) => void;
  setNovelResult: (result: string) => void;

  setScriptNovel: (novel: string) => void;
  setScriptStyle: (style: string) => void;
  setScriptResult: (result: string) => void;

  setActiveTab: (tab: string) => void;

  // 清空方法
  clearNovel: () => void;
  clearScript: () => void;
}

export const useAICreationStore = create<AICreationState>((set) => ({
  // 初始状态
  novelTheme: '',
  novelOutline: '',
  novelLength: 2000,
  novelResult: '',

  scriptNovel: '',
  scriptStyle: '奇幻',
  scriptResult: '',

  activeTab: 'novel',

  // 更新方法
  setNovelTheme: (theme) => set({ novelTheme: theme }),
  setNovelOutline: (outline) => set({ novelOutline: outline }),
  setNovelLength: (length) => set({ novelLength: length }),
  setNovelResult: (result) => set({ novelResult: result }),

  setScriptNovel: (novel) => set({ scriptNovel: novel }),
  setScriptStyle: (style) => set({ scriptStyle: style }),
  setScriptResult: (result) => set({ scriptResult: result }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  // 清空方法
  clearNovel: () =>
    set({
      novelTheme: '',
      novelOutline: '',
      novelLength: 2000,
      novelResult: '',
    }),

  clearScript: () =>
    set({
      scriptNovel: '',
      scriptStyle: '奇幻',
      scriptResult: '',
    }),
}));
