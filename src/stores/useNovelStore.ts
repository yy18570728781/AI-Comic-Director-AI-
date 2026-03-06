import { create } from 'zustand';

interface TagSelection {
  [categoryKey: string]: string | string[];
}

interface NovelStoreState {
  tagSelection: TagSelection;
  outlineInput: string;
  wordCount: number;
  generatedContent: string;
  isGenerating: boolean;

  selectTag: (categoryKey: string, tag: string, multiSelect?: boolean) => void;
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
    channel: '男频',
    language: '中文',
    hasCheatCode: '是',
  },
  outlineInput: '',
  wordCount: 2000,
  generatedContent: '',
  isGenerating: false,

  selectTag: (categoryKey, tag, multiSelect = false) =>
    set((state) => {
      const current = state.tagSelection[categoryKey];
      
      if (multiSelect) {
        const currentArray = Array.isArray(current) ? current : current ? [current] : [];
        const newArray = currentArray.includes(tag)
          ? currentArray.filter(t => t !== tag)
          : [...currentArray, tag];
        
        return {
          tagSelection: {
            ...state.tagSelection,
            [categoryKey]: newArray.length > 0 ? newArray : '',
          },
        };
      }
      
      return {
        tagSelection: {
          ...state.tagSelection,
          [categoryKey]: current === tag ? '' : tag,
        },
      };
    }),

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
        channel: '男频',
        language: '中文',
        hasCheatCode: '是',
      },
      outlineInput: '',
      wordCount: 2000,
      generatedContent: '',
      isGenerating: false,
    }),
}));
