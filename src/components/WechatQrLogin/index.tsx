import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spin, Button, message } from 'antd';
import { ReloadOutlined, WechatOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { generateWechatQrCode, getWechatLoginStatus } from '@/api/wechat';
import { usePolling } from '@/hooks/usePolling';

interface WechatQrLoginProps {
  onSuccess: (token: string, userInfo: any) => void;
}

type LoginStatus = 'loading' | 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error';

const WechatQrLogin: React.FC<WechatQrLoginProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<LoginStatus>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sceneId, setSceneId] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSuccessRef = useRef(onSuccess);

  // 保持 onSuccess 最新引用
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // 使用轮询 hook
  const { start: startPolling, stop: stopPolling } = usePolling(
    useCallback(() => {
      if (!sceneId) return Promise.resolve({ success: false, data: {} });
      return getWechatLoginStatus(sceneId);
    }, [sceneId]),
    {
      interval: 3500,
      shouldStop: (res: any) => {
        const loginStatus = res?.data?.status;
        return loginStatus === 'confirmed' || loginStatus === 'expired';
      },
      onSuccess: (res: any) => {
        if (!res.success) return;
        const { status: loginStatus, token, userInfo } = res.data;

        if (loginStatus === 'scanned') {
          setStatus('scanned');
        } else if (loginStatus === 'confirmed' && token) {
          setStatus('confirmed');
          stopCountdown();
          onSuccessRef.current(token, userInfo);
        } else if (loginStatus === 'expired') {
          setStatus('expired');
          stopCountdown();
        }
      },
    }
  );

  // 停止倒计时
  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // 倒计时
  const startCountdown = (seconds: number) => {
    stopCountdown();
    setCountdown(seconds);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          stopPolling();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 生成二维码
  const generateQrCode = useCallback(async () => {
    try {
      setStatus('loading');
      stopPolling();
      stopCountdown();

      const response: any = await generateWechatQrCode();

      if (response.success) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setSceneId(response.data.sceneId);
        setStatus('waiting');

        // 计算倒计时秒数
        const seconds = Math.floor((response.data.expireTime - Date.now()) / 1000);
        startCountdown(seconds);
      } else {
        setStatus('error');
        message.error(response.message || '生成二维码失败');
      }
    } catch (error) {
      setStatus('error');
    }
  }, [stopPolling]);

  // sceneId 变化时开始轮询
  useEffect(() => {
    if (sceneId && status === 'waiting') {
      startPolling();
    }
  }, [sceneId, status, startPolling]);

  // 组件挂载时生成二维码
  useEffect(() => {
    generateQrCode();

    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  // 渲染状态提示
  const renderStatusTip = () => {
    switch (status) {
      case 'loading':
        return <span style={{ color: '#999' }}>正在加载二维码...</span>;
      case 'waiting':
        return (
          <span style={{ color: '#666' }}>
            请使用微信扫描二维码登录
            <span style={{ color: '#999', marginLeft: 8 }}>({countdown}s)</span>
          </span>
        );
      case 'scanned':
        return <span style={{ color: '#52c41a' }}>扫描成功，请在手机上确认</span>;
      case 'confirmed':
        return (
          <span style={{ color: '#52c41a' }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            登录成功
          </span>
        );
      case 'expired':
        return <span style={{ color: '#ff4d4f' }}>二维码已过期，请刷新</span>;
      case 'error':
        return <span style={{ color: '#ff4d4f' }}>加载失败，请重试</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      {/* 二维码区域 */}
      <div
        style={{
          width: 200,
          height: 200,
          margin: '0 auto 16px',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {status === 'loading' ? (
          <Spin size="large" />
        ) : status === 'error' || status === 'expired' ? (
          <div style={{ textAlign: 'center' }}>
            <WechatOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 8 }} />
            <br />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={generateQrCode}
              style={{ backgroundColor: '#07c160', borderColor: '#07c160' }}
            >
              刷新二维码
            </Button>
          </div>
        ) : (
          <>
            <img
              src={qrCodeUrl}
              alt="微信登录二维码"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* 扫描成功遮罩 */}
            {status === 'scanned' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#fff',
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 8 }} />
                <span>扫描成功</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 状态提示 */}
      <div style={{ marginBottom: 16 }}>{renderStatusTip()}</div>

      {/* 微信图标和说明 */}
      <div style={{ color: '#999', fontSize: 12 }}>
        <WechatOutlined style={{ color: '#07c160', marginRight: 4 }} />
        关注公众号即可完成登录
      </div>
    </div>
  );
};

export default WechatQrLogin;
