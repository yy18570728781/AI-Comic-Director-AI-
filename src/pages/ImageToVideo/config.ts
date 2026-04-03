/**
 * 视频生成模式配置。
 * 这里故意把模式文案、模式校验、推荐逻辑都集中在一个文件里，
 * 这样后面如果后端模式枚举或前端展示文案有调整，只需要改这里一处。
 */

/**
 * 模式标签映射。
 * 用于下拉框、标签等需要短文案的场景。
 */
export const modeLabels: Record<string, string> = {
  t2v: '文生视频',
  i2v: '首帧模式',
  flf2v: '首尾帧模式',
  ref2v: '参考图模式',
};

/**
 * 模式说明映射。
 * 用于需要更长提示语的场景，帮助用户理解每种模式对图片数量的要求。
 */
export const modeDescriptions: Record<string, string> = {
  i2v: '首帧：单张图片作为视频首帧',
  flf2v: '首尾帧：第 1 张为首帧，第 2 张为尾帧',
  ref2v: '参考图：AI 参考所有图片的风格与主体生成',
  t2v: '文生视频：仅根据文字描述生成',
};

/**
 * 判断当前模式是否可用。
 *
 * 为什么这里不仅判断图片数量，还要判断 supportedModes：
 * 因为不同模型支持的模式并不一致，不能只看前端当前选了几张图。
 */
export function isModeAvailable(
  mode: string,
  imageCount: number,
  supportedModes: string[]
): boolean {
  if (!supportedModes.includes(mode)) return false;

  switch (mode) {
    case 'i2v':
      return imageCount === 1;
    case 'flf2v':
      return imageCount === 2;
    case 'ref2v':
      return imageCount >= 1 && imageCount <= 4;
    case 't2v':
      return imageCount === 0;
    default:
      return false;
  }
}

/**
 * 根据图片数量和模型支持情况，推导一个推荐模式。
 *
 * 这里优先“尽量保留用户当前选择”，只有当前模式已经不合法时才自动切换，
 * 避免用户在改图数量时，界面频繁跳模式造成困惑。
 */
export function getRecommendedMode(
  imageCount: number,
  supportedModes: string[],
  currentMode?: string
): string {
  if (currentMode && isModeAvailable(currentMode, imageCount, supportedModes)) {
    return currentMode;
  }

  if (imageCount === 0 && supportedModes.includes('t2v')) {
    return 't2v';
  }

  if (imageCount === 1 && supportedModes.includes('i2v')) {
    return 'i2v';
  }

  if (imageCount === 2) {
    // 两张图时优先参考图模式，因为它通常比首尾帧模式更宽松。
    if (supportedModes.includes('ref2v')) return 'ref2v';
    if (supportedModes.includes('flf2v')) return 'flf2v';
  }

  if (imageCount >= 1 && supportedModes.includes('ref2v')) {
    return 'ref2v';
  }

  // 最后兜底返回模型支持的第一个模式，避免页面出现空值。
  return supportedModes[0] || 'i2v';
}

/**
 * 根据模型支持的模式，计算允许上传的最大图片数。
 *
 * 这里先按模式能力做兜底，再兼容后端显式返回的 maxImages。
 */
export function getMaxImageCount(supportedModes: string[], maxImages?: number): number {
  if (supportedModes.includes('ref2v')) return maxImages || 4;
  if (supportedModes.includes('flf2v')) return 2;
  return 1;
}
