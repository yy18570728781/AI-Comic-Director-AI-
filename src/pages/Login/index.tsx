import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Space } from 'antd';
import { LockOutlined, LoginOutlined, UserAddOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithPassword, registerWithPassword, sendEmailCode, resetPassword } from '@/api/auth';
import { useUserStore } from '@/stores/useUserStore';
import EmailInput from '@/components/EmailInput';
import './style.css';

const { TabPane } = Tabs;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useUserStore();
  
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('login');

  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/';

  // 发送邮箱验证码（注册用）
  const handleSendEmailCode = async () => {
    try {
      const email = registerForm.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        message.error('邮箱格式不正确');
        return;
      }

      setSendingCode(true);
      const response: any = await sendEmailCode(email);
      
      if (response.success) {
        message.success('验证码发送成功，请查收邮件');
        // 开始倒计时
        startCountdown();
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error: any) {
      message.error('发送失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 发送邮箱验证码（重置密码用）
  const handleSendResetCode = async () => {
    try {
      const email = resetForm.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱地址');
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        message.error('邮箱格式不正确');
        return;
      }

      setSendingCode(true);
      const response: any = await sendEmailCode(email);
      
      if (response.success) {
        message.success('验证码发送成功，请查收邮件');
        // 开始倒计时
        startCountdown();
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error: any) {
      message.error('发送失败，请稍后重试');
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
        
        // 保存用户信息和token
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        
        // 跳转到目标页面
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
  const handleRegister = async (values: { email: string; password: string; confirmPassword: string; code: string }) => {
    try {
      setRegisterLoading(true);
      const response: any = await registerWithPassword(values.email, values.password, values.code);
      
      if (response.success) {
        message.success('注册成功，请登录');
        
        // 切换到登录页面并填充邮箱
        setActiveTab('login');
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
  const handleResetPassword = async (values: { email: string; code: string; newPassword: string; confirmPassword: string }) => {
    try {
      setResetLoading(true);
      const response: any = await resetPassword(values.email, values.code, values.newPassword);
      
      if (response.success) {
        message.success('密码重置成功，请使用新密码登录');
        
        // 切换到登录页面并填充邮箱
        setActiveTab('login');
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

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>AI Comic Studio</h1>
          <p>AI驱动的漫画创作平台</p>
        </div>

        <Card className="login-card">
          <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
            <TabPane
              tab={
                <span>
                  <LoginOutlined />
                  登录
                </span>
              }
              key="login"
            >
              <Form
                form={loginForm}
                name="login"
                onFinish={handleLogin}
                autoComplete="off"
                layout="vertical"
              >
                <Form.Item
                  label="邮箱地址"
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '邮箱格式不正确' }
                  ]}
                >
                  <EmailInput placeholder="请输入邮箱地址" />
                </Form.Item>

                <Form.Item
                  label="密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    size="large"
                  />
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

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button 
                    type="link" 
                    onClick={() => setActiveTab('reset')}
                    style={{ padding: 0 }}
                  >
                    忘记密码？
                  </Button>
                </div>
              </Form>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserAddOutlined />
                  注册
                </span>
              }
              key="register"
            >
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
                    { type: 'email', message: '邮箱格式不正确' }
                  ]}
                >
                  <EmailInput placeholder="请输入邮箱地址" />
                </Form.Item>

                <Form.Item
                  label="邮箱验证码"
                  name="code"
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { len: 6, message: '验证码为6位数字' }
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
                      onClick={handleSendEmailCode}
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
                    { max: 20, message: '密码最多20位' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码（6-20位）"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请再次输入密码"
                    size="large"
                  />
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
            </TabPane>

            <TabPane
              tab={
                <span>
                  <LockOutlined />
                  重置密码
                </span>
              }
              key="reset"
            >
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
                    { type: 'email', message: '邮箱格式不正确' }
                  ]}
                >
                  <EmailInput placeholder="请输入注册时的邮箱地址" />
                </Form.Item>

                <Form.Item
                  label="邮箱验证码"
                  name="code"
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { len: 6, message: '验证码为6位数字' }
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
                      onClick={handleSendResetCode}
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
                    { max: 20, message: '密码最多20位' }
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
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请再次输入新密码"
                    size="large"
                  />
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

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button 
                    type="link" 
                    onClick={() => setActiveTab('login')}
                    style={{ padding: 0 }}
                  >
                    返回登录
                  </Button>
                </div>
              </Form>
            </TabPane>
          </Tabs>

          <div className="login-tips">
            <p>💡 使用提示：</p>
            <ul>
              <li>注册时需要验证邮箱，请确保邮箱地址有效</li>
              <li>验证码有效期为5分钟，90秒内不能重复发送</li>
              <li>密码长度为6-20位</li>
              <li>忘记密码可通过邮箱验证码重置</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;