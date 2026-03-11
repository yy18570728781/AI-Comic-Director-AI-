import { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Card,
  message,
  Modal,
  Spin,
  Image,
  Tag,
  Checkbox,
  Empty,
} from 'antd';
import {
  UserAddOutlined,
  ReloadOutlined,
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  extractCharacters,
  batchSaveCharacters,
  getCharacterList,
  deleteCharacter,
  updateCharacterLibrary,
} from '@/api/script';
import { useUserStore } from '@/stores/useUserStore';
import {
  ExtractedCharacter,
  SavedCharacter,
  emptyStates,
  buttonTexts,
  messages,
} from '@/pages/CharacterLibrary/ScriptCharacters/config';
import ImageGenerateModal from '@/components/ImageGenerateModal';
import type { ImageGenerateSubmitValues, ImageGenerateFormValues } from '@/components/ImageGenerateModal';
import { generateImageAsync } from '@/api/ai';
import { useTaskStore } from '@/stores/useTaskStore';
import { onTaskComplete } from '@/components/GlobalTaskPoller';

interface ResourcesTabProps {
  scriptId: number;
}

function ResourcesTab({ scriptId }: ResourcesTabProps) {
  const { currentUser } = useUserStore();
  const { addTask } = useTaskStore();
  const [resourceType, setResourceType] = useState<'character' | 'scene'>('character');

  // 角色相关状态
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  // 图像生成相关状态
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedCharacterForImage, setSelectedCharacterForImage] = useState<SavedCharacter | null>(null);

  const fetchSavedCharacters = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setLoadingSaved(true);
    try {
      const response = await getCharacterList({
        userId: currentUser.id,
        scriptId,
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

  useEffect(() => {
    if (resourceType === 'character') {
      fetchSavedCharacters();
    }
  }, [scriptId, resourceType]);

  useEffect(() => {
    const unsubscribe = onTaskComplete((event) => {
      if (event.type === 'image' && event.characterId) {
        const imageUrl = event.result?.savedImage?.url || event.result?.images?.[0]?.url;
        if (!imageUrl) return;

        setSavedCharacters(prev =>
          prev.map(c =>
            c.id === event.characterId ? { ...c, imageUrl } : c
          )
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const handleExtractCharacters = async () => {
    setExtracting(true);
    try {
      const response = await extractCharacters(scriptId);
      if (response.success) {
        const characters = response.data.characters || [];
        setExtractedCharacters(characters);
        setSelectedCharacters(characters.map((c: ExtractedCharacter) => 
          `${c.characterGroup || c.name}-${c.variant || '默认'}`
        ));
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

  const handleSaveCharacters = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    const charactersToSave = extractedCharacters.filter((c) =>
      selectedCharacters.includes(`${c.characterGroup || c.name}-${c.variant || '默认'}`),
    );

    if (charactersToSave.length === 0) {
      message.error(messages.noSelection);
      return;
    }

    const duplicateKeys = charactersToSave
      .map(c => `${c.characterGroup || c.name}-${c.variant || '默认'}`)
      .filter(key => {
        const [group, variant] = key.split('-');
        return savedCharacters.some(saved => 
          (saved.characterGroup || saved.name) === group && 
          (saved.variant || '默认') === variant
        );
      });

    if (duplicateKeys.length > 0) {
      Modal.warning({
        title: '存在重复角色形态',
        content: (
          <div>
            <p>以下角色形态已存在于角色库中，无法重复保存：</p>
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
              {duplicateKeys.map(key => (
                <li key={key} style={{ color: '#ff4d4f' }}>{key}</li>
              ))}
            </ul>
            <p style={{ marginTop: 12, color: '#666' }}>
              请先删除已存在的角色形态，或取消勾选这些角色后再保存。
            </p>
          </div>
        ),
        okText: '知道了',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await batchSaveCharacters(charactersToSave, currentUser.id, scriptId);
      if (response.success) {
        message.success(messages.saveSuccess(charactersToSave.length));
        fetchSavedCharacters();
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

  const handleGenerateCharacterImage = (character: SavedCharacter) => {
    setSelectedCharacterForImage(character);
    setGenerateModalVisible(true);
  };

  const handleImageSubmit = async (values: ImageGenerateSubmitValues) => {
    if (!selectedCharacterForImage) return;

    setGenerateLoading(true);
    try {
      const optimizedPrompt = `${values.imagePrompt}，生成人物动漫角色，生成全身三视图，一张面部特写（最左边占满1/3的位置，超大面部特写），右边2/3放正视图、侧视图、后视图，白色背景，左上角显示角色名称"${selectedCharacterForImage.name}"，清晰的文字标注`;

      await updateCharacterLibrary(selectedCharacterForImage.id, {
        description: values.imagePrompt,
      });

      const res = await generateImageAsync({
        prompt: optimizedPrompt,
        model: values.model,
        aspectRatio: values.aspectRatio,
        referenceImages: values.referenceImages?.length ? values.referenceImages : undefined,
        scriptId,
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

  const handleSavePrompt = async (values: ImageGenerateFormValues) => {
    if (!selectedCharacterForImage) return;

    try {
      await updateCharacterLibrary(selectedCharacterForImage.id, {
        description: values.imagePrompt,
      });
      message.success('提示词已保存');
      fetchSavedCharacters();
    } catch (error: any) {
      console.error('保存提示词失败:', error);
      message.error('保存提示词失败');
    }
  };

  const handleDeleteCharacter = async (character: SavedCharacter) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    const variantText = character.variant && character.variant !== '默认' 
      ? ` (${character.variant})` 
      : '';

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色"${character.name}${variantText}"吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteCharacter(character.id, currentUser.id);
          if (response.success) {
            message.success('删除成功');
            fetchSavedCharacters();
          } else {
            message.error(response.message || '删除失败');
          }
        } catch (error: any) {
          console.error('删除角色失败:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const renderCharacterContent = () => (
    <>
      {/* 已保存角色列表 */}
      <Card style={{ 
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        background: 'rgba(255, 255, 255, 0.95)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>已保存角色</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {savedCharacters.map((character) => (
              <Card
                key={character.id}
                hoverable
                style={{ 
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}
                styles={{ body: { padding: '16px' } }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                cover={
                  <div style={{ width: '100%', height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {character.imageUrl ? (
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        width="100%"
                        height={200}
                        style={{ objectFit: 'contain' }}
                        preview={{ mask: <div style={{ color: '#fff', fontSize: 14 }}>{character.name}</div> }}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E暂无图片%3C/text%3E%3C/svg%3E"
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        <UserOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                        <div style={{ fontSize: 12 }}>暂无角色图片</div>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px' }}>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{character.id}</Tag>
                    </div>
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <div style={{ fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {character.name}
                      {character.variant && character.variant !== '默认' && (
                        <Tag color="purple" style={{ marginLeft: 8, fontSize: 12 }}>{character.variant}</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      {character.tags && character.tags.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {character.tags.map((tag, idx) => (
                            <Tag key={idx} color="blue" style={{ fontSize: 11, marginBottom: 4 }}>{tag}</Tag>
                          ))}
                        </div>
                      )}
                      {character.description && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                          {character.description}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#999', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span>创建时间</span>
                        <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" type="primary" icon={<PictureOutlined />} onClick={() => handleGenerateCharacterImage(character)}>
                          生成图像
                        </Button>
                        <Button size="small" icon={<UploadOutlined />} onClick={() => message.info('图像上传功能开发中...')}>
                          上传图像
                        </Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCharacter(character)}>
                          删除
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
      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>提取新角色</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              从剧本内容和分镜数据中提取角色信息
            </p>
          </div>
          <Space>
            {!hasExtracted ? (
              <Button type="primary" icon={<UserAddOutlined />} loading={extracting} onClick={handleExtractCharacters}>
                {buttonTexts.extract}
              </Button>
            ) : (
              <>
                <Button icon={<ReloadOutlined />} loading={extracting} onClick={handleExtractCharacters}>
                  {buttonTexts.reExtract}
                </Button>
                <Button type="primary" loading={saving} onClick={handleSaveCharacters} disabled={selectedCharacters.length === 0}>
                  {buttonTexts.save} ({selectedCharacters.length})
                </Button>
              </>
            )}
          </Space>
        </div>

        {extracting && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>{emptyStates.loading.title}</div>
          </div>
        )}

        {!extracting && hasExtracted && (
          <>
            {extractedCharacters.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p>提取到 <strong>{extractedCharacters.length}</strong> 个角色，请选择要保存到角色库的角色：</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {extractedCharacters.map((character) => {
                    const characterKey = `${character.characterGroup || character.name}-${character.variant || '默认'}`;
                    const isSelected = selectedCharacters.includes(characterKey);
                    const isDuplicate = savedCharacters.some(saved => 
                      (saved.characterGroup || saved.name) === (character.characterGroup || character.name) &&
                      (saved.variant || '默认') === (character.variant || '默认')
                    );
                    return (
                      <Card
                        key={characterKey}
                        hoverable
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid #667eea' : '1px solid rgba(102, 126, 234, 0.2)',
                          cursor: 'pointer',
                          opacity: isDuplicate ? 0.7 : 1,
                          boxShadow: isSelected ? '0 4px 16px rgba(102, 126, 234, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease'
                        }}
                        styles={{ body: { padding: '16px' } }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCharacters((prev) => prev.filter((key) => key !== characterKey));
                          } else {
                            setSelectedCharacters((prev) => [...prev, characterKey]);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                        cover={
                          <div style={{ width: '100%', height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                              <UserOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                              <div style={{ fontSize: 12 }}>暂无角色图片</div>
                            </div>
                            <Checkbox checked={isSelected} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }} onClick={(e) => e.stopPropagation()} />
                            {isDuplicate && (
                              <Tag color="warning" style={{ position: 'absolute', top: 8, left: 8, margin: 0 }}>已存在</Tag>
                            )}
                          </div>
                        }
                      >
                        <Card.Meta
                          title={
                            <div style={{ fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {character.name}
                              {character.variant && character.variant !== '默认' && (
                                <Tag color="purple" style={{ marginLeft: 8, fontSize: 12 }}>{character.variant}</Tag>
                              )}
                            </div>
                          }
                          description={
                            <div>
                              {character.tags && character.tags.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  {character.tags.map((tag, idx) => (
                                    <Tag key={idx} color="blue" style={{ fontSize: 11, marginBottom: 4 }}>{tag}</Tag>
                                  ))}
                                </div>
                              )}
                              {character.description && (
                                <div style={{ fontSize: 13, color: '#666', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                                  {character.description}
                                </div>
                              )}
                              {character.appearance && (
                                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                  <strong>外貌：</strong>
                                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
            <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}>{emptyStates.initial.icon}</div>
            <p>{emptyStates.initial.title}</p>
            <p style={{ fontSize: '12px' }}>{emptyStates.initial.description}</p>
          </div>
        )}
      </Card>
    </>
  );

  const renderSceneContent = () => (
    <Card style={{ 
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.95)'
    }}>
      <Empty
        image={<EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
        description="场景资源功能开发中"
        style={{ padding: '80px 0' }}
      >
        <p style={{ color: '#999', fontSize: 14, marginTop: 16 }}>
          即将支持场景提取、管理和生成功能
        </p>
      </Empty>
    </Card>
  );

  return (
    <div style={{
      minHeight: '60vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      borderRadius: '12px',
      margin: '-16px',
    }}>
      {/* 资源类型切换 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          <div
            onClick={() => setResourceType('character')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: resourceType === 'character' ? '#667eea' : 'transparent',
              color: resourceType === 'character' ? '#fff' : '#666',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <UserOutlined style={{ marginRight: 8 }} />
            角色 {savedCharacters.length > 0 && (
              <span style={{ 
                marginLeft: 8,
                background: resourceType === 'character' ? 'rgba(255,255,255,0.2)' : '#1890ff',
                color: resourceType === 'character' ? '#fff' : '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {savedCharacters.length}
              </span>
            )}
          </div>
          <div
            onClick={() => setResourceType('scene')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: resourceType === 'scene' ? '#667eea' : 'transparent',
              color: resourceType === 'scene' ? '#fff' : '#666',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            场景 <span style={{ 
              marginLeft: 8,
              background: resourceType === 'scene' ? 'rgba(255,255,255,0.2)' : '#1890ff',
              color: resourceType === 'scene' ? '#fff' : '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              0
            </span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {resourceType === 'character' && renderCharacterContent()}
      {resourceType === 'scene' && renderSceneContent()}

      {/* 图像生成弹窗 */}
      <ImageGenerateModal
        visible={generateModalVisible}
        title={
          selectedCharacterForImage 
            ? `生成角色图像 - ${selectedCharacterForImage.name}${
                selectedCharacterForImage.variant && selectedCharacterForImage.variant !== '默认' 
                  ? ` (${selectedCharacterForImage.variant})` 
                  : ''
              }` 
            : '生成图像'
        }
        initialValues={{
          shotType: '全景',
          scene: '纯白色背景',
          imagePrompt: selectedCharacterForImage?.description || '',
        }}
        scriptId={scriptId}
        loading={generateLoading}
        onCancel={() => {
          setGenerateModalVisible(false);
          setSelectedCharacterForImage(null);
        }}
        onSubmit={handleImageSubmit}
        onSave={handleSavePrompt}
      />
    </div>
  );
}

export default ResourcesTab;