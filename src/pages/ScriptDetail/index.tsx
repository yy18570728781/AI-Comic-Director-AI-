import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Space,
  Modal,
  Tag,
  Empty,
  Popconfirm,
  Image,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  getScriptDetail,
  generateStoryboard,
  updateShot,
  deleteShot,
} from '@/api/script';
import { generateImage, batchGetImageStatus } from '@/api/image';
import { generateVideo, batchGetVideoStatus } from '@/api/video';

const { TextArea } = Input;

// 任务状态类型
interface ImageTask {
  taskId: string;
  shotId: number;
}

interface VideoTask {
  taskId: string;
  shotId: number;
  model: string;
}

function ScriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('script');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [editingShotId, setEditingShotId] = useState<number | null>(null);
  const [editForm] = Form.useForm();
  const [generatingImages, setGeneratingImages] = useState<Set<number>>(
    new Set(),
  ); // 正在生成图片的镜头ID
  const [generatingVideos, setGeneratingVideos] = useState<Set<number>>(
    new Set(),
  ); // 正在生成视频的镜头ID
  const [imageTasks, setImageTasks] = useState<ImageTask[]>([]); // 图片生成任务列表
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]); // 视频生成任务列表
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载剧本详情
  const loadScript = async () => {
    setLoading(true);
    try {
      const res = await getScriptDetail(parseInt(id!));
      setScript(res.data);
    } catch (error) {
      console.error(error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScript();
  }, [id]);

  // 统一轮询器：批量查询所有任务状态
  useEffect(() => {
    if (imageTasks.length === 0) {
      // 没有任务时清除定时器
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    const pollTasks = async () => {
      try {
        console.log(`🔄 批量查询 ${imageTasks.length} 个任务状态`);
        const res = await batchGetImageStatus(imageTasks);

        if (res.success && res.data) {
          const completedTasks: number[] = [];
          const failedTasks: number[] = [];

          // 处理每个任务的结果
          res.data.forEach((result: any) => {
            if (result.status === 'completed') {
              completedTasks.push(result.shotId);

              // 直接更新 script 状态中的对应镜头
              setScript((prevScript: any) => {
                if (!prevScript) return prevScript;

                const updatedShots = prevScript.shots.map((shot: any) => {
                  if (shot.id === result.shotId) {
                    return {
                      ...shot,
                      images: shot.images
                        ? [...shot.images, result.image]
                        : [result.image],
                    };
                  }
                  return shot;
                });

                return {
                  ...prevScript,
                  shots: updatedShots,
                };
              });

              message.success(`镜头 #${result.shotId} 图像生成成功！`);
            } else if (
              result.status === 'failed' ||
              result.status === 'error'
            ) {
              failedTasks.push(result.shotId);
              message.error(
                `镜头 #${result.shotId} 图像生成失败: ${result.error || '未知错误'}`,
              );
            }
          });

          // 移除已完成或失败的任务
          if (completedTasks.length > 0 || failedTasks.length > 0) {
            const finishedShotIds = [...completedTasks, ...failedTasks];

            setImageTasks((prev) =>
              prev.filter((task) => !finishedShotIds.includes(task.shotId)),
            );

            setGeneratingImages((prev) => {
              const newSet = new Set(prev);
              finishedShotIds.forEach((shotId) => newSet.delete(shotId));
              return newSet;
            });
          }
        }
      } catch (error: any) {
        console.error('批量查询任务失败:', error);
      }

      // 继续轮询（如果还有任务）
      if (imageTasks.length > 0) {
        pollingTimerRef.current = setTimeout(pollTasks, 3500);
      }
    };

    // 启动轮询
    pollingTimerRef.current = setTimeout(pollTasks, 3500);

    // 清理函数
    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [imageTasks]);

  // 视频任务轮询器
  useEffect(() => {
    if (videoTasks.length === 0) {
      if (videoPollingTimerRef.current) {
        clearTimeout(videoPollingTimerRef.current);
        videoPollingTimerRef.current = null;
      }
      return;
    }

    const pollVideoTasks = async () => {
      try {
        console.log(`🔄 批量查询 ${videoTasks.length} 个视频任务状态`);
        const res = await batchGetVideoStatus(videoTasks);

        if (res.success && res.data) {
          const completedTasks: number[] = [];
          const failedTasks: number[] = [];

          res.data.forEach((result: any) => {
            if (result.status === 'completed') {
              completedTasks.push(result.shotId);

              // 直接更新 script 状态中的对应镜头
              setScript((prevScript: any) => {
                if (!prevScript) return prevScript;

                const updatedShots = prevScript.shots.map((shot: any) => {
                  if (shot.id === result.shotId) {
                    return {
                      ...shot,
                      videos: shot.videos
                        ? [...shot.videos, result.video]
                        : [result.video],
                    };
                  }
                  return shot;
                });

                return {
                  ...prevScript,
                  shots: updatedShots,
                };
              });

              message.success(`镜头 #${result.shotId} 视频生成成功！`);
            } else if (
              result.status === 'failed' ||
              result.status === 'error'
            ) {
              failedTasks.push(result.shotId);
              message.error(
                `镜头 #${result.shotId} 视频生成失败: ${result.error || '未知错误'}`,
              );
            }
          });

          // 移除已完成或失败的任务
          if (completedTasks.length > 0 || failedTasks.length > 0) {
            const finishedShotIds = [...completedTasks, ...failedTasks];

            setVideoTasks((prev) =>
              prev.filter((task) => !finishedShotIds.includes(task.shotId)),
            );

            setGeneratingVideos((prev) => {
              const newSet = new Set(prev);
              finishedShotIds.forEach((shotId) => newSet.delete(shotId));
              return newSet;
            });
          }
        }
      } catch (error: any) {
        console.error('批量查询视频任务失败:', error);
      }

      // 继续轮询（视频生成较慢，5秒轮询一次）
      if (videoTasks.length > 0) {
        videoPollingTimerRef.current = setTimeout(pollVideoTasks, 5000);
      }
    };

    // 启动轮询
    videoPollingTimerRef.current = setTimeout(pollVideoTasks, 5000);

    // 清理函数
    return () => {
      if (videoPollingTimerRef.current) {
        clearTimeout(videoPollingTimerRef.current);
      }
    };
  }, [videoTasks]);

  // 生成分镜脚本
  const handleGenerateStoryboard = async () => {
    setGenerateLoading(true);
    try {
      await generateStoryboard(parseInt(id!), {
        shotCount: 30,
      });
      message.success('分镜脚本生成成功');
      loadScript();
      setActiveTab('shots');
    } catch (error) {
      console.error(error);
    } finally {
      setGenerateLoading(false);
    }
  };

  // 编辑分镜
  const handleEditShot = (shot: any) => {
    setEditingShotId(shot.id);
    editForm.setFieldsValue({
      scene: shot.scene,
      characters: shot.characters?.join(', '),
      dialogue: shot.dialogue,
      visualDescription: shot.visualDescription,
      imagePrompt: shot.imagePrompt,
      videoPrompt: shot.videoPrompt,
      shotType: shot.shotType,
      duration: shot.duration,
    });
  };

  // 保存分镜编辑
  const handleSaveShot = async (values: any) => {
    try {
      await updateShot(editingShotId!, {
        ...values,
        characters: values.characters
          ?.split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      });
      message.success('保存成功');
      setEditingShotId(null);
      editForm.resetFields();
      loadScript();
    } catch (error) {
      console.error(error);
    }
  };

  // 删除分镜
  const handleDeleteShot = async (shotId: number) => {
    try {
      await deleteShot(shotId);
      message.success('删除成功');
      loadScript();
    } catch (error) {
      console.error(error);
    }
  };

  // 生成图像（优化版）
  const handleGenerateImage = async (shot: any) => {
    const shotId = shot.id;

    console.log('🎨 前端：准备生成图片');
    console.log('📋 shot 对象:', shot);
    console.log('🆔 shotId:', shotId);

    // 防止重复生成
    if (generatingImages.has(shotId)) {
      message.warning('该镜头正在生成图像，请稍候');
      return;
    }

    setGeneratingImages((prev) => new Set(prev).add(shotId));

    try {
      message.loading({
        content: '正在生成图像...',
        key: `gen-${shotId}`,
        duration: 2,
      });

      // 调用生成图像 API
      const res = await generateImage({
        prompt: shot.imagePrompt || shot.visualDescription,
        model: 'wanx',
        width: 1024,
        height: 1024,
      });

      if (res.success && res.data.taskId) {
        // 添加到任务列表
        console.log('✅ 前端：添加图片任务到列表', {
          taskId: res.data.taskId,
          shotId,
        });
        setImageTasks((prev) => [...prev, { taskId: res.data.taskId, shotId }]);

        message.info({
          content: '图像生成任务已提交，正在处理中...',
          key: `gen-${shotId}`,
        });
      } else {
        throw new Error('任务创建失败');
      }
    } catch (error: any) {
      message.error({
        content: error.message || '生成失败',
        key: `gen-${shotId}`,
      });
      setGeneratingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shotId);
        return newSet;
      });
    }
  };

  // 生成视频（优化版）
  const handleGenerateVideo = async (shot: any) => {
    const shotId = shot.id;

    console.log('🎬 前端：准备生成视频');
    console.log('📋 shot 对象:', shot);
    console.log('🆔 shotId:', shotId);

    // 防止重复生成
    if (generatingVideos.has(shotId)) {
      message.warning('该镜头正在生成视频，请稍候');
      return;
    }

    // 检查是否有图片
    if (!shot.images || shot.images.length === 0) {
      message.warning('请先生成图像，再生成视频');
      return;
    }

    setGeneratingVideos((prev) => new Set(prev).add(shotId));

    try {
      message.loading({
        content: '正在生成视频...',
        key: `gen-video-${shotId}`,
        duration: 2,
      });

      // 使用最后一张图片作为参考图
      const referenceImage = shot.images[shot.images.length - 1].url;

      // 调用生成视频 API
      const res = await generateVideo({
        prompt: shot.videoPrompt || shot.visualDescription || '',
        model: 'wan2.6-i2v-flash', // 使用快速模式
        referenceImage,
      });

      if (res.success && res.data.taskId) {
        // 添加到任务列表
        console.log('✅ 前端：添加视频任务到列表', {
          taskId: res.data.taskId,
          shotId,
          model: 'wan2.6-i2v-flash',
        });
        setVideoTasks((prev) => [
          ...prev,
          { taskId: res.data.taskId, shotId, model: 'wan2.6-i2v-flash' },
        ]);

        message.info({
          content: '视频生成任务已提交，正在处理中（预计1-2分钟）...',
          key: `gen-video-${shotId}`,
        });
      } else {
        throw new Error('任务创建失败');
      }
    } catch (error: any) {
      message.error({
        content: error.message || '生成失败',
        key: `gen-video-${shotId}`,
      });
      setGeneratingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shotId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <Spin spinning style={{ marginTop: 100 }} />;
  }

  if (!script) {
    return <Empty description="剧本不存在" />;
  }

  const tabItems = [
    {
      key: 'script',
      label: '剧本',
      children: (
        <Card>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {script.content}
          </div>
        </Card>
      ),
    },
    {
      key: 'shots',
      label: (
        <span>
          分镜{' '}
          {script.shots?.length > 0 && (
            <Tag color="blue">{script.shots.length}</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {!script.shots || script.shots.length === 0 ? (
            <Card>
              <Empty
                description="还没有生成分镜脚本"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerateStoryboard}
                  loading={generateLoading}
                >
                  生成分镜脚本
                </Button>
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {script.shots.map((shot: any) => (
                <Card
                  key={shot.id}
                  title={
                    <Space>
                      <Tag color="green">镜头 #{shot.shotNumber}</Tag>
                      {shot.scene && <span>{shot.scene}</span>}
                      {shot.shotType && <Tag>{shot.shotType}</Tag>}
                      {shot.duration && (
                        <Tag color="blue">{shot.duration}秒</Tag>
                      )}
                    </Space>
                  }
                >
                  {shot.characters && shot.characters.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>角色：</strong>
                      {shot.characters.map((char: string, idx: number) => (
                        <Tag key={idx} color="purple">
                          {char}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {shot.dialogue && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>对白：</strong>
                      <div style={{ marginTop: 4, color: '#666' }}>
                        {shot.dialogue}
                      </div>
                    </div>
                  )}
                  {shot.visualDescription && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>画面描述：</strong>
                      <div style={{ marginTop: 4, color: '#666' }}>
                        {shot.visualDescription}
                      </div>
                    </div>
                  )}
                  {shot.images && shot.images.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>生成的图像：</strong>
                      <div style={{ marginTop: 8 }}>
                        <Image.PreviewGroup>
                          {shot.images.map((img: any, idx: number) => (
                            <Image
                              key={idx}
                              width={200}
                              src={img.url}
                              style={{ marginRight: 8, marginBottom: 8 }}
                            />
                          ))}
                        </Image.PreviewGroup>
                      </div>
                    </div>
                  )}
                  {shot.videos && shot.videos.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>生成的视频：</strong>
                      <div style={{ marginTop: 8 }}>
                        {shot.videos.map((video: any, idx: number) => (
                          <video
                            key={idx}
                            width={300}
                            controls
                            style={{ marginRight: 8, marginBottom: 8 }}
                          >
                            <source src={video.url} type="video/mp4" />
                            您的浏览器不支持视频播放
                          </video>
                        ))}
                      </div>
                    </div>
                  )}
                  {shot.imagePrompt && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>图像提示词：</strong>
                      <div
                        style={{ marginTop: 4, color: '#1890ff', fontSize: 12 }}
                      >
                        {shot.imagePrompt}
                      </div>
                    </div>
                  )}
                  {shot.videoPrompt && (
                    <div style={{ marginBottom: 16 }}>
                      <strong>视频提示词：</strong>
                      <div
                        style={{
                          marginTop: 4,
                          color: '#52c41a',
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {shot.videoPrompt}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮区域 - 添加背景色区分 */}
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa',
                      padding: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Space wrap>
                      <Button
                        icon={<PictureOutlined />}
                        onClick={() => handleGenerateImage(shot)}
                        loading={generatingImages.has(shot.id)}
                        disabled={!shot.imagePrompt && !shot.visualDescription}
                      >
                        生成图像
                      </Button>
                      <Button
                        icon={<VideoCameraOutlined />}
                        onClick={() => handleGenerateVideo(shot)}
                        loading={generatingVideos.has(shot.id)}
                        disabled={!shot.images || shot.images.length === 0}
                      >
                        生成视频
                      </Button>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEditShot(shot)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定删除这个分镜吗？"
                        onConfirm={() => handleDeleteShot(shot.id)}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </div>
      ),
    },
    {
      key: 'images',
      label: '图像',
      children: (
        <Card>
          <Empty description="图像功能开发中" />
        </Card>
      ),
    },
    {
      key: 'videos',
      label: '视频',
      children: (
        <Card>
          <Empty description="视频功能开发中" />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/script-management')}
          >
            返回
          </Button>
          <h2 style={{ margin: 0 }}>{script.title}</h2>
          {script.style && <Tag color="blue">{script.style}</Tag>}
        </Space>
        {activeTab === 'script' && script.shots?.length === 0 && (
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateStoryboard}
            loading={generateLoading}
          >
            生成分镜脚本
          </Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 编辑分镜弹窗 */}
      <Modal
        title="编辑分镜"
        open={editingShotId !== null}
        onCancel={() => {
          setEditingShotId(null);
          editForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveShot}>
          <Form.Item label="场景" name="scene">
            <Input placeholder="例如：城堡大厅" />
          </Form.Item>
          <Form.Item label="角色" name="characters">
            <Input placeholder="多个角色用逗号分隔，例如：#id:ABC123 诺士英, 沉默" />
          </Form.Item>
          <Form.Item label="对白" name="dialogue">
            <TextArea rows={2} placeholder="角色对白" />
          </Form.Item>
          <Form.Item label="画面描述" name="visualDescription">
            <TextArea rows={3} placeholder="详细描述画面内容" />
          </Form.Item>
          <Form.Item label="图像提示词" name="imagePrompt">
            <TextArea rows={3} placeholder="用于生成图像的提示词（英文）" />
          </Form.Item>
          <Form.Item label="视频提示词" name="videoPrompt">
            <TextArea rows={4} placeholder="时间轴格式的视频提示词" />
          </Form.Item>
          <Space>
            <Form.Item
              label="镜头类型"
              name="shotType"
              style={{ marginBottom: 0 }}
            >
              <Select style={{ width: 120 }}>
                <Select.Option value="特写">特写</Select.Option>
                <Select.Option value="近景">近景</Select.Option>
                <Select.Option value="中景">中景</Select.Option>
                <Select.Option value="全景">全景</Select.Option>
                <Select.Option value="远景">远景</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="时长(秒)"
              name="duration"
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={1} max={30} />
            </Form.Item>
          </Space>
          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setEditingShotId(null)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ScriptDetail;
