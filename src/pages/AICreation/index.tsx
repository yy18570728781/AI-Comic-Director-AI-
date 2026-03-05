import { useState } from 'react';
import { Tabs } from 'antd';
import NovelGeneration from '@/pages/NovelGeneration';
import ScriptGeneration from '@/pages/ScriptGeneration';

function AICreation() {
  const [activeTab, setActiveTab] = useState('novel');

  const tabItems = [
    {
      key: 'novel',
      label: '小说生成',
      children: <NovelGeneration />,
    },
    {
      key: 'script',
      label: '剧本生成',
      children: <ScriptGeneration />,
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}

export default AICreation;
