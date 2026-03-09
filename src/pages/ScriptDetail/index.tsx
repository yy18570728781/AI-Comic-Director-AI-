import { useState, useEffect } from 'react';
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
  generateStoryboardStream,
} from '@/api/script';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useScriptData } from '@/hooks/useScriptData';

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
  const [generatingRawText, setGeneratingRawText] = useState('');
  const [editingShotId, setEditingShotId] = useState<number | null>(null);
  const [editForm] = Form.useForm();
  const [blendModalVisible, setBlendModalVisible] = useState(false);

  // 使用分镜数据管理 Hook
  const {
    updateShotData,
    deleteShotData,
    updateShotImage,
    updateShotVideo,
    updateVideoStatus,
    removeShotImage,
    updateImageFrameStatus,
  } = useScriptData(script, setScript);

  // 使用统一的 AI 生成 hook
  const { 
    generateImage, 
    generateVideo, 
    generatingImageIds, 
    generatingVideoIds 
  } = useAIGeneration({
    onImageComplete: (image, shotId) => {
      if (shotId && image?.id) {
        updateShotImage(shotId, image);
      }
    },
    onVideoComplete: (video, shotId) => {
      console.log('🎬 [主页面] onVideoComplete 被调用:', { video, shotId });
      if (shotId && video?.id) {
        updateShotVideo(shotId, video);
      } 
    },
    onError: async (error, type, shotId) => {
      // 处理失败情况，局部刷新对应分镜的数据
      if (type === 'video' && shotId) {
        try {
          // 延迟一下确保后端已更新状态
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 重新获取该分镜的数据
          const { getScriptDetail } = await import('@/api/script');
          const res = await getScriptDetail(parseInt(id!));
          
          if (res.success && res.data) {
            const updatedShot = res.data.shots?.find((s: any) => s.id === shotId);
            if (updatedShot) {
              // 局部更新该分镜的数据
              setScript((prevScript: any) => {
                if (!prevScript) return prevScript;
                
                const updatedShots = prevScript.shots.map((shot: any) => 
                  shot.id === shotId ? updatedShot : shot
                );
                
                return { ...prevScript, shots: updatedShots };
              });
            }
          }
        } catch (err) {
          console.error('更新失败状态时出错:', err);
        }
      }
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

  // 生成分镜脚本（流式）
  const handleGenerateStoryboard = async () => {
    setGenerateLoading(true);
    setGeneratingRawText('');
    
    // 立即跳转到分镜脚本标签
    setActiveTab('shots');
    
    // 清空当前的分镜数据，显示流式效果
    setScript((prev: any) => prev ? { ...prev, shots: [] } : prev);
    
    try {
      await generateStoryboardStream(
        parseInt(id!),
        { shotCount: 30 },
        (content, fullText) => {
          setGeneratingRawText(fullText);
          console.log('📝 收到流式数据，当前长度:', fullText.length);
        },
        (error) => {
          message.error(error);
          setGenerateLoading(false);
          setGeneratingRawText('');
        },
        async (result) => {
          console.log('✅ 分镜生成完成，准备刷新数据');
          setGeneratingRawText('');
          setGenerateLoading(false);
          
          // 等待一小段时间确保后端保存完成
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 刷新数据
          await loadScript();
          message.success('分镜脚本生成成功');
        }
      );
    } catch (error) {
      console.error(error);
      setGenerateLoading(false);
      setGeneratingRawText('');
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
      videoPrompt: shot.videoPrompt || '', // 统一使用 videoPrompt 字段
      shotType: shot.shotType,
      duration: shot.duration,
    });
  };

  // 保存分镜编辑
  const handleSaveShot = async (values: any) => {
    try {
      await updateShotData(editingShotId!, {
        ...values,
        characters: values.characters
          ?.split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      });
      
      setEditingShotId(null);
      editForm.resetFields();
    } catch (error) {
      // 错误已在 Hook 中处理
    }
  };

  // 删除分镜
  const handleDeleteShot = async (shotId: number) => {
    try {
      await deleteShotData(shotId);
    } catch (error) {
      // 错误已在 Hook 中处理
    }
  };

  // 设置首帧（局部更新）
  const handleSetFirstFrame = async (shotId: number, imageId: number) => {
    try {
      await setFirstFrame(imageId);
      message.success('已设置为首帧');
      updateImageFrameStatus(shotId, imageId, 'first');
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 设置尾帧（局部更新）
  const handleSetLastFrame = async (shotId: number, imageId: number) => {
    try {
      await setLastFrame(imageId);
      message.success('已设置为尾帧');
      updateImageFrameStatus(shotId, imageId, 'last');
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  // 删除图片（局部更新）
  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage(imageId);
      message.success('图片删除成功');
      removeShotImage(imageId);
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
      aspectRatio: config?.aspectRatio || '16:9',
      quality: config?.quality || 'standard',
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

    // 分镜页面：有尾帧用首尾帧模式，否则用单图模式
    const mode = lastFrameImage ? 'flf2v' : 'i2v';

    // 使用 hook 生成视频
    await generateVideo({
      prompt: config.videoPrompt || shot.videoPrompt || '', // 统一使用 videoPrompt 字段
      model: config.model || 'doubao-seedance-1-0-lite-i2v-250428',
      mode,
      duration: config.duration || 5,
      referenceImages: lastFrameImage 
        ? [firstFrameImage.url, lastFrameImage.url] 
        : [firstFrameImage.url],
      aspectRatio: config.aspectRatio,
      generateAudio: config.generateAudio ?? false,
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
      key: 'characters',
      label: (
        <span>
          角色库
        </span>
      ),
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
    // 所有标签都保持挂载，只是隐藏不活跃的标签
    // 这样每个标签的滚动位置会自然保留
    return (
      <>
        <div style={{ display: activeTab === 'script' ? 'block' : 'none' }}>
          <ScriptTab 
            content={script.content} 
            hasShots={script.shots?.length > 0}
            generateLoading={generateLoading}
            generatingRawText={generatingRawText}
            onRegenerateStoryboard={handleGenerateStoryboard}
          />
        </div>
        <div style={{ display: activeTab === 'characters' ? 'block' : 'none' }}>
          <div style={{ padding: '16px 0' }}>
            <Button
              type="primary"
              onClick={() => navigate(`/character-library/script/${script.id}`, { state: { script } })}
            >
              进入角色管理
            </Button>
          </div>
        </div>
        <div style={{ display: activeTab === 'shots' ? 'block' : 'none' }}>
          <ShotsTab
            shots={script.shots || []}
            generateLoading={generateLoading}
            generatingImages={generatingImageIds}
            generatingRawText={generatingRawText}
            onGenerateStoryboard={handleGenerateStoryboard}
            onEditShot={handleEditShot}
            onDeleteShot={handleDeleteShot}
            onGenerateImage={handleGenerateImage}
            onSetFirstFrame={handleSetFirstFrame}
            onSetLastFrame={handleSetLastFrame}
            onDeleteImage={handleDeleteImage}
            onShotUpdate={async (shotId, data) => {
              await updateShotData(shotId, data, { showMessage: false });
            }}
          />
        </div>
        <div style={{ display: activeTab === 'images' ? 'block' : 'none' }}>
          <ImagesTab
            shots={script.shots || []}
            generatingImages={generatingImageIds}
            generatingVideos={generatingVideoIds}
            scriptId={script.id}
            onGenerateVideo={handleGenerateVideo}
            onEditShot={handleEditShot}
            onDeleteShot={handleDeleteShot}
            onShotUpdate={async (shotId, data) => {
              await updateShotData(shotId, data, { showMessage: false });
            }}
          />
        </div>
        <div style={{ display: activeTab === 'videos' ? 'block' : 'none' }}>
          <VideosTab shots={script.shots || []} />
        </div>
      </>
    );
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
          <Form.Item label="图像提示词" name="imagePrompt">
            <TextArea rows={3} placeholder="用于生成分镜图片的提示词" />
          </Form.Item>
          <Form.Item label="视频提示词" name="videoPrompt">
            <TextArea rows={6} placeholder="用于生成分镜视频的完整提示词，包含运镜、时间轴、画面细节、对白/旁白等" />
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
