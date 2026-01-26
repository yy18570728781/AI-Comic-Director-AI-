import { useState, useEffect, useCallback } from 'react';
import {
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
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ThunderboltOutlined, MergeCellsOutlined } from '@ant-design/icons';

import { generateImage } from '@/api/image';
import { setFirstFrame, setLastFrame, deleteImage } from '@/api/image-action';
import {
  getScriptDetail,
  generateStoryboard,
  updateShot,
  deleteShot,
} from '@/api/script';
import { generateVideo } from '@/api/video';
import { useImagePolling, useVideoPolling } from '@/hooks/useTaskPolling';
import { useTaskStore } from '@/stores/useTaskStore';

// 导入标签页组件
import ImageBlendModal from './components/ImageBlendModal';
import ImagesTab from './components/ImagesTab';
import ScriptTab from './components/ScriptTab';
import ShotsTab from './components/ShotsTab';
import VideosTab from './components/VideosTab';

const { TextArea } = Input;

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
  const [blendModalVisible, setBlendModalVisible] = useState(false);

  // 使用全局任务状态
  const { addImageTask } = useTaskStore();
  const { addVideoTask } = useTaskStore();

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

  // 更新 script 中对应镜头的图片
  const updateShotImage = useCallback((shotId: number, image: any) => {
    setScript((prevScript: any) => {
      if (!prevScript) return prevScript;

      const updatedShots = prevScript.shots.map((shot: any) => {
        if (shot.id === shotId) {
          return {
            ...shot,
            images: shot.images
              ? [...shot.images, image]
              : [image],
          };
        }
        return shot;
      });

      return {
        ...prevScript,
        shots: updatedShots,
      };
    });
  }, []);

  // 更新 script 中对应镜头的视频
  const updateShotVideo = useCallback((shotId: number, video: any) => {
    setScript((prevScript: any) => {
      if (!prevScript) return prevScript;

      const updatedShots = prevScript.shots.map((shot: any) => {
        if (shot.id === shotId) {
          return {
            ...shot,
            videos: shot.videos
              ? [...shot.videos, video]
              : [video],
          };
        }
        return shot;
      });

      return {
        ...prevScript,
        shots: updatedShots,
      };
    });
  }, []);

  // 图片轮询回调
  const handleImageComplete = useCallback((results: any[]) => {
    results.forEach((result: any) => {
      if (result.status === 'completed') {
        if (result.shotId !== 0) {
          updateShotImage(result.shotId, result.image);
          message.success(`镜头 #${result.shotId} 图像生成成功！`);
          // 移除 generatingImages 状态
          setGeneratingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(result.shotId);
            return newSet;
          });
        } else {
          message.success('图像融合成功！');
        }
      } else if (result.status === 'failed' || result.status === 'error') {
        if (result.shotId !== 0) {
          message.error(`镜头 #${result.shotId} 图像生成失败: ${result.error || '未知错误'}`);
          // 移除 generatingImages 状态（失败也要移除）
          setGeneratingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(result.shotId);
            return newSet;
          });
        } else {
          message.error(`图像生成失败: ${result.error || '未知错误'}`);
        }
      }
    });
  }, [updateShotImage]);

  // 视频轮询回调
  const handleVideoComplete = useCallback((results: any[]) => {
    results.forEach((result: any) => {
      if (result.status === 'completed') {
        updateShotVideo(result.shotId, result.video);
        message.success(`镜头 #${result.shotId} 视频生成成功！`);
      } else if (result.status === 'failed' || result.status === 'error') {
        message.error(`镜头 #${result.shotId} 视频生成失败: ${result.error || '未知错误'}`);
      }
    });
  }, [updateShotVideo]);

  // 启用轮询
  useImagePolling({
    onComplete: handleImageComplete,
  });

  useVideoPolling({
    onComplete: handleVideoComplete,
  });

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

  // 设置首帧
  const handleSetFirstFrame = async (shotId: number, imageId: number) => {
    try {
      await setFirstFrame(imageId);
      message.success('已设置为首帧');
      loadScript();
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 设置尾帧
  const handleSetLastFrame = async (shotId: number, imageId: number) => {
    try {
      await setLastFrame(imageId);
      message.success('已设置为尾帧');
      loadScript();
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 删除图片
  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage(imageId);
      message.success('删除成功');
      loadScript();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 生成图像
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

      // 根据图像比例计算宽高
      let width = 1024;
      let height = 1024;

      if (config?.aspectRatio) {
        const ratioMap: Record<string, [number, number]> = {
          '1:1': [1024, 1024],
          '16:9': [1280, 720],
          '9:16': [720, 1280],
          '4:3': [1024, 1024],
          '3:4': [768, 1152],
          '21:9': [1280, 720],
        };
        [width, height] = ratioMap[config.aspectRatio] || [1024, 1024];
      }

      const prompt = config?.imagePrompt || shot.imagePrompt;

      const res = await generateImage({
        prompt,
        model: 'wanx',
        width,
        height,
        referenceImages: config?.referenceImages || [],
      });

      if (res.success && res.data.taskId) {
        // 添加到全局任务列表
        console.log('✅ 前端：添加图片任务到全局列表', {
          taskId: res.data.taskId,
          shotId,
        });
        addImageTask({
          taskId: res.data.taskId,
          shotId,
          isBlend: false,
        });

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
      setBlendModalVisible(false);

      message.loading({
        content: '融图任务已提交，正在后台处理...',
        key: 'blend',
        duration: 2,
      });

      const { blendImages } = await import('@/api/image');
      const res = await blendImages({
        model: config.model,
        prompt: config.prompt,
        referenceImages: config.referenceImages,
        aspectRatio: config.aspectRatio,
        scriptId: script?.id,
        userId: script?.userId,
      });

      if (res.success && res.data.taskId) {
        // 添加到全局任务列表
        addImageTask({
          taskId: res.data.taskId,
          shotId: 0,
          isBlend: true,
        });
        message.success({
          content: '融图任务已提交，完成后将自动保存到资源库',
          key: 'blend',
        });
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

  // 生成视频
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

      const referenceImage = shot.images[shot.images.length - 1].url;

      const res = await generateVideo({
        prompt: shot.videoPrompt || shot.visualDescription || '',
        model: 'wan2.6-i2v-flash',
        referenceImage,
      });

      if (res.success && res.data.taskId) {
        // 添加到全局任务列表
        console.log('✅ 前端：添加视频任务到全局列表', {
          taskId: res.data.taskId,
          shotId,
          model: 'wan2.6-i2v-flash',
        });
        addVideoTask({
          taskId: res.data.taskId,
          shotId,
          model: 'wan2.6-i2v-flash',
        });

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptTab content={script.content} />;
      case 'shots':
        return (
          <ShotsTab
            shots={script.shots || []}
            generateLoading={generateLoading}
            generatingImages={generatingImages}
            onGenerateStoryboard={handleGenerateStoryboard}
            onEditShot={handleEditShot}
            onDeleteShot={handleDeleteShot}
            onGenerateImage={handleGenerateImage}
            onSetFirstFrame={handleSetFirstFrame}
            onSetLastFrame={handleSetLastFrame}
            onDeleteImage={handleDeleteImage}
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
          <div>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              style={{ marginBottom: 0, flex: 1 }}
            />
          </div>
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

