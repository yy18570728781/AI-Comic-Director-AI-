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
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';

import { setFirstFrame, setLastFrame, deleteImage } from '@/api/image-action';
import {
  getScriptDetail,
  generateStoryboard,
  updateShot,
  deleteShot,
} from '@/api/script';
import { useAIGeneration } from '@/hooks/useAIGeneration';

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
  const [blendModalVisible, setBlendModalVisible] = useState(false);

  // 更新 script 中对应镜头的图片
  const updateShotImage = useCallback((shotId: number, image: any) => {
    setScript((prevScript: any) => {
      if (!prevScript) return prevScript;
      const updatedShots = prevScript.shots.map((shot: any) => {
        if (shot.id === shotId) {
          return { ...shot, images: shot.images ? [...shot.images, image] : [image] };
        }
        return shot;
      });
      return { ...prevScript, shots: updatedShots };
    });
  }, []);

  // 更新 script 中对应镜头的视频
  const updateShotVideo = useCallback((shotId: number, video: any) => {
    setScript((prevScript: any) => {
      if (!prevScript) return prevScript;
      const updatedShots = prevScript.shots.map((shot: any) => {
        if (shot.id === shotId) {
          return { ...shot, videos: shot.videos ? [...shot.videos, video] : [video] };
        }
        return shot;
      });
      return { ...prevScript, shots: updatedShots };
    });
  }, []);

  // 使用统一的 AI 生成 hook
  const { 
    generateImage, 
    generateVideo, 
    generatingImageIds, 
    generatingVideoIds 
  } = useAIGeneration({
    onImageComplete: (image, shotId) => {
      if (shotId) updateShotImage(shotId, image);
    },
    onVideoComplete: (video, shotId) => {
      if (shotId) updateShotVideo(shotId, video);
    },
  });

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

  // 生成分镜脚本
  const handleGenerateStoryboard = async () => {
    setGenerateLoading(true);
    try {
      const result = await generateStoryboard(parseInt(id!), {
        shotCount: 30,
      });
      if (result.success) {
        message.success('分镜脚本生成成功');
        loadScript();
        setActiveTab('shots');
      }
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

  // 设置首帧（局部更新）
  const handleSetFirstFrame = async (shotId: number, imageId: number) => {
    try {
      await setFirstFrame(imageId);
      message.success('已设置为首帧');

      // 局部更新：只清除首帧标记，保留尾帧
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId) {
            const updatedImages = (shot.images || []).map((img: any) => ({
              ...img,
              isFirstFrame: img.id === imageId,
            }));
            return { ...shot, images: updatedImages };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 设置尾帧（局部更新）
  const handleSetLastFrame = async (shotId: number, imageId: number) => {
    try {
      await setLastFrame(imageId);
      message.success('已设置为尾帧');

      // 局部更新：只清除尾帧标记，保留首帧
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId) {
            const updatedImages = (shot.images || []).map((img: any) => ({
              ...img,
              isLastFrame: img.id === imageId,
            }));
            return { ...shot, images: updatedImages };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 删除图片（局部更新）
  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage(imageId);
      message.success('图片删除成功');

      // 局部更新：从对应镜头的 images 中移除
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          const hasDeletedImage = shot.images?.some(
            (img: any) => img.id === imageId,
          );
          if (hasDeletedImage) {
            return {
              ...shot,
              images: shot.images.filter((img: any) => img.id !== imageId),
            };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 生成图像（使用 hook）
  const handleGenerateImage = async (shot: any, config?: any) => {
    const shotId = shot.id;

    // 防止重复生成
    if (generatingImageIds.has(shotId)) {
      message.warning('该镜头正在生成图像，请稍候');
      return;
    }

    await generateImage({
      prompt: config?.imagePrompt || shot.imagePrompt,
      model: config?.model || 'seedream',
      aspectRatio: config?.aspectRatio || '1:1',
      referenceImages: config?.referenceImages || [],
      shotId,
      scriptId: script?.id,
    });
  };

  // 多图融合（保持使用旧API，因为融图不走队列）
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
        // 融图使用旧的轮询机制（不走队列）
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

  // 生成视频（使用 hook）
  const handleGenerateVideo = async (shot: any, config: any) => {
    const shotId = shot.id;

    // 检查是否有首帧
    const firstFrameImage = shot.images?.find((img: any) => img.isFirstFrame);
    if (!firstFrameImage) {
      message.warning('请先设置首帧图片，再生成视频');
      return;
    }

    // 检查是否有尾帧
    const lastFrameImage = shot.images?.find((img: any) => img.isLastFrame);

    // 使用 hook 生成视频
    await generateVideo({
      prompt: config.videoPrompt || shot.videoPrompt || shot.visualDescription || '',
      model: config.model || 'doubao-seedance-1-0-lite-i2v-250428',
      duration: config.duration || 5,
      referenceImages: lastFrameImage 
        ? [firstFrameImage.url, lastFrameImage.url] 
        : [firstFrameImage.url],
      shotId,
      scriptId: script?.id,
    });
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
            generatingImages={generatingImageIds}
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
            generatingImages={generatingImageIds}
            generatingVideos={generatingVideoIds}
            scriptId={script.id}
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
