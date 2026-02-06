import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Tag, Modal, message, Spin, Space, Typography, QRCode } from 'antd';
import { CheckCircleFilled, CrownFilled, FireFilled } from '@ant-design/icons';
import {
  getRechargePackages,
  createPreOrder,
  createJsapiOrder,
  queryOrderStatus,
  RechargePackage,
} from '../../api/payment';
import { useUserStore } from '../../stores/useUserStore';

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
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [paying, setPaying] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { refreshPoints } = useUserStore();

  // 加载套餐列表
  useEffect(() => {
    loadPackages();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

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
    if (!selectedPkg) {
      message.warning('请选择充值套餐');
      return;
    }

    setPaying(true);

    try {
      if (isWechatBrowser()) {
        // 微信内使用 JSAPI 支付
        const res = await createJsapiOrder(selectedPkg.id);
        if (res.success && res.data) {
          callWechatPay(res.data.payParams);
        } else {
          message.error(res.message || '创建订单失败');
        }
      } else {
        // PC 端生成二维码，用户扫码后在微信内支付
        const res = await createPreOrder(selectedPkg.id);
        if (res.success && res.data) {
          setOrderNo(res.data.orderNo);
          setPayUrl(res.data.payUrl);
          setPayModalVisible(true);
          // 开始轮询订单状态
          startPolling(res.data.orderNo);
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

  // 轮询订单状态
  const startPolling = (orderNo: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await queryOrderStatus(orderNo);
        if (res.status === 'paid') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPayModalVisible(false);
          message.success('支付成功！积分已到账');
          refreshPoints();
        }
      } catch (error) {
        // 忽略轮询错误
      }
    }, 2000);

    // 5分钟后停止轮询
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 5 * 60 * 1000);
  };

  // 关闭支付弹窗
  const handleClosePayModal = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPayModalVisible(false);
    setPayUrl('');
    setOrderNo('');
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
            onClick={() => setSelectedPkg(pkg)}
            style={{
              border: selectedPkg?.id === pkg.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
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

            {selectedPkg?.id === pkg.id && (
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
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Space direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            onClick={handlePay}
            loading={paying}
            disabled={!selectedPkg}
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
          {payUrl && (
            <QRCode value={payUrl} size={200} />
          )}
          <div style={{ marginTop: 16 }}>
            <Text>请使用微信扫码，在微信内完成支付</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">支付金额：</Text>
            <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
              ¥{selectedPkg?.amountYuan}
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
