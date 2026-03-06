import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';

const API = '/api/auth';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? `${API}/register` : `${API}/login`;
      const body = isRegister
        ? { ...form, role }
        : { username: form.username, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '操作失败');
      }

      login(data.user, data.token);
      toast(isRegister ? '注册成功！' : '登录成功！', 'success');
      navigate(data.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🎓</div>
          <h1>AI 作业批改系统</h1>
          <p>智能批改 · 精准反馈 · 高效教学</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            登录
          </button>
          <button
            className={`login-tab ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            注册
          </button>
        </div>

        {isRegister && (
          <div className="role-selector">
            <div
              className={`role-option ${role === 'teacher' ? 'selected' : ''}`}
              onClick={() => setRole('teacher')}
            >
              <div className="role-option-icon">👨‍🏫</div>
              <div className="role-option-label">教师</div>
            </div>
            <div
              className={`role-option ${role === 'student' ? 'selected' : ''}`}
              onClick={() => setRole('student')}
            >
              <div className="role-option-icon">👨‍🎓</div>
              <div className="role-option-label">学生</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入您的姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              placeholder="请输入用户名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="请输入密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          {isRegister ? '已有账户？' : '还没有账户？'}
          <span
            style={{ color: 'var(--color-primary-light)', cursor: 'pointer', marginLeft: '4px' }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '去登录' : '去注册'}
          </span>
        </p>
      </div>
    </div>
  );
}
