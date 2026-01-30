import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Card, Descriptions, message, Modal, Spin } from 'antd';
import { ArrowLeftOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { extractCharacters, batchSaveCharacters, getCharacterList } from '../../api/script';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Script } from '../../stores/useScriptStore';
import { useUserStore } from '../../stores/useUserStore';
import {
  ExtractedCharacter,
  SavedCharacter,
  characterTableColumns,
  savedCharacterTableColumns,
  characterTableConfig,
  savedCharacterTableConfig,
  getCharacterExpandedContent,
  getScriptDescriptionItems,
  emptyStates,
  buttonTexts,
  messages,
  confirmDialogs,
} from './ScriptCharacters/config';

function ScriptCharacters() {
  const navigate = useNavigate();
  const { scriptId } = useParams<{ scriptId: string }>();
  const location = useLocation();
  const script = location.state?.script as Script;
  const { currentUser } = useUserStore();

  // 获取已保存的角色列表
  const fetchSavedCharacters = async () => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setLoadingSaved(true);
    try {
      const response = await getCharacterList({
        userId: currentUser.id, // 使用当前用户ID
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

  // 页面加载时获取已保存的角色
  useEffect(() => {
    fetchSavedCharacters();
  }, []);

  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

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
    const charactersToSave = extractedCharacters.filter(c => 
      selectedCharacters.includes(c.name)
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
        // 刷新已保存角色列表
        fetchSavedCharacters();
        // 保存成功后可以选择是否清空当前提取结果
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

  // 返回角色库首页
  const handleBack = () => {
    navigate('/character-library');
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
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
              <strong>描述：</strong>{script.description}
            </div>
          )}
        </Card>
      )}

      {/* 已保存角色列表 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0 }}>已保存角色</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              当前用户已保存到角色库的所有角色
            </p>
          </div>
          <Button
            onClick={fetchSavedCharacters}
            loading={loadingSaved}
          >
            {buttonTexts.refreshSaved}
          </Button>
        </div>

        <Table
          dataSource={savedCharacters}
          columns={savedCharacterTableColumns}
          {...savedCharacterTableConfig}
          loading={loadingSaved}
          locale={{
            emptyText: '暂无已保存的角色',
          }}
        />
      </Card>

      {/* 操作区域 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

        {/* 提取中的加载状态 */}
        {extracting && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>
              {emptyStates.loading.title}
            </div>
          </div>
        )}

        {/* 角色列表 */}
        {!extracting && hasExtracted && (
          <>
            {extractedCharacters.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p>
                    提取到 <strong>{extractedCharacters.length}</strong> 个角色，
                    请选择要保存到角色库的角色：
                  </p>
                </div>
                <Table
                  dataSource={extractedCharacters}
                  columns={characterTableColumns}
                  {...characterTableConfig}
                  rowSelection={{
                    selectedRowKeys: selectedCharacters,
                    onChange: (selectedRowKeys) => {
                      setSelectedCharacters(selectedRowKeys as string[]);
                    },
                    onSelectAll: (selected) => {
                      if (selected) {
                        setSelectedCharacters(extractedCharacters.map(c => c.name));
                      } else {
                        setSelectedCharacters([]);
                      }
                    },
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ padding: '8px 0' }}>
                        <Descriptions 
                          size="small" 
                          column={1}
                          items={getCharacterExpandedContent(record)}
                        />
                      </div>
                    ),
                  }}
                />
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

        {/* 初始状态提示 */}
        {!extracting && !hasExtracted && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}>
              {emptyStates.initial.icon}
            </div>
            <p>{emptyStates.initial.title}</p>
            <p style={{ fontSize: '12px' }}>
              {emptyStates.initial.description}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ScriptCharacters;