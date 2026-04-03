import React, { useState, useEffect } from 'react';
import { Button, message, Spin, Typography, Result } from 'antd';
import { WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { getOrderDetail, payOrder } from '../../api/payment';

const { Title, Text } = Typography;

/**
 * 检测是否在微信浏览器中
 */
function isWechatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

/**
 * 微信内支付页面
 * 用户扫码后在微信内打开此页面完成支付
 */
const PayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get('orderNo');

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    if (!orderNo) {
      setError('订单号不存在');
      setLoading(false);
      return;
    }

    if (!isWechatBrowser()) {
      setError('请在微信中打开此页面');
      setLoading(false);
      return;
    }

    loadOrderInfo();
  }, [orderNo]);

  const loadOrderInfo = async () => {
    try {
      const res = await getOrderDetail(orderNo!);
      if (res.success && res.data) {
        if (res.data.status === 'paid') {
          setPaySuccess(true);
        } else {
          setOrderInfo(res.data);
        }
      } else {
        setError(res.message || '订单不存在');
      }
    } catch (error) {
      setError('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  // 发起支付
  const handlePay = async () => {
    if (!orderNo) return;

    setPaying(true);

    try {
      // 直接调用支付接口，openid 已在订单中
      const res = await payOrder(orderNo);
      if (res.success && res.data) {
        callWechatPay(res.data);
      } else {
        message.error(res.message || '发起支付失败');
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
        setPaySuccess(true);
        message.success('支付成功！');
      } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
        message.info('已取消支付');
      } else {
        message.error('支付失败');
      }
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f5f5f5',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <Result status="error" title="出错了" subTitle={error} />
      </div>
    );
  }

  if (paySuccess) {
    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="支付成功"
          subTitle="积分已到账，请返回电脑端继续使用"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <WalletOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />

        <Title level={4} style={{ marginBottom: 24 }}>
          {orderInfo?.packageName || '积分充值'}
        </Title>

        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">支付金额</Text>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#f5222d', margin: '8px 0' }}>
            ¥{orderInfo?.amountYuan}
          </div>
          <Text type="secondary">获得 {orderInfo?.points} 积分</Text>
        </div>

        <Button
          type="primary"
          size="large"
          block
          loading={paying}
          onClick={handlePay}
          style={{ height: 48 }}
        >
          立即支付
        </Button>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            订单号：{orderNo}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default PayPage;
