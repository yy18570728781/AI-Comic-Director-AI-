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
} from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, MergeCellsOutlined } from '@ant-design/icons';
import {
  getScriptDetail,
  generateStoryboard,
  updateShot,
  deleteShot,
} from '@/api/script';
import { generateImage, batchGetImageStatus } from '@/api/image';
import { generateVideo, batchGetVideoStatus } from '@/api/video';
import { saveToLibrary } from '@/api/resource';

// 导入标签页组件
import ScriptTab from './components/ScriptTab';
import ShotsTab from './components/ShotsTab';
import ImagesTab from './components/ImagesTab';
import VideosTab from './components/VideosTab';
import ImageBlendModal from './components/ImageBlendModal';

const { TextArea } = Input;

// 任务状态类型
interface ImageTask {
  taskId: string;
  shotId: number;
  isBlend?: boolean; // 标记是否为融图任务
  blendConfig?: any; // 保存融图配置
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
  const [blendModalVisible, setBlendModalVisible] = useState(false);

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
              // 查找对应的任务信息
              const task = imageTasks.find(t => t.taskId === result.taskId);
              
              // 如果是融图任务，保存到资源库
              if (task && (task as any).isBlend && result.image) {
                saveToLibrary({
                  name: `融图结果_${new Date().getTime()}`,
                  type: 'blend', // 保存为融图类型
                  url: result.image.url,
                  description: (task as any).blendConfig?.prompt || '多参考图融合结果',
                  prompt: (task as any).blendConfig?.prompt || '',
                  scriptId: script?.id || null, // 关联到当前剧本
                  userId: script?.userId,
                  referenceImages: (task as any).blendConfig?.referenceImages || [],
                  metadata: {
                    isBlend: true,
                    referenceImages: (task as any).blendConfig?.referenceImages || [],
                    model: (task as any).blendConfig?.model || '',
                    aspectRatio: (task as any).blendConfig?.aspectRatio || '',
                  },
                }).then(() => {
                  message.success('融图结果已保存到资源库');
                }).catch((error: any) => {
                  console.error('保存到资源库失败:', error);
                  message.warning('融图成功，但保存到资源库失败');
                });
              }

