import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Space } from 'antd';
import {
  LockOutlined,
  LoginOutlined,
  UserAddOutlined,
  SafetyOutlined,
  WechatOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginWithPassword, registerWithPassword, sendEmailCode, resetPassword } from '@/api/auth';
import { useUserStore } from '@/stores/useUserStore';
import WechatQrLogin from '@/components/WechatQrLogin';
import './style.css';

type LoginMethod = 'wechat' | 'email';
type EmailTab = 'login' | 'register' | 'reset';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { setCurrentUser } = useUserStore();

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 一级菜单：微信 / 邮箱
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wechat');
  // 二级菜单（邮箱下）：登录 / 注册 / 重置密码
  const [emailTab, setEmailTab] = useState<EmailTab>('login');

  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/';

  // 微信登录成功回调
  const handleWechatLoginSuccess = (token: string, userInfo: any) => {
    message.success('登录成功');
    setCurrentUser(userInfo);
    localStorage.setItem('token', token);
    navigate(from, { replace: true });
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async (formInstance: any) => {
    try {
      const email = formInstance.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }

      await formInstance.validateFields(['email']);

      setSendingCode(true);
      const response: any = await sendEmailCode(email);
      if (response.success) {
        message.success('验证码发送成功，请查收邮件');
        startCountdown();
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请输入正确的邮箱地址');
      } else {
        message.error('发送失败，请稍后重试');
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 倒计时
  const startCountdown = () => {
    setCountdown(90);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 邮箱登录
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoginLoading(true);
      const response: any = await loginWithPassword(values.email, values.password);
      if (response.success) {
        message.success('登录成功');
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        navigate(from, { replace: true });
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error: any) {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  // 邮箱注册
  const handleRegister = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
  }) => {
    try {
      setRegisterLoading(true);
      const response: any = await registerWithPassword(values.email, values.password, values.code);
      if (response.success) {
        message.success('注册成功，请登录');
        setEmailTab('login');
        loginForm.setFieldsValue({ email: values.email });
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error: any) {
      message.error('注册失败，请稍后重试');
    } finally {
      setRegisterLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (values: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setResetLoading(true);
      const response: any = await resetPassword(values.email, values.code, values.newPassword);
      if (response.success) {
        message.success('密码重置成功，请使用新密码登录');
        setEmailTab('login');
        loginForm.setFieldsValue({ email: values.email });
      } else {
        message.error(response.message || '重置密码失败');
      }
    } catch (error: any) {
      message.error('重置密码失败，请稍后重试');
    } finally {
      setResetLoading(false);
    }
  };

  // 渲染邮箱登录表单
  const renderEmailLoginForm = () => (
    <Form form={loginForm} name="login" onFinish={handleLogin} autoComplete="off" layout="vertical">
      <Form.Item
        label="邮箱地址"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '邮箱格式不正确' },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" size="large" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loginLoading}
          block
          icon={<LoginOutlined />}
        >
          登录
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Button type="link" onClick={() => setEmailTab('reset')} style={{ padding: 0 }}>
          忘记密码？
        </Button>
      </div>
    </Form>
  );

  // 渲染邮箱注册表单
  const renderEmailRegisterForm = () => (
    <Form
      form={registerForm}
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        label="邮箱地址"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '邮箱格式不正确' },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" size="large" />
      </Form.Item>
      <Form.Item
        label="邮箱验证码"
        name="code"
        rules={[
          { required: true, message: '请输入验证码' },
          { len: 6, message: '验证码为6位数字' },
        ]}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<SafetyOutlined />}
            placeholder="请输入6位验证码"
            size="large"
            maxLength={6}
          />
          <Button
            size="large"
            onClick={() => handleSendEmailCode(registerForm)}
            loading={sendingCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown}s` : '发送验证码'}
          </Button>
        </Space.Compact>
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
          { max: 20, message: '密码最多20位' },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（6-20位）" size="large" />
      </Form.Item>
      <Form.Item
        label="确认密码"
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) return Promise.resolve();
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={registerLoading}
          block
          icon={<UserAddOutlined />}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染重置密码表单
  const renderResetPasswordForm = () => (
    <Form
      form={resetForm}
      name="reset-password"
      onFinish={handleResetPassword}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        label="邮箱地址"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '邮箱格式不正确' },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入注册时的邮箱地址" size="large" />
      </Form.Item>
      <Form.Item
        label="邮箱验证码"
        name="code"
        rules={[
          { required: true, message: '请输入验证码' },
          { len: 6, message: '验证码为6位数字' },
        ]}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<SafetyOutlined />}
            placeholder="请输入6位验证码"
            size="large"
            maxLength={6}
          />
          <Button
            size="large"
            onClick={() => handleSendEmailCode(resetForm)}
            loading={sendingCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown}s` : '发送验证码'}
          </Button>
        </Space.Compact>
      </Form.Item>
      <Form.Item
        label="新密码"
        name="newPassword"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6位' },
          { max: 20, message: '密码最多20位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入新密码（6-20位）"
          size="large"
        />
      </Form.Item>
      <Form.Item
        label="确认新密码"
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={resetLoading}
          block
          icon={<LockOutlined />}
        >
          重置密码
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Button type="link" onClick={() => setEmailTab('login')} style={{ padding: 0 }}>
          返回登录
        </Button>
      </div>
    </Form>
  );

  // 邮箱登录区域的子 Tab 配置
  const emailTabItems = [
    {
      key: 'login',
      label: (
        <span>
          <LoginOutlined /> 登录
        </span>
      ),
      children: renderEmailLoginForm(),
    },
    {
      key: 'register',
      label: (
        <span>
          <UserAddOutlined /> 注册
        </span>
      ),
      children: renderEmailRegisterForm(),
    },
    {
      key: 'reset',
      label: (
        <span>
          <LockOutlined /> 重置密码
        </span>
      ),
      children: renderResetPasswordForm(),
    },
  ];

  // 一级 Tab 配置
  const mainTabItems = [
    {
      key: 'wechat',
      label: (
        <span>
          <WechatOutlined /> 微信扫码
        </span>
      ),
      children: <WechatQrLogin onSuccess={handleWechatLoginSuccess} />,
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined /> 邮箱登录
        </span>
      ),
      children: (
        <Tabs
          activeKey={emailTab}
          onChange={(key) => setEmailTab(key as EmailTab)}
          centered
          size="small"
          items={emailTabItems}
        />
      ),
    },
  ];

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>{t('loginTitle')}</h1>
          <p>AI驱动的漫画创作平台</p>
        </div>

        <Card className="login-card">
          <Tabs
            activeKey={loginMethod}
            onChange={(key) => setLoginMethod(key as LoginMethod)}
            centered
            items={mainTabItems}
          />

          <div className="login-tips">
            <p>💡 使用提示：</p>
            <ul>
              <li>微信扫码：关注公众号即可快速登录</li>
              <li>邮箱登录：需要先注册账号</li>
              <li>验证码有效期为5分钟</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;
