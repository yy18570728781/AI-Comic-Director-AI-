import { Button, message, Progress, Card } from 'antd';
import { PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { batchGenerateImagesAsync } from '@/api/ai';
import { useTaskStore } from '@/stores/useTaskStore';
import { onTaskComplete } from '@/components/GlobalTaskPoller';

interface BatchImageGenerateExampleProps {
  shots: any[];
  scriptId: number;
  onSuccess: (results: any[]) => void;
}

/**
 * 批量图像生成示例组件
 *
 * 展示如何使用队列批量生成图像
 */
export default function BatchImageGenerateExample({
  shots,
  scriptId,
  onSuccess,
}: BatchImageGenerateExampleProps) {
  const [generating, setGenerating] = useState(false);
  const [jobIds, setJobIds] = useState<Array<string | number>>([]);
  const [completedJobs, setCompletedJobs] = useState<Map<string | number, any>>(
    new Map(),
  );
  const [failedJobs, setFailedJobs] = useState<Set<string | number>>(new Set());

  // 使用全局任务 store
  const { addTasks } = useTaskStore();

  // 计算统计数据
  const totalCount = jobIds.length;
  const completedCount = completedJobs.size;
  const failedCount = failedJobs.size;
  const allCompleted =
    totalCount > 0 && completedCount + failedCount >= totalCount;

  // 监听任务完成事件
  useEffect(() => {
    if (jobIds.length === 0) return;

    const unsubscribe = onTaskComplete((event) => {
      if (jobIds.includes(event.jobId)) {
        setCompletedJobs((prev) => {
          const newMap = new Map(prev);
          newMap.set(event.jobId, event.result);
          return newMap;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [jobIds]);

  // 检查是否全部完成
  useEffect(() => {
    if (allCompleted && generating) {
      const results = Array.from(completedJobs.values());
      message.success(`批量生成完成！成功 ${results.length} 个`);
      setGenerating(false);
      setJobIds([]);
      setCompletedJobs(new Map());
      setFailedJobs(new Set());
      onSuccess(results);
    }
  }, [allCompleted, generating, completedJobs, onSuccess]);

  // 批量生成图像
  const handleBatchGenerate = async () => {
    try {
      setGenerating(true);

      // 准备批量任务数据
      const shotData = shots.map((shot) => ({
        id: shot.id,
        prompt: shot.imagePrompt || shot.prompt,
        model: 'doubao-seedream-4-0-250828', // 使用4.0版本，支持1024x1024
        params: {
          width: 1024,
          height: 1024,
        },
      }));

      // 调用批量异步接口
      const res = await batchGenerateImagesAsync({
        shots: shotData,
        scriptId,
      });

      if (res.success && res.data?.jobIds) {
        // 获取所有 jobId，添加到全局任务列表
        setJobIds(res.data.jobIds);
        addTasks(
          res.data.jobIds.map((jobId: string | number, index: number) => ({
            jobId,
            type: 'image' as const,
            shotId: shots[index]?.id,
          })),
        );
        message.info(`已提交 ${res.data.count} 个任务到队列`);
      } else {
        throw new Error('提交批量任务失败');
      }
    } catch (error: any) {
      console.error('批量生成失败:', error);
      message.error(error.message || '批量生成失败');
      setGenerating(false);
    }
  };

  // 计算进度百分比
  const progress =
    totalCount > 0
      ? Math.round(((completedCount + failedCount) / totalCount) * 100)
      : 0;

  return (
    <div>
      <Button
        type="primary"
        icon={generating ? <LoadingOutlined /> : <PictureOutlined />}
        onClick={handleBatchGenerate}
        loading={generating}
        disabled={shots.length === 0}
      >
        批量生成图像 ({shots.length}个)
      </Button>

      {/* 显示批量生成进度 */}
      {generating && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <LoadingOutlined style={{ marginRight: 8 }} />
            批量生成进行中...
          </div>

          <Progress
            percent={progress}
            status={
              failedCount > 0
                ? 'exception'
                : allCompleted
                  ? 'success'
                  : 'active'
            }
          />

          <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
            <div>总任务数: {totalCount}</div>
            <div>已完成: {completedCount}</div>
            <div>失败: {failedCount}</div>
            <div>进行中: {totalCount - completedCount - failedCount}</div>
          </div>

          {/* 显示每个任务的状态 */}
          <div style={{ marginTop: 16, maxHeight: 200, overflow: 'auto' }}>
            {jobIds.map((jobId) => {
              const isCompleted = completedJobs.has(jobId);
              const isFailed = failedJobs.has(jobId);
              const state = isCompleted
                ? 'completed'
                : isFailed
                  ? 'failed'
                  : 'active';

              return (
                <div
                  key={String(jobId)}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>任务 #{jobId}</span>
                  <span
                    style={{
                      color:
                        state === 'completed'
                          ? '#52c41a'
                          : state === 'failed'
                            ? '#ff4d4f'
                            : '#1890ff',
                    }}
                  >
                    {state === 'active' && '生成中'}
                    {state === 'completed' && '✓ 完成'}
                    {state === 'failed' && '✗ 失败'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
