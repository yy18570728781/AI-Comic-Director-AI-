import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import i18n from 'i18next';
import App from './App';
import './index.css';
import './brand/i18n';

dayjs.locale('zh-cn');
document.title = i18n.t('browserTitle');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorBgLayout: '#f5f5f5',
          colorPrimary: '#8b5cf6',
          colorInfo: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
