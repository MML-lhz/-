import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 注册 Service Worker
// 仅在生产环境 + HTTPS（且证书有效）下注册，避免 frp 自签证书域名报错
const isHttps = window.location.protocol === 'https:';
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
if ('serviceWorker' in navigator && import.meta.env.PROD && (isHttps || isLocalhost)) {
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      if (registration.installing) {
        console.log('正在安装 Service Worker');
      } else if (registration.waiting) {
        console.log('已安装 Service Worker');
      } else if (registration.active) {
        console.log('激活 Service Worker');
      }
    } catch (error) {
      console.error(`Service Worker 注册失败：${error}`);
    }
  };

  registerServiceWorker();
}
