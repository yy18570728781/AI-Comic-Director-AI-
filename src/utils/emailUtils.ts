// 常用邮箱后缀
export const EMAIL_SUFFIXES = [
  '@qq.com',
  '@163.com',
  '@126.com',
  '@gmail.com',
  '@sina.com',
  '@sohu.com',
  '@139.com',
  '@189.cn',
  '@yeah.net',
  '@foxmail.com',
  '@hotmail.com',
  '@outlook.com',
  '@aliyun.com',
  '@vip.sina.com',
  '@vip.163.com'
];

// 默认邮箱后缀
export const DEFAULT_EMAIL_SUFFIX = '@qq.com';

// 缓存键名
const EMAIL_SUFFIX_CACHE_KEY = 'preferred_email_suffix';

/**
 * 获取缓存的邮箱后缀
 */
export const getCachedEmailSuffix = (): string => {
  try {
    const cached = localStorage.getItem(EMAIL_SUFFIX_CACHE_KEY);
    return cached && EMAIL_SUFFIXES.includes(cached) ? cached : DEFAULT_EMAIL_SUFFIX;
  } catch (error) {
    console.warn('获取邮箱后缀缓存失败:', error);
    return DEFAULT_EMAIL_SUFFIX;
  }
};

/**
 * 保存邮箱后缀到缓存
 */
export const setCachedEmailSuffix = (suffix: string): void => {
  try {
    if (EMAIL_SUFFIXES.includes(suffix)) {
      localStorage.setItem(EMAIL_SUFFIX_CACHE_KEY, suffix);
    }
  } catch (error) {
    console.warn('保存邮箱后缀缓存失败:', error);
  }
};

/**
 * 解析邮箱地址
 */
export const parseEmail = (email: string): { prefix: string; suffix: string } => {
  if (!email || !email.includes('@')) {
    return { prefix: '', suffix: getCachedEmailSuffix() };
  }
  
  const [prefix, ...suffixParts] = email.split('@');
  const suffix = '@' + suffixParts.join('@');
  
  return {
    prefix: prefix || '',
    suffix: EMAIL_SUFFIXES.includes(suffix) ? suffix : getCachedEmailSuffix()
  };
};

/**
 * 组合邮箱地址
 */
export const combineEmail = (prefix: string, suffix: string): string => {
  return prefix + suffix;
};