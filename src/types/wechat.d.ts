// 微信 JS Bridge 类型声明
interface WeixinJSBridge {
  invoke(
    api: string,
    params: any,
    callback: (res: { err_msg: string }) => void
  ): void;
}

declare global {
  interface Window {
    WeixinJSBridge: WeixinJSBridge;
  }
  const WeixinJSBridge: WeixinJSBridge;
}

export {};
