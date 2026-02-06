import { request } from './request';

/**
 * 生成微信登录二维码
 */
export function generateWechatQrCode() {
  return request({
    url: '/api/wechat/qr-login/generate',
    method: 'POST',
  });
}

/**
 * 查询微信登录状态
 * @param sceneId 场景ID
 */
export function getWechatLoginStatus(sceneId: string) {
  return request({
    url: `/api/wechat/qr-login/status/${sceneId}`,
    method: 'GET',
  });
}
