import { Button, message, Progress, Card } from 'antd';
import { PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { batchGenerateImagesAsync } from '@/api/ai';
import { useBatchQueuePolling } from '@/hooks/useQueuePolling';

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

  // 使用批量轮询 Hook
  const {
    jobs,
    isPolling,
    completedCount,
    failedCount,
    allCompleted,
    totalCount,
  } = useBatchQueuePolling({
    queueName: 'image',
    jobIds,
    enabled: jobIds.length > 0,
    onAllCompleted: (results) => {
      message.success(`批量生成完成！成功 ${results.length} 个`);
      setGenerating(false);
      setJobIds([]);
      onSuccess(results);
    },
    onProgress: (completed, total) => {
      console.log(`进度: ${completed}/${total}`);
    },
  });

  // 批量生成图像
  const handleBatchGenerate = async () => {
    try {
      setGenerating(true);

      // 准备批量任务数据
      const shotData = shots.map((shot) => ({
        id: shot.id,
        prompt: shot.imagePrompt || shot.prompt,
        model: 'seedream',
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
        // 获取所有 jobId，开始轮询
        setJobIds(res.data.jobIds);
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
            {Array.from(jobs.entries()).map(([jobId, job]) => (
              <div
                key={jobId}
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
                      job.state === 'completed'
                        ? '#52c41a'
                        : job.state === 'failed'
                          ? '#ff4d4f'
                          : job.state === 'active'
                            ? '#1890ff'
                            : '#999',
                  }}
                >
                  {job.state === 'waiting' && '等待中'}
                  {job.state === 'active' && '生成中'}
                  {job.state === 'completed' && '✓ 完成'}
                  {job.state === 'failed' && '✗ 失败'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
