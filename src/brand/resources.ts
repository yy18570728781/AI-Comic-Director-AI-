export const brandCodes = ['ss', 'pp'] as const;

export type BrandCode = typeof brandCodes[number];

export interface BrandMessages {
  browserTitle: string;
  appName: string;
  appFullName: string;
  appShortName: string;
  loginTitle: string;
  loginSubtitle: string;
  loginButton: string;
  topNavLogin: string;
  pointsLabel: string;
  rechargeLabel: string;
  modelSettingsLabel: string;
}

/**
 * 品牌文案资源。
 * 这里借助 i18n 库管理“品牌维度”的文案切换，而不是做多语言翻译。
 * 当前先约定两个品牌代号：ss / pp，后续新增品牌时继续按这个结构扩展即可。
 */
export const brandResources: Record<BrandCode, { translation: BrandMessages }> = {
  ss: {
    translation: {
      browserTitle: '蓝星漫剧工作台',
      appName: '蓝星漫剧',
      appFullName: '蓝星漫剧工作台',
      appShortName: '蓝星',
      loginTitle: '蓝星漫剧工作台',
      loginSubtitle: 'AI 驱动的漫剧创作平台',
      loginButton: '登录 / 注册',
      topNavLogin: '登录 / 注册',
      pointsLabel: '可用积分',
      rechargeLabel: '积分充值',
      modelSettingsLabel: '模型设置',
    },
  },
  pp: {
    translation: {
      browserTitle: 'PP 漫剧工作台',
      appName: 'PP 漫剧',
      appFullName: 'PP 漫剧工作台',
      appShortName: 'PP',
      loginTitle: 'PP 漫剧工作台',
      loginSubtitle: 'AI 驱动的漫剧创作平台',
      loginButton: '登录 / 注册',
      topNavLogin: '登录 / 注册',
      pointsLabel: '可用积分',
      rechargeLabel: '积分充值',
      modelSettingsLabel: '模型设置',
    },
  },
};
