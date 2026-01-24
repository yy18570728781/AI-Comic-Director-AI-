import { Card } from 'antd';

interface ScriptTabProps {
  content: string;
}

/**
 * 剧本标签页
 */
export default function ScriptTab({ content }: ScriptTabProps) {
  return (
    <Card>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{content}</div>
    </Card>
  );
}
