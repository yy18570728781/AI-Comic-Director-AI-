import { getCharacterList } from '@/api/script';

/**
 * 角色变体类型定义
 */
export interface CharacterVariant {
  variant: string;
  tags: string[];
}

/**
 * AI使用的角色格式
 */
export interface AICharacter {
  name: string;
  variants: CharacterVariant[];
}

/**
 * 获取角色信息并转换为AI理解的格式
 * @param scriptId 剧本ID
 * @returns AI格式的角色数组
 */
export const getCharactersForAI = async (scriptId: number): Promise<AICharacter[] | undefined> => {
  try {
    const { success, data } = await getCharacterList({
      scriptId,
      page: 1,
      pageSize: 1000,
    });

    if (!success || !data.list?.length) return undefined;

    // 按角色名分组，收集每个角色的所有服装变体
    const characterMap = new Map<string, CharacterVariant[]>();

    data.list.forEach((char: any) => {
      const { name, variant = '默认', tags = [] } = char;

      if (!characterMap.has(name)) {
        characterMap.set(name, []);
      }

      characterMap.get(name)!.push({ variant, tags });
    });

    const characters = Array.from(characterMap.entries()).map(([name, variants]) => ({
      name,
      variants,
    }));

    console.log(`📚 [角色工具] 找到${characters.length}个角色参考:`, characters);
    return characters;
  } catch (error) {
    console.log('⚠️ [角色工具] 获取角色库失败:', error);
    return undefined;
  }
};
