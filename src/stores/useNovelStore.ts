import { create } from 'zustand';

interface TagSelection {
  [categoryKey: string]: string; // 改为单选，存储单个值
}

interface NovelStoreState {
  tagSelection: TagSelection;
  outlineInput: string;
  wordCount: number;
  generatedContent: string;
  isGenerating: boolean;

  selectTag: (categoryKey: string, tag: string) => void;
  clearCategory: (categoryKey: string) => void;
  clearAll: () => void;
  setOutlineInput: (outline: string) => void;
  setWordCount: (count: number) => void;
  setGeneratedContent: (content: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

export const useNovelStore = create<NovelStoreState>((set) => ({
  tagSelection: {
    channel: '男频', // 默认选中男频
  },
  outlineInput: '',
  wordCount: 2000,
  generatedContent: '',
  isGenerating: false,

  selectTag: (categoryKey, tag) =>
    set((state) => ({
      tagSelection: {
        ...state.tagSelection,
        [categoryKey]: state.tagSelection[categoryKey] === tag ? '' : tag, // 点击已选中的标签则取消选择
      },
    })),

  clearCategory: (categoryKey) =>
    set((state) => ({
      tagSelection: {
        ...state.tagSelection,
        [categoryKey]: '',
      },
    })),

  clearAll: () => set({ tagSelection: {} }),

  setOutlineInput: (outline) => set({ outlineInput: outline }),

  setWordCount: (count) => set({ wordCount: count }),

  setGeneratedContent: (content) => set({ generatedContent: content }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  reset: () =>
    set({
      tagSelection: {
        channel: '男频', // 重置时也默认选中男频
      },
      outlineInput: '',
      wordCount: 2000,
      generatedContent: '',
      isGenerating: false,
    }),
}));