              if (result.shotId !== 0) {
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
              } else {
                // 融图任务完成，只显示消息
                message.success('图像融合成功！');
              }
            } else if (
              result.status === 'failed' ||
              result.status === 'error'
            ) {
              if (result.shotId !== 0) {
                failedTasks.push(result.shotId);
                message.error(
                  `镜头 #${result.shotId} 图像生成失败: ${result.error || '未知错误'}`,
                );
              } else {
                message.error(
                  `图像生成失败: ${result.error || '未知错误'}`,
                );
              }
            }
          });

          // 移除已完成或失败的任务（按 taskId）
          const finishedTaskIds: string[] = [];

          res.data.forEach((result: any) => {
            if (
              result.status === 'completed' ||
              result.status === 'failed' ||
              result.status === 'error'
            ) {
              finishedTaskIds.push(result.taskId);
            }
          });

          if (finishedTaskIds.length > 0) {
            console.log('🗑️ 移除已完成的任务:', finishedTaskIds);

            setImageTasks((prev) => {
              const remaining = prev.filter(
                (task) => !finishedTaskIds.includes(task.taskId),
              );
              console.log(`📊 剩余任务数: ${remaining.length}`);
              return remaining;
            });

            // 检查每个 shotId 是否还有未完成的任务
            const affectedShotIds = [
              ...new Set(res.data.map((r: any) => r.shotId).filter((id: number) => id !== 0)),
            ];
            setGeneratingImages((prev) => {
              const newSet = new Set(prev);
              affectedShotIds.forEach((shotId) => {
                // 检查该 shotId 是否还有未完成的任务
                const remainingForShot = imageTasks.filter(
                  (t) =>
                    t.shotId === shotId && !finishedTaskIds.includes(t.taskId),
                );
                if (remainingForShot.length === 0) {
                  console.log(`✅ shotId ${shotId} 的所有任务已完成`);
                  newSet.delete(shotId);
                }
              });
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

  // 生成图像（简化版 - 单张图片）
  const handleGenerateImage = async (shot: any, config?: any) => {
    const shotId = shot.id;

    console.log('🎨 前端：准备生成图片');
    console.log('📋 shot 对象:', shot);
    console.log('🆔 shotId:', shotId);
    console.log('⚙️ 配置:', config);

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

      // 根据图像比例计算宽高（通义万相支持的尺寸）
      let width = 1024;
      let height = 1024;

      if (config?.aspectRatio) {
        const ratioMap: Record<string, [number, number]> = {
          '1:1': [1024, 1024], // 正方形
          '16:9': [1280, 720], // 横屏
          '9:16': [720, 1280], // 竖屏
          '4:3': [1024, 1024], // 标准横屏（用正方形代替，通义万相不支持4:3）
          '3:4': [768, 1152], // 标准竖屏（2:3）
          '21:9': [1280, 720], // 超宽屏（用16:9代替）
        };
        [width, height] = ratioMap[config.aspectRatio] || [1024, 1024];
      }

      // 使用配置中的图像提示词（通义万相支持中文）
      const prompt = config?.imagePrompt || shot.imagePrompt;

      // 调用生成图像 API
      const res = await generateImage({
        prompt,
        model: 'wanx',
        width,
        height,
        referenceImages: config?.referenceImages || [],
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

  // 多图融合
  const handleBlendImages = async (config: any) => {
    console.log('🎨 前端：准备融图');
    console.log('⚙️ 配置:', config);

    try {
      message.loading({
        content: '正在融合图像...',
        key: 'blend',
        duration: 2,
      });

      const { blendImages } = await import('@/api/image');
      const res = await blendImages({
        model: config.model,
        prompt: config.prompt,
        referenceImages: config.referenceImages,
        aspectRatio: config.aspectRatio,
      });

      if (res.success) {
        // 保存融图结果到资源库的函数
        const saveBlendResultToLibrary = async (imageUrl: string) => {
          try {
            await saveToLibrary({
              name: `融图结果_${new Date().getTime()}`,
              type: 'blend', // 保存为融图类型
              url: imageUrl,
              description: config.prompt || '多参考图融合结果',
              prompt: config.prompt || '',
              scriptId: script?.id || null, // 关联到当前剧本
              userId: script?.userId,
              referenceImages: config.referenceImages || [],
              metadata: {
                isBlend: true,
                referenceImages: config.referenceImages || [],
                model: config.model || '',
                aspectRatio: config.aspectRatio || '',
              },
            });
            message.success('融图结果已保存到资源库');
          } catch (error: any) {
            console.error('保存到资源库失败:', error);
            message.warning('融图成功，但保存到资源库失败');
          }
        };

        // 如果是异步模型，添加到任务列表（轮询完成后保存）
        if (res.data.status === 'pending' || res.data.status === 'processing') {
          // 通义万相是异步的，需要轮询
          setImageTasks((prev) => [
            ...prev,
            { 
              taskId: res.data.taskId, 
              shotId: 0, // shotId 为 0 表示不关联分镜
              isBlend: true, // 标记为融图任务
              blendConfig: config, // 保存配置以便后续保存到资源库
            },
          ]);
          message.success({
            content: '图像融合任务已提交，正在处理中...',
            key: 'blend',
          });
        } else if (res.data.status === 'completed' && res.data.images) {
          // 同步模型直接显示结果并保存到资源库
          const imageUrl = res.data.images[0].url;
          await saveBlendResultToLibrary(imageUrl);
          
          Modal.success({
            title: '融图成功',
            content: (
              <div>
                <img
                  src={imageUrl}
                  alt="融图结果"
                  style={{ width: '100%', marginTop: 16 }}
                />
              </div>
            ),
            width: 600,
          });
        }
      } else {
        throw new Error(res.message || '融图失败');
      }
    } catch (error: any) {
      message.error({
        content: error.message || '融图失败',
        key: 'blend',
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
    },
    {
      key: 'shots',
      label: (
        <span>
          分镜脚本{' '}
          {script.shots?.length > 0 && (
            <Tag color="blue">{script.shots.length}</Tag>
          )}
        </span>
      ),
    },
    {
      key: 'images',
      label: (
        <span>
          分镜图像{' '}
          {script.shots?.reduce(
            (total: number, shot: any) => total + (shot.images?.length || 0),
            0,
          ) > 0 && (
            <Tag color="blue">
              {script.shots.reduce(
                (total: number, shot: any) =>
                  total + (shot.images?.length || 0),
                0,
              )}
            </Tag>
          )}
        </span>
      ),
    },
    {
      key: 'videos',
      label: (
        <span>
          视频{' '}
          {script.shots?.reduce(
            (total: number, shot: any) => total + (shot.videos?.length || 0),
            0,
          ) > 0 && (
            <Tag color="blue">
              {script.shots.reduce(
                (total: number, shot: any) =>
                  total + (shot.videos?.length || 0),
                0,
              )}
            </Tag>
          )}
        </span>
      ),
    },
  ];

  // 渲染当前标签页的内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptTab content={script.content} />;
      case 'shots':
        return (
          <ShotsTab
            shots={script.shots || []}
            generateLoading={generateLoading}
            onGenerateStoryboard={handleGenerateStoryboard}
            onEditShot={handleEditShot}
            onDeleteShot={handleDeleteShot}
          />
        );
      case 'images':
        return (
          <ImagesTab
            shots={script.shots || []}
            generatingImages={generatingImages}
            generatingVideos={generatingVideos}
            scriptId={script.id}
            onGenerateImage={handleGenerateImage}
            onGenerateVideo={handleGenerateVideo}
            onEditShot={handleEditShot}
            onDeleteShot={handleDeleteShot}
          />
        );
      case 'videos':
        return <VideosTab shots={script.shots || []} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* 固定的头部区域 - 使用 sticky */}
      <div
        style={{
          position: 'sticky',
          top: -24, // 抵消父容器的 padding
          zIndex: 10,
          padding: '16px 24px',
          margin: '-24px -24px 0 -24px', // 抵消父容器的 padding
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
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
      </div>

      {/* 固定的标签页导航 - 使用 sticky */}
      <div
        style={{
          position: 'sticky',
          top: 56, // 头部高度
          zIndex: 9,
          padding: '0 24px',
          margin: '0 -24px', // 抵消父容器的 padding
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Button
            type="primary"
            icon={<MergeCellsOutlined />}
            onClick={() => setBlendModalVisible(true)}
            style={{ marginLeft: 16 }}
          >
            多参考图融图
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '16px' }}>{renderTabContent()}</div>

      {/* 融图弹窗 */}
      <ImageBlendModal
        visible={blendModalVisible}
        scriptId={script.id}
        onCancel={() => setBlendModalVisible(false)}
        onSubmit={handleBlendImages}
      />

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
