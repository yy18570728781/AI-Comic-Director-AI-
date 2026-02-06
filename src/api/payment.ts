import request from './request';

/**
 * 充值套餐
 */
export interface RechargePackage {
  id: number;
  name: string;
  amount: number;
  amountYuan: number;
  bonus: number;
  points: number;
  tag: string | null;
  isHot: boolean;
}

/**
 * 获取充值套餐列表
 */
export async function getRechargePackages(): Promise<RechargePackage[]> {
  const res = await request.get('/api/payment/packages');
  return res.data || [];
}

/**
 * 创建预订单（PC端生成二维码用）
 */
export async function createPreOrder(packageId: number): Promise<{
  success: boolean;
  message: string;
  data?: {
    orderNo: string;
    payUrl: string;
  };
}> {
  return request.post('/api/payment/preorder/create', { packageId });
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(orderNo: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    orderNo: string;
    amount: number;
    amountYuan: number;
    points: number;
    status: string;
    packageName?: string;
  };
}> {
  return request.get('/api/payment/order/detail', { params: { orderNo } });
}

/**
 * 微信内发起支付
 */
export async function payOrder(orderNo: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  return request.post('/api/payment/order/pay', { orderNo });
}

/**
 * 创建 JSAPI 支付订单（公众号内直接支付）
 */
export async function createJsapiOrder(packageId: number): Promise<{
  success: boolean;
  message: string;
  data?: {
    orderNo: string;
    payParams: any;
  };
}> {
  return request.post('/api/payment/jsapi/create', { packageId });
}

/**
 * 查询订单状态
 */
export async function queryOrderStatus(orderNo: string): Promise<{
  success: boolean;
  status: string;
  message: string;
}> {
  return request.get('/api/payment/order/status', { params: { orderNo } });
}

/**
 * 获取充值记录
 */
export async function getRechargeOrders(page = 1, pageSize = 20): Promise<{
  success: boolean;
  data: any[];
  total: number;
}> {
  return request.get('/api/payment/orders', { params: { page, pageSize } });
}
