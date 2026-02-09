import { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Card,
  Descriptions,
  message,
  Modal,
  Spin,
  Image,
  Tag,
  Checkbox,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  ReloadOutlined,
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  extractCharacters,
  batchSaveCharacters,
  getCharacterList,
} from '@/api/script';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Script } from '../../stores/useScriptStore';
import { useUserStore } from '../../stores/useUserStore';
import {
  ExtractedCharacter,
  SavedCharacter,
  getScriptDescriptionItems,
  emptyStates,
  buttonTexts,
  messages,
  confirmDialogs,
} from './ScriptCharacters/config';
import ImageGenerateModal from '../../components/ImageGenerateModal';
import type { ImageGenerateSubmitValues } from '../../components/ImageGenerateModal';
import { generateImageAsync } from '@/api/ai';
import { useTaskStore } from '../../stores/useTaskStore';
import { onTaskComplete } from '../../components/GlobalTaskPoller';

function ScriptCharacters() {
  const navigate = useNavigate();
  const { scriptId } = useParams<{ scriptId: string }>();
  const location = useLocation();
  const script = location.state?.script as Script;
  const { currentUser } = useUserStore();
  const { addTask } = useTaskStore();

  // 获取已保存的角色列表
  const fetchSavedCharacters = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setLoadingSaved(true);
    try {
      const response = await getCharacterList({
        userId: currentUser.id,
        page: 1,
        pageSize: 100,
      });
      if (response.success) {
        setSavedCharacters(response.data.list || []);
      } else {
        message.error('获取已保存角色失败');
      }
    } catch (error: any) {
      console.error('获取已保存角色失败:', error);
      message.error('获取已保存角色失败');
    } finally {
      setLoadingSaved(false);
    }
  };

  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  useEffect(() => {
    fetchSavedCharacters();
  }, []);

  // 监听角色图像生成任务完成 - 局部更新对应角色的 imageUrl
  useEffect(() => {
    const unsubscribe = onTaskComplete((event) => {
      if (event.type === 'image' && event.characterId) {
        // 从 result 中提取图片 URL
        const imageUrl = event.result?.savedImage?.url
          || event.result?.images?.[0]?.url;
        if (!imageUrl) return;

        setSavedCharacters(prev =>
          prev.map(c =>
            c.id === event.characterId
              ? { ...c, imageUrl }
              : c
          )
        );
      }
    });
    return () => unsubscribe();
  }, []);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  // 角色图像生成相关状态
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedCharacterForImage, setSelectedCharacterForImage] = useState<SavedCharacter | null>(null);

  // 提取角色信息
  const handleExtractCharacters = async () => {
    if (!scriptId) {
      message.error(messages.noScriptId);
      return;
    }

    setExtracting(true);
    try {
      const response = await extractCharacters(parseInt(scriptId));
      if (response.success) {
        const characters = response.data.characters || [];
        setExtractedCharacters(characters);
        setSelectedCharacters(characters.map((c: ExtractedCharacter) => c.name));
        setHasExtracted(true);
        message.success(messages.extractSuccess(characters.length));
      } else {
        message.error(response.message || messages.extractError);
      }
    } catch (error: any) {
      console.error('提取角色失败:', error);
      message.error(messages.extractError + ': ' + (error.message || '未知错误'));
    } finally {
      setExtracting(false);
    }
  };

  // 保存选中的角色到角色库
  const handleSaveCharacters = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    const charactersToSave = extractedCharacters.filter((c) =>
      selectedCharacters.includes(c.name),
    );

    if (charactersToSave.length === 0) {
      message.error(messages.noSelection);
      return;
    }

    setSaving(true);
    try {
      const response = await batchSaveCharacters(charactersToSave, currentUser.id);
      if (response.success) {
        message.success(messages.saveSuccess(charactersToSave.length));
        fetchSavedCharacters();
        Modal.confirm({
          ...confirmDialogs.saveSuccess,
          onOk: () => {
            setExtractedCharacters([]);
            setSelectedCharacters([]);
            setHasExtracted(false);
          },
        });
      } else {
        message.error(response.message || messages.saveError);
      }
    } catch (error: any) {
      console.error('保存角色失败:', error);
      message.error(messages.saveError + ': ' + (error.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/character-library');
  };

  // 打开图像生成弹窗
  const handleGenerateCharacterImage = (character: SavedCharacter) => {
    setSelectedCharacterForImage(character);
    setGenerateModalVisible(true);
  };

  // 图像生成提交 - 调用异步队列接口
  const handleImageSubmit = async (values: ImageGenerateSubmitValues) => {
    if (!selectedCharacterForImage) return;

    setGenerateLoading(true);
    try {
      let width = 1024;
      let height = 1024;
      if (values.model === 'doubao-seedream-4-5-251128') {
        width = 1920;
        height = 1920;
      }

      const res = await generateImageAsync({
        prompt: values.imagePrompt,
        model: values.model,
        width,
        height,
        referenceImages: values.referenceImages.length > 0 ? values.referenceImages : undefined,
        scriptId: scriptId ? parseInt(scriptId) : undefined,
        characterId: selectedCharacterForImage.id,
        saveToLibrary: true,
        libraryName: `角色图像_${selectedCharacterForImage.name}`,
        libraryTags: ['角色图像', 'AI生成'],
      });

      if (res.success && res.data?.jobId) {
        addTask({
          jobId: res.data.jobId,
          type: 'image',
          characterId: selectedCharacterForImage.id,
        });
        message.info('图像生成任务已提交到队列');
        setGenerateModalVisible(false);
        setSelectedCharacterForImage(null);
      } else {
        throw new Error('提交任务失败');
      }
    } catch (error: any) {
      console.error('生成图像失败:', error);
      message.error(error.message || '生成图像失败');
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {buttonTexts.back}
          </Button>
        </Space>
        <h2 style={{ margin: '16px 0 8px 0' }}>
          {script?.title || `剧本 #${scriptId}`} - 角色管理
        </h2>
      </div>

      {/* 剧本信息卡片 */}
      {script && (
        <Card style={{ marginBottom: '24px' }} size="small">
          <Descriptions
            size="small"
            column={4}
            items={getScriptDescriptionItems(script)}
          />
          {script.description && (
            <div style={{ marginTop: '8px' }}>
              <strong>描述：</strong>
              {script.description}
            </div>
          )}
        </Card>
      )}

      {/* 已保存角色列表 */}
      <Card style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>已保存角色</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              当前用户已保存到角色库的所有角色
            </p>
          </div>
          <Button onClick={fetchSavedCharacters} loading={loadingSaved}>
            {buttonTexts.refreshSaved}
          </Button>
        </div>

        {loadingSaved ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : savedCharacters.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无已保存的角色"
            style={{ padding: '40px 0' }}
          >
            <div style={{ color: '#999', fontSize: 12 }}>
              请先提取并保存角色到角色库
            </div>
          </Empty>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {savedCharacters.map((character) => (
              <Card
                key={character.id}
                hoverable
                style={{ borderRadius: 8, overflow: 'hidden' }}
                cover={
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {character.imageUrl ? (
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        width="100%"
                        height={200}
                        style={{ objectFit: 'contain' }}
                        preview={{
                          mask: (
                            <div>
                              <div style={{ color: '#fff', fontSize: 14 }}>{character.name}</div>
                            </div>
                          ),
                        }}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E暂无图片%3C/text%3E%3C/svg%3E"
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                        }}
                      >
                        <UserOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                        <div style={{ fontSize: 12 }}>暂无角色图片</div>
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {character.id}
                      </Tag>
                    </div>
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {character.name}
                    </div>
                  }
                  description={
                    <div>
                      {character.description && (
                        <div
                          style={{
                            fontSize: 13,
                            color: '#666',
                            marginBottom: 8,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4',
                          }}
                        >
                          {character.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 12,
                          color: '#999',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span>创建时间</span>
                        <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PictureOutlined />}
                          onClick={() => handleGenerateCharacterImage(character)}
                        >
                          生成图像
                        </Button>
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          onClick={() => message.info('图像上传功能开发中...')}
                        >
                          上传图像
                        </Button>
                      </div>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 操作区域 */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>提取新角色</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              从剧本内容和分镜数据中提取角色信息
            </p>
          </div>
          <Space>
            {!hasExtracted ? (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                loading={extracting}
                onClick={handleExtractCharacters}
              >
                {buttonTexts.extract}
              </Button>
            ) : (
              <>
                <Button
                  icon={<ReloadOutlined />}
                  loading={extracting}
                  onClick={handleExtractCharacters}
                >
                  {buttonTexts.reExtract}
                </Button>
                <Button
                  type="primary"
                  loading={saving}
                  onClick={handleSaveCharacters}
                  disabled={selectedCharacters.length === 0}
                >
                  {buttonTexts.save} ({selectedCharacters.length})
                </Button>
              </>
            )}
          </Space>
        </div>

        {extracting && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>
              {emptyStates.loading.title}
            </div>
          </div>
        )}

        {!extracting && hasExtracted && (
          <>
            {extractedCharacters.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p>
                    提取到 <strong>{extractedCharacters.length}</strong> 个角色，请选择要保存到角色库的角色：
                  </p>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {extractedCharacters.map((character) => {
                    const isSelected = selectedCharacters.includes(character.name);
                    return (
                      <Card
                        key={character.name}
                        hoverable
                        style={{
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCharacters((prev) => prev.filter((name) => name !== character.name));
                          } else {
                            setSelectedCharacters((prev) => [...prev, character.name]);
                          }
                        }}
                        cover={
                          <div
                            style={{
                              width: '100%',
                              height: 200,
                              backgroundColor: '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                              }}
                            >
                              <UserOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                              <div style={{ fontSize: 12 }}>暂无角色图片</div>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        }
                      >
                        <Card.Meta
                          title={
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {character.name}
                            </div>
                          }
                          description={
                            <div>
                              {character.description && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: '#666',
                                    marginBottom: 8,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.4',
                                  }}
                                >
                                  {character.description}
                                </div>
                              )}
                              {character.appearance && (
                                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                  <strong>外貌：</strong>
                                  <span
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {character.appearance}
                                  </span>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>{emptyStates.noCharacters.title}</p>
                <p>可能的原因：</p>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                  {emptyStates.noCharacters.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {!extracting && !hasExtracted && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}>
              {emptyStates.initial.icon}
            </div>
            <p>{emptyStates.initial.title}</p>
            <p style={{ fontSize: '12px' }}>{emptyStates.initial.description}</p>
          </div>
        )}
      </Card>

      {/* 角色图像生成弹窗 - 使用通用组件，不传 onSave（角色库不需要保存按钮） */}
      <ImageGenerateModal
        visible={generateModalVisible}
        title={selectedCharacterForImage ? `生成角色图像 - ${selectedCharacterForImage.name}` : '生成图像'}
        initialValues={{
          shotType: '近景',
          imagePrompt: selectedCharacterForImage?.description || '',
        }}
        scriptId={scriptId ? parseInt(scriptId) : undefined}
        loading={generateLoading}
        onCancel={() => {
          setGenerateModalVisible(false);
          setSelectedCharacterForImage(null);
        }}
        onSubmit={handleImageSubmit}
      />
    </div>
  );
}

export default ScriptCharacters;
