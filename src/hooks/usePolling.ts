import { useRef, useCallback, useEffect, useState } from 'react';

interface UsePollingOptions<T> {
  /** 轮询间隔（毫秒），默认 2000 */
  interval?: number;
  /** 判断是否停止轮询 */
  shouldStop?: (data: T) => boolean;
  /** 轮询成功回调 */
  onSuccess?: (data: T) => void;
  /** 轮询出错回调 */
  onError?: (error: any) => void;
}

/**
 * 通用轮询 Hook
 * @param fetchFn 轮询请求函数
 * @param options 配置项
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions<T> = {}
) {
  const { interval = 2000, shouldStop, onSuccess, onError } = options;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // 用 ref 存储最新的回调，避免 useCallback 依赖变化导致重建
  const fetchFnRef = useRef(fetchFn);
  const optionsRef = useRef({ shouldStop, onSuccess, onError });
  
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);
  
  useEffect(() => {
    optionsRef.current = { shouldStop, onSuccess, onError };
  }, [shouldStop, onSuccess, onError]);

  /** 停止轮询 */
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /** 开始轮询 */
  const start = useCallback(() => {
    // 已经在轮询中，不重复启动
    if (timerRef.current) return;
    setIsPolling(true);

    const poll = async () => {
      try {
        const data = await fetchFnRef.current();
        optionsRef.current.onSuccess?.(data);
        
        if (optionsRef.current.shouldStop?.(data)) {
          stop();
        }
      } catch (error) {
        optionsRef.current.onError?.(error);
      }
    };

    // 立即执行一次
    poll();
    
    // 设置定时器
    timerRef.current = setInterval(poll, interval);
  }, [interval, stop]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { start, stop, isPolling };
}

export default usePolling;
