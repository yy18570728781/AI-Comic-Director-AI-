import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Tag, Modal, message, Spin, Space, Typography, QRCode, InputNumber } from 'antd';
import { CheckCircleFilled, CrownFilled, FireFilled, EditOutlined } from '@ant-design/icons';
import {
  getRechargePackages,
  createPreOrder,
  createJsapiOrder,
  createCustomPreOrder,
  createCustomJsapiOrder,
  queryOrderStatus,
  RechargePackage,
} from '../../api/payment';
import { useUserStore } from '../../stores/useUserStore';
import { usePolling } from '@/hooks/usePolling';

const { Title, Text } = Typography;

/**
 * 检测是否在微信浏览器中
 */
function isWechatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

/**
 * 充值页面
 */
const RechargePage: React.FC = () => {
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<RechargePackage | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [paying, setPaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { refreshPoints } = useUserStore();

  // 倒计时时长（秒）
  const COUNTDOWN_SECONDS = 5 * 60; // 5分钟

  // 订单状态轮询
  const { start: startPolling, stop: stopPolling } = usePolling(
    useCallback(() => {
      if (!orderNo) return Promise.resolve({ status: 'pending' });
      return queryOrderStatus(orderNo);
    }, [orderNo]),
    {
      interval: 5000,
      shouldStop: (res) => res.status === 'paid',
      onSuccess: (res) => {
        if (res.status === 'paid') {
          message.success('支付成功！积分已到账');
          refreshPoints();
          // 关闭弹窗的逻辑会在下面的 effect 里通过 stopPolling 触发
          setPayModalVisible(false);
          setPayUrl('');
          setOrderNo('');
          setCountdown(0);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
        }
      },
    }
  );

  // 加载套餐列表
  useEffect(() => {
    loadPackages();
  }, []);

  // 当 orderNo 设置且弹窗打开时，开始轮询
  useEffect(() => {
    if (orderNo && payModalVisible) {
      startPolling();
    }
    return () => {
      stopPolling();
    };
  }, [orderNo, payModalVisible]);

  const loadPackages = async () => {
    try {
      const data = await getRechargePackages();
      setPackages(data);
      // 默认选中热门套餐
      const hotPkg = data.find(p => p.isHot);
      if (hotPkg) setSelectedPkg(hotPkg);
    } catch (error) {
      message.error('加载套餐失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始支付
  const handlePay = async () => {
    // 自定义金额模式
    if (isCustomMode) {
      if (!customAmount || customAmount < 10) {
        message.warning('充值金额不能低于10元');
        return;
      }
      if (customAmount > 10000) {
        message.warning('单笔充值金额不能超过10000元');
        return;
      }
    } else if (!selectedPkg) {
      message.warning('请选择充值套餐');
      return;
    }

    setPaying(true);

    try {
      if (isWechatBrowser()) {
        // 微信内使用 JSAPI 支付
        const res = isCustomMode
          ? await createCustomJsapiOrder(customAmount!)
          : await createJsapiOrder(selectedPkg!.id);
        if (res.success && res.data) {
          callWechatPay(res.data.payParams);
        } else {
          message.error(res.message || '创建订单失败');
        }
      } else {
        // PC 端生成二维码，用户扫码后在微信内支付
        const res = isCustomMode
          ? await createCustomPreOrder(customAmount!)
          : await createPreOrder(selectedPkg!.id);
        if (res.success && res.data) {
          setOrderNo(res.data.orderNo);
          setPayUrl(res.data.payUrl);
          setPayModalVisible(true);
          // 开始倒计时和轮询
          startCountdown();
        } else {
          message.error(res.message || '创建订单失败');
        }
      }
    } catch (error) {
      message.error('支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  // 调用微信 JSAPI 支付
  const callWechatPay = (payParams: any) => {
    if (typeof WeixinJSBridge === 'undefined') {
      message.error('请在微信中打开');
      return;
    }

    WeixinJSBridge.invoke('getBrandWCPayRequest', payParams, (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        message.success('支付成功！');
        refreshPoints();
      } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
        message.info('已取消支付');
      } else {
        message.error('支付失败');
      }
    });
  };

  // 倒计时
  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setCountdown(COUNTDOWN_SECONDS);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleClosePayModal();
          message.warning('支付超时，请重新下单');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 关闭支付弹窗
  const handleClosePayModal = () => {
    stopPolling();
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setPayModalVisible(false);
    setPayUrl('');
    setOrderNo('');
    setCountdown(0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        <CrownFilled style={{ color: '#faad14', marginRight: 8 }} />
        积分充值
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {packages.map(pkg => (
          <Card
            key={pkg.id}
            hoverable
            onClick={() => {
              setSelectedPkg(pkg);
              setIsCustomMode(false);
            }}
            style={{
              border: !isCustomMode && selectedPkg?.id === pkg.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
              position: 'relative',
            }}
          >
            {pkg.isHot && (
              <Tag color="red" style={{ position: 'absolute', top: 8, right: 8 }}>
                <FireFilled /> 推荐
              </Tag>
            )}
            {pkg.tag && !pkg.isHot && (
              <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8 }}>
                {pkg.tag}
              </Tag>
            )}

            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 18 }}>{pkg.name}</Text>
              <div style={{ margin: '16px 0' }}>
                {/* 计算原价：积分数 * 0.1 = 原价（1积分=0.1元） */}
                {pkg.points * 0.1 > pkg.amountYuan && (
                  <Text delete type="secondary" style={{ fontSize: 16, marginRight: 8 }}>
                    ¥{(pkg.points * 0.1).toFixed(0)}
                  </Text>
                )}
                <Text style={{ fontSize: 32, color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{pkg.amountYuan}
                </Text>
              </div>
              <div>
                <Text type="secondary">获得 </Text>
                <Text strong style={{ color: '#faad14', fontSize: 20 }}>{pkg.points}</Text>
                <Text type="secondary"> 积分</Text>
              </div>
              {pkg.tag && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="green">{pkg.tag}</Tag>
                </div>
              )}
            </div>

            {!isCustomMode && selectedPkg?.id === pkg.id && (
              <CheckCircleFilled
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  fontSize: 20,
                  color: '#1890ff',
                }}
              />
            )}
          </Card>
        ))}

        {/* 自定义金额卡片 */}
        <Card
          hoverable
          onClick={() => {
            setIsCustomMode(true);
            setSelectedPkg(null);
          }}
          style={{
            border: isCustomMode ? '2px solid #1890ff' : '1px solid #d9d9d9',
            position: 'relative',
          }}
        >
          <Tag color="purple" style={{ position: 'absolute', top: 8, right: 8 }}>
            <EditOutlined /> 自定义
          </Tag>

          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: 18 }}>自定义金额</Text>
            <div style={{ margin: '16px 0' }}>
              <InputNumber
                value={customAmount}
                onChange={(val) => setCustomAmount(val)}
                min={10}
                max={10000}
                precision={0}
                placeholder="输入金额"
                prefix="¥"
                style={{ width: 140, fontSize: 18 }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Text type="secondary">获得 </Text>
              <Text strong style={{ color: '#faad14', fontSize: 20 }}>
                {customAmount ? customAmount * 10 : 0}
              </Text>
              <Text type="secondary"> 积分</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>最低10元，无折扣</Text>
            </div>
          </div>

          {isCustomMode && (
            <CheckCircleFilled
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                fontSize: 20,
                color: '#1890ff',
              }}
            />
          )}
        </Card>
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Space direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            onClick={handlePay}
            loading={paying}
            disabled={!isCustomMode && !selectedPkg}
            style={{ width: 200, height: 48 }}
          >
            {isWechatBrowser() ? '立即支付' : '微信扫码支付'}
          </Button>
          <Text type="secondary">
            支付即表示同意《用户服务协议》
          </Text>
        </Space>
      </div>

      {/* 扫码支付弹窗 */}
      <Modal
        title="微信扫码支付"
        open={payModalVisible}
        onCancel={handleClosePayModal}
        footer={null}
        centered
        width={360}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {payUrl && <QRCode value={payUrl} size={200} />}
          </div>
          <div>
            <Text>请使用微信扫码，在微信内完成支付</Text>
          </div>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">支付金额：</Text>
            <Text strong style={{ color: '#f5222d', fontSize: 20 }}>
              ¥{isCustomMode ? customAmount : selectedPkg?.amountYuan}
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>订单号：{orderNo}</Text>
          </div>
          <div style={{ marginTop: 16, padding: '8px 16px', background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">剩余支付时间：</Text>
            <Text strong style={{ color: countdown < 60 ? '#f5222d' : '#1890ff', fontSize: 16 }}>
              {formatCountdown(countdown)}
            </Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>等待支付...</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RechargePage;
