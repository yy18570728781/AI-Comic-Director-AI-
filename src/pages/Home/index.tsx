import { useNavigate } from 'react-router-dom';
import { Button, Menu, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  EditOutlined,
  SwapOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { topMenuItems } from '@/components/Layout/menuConfig';
import '@/components/Layout/cpns/topnav.css';
import './style.css';

const features = [
  { icon: <EditOutlined />, title: 'AI 剧本创作', desc: '输入故事大纲，AI 自动生成分镜脚本' },
  { icon: <PictureOutlined />, title: '智能图像生成', desc: '多模型支持，一键生成高质量漫画画面' },
  { icon: <PlayCircleOutlined />, title: '图生视频', desc: '静态画面秒变动态短剧，支持多种风格' },
  { icon: <ThunderboltOutlined />, title: '批量生产', desc: '队列化任务管理，高效批量输出内容' },
];

const workflowSteps = ['输入故事大纲', 'AI 生成分镜', '生成画面', '合成视频'];

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleCTA = () => navigate(currentUser ? '/ai-creation' : '/login');

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(currentUser ? key : '/login');
    }
  };

  return (
    <div className="home-container" data-theme={theme}>
      {/* 主题1：星星 */}
      {theme === 'theme1' && (
        <div className="home-stars">
          {Array.from({ length: 80 }, (_, i) => (
            <span key={i} className="star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
          ))}
        </div>
      )}

      {/* 粒子 */}
      <div className="home-particles">
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }} />
        ))}
      </div>

      {/* ========== 主题1 导航：蓝星AI风格顶部菜单 ========== */}
      {theme === 'theme1' && (
        <nav className="home-nav home-nav-theme1">
          <div className="home-nav-left">
            <div className="home-nav-logo">
              <img src="/image/logo2.png" alt="logo" className="home-logo-img" />
              <span className="home-logo-text">AI 漫剧工作台</span>
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={['/']}
              items={topMenuItems}
              onClick={handleMenuClick}
              className="topnav-menu"
            />
          </div>
          <div className="home-nav-actions">
            <Tooltip title="切换主题">
              <button className="home-theme-toggle" onClick={toggleTheme}><SwapOutlined /></button>
            </Tooltip>
            {currentUser ? (
              <>
                <Button type="primary" danger size="small" icon={<WalletOutlined />} onClick={() => navigate('/recharge')}>
                  积分充值
                </Button>
                <span className="home-nav-points">可用积分: <strong>{currentUser.points ?? 0}</strong></span>
                <span className="home-nav-username">{currentUser.username || '用户'}</span>
              </>
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}>登录 / 注册</Button>
            )}
          </div>
        </nav>
      )}

      {/* ========== 主题2 导航：简约风格 ========== */}
      {theme === 'theme2' && (
        <nav className="home-nav home-nav-theme2">
          <div className="home-nav-left">
            <div className="home-nav-logo">
              <img src="/image/logo2.png" alt="logo" className="home-logo-img" />
              <span className="home-logo-text">AI 漫剧工作台</span>
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={['/']}
              items={topMenuItems}
              onClick={handleMenuClick}
              className="topnav-menu"
            />
          </div>
          <div className="home-nav-actions">
            <Tooltip title="切换主题">
              <button className="home-theme-toggle" onClick={toggleTheme}><SwapOutlined /></button>
            </Tooltip>
            {currentUser ? (
              <Button type="primary" size="large" onClick={() => navigate('/ai-creation')}>进入工作台</Button>
            ) : (
              <Button type="primary" size="large" onClick={() => navigate('/login')}>登录 / 注册</Button>
            )}
          </div>
        </nav>
      )}

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-glow" />
        <h1 className="home-hero-title">
          <span className="home-gradient-text">蓝星 AI</span>
          {theme === 'theme1' && <span className="home-hero-badge">一站式AI短剧制作中心</span>}
        </h1>
        {theme === 'theme2' && (
          <p className="home-hero-subtitle">从剧本到分镜，从画面到视频，一站式 AI 漫剧生产工作流</p>
        )}
        <Space size="large" style={{ marginTop: 40 }}>
          <Button type="primary" size="large" icon={<ThunderboltOutlined />} className="home-cta-btn" onClick={handleCTA}>
            开始创作
          </Button>
          {theme === 'theme2' && (
            <Button size="large" ghost className="home-ghost-btn"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              了解更多
            </Button>
          )}
        </Space>
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
        <Button type="primary" size="large" icon={<ThunderboltOutlined />} className="home-cta-btn" onClick={handleCTA}>
          免费开始
        </Button>
      </section>

      <footer className="home-footer">
        <span>© 2026 AI 漫剧工作台</span>
      </footer>
    </div>
  );
}
