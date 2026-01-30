import React, { useState, useEffect } from 'react';
import { Input, Select } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { EMAIL_SUFFIXES, parseEmail, combineEmail } from '@/utils/emailUtils';
import { useEmailStore } from '@/stores/useEmailStore';

const { Option } = Select;

interface EmailInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  disabled?: boolean;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value = '',
  onChange,
  placeholder = '请输入邮箱地址',
  size = 'large',
  disabled = false
}) => {
  const { emailSuffix, setEmailSuffix } = useEmailStore();
  const [emailPrefix, setEmailPrefix] = useState('');

  // 初始化时解析邮箱
  useEffect(() => {
    if (value) {
      const { prefix } = parseEmail(value);
      setEmailPrefix(prefix);
    }
  }, [value]);

  // 处理前缀输入
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = e.target.value;
    setEmailPrefix(prefix);
    
    const fullEmail = combineEmail(prefix, emailSuffix);
    onChange?.(fullEmail);
  };

  // 处理后缀选择
  const handleSuffixChange = (suffix: string) => {
    setEmailSuffix(suffix); // 更新全局状态，所有组件自动同步
    
    const fullEmail = combineEmail(emailPrefix, suffix);
    onChange?.(fullEmail);
  };

  return (
    <Input.Group compact>
      <Input
        style={{ width: '60%' }}
        prefix={<MailOutlined />}
        placeholder="邮箱账户"
        size={size}
        value={emailPrefix}
        onChange={handlePrefixChange}
        disabled={disabled}
      />
      <Select
        style={{ width: '40%' }}
        size={size}
        value={emailSuffix}
        onChange={handleSuffixChange}
        showSearch
        placeholder="选择邮箱后缀"
        disabled={disabled}
        filterOption={(input, option) =>
          (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
        }
      >
        {EMAIL_SUFFIXES.map(suffix => (
          <Option key={suffix} value={suffix}>
            {suffix}
          </Option>
        ))}
      </Select>
    </Input.Group>
  );
};

export default EmailInput;