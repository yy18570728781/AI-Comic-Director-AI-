import { useRef, useState } from 'react';

/**
 * 通用异步动作防重 Hook。
 * 适合提交、保存、删除、充值这类按钮：执行中直接忽略重复点击，并暴露 loading 给按钮使用。
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const runningRef = useRef(false);

  const execute = async (...args: TArgs): Promise<TResult | undefined> => {
    if (runningRef.current) {
      return undefined;
    }

    runningRef.current = true;
    setLoading(true);

    try {
      return await action(...args);
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  };

  return {
    loading,
    execute,
  };
}
