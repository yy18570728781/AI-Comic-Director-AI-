/**
 * localStorage 工具函数
 * 提供类型安全的存储和读取功能
 */

export const storage = {
  /**
   * 保存数据到 localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  },

  /**
   * 从 localStorage 读取数据
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to read from localStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  },

  /**
   * 删除 localStorage 中的数据
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
    }
  },

  /**
   * 清空所有 localStorage 数据
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  },

  /**
   * 检查 key 是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },
};

/**
 * 创建带命名空间的 storage
 * 用于避免 key 冲突
 */
export const createNamespacedStorage = (namespace: string) => ({
  set<T>(key: string, value: T): void {
    storage.set(`${namespace}:${key}`, value);
  },

  get<T>(key: string, defaultValue?: T): T | null {
    return storage.get(`${namespace}:${key}`, defaultValue);
  },

  remove(key: string): void {
    storage.remove(`${namespace}:${key}`);
  },

  has(key: string): boolean {
    return storage.has(`${namespace}:${key}`);
  },

  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${namespace}:`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Failed to clear namespace: ${namespace}`, error);
    }
  },
});

/**
 * sessionStorage 工具函数
 */
export const sessionStore = {
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`无法保存到 sessionStorage: ${key}`, error);
    }
  },

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`无法保存到 sessionStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  },

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`无法保存到 sessionStorage: ${key}`, error);
    }
  },

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('无法保存到 sessionStorage', error);
    }
  },

  has(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  },
};

/**
 * 创建带命名空间的 sessionStorage
 */
export const createNamespacedSessionStorage = (namespace: string) => ({
  set<T>(key: string, value: T): void {
    sessionStore.set(`${namespace}:${key}`, value);
  },

  get<T>(key: string, defaultValue?: T): T | null {
    return sessionStore.get(`${namespace}:${key}`, defaultValue);
  },

  remove(key: string): void {
    sessionStore.remove(`${namespace}:${key}`);
  },

  has(key: string): boolean {
    return sessionStore.has(`${namespace}:${key}`);
  },

  clearAll(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${namespace}:`)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Failed to clear namespace: ${namespace}`, error);
    }
  },
});
