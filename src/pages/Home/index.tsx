import { useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import TopNavBar from '@/components/Layout/cpns/TopNavBar';
import './style.css';

const features = [
  { icon: <EditOutlined />, title: 'AI 剧本创作', desc: '输入故事大纲，AI 自动生成分镜脚本' },
  { icon: <PictureOutlined />, title: '智能图像生成', desc: '多模型支持，一键生成高质量漫画画面' },
  { icon: <PlayCircleOutlined />, title: '图生视频', desc: '静态画面秒变动态短剧，支持多种风格' },
  { icon: <ThunderboltOutlined />, title: '批量生产', desc: '队列化任务管理，高效批量输出内容' },
];

const workflowSteps = ['输入故事大纲', 'AI 生成分镜', '生成画面', '合成视频'];

const showcaseImages = [
  'https://cdn.jeff1992.com/ai-video/2025/09/10/20250909164452_2.jpg',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/15/aa81c5c4d4ca434989278335f68ea243.png',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/15/a180958c835e4aaa92f029bce31b0f31.png',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/16/5971e82c857a485a9befb80022acfe26.png',
  'https://cdn.jeff1992.com/ai-video/2025/09/10/20250909164518_21.png',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/15/2af985bcd0e448359ac15279680714d0.png',
  'https://cdn.jeff1992.com/ai-video/2026/02/11/danglaoban.jpeg',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/16/079c9d2fc312427d88b01a8ae6e55270.jpg',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/16/9b08875175164d4693a6c6d7be7a36f1.jpg',
  'https://cdn.jeff1992.com/ai-video/2025/09/10/gongzhudianxia.jpeg',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/16/9f36c48412b9420c960abd9eb3053b8b.png',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/16/a6e65426c8c84348a880597282a82708.png',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/20/1ed762b9ef394c23b83da56dcd498a81.jpg',
  'https://cdn.jeff1992.com/j1-common-bucket/2025/10/20/4a54eb5db72b425187c874d1db1e9e81.jpg',
  'https://cdn.jeff1992.com/ai-video/2026/02/11/guiyishijie.jpeg',
  'https://cdn.jeff1992.com/ai-video/2025/11/17/sfbgl.jpg',
  'https://cdn.jeff1992.com/ai-video/2025/11/28/eikhpn_1764323292731.png',
  'https://cdn.jeff1992.com/ai-video/2026/01/31/古董夫君.jpeg',
  'https://cdn.jeff1992.com/ai-video/2025/12/29/tmp621zf1_1767001537512.jpg',
  'https://cdn.jeff1992.com/ai-video/2025/09/10/xingty4_0.jpeg',
  'https://cdn.jeff1992.com/ai-video/2026/02/11/guizheguaitan.jpeg',
  'https://cdn.jeff1992.com/ai-video/2026/02/11/guiyimori.jpeg',
];

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { theme } = useThemeStore();

  const handleCTA = () => navigate(currentUser ? '/ai-creation' : '/login');

  return (
    <div className="home-container" data-theme={theme}>
      {/* 主题1：星星 */}
      {theme === 'theme1' && (
        <div className="home-stars">
          {Array.from({ length: 80 }, (_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 粒子 */}
      <div className="home-particles">
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <TopNavBar showThemeToggle />

      {/* Hero */}
      <section className="home-hero">
        {theme === 'theme1' && (
          <video className="home-hero-video" autoPlay loop muted playsInline>
            <source src="/video/home.mp4" type="video/mp4" />
          </video>
        )}
        <div className="home-hero-overlay" />
        <div className="home-hero-glow" />
        <h1 className="home-hero-title">
          <span className="home-gradient-text">一站式AI短剧制作中心</span>
        </h1>
        <p className="home-hero-subtitle">智能平台高效创作 | 小投入产出大流量</p>
        <Space size="large" style={{ marginTop: 40 }}>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            className="home-cta-btn"
            onClick={handleCTA}
          >
            开始创作
          </Button>
          {theme === 'theme2' && (
            <Button
              size="large"
              ghost
              className="home-ghost-btn"
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              了解更多
            </Button>
          )}
        </Space>

        {theme === 'theme1' && (
          <div className="home-showcase">
            <div className="home-showcase-track">
              {[...showcaseImages, ...showcaseImages].map((src, i) => (
                <div key={i} className="home-showcase-card">
                  <img src={src} alt={`showcase-${i}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 功能卡片 */}
      <section id="features" className="home-features">
        <h2 className="home-section-title">核心能力</h2>
        <div className="home-features-grid">
          {features.map((f, i) => (
            <div key={i} className="home-feature-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="home-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 工作流 */}
      <section className="home-workflow">
        <h2 className="home-section-title">创作流程</h2>
        <div className="home-workflow-steps">
          {workflowSteps.map((step, i) => (
            <div key={i} className="home-workflow-step">
              <div className="home-step-number">{i + 1}</div>
              <span>{step}</span>
              {i < workflowSteps.length - 1 && <div className="home-step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="home-bottom-cta">
        <h2>准备好开始创作了吗？</h2>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          className="home-cta-btn"
          onClick={handleCTA}
        >
          免费开始
        </Button>
      </section>

      <footer className="home-footer">
        <span>© 2026 AI 漫剧工作台</span>
      </footer>
    </div>
  );
}
