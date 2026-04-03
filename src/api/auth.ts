import request from './request';

/**
 * 重置密码
 */
export function resetPassword(email: string, code: string, newPassword: string) {
  return request({
    url: '/api/auth/reset-password',
    method: 'POST',
    data: { email, code, newPassword },
  });
}

/**
 * 邮箱密码登录
 */
export function loginWithPassword(email: string, password: string) {
  return request({
    url: '/api/auth/login-with-password',
    method: 'POST',
    data: { email, password },
  });
}

/**
 * 邮箱密码注册
 */
export function registerWithPassword(email: string, password: string, code: string) {
  return request({
    url: '/api/auth/register-with-password',
    method: 'POST',
    data: { email, password, code },
  });
}

/**
 * 发送邮箱验证码
 */
export function sendEmailCode(email: string) {
  return request({
    url: '/api/auth/send-email-code',
    method: 'POST',
    data: { email },
  });
}

/**
 * 发送手机验证码
 */
export function sendSmsCode(phone: string) {
  return request({
    url: '/api/auth/send-sms-code',
    method: 'POST',
    data: { phone },
  });
}

/**
 * 邮箱验证码登录
 */
export function loginWithEmail(email: string, code: string) {
  return request({
    url: '/api/auth/login-with-email',
    method: 'POST',
    data: { email, code },
  });
}

/**
 * 手机验证码登录
 */
export function loginWithPhone(phone: string, code: string) {
  return request({
    url: '/api/auth/login-with-phone',
    method: 'POST',
    data: { phone, code },
  });
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  return request({
    url: '/api/auth/me',
    method: 'GET',
  });
}

/**
 * 刷新Token
 */
export function refreshToken() {
  return request({
    url: '/api/auth/refresh-token',
    method: 'POST',
  });
}

/**
 * 登出
 */
export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'POST',
  });
}
