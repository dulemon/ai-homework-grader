import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { apiFetch, getRecommendedApiBaseUrl, normalizeApiBaseUrl } from '../utils/api';
import { isNativeApp } from '../utils/platform';
import { clearStoredApiBaseUrl, getStoredApiBaseUrl, persistApiBaseUrl } from '../utils/storage';

export default function Login() {
  const nativeApp = isNativeApp();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiConfigOpen, setApiConfigOpen] = useState(false);
  const [apiConfigLoading, setApiConfigLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadApiBaseUrl = async () => {
      const stored = await getStoredApiBaseUrl();
      if (!active) return;

      setApiBaseUrl(stored || getRecommendedApiBaseUrl());
      if (nativeApp && !stored) {
        setApiConfigOpen(true);
      }
    };

    void loadApiBaseUrl();

    return () => {
      active = false;
    };
  }, []);

  const validateApiBaseUrl = () => {
    const normalized = normalizeApiBaseUrl(apiBaseUrl);
    const isRelativeApi = normalized === '/api';
    const isAbsoluteApi = /^https?:\/\/.+\/api$/i.test(normalized);

    if (!isRelativeApi && !isAbsoluteApi) {
      throw new Error('服务地址必须是 /api 或 http://.../api');
    }
    return normalized;
  };

  const handleSaveApiBaseUrl = async () => {
    try {
      const normalized = validateApiBaseUrl();
      await persistApiBaseUrl(normalized);
      setApiBaseUrl(normalized);
      toast('服务地址已保存', 'success');
      setApiConfigOpen(false);
    } catch (err) {
      toast(err.message || '保存失败', 'error');
    }
  };

  const handleResetApiBaseUrl = async () => {
    const fallback = getRecommendedApiBaseUrl();
    await clearStoredApiBaseUrl();
    setApiBaseUrl(fallback);
    toast('已恢复默认服务地址', 'success');
  };

  const handleTestApiBaseUrl = async () => {
    let normalized;
    try {
      normalized = validateApiBaseUrl();
    } catch (err) {
      toast(err.message || '地址格式不正确', 'error');
      return;
    }

    setApiConfigLoading(true);

    try {
      const response = await fetch(`${normalized}/health`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`服务返回 ${response.status}`);
      }

      await response.json();
      toast('服务连接正常', 'success');
    } catch (err) {
      toast(err.message || '无法连接到服务端', 'error');
    } finally {
      setApiConfigLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { ...form, role }
        : { username: form.username, password: form.password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
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

        {nativeApp && (
          <div className="server-config-card">
            <div className="server-config-row">
              <div>
                <div className="server-config-title">服务端地址</div>
                <div className="server-config-value">{apiBaseUrl || getRecommendedApiBaseUrl()}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setApiConfigOpen((open) => !open)}
              >
                {apiConfigOpen ? '收起' : '设置'}
              </button>
            </div>

            {apiConfigOpen && (
              <div className="server-config-form">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">API 地址</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="http://192.168.1.10:3001/api"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                  />
                </div>
                <p className="server-config-hint">
                  真机请填写电脑或服务器地址，格式必须以 `/api` 结尾。
                </p>
                <div className="server-config-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => void handleResetApiBaseUrl()}
                  >
                    恢复默认
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => void handleTestApiBaseUrl()}
                    disabled={apiConfigLoading}
                  >
                    {apiConfigLoading ? '检测中...' : '测试连接'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => void handleSaveApiBaseUrl()}
                  >
                    保存地址
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
