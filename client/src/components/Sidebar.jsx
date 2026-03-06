import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const TEACHER_MENU = [
  { key: '/teacher', icon: '📊', label: '仪表盘' },
  { key: '/teacher/assignment/new', icon: '📝', label: '创建作业' },
];

const STUDENT_MENU = [
  { key: '/student', icon: '📊', label: '仪表盘' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = user?.role === 'teacher' ? TEACHER_MENU : STUDENT_MENU;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🎓</div>
            <span className="sidebar-logo-text">AI 作业批改</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
              onClick={() => handleNav(item.key)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{user?.name?.[0]}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'teacher' ? '教师' : '学生'}</div>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={() => { logout(); navigate('/login'); }}
            style={{ marginTop: 8, color: '#e11d48' }}
          >
            <span className="nav-item-icon">🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation (Mobile) */}
      <div className="bottom-nav">
        <div className="bottom-nav-items">
          {menu.map((item) => (
            <button
              key={item.key}
              className={`bottom-nav-item ${location.pathname === item.key ? 'active' : ''}`}
              onClick={() => handleNav(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className="bottom-nav-item"
            onClick={() => setMobileOpen(true)}
          >
            <span className="nav-icon">👤</span>
            <span>我的</span>
          </button>
        </div>
      </div>
    </>
  );
}
