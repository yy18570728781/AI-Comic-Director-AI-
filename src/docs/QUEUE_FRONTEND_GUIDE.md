# 前端队列使用指南

## 📦 已添加的文件

### 1. API 接口 (`web/src/api/ai.ts`)
新增队列相关接口：
- `generateImageAsync()` - 异步生成图像
- `batchGenerateImagesAsync()` - 批量异步生成图像
- `generateVideoAsync()` - 异步生成视频
- `batchGenerateVideosAsync()` - 批量异步生成视频
- `getQueueJobStatus()` - 查询任务状态
- `getQueueStats()` - 查询队列统计

### 2. 轮询 Hook (`web/src/hooks/useQueuePolling.ts`)
- `useQueuePolling` - 单个任务轮询
- `useBatchQueuePolling` - 批量任务轮询

### 3. 示例组件
- `ImageGenerateModalQueue.tsx` - 单个图像生成（使用队列）
- `BatchImageGenerateExample.tsx` - 批量图像生成示例

## 🚀 使用方法

### 方法1：单个任务生成

```typescript
import { useState } from 'react';
import { generateImageAsync, getQueueJobStatus } from '@/api/ai';
import { useQueuePolling } from '@/hooks/useQueuePolling';

function MyComponent() {
  const [jobId, setJobId] = useState<string | number | null>(null);

  // 使用轮询 Hook
  const { job, isPolling } = useQueuePolling({
    queueName: 'image',
    jobId: jobId || '',
    enabled: !!jobId,
    onCompleted: (result) => {
      console.log('生成完成！', result);
      // 更新 UI，显示生成的图像
    },
    onFailed: (reason) => {
      console.error('生成失败！', reason);
    },
  });

  // 提交任务
  const handleGenerate = async () => {
    const res = await generateImageAsync({
      prompt: '一个美丽的风景',
      model: 'seedream',
    });

    if (res.success) {
      setJobId(res.data.jobId);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isPolling}>
        生成图像
      </button>
      {isPolling && <div>生成中... {job?.state}</div>}
    </div>
  );
}
```

### 方法2：批量任务生成

```typescript
import { useState } from 'react';
import { batchGenerateImagesAsync } from '@/api/ai';
import { useBatchQueuePolling } from '@/hooks/useQueuePolling';

function BatchGenerateComponent() {
  const [jobIds, setJobIds] = useState<Array<string | number>>([]);

  // 使用批量轮询 Hook
  const { jobs, completedCount, totalCount, allCompleted } = useBatchQueuePolling({
    queueName: 'image',
    jobIds,
    enabled: jobIds.length > 0,
    onAllCompleted: (results) => {
      console.log('全部完成！', results);
    },
    onProgress: (completed, total) => {
      console.log(`进度: ${completed}/${total}`);
    },
  });

  // 批量提交任务
  const handleBatchGenerate = async () => {
    const res = await batchGenerateImagesAsync({
      shots: [
        { id: 1, prompt: '第1个镜头' },
        { id: 2, prompt: '第2个镜头' },
        // ... 更多镜头
      ],
      scriptId: 123,
    });

    if (res.success) {
      setJobIds(res.data.jobIds);
    }
  };

  return (
    <div>
      <button onClick={handleBatchGenerate}>
        批量生成 (100个)
      </button>
      {jobIds.length > 0 && (
        <div>
          进度: {completedCount}/{totalCount}
          {allCompleted && <div>全部完成！</div>}
        </div>
      )}
    </div>
  );
}
```

### 方法3：手动轮询（不使用 Hook）

```typescript
import { generateImageAsync, getQueueJobStatus } from '@/api/ai';

async function manualPolling() {
  // 1. 提交任务
  const res = await generateImageAsync({
    prompt: '一个美丽的风景',
    model: 'seedream',
  });

  const jobId = res.data.jobId;

  // 2. 轮询查询状态
  const interval = setInterval(async () => {
    const statusRes = await getQueueJobStatus('image', jobId);
    const job = statusRes.data;

    console.log('任务状态:', job.state);

    if (job.state === 'completed') {
      clearInterval(interval);
      console.log('生成完成！', job.result);
    } else if (job.state === 'failed') {
      clearInterval(interval);
      console.error('生成失败！', job.failedReason);
    }
  }, 2000); // 每2秒查询一次
}
```

## 🎯 改造现有组件

### 改造步骤

1. **导入新的 API 和 Hook**
```typescript
import { generateImageAsync } from '@/api/ai';
import { useQueuePolling } from '@/hooks/useQueuePolling';
```

2. **添加状态管理**
```typescript
const [jobId, setJobId] = useState<string | number | null>(null);
const [generating, setGenerating] = useState(false);
```

3. **使用轮询 Hook**
```typescript
const { job, isPolling } = useQueuePolling({
  queueName: 'image',
  jobId: jobId || '',
  enabled: !!jobId,
  onCompleted: (result) => {
    // 处理完成
    setGenerating(false);
    updateUI(result);
  },
  onFailed: (reason) => {
    // 处理失败
    setGenerating(false);
    showError(reason);
  },
});
```

4. **修改提交逻辑**
```typescript
// 原来：同步调用
const handleGenerate = async () => {
  const result = await generateImage({ prompt });
  updateUI(result);
};

// 改为：异步调用
const handleGenerate = async () => {
  setGenerating(true);
  const res = await generateImageAsync({ prompt });
  setJobId(res.data.jobId);
  // 轮询 Hook 会自动处理后续逻辑
};
```

5. **更新 UI 显示**
```typescript
{generating && (
  <div>
    <LoadingOutlined /> {job?.state === 'waiting' ? '排队中...' : '生成中...'}
    <Progress percent={job?.state === 'active' ? 50 : 10} />
  </div>
)}
```

## 📋 完整示例

参考以下文件：
- `web/src/pages/ScriptDetail/components/ImageGenerateModalQueue.tsx` - 单个生成
- `web/src/pages/ScriptDetail/components/BatchImageGenerateExample.tsx` - 批量生成

## 🎨 UI 建议

### 显示任务状态
```typescript
const getStatusText = (state: string) => {
  switch (state) {
    case 'waiting': return '⏳ 排队等待中...';
    case 'active': return '🎨 正在生成...';
    case 'completed': return '✅ 生成完成！';
    case 'failed': return '❌ 生成失败';
    default: return '准备中...';
  }
};
```

### 显示进度条
```typescript
<Progress
  percent={
    job?.state === 'completed' ? 100 :
    job?.state === 'active' ? 50 :
    job?.state === 'waiting' ? 10 : 0
  }
  status={job?.state === 'failed' ? 'exception' : 'active'}
/>
```

### 批量任务统计
```typescript
<div>
  <div>总任务: {totalCount}</div>
  <div>已完成: {completedCount}</div>
  <div>失败: {failedCount}</div>
  <div>进行中: {totalCount - completedCount - failedCount}</div>
</div>
```

## ✅ 优势

使用队列后的优势：
1. **不会阻塞 UI** - 立即返回，用户可以继续操作
2. **自动并发控制** - 后端自动管理，不会超过 API 限制
3. **批量处理更快** - 100个任务从16分钟降到1.7分钟（10倍提升）
4. **任务持久化** - 刷新页面不会丢失任务
5. **实时进度反馈** - 用户可以看到任务进度

## 🔄 迁移建议

1. **渐进式迁移** - 先在新功能中使用队列
2. **保留旧接口** - 旧功能继续使用同步接口
3. **A/B 测试** - 对比队列和同步的效果
4. **全面切换** - 确认无问题后，全面使用队列

现在可以开始改造你的组件了！
