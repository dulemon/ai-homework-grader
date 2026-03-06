import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignRes, statsRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/stats/overview')
      ]);
      const assignData = await assignRes.json();
      const statsData = await statsRes.json();
      setAssignments(assignData);
      setStats(statsData);
    } catch (err) {
      toast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个作业吗？')) return;

    try {
      await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
      toast('删除成功', 'success');
      loadData();
    } catch {
      toast('删除失败', 'error');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <div className="page-header">
          <h1>👋 你好，{user?.name}</h1>
          <p>这里是你的教学管理中心</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-card-icon">📝</div>
            <div className="stat-card-value">{stats?.totalAssignments || 0}</div>
            <div className="stat-card-label">作业总数</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-icon">📮</div>
            <div className="stat-card-value">{stats?.totalSubmissions || 0}</div>
            <div className="stat-card-label">提交总数</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-icon">🤖</div>
            <div className="stat-card-value">{stats?.totalGraded || 0}</div>
            <div className="stat-card-label">已批改</div>
          </div>
          <div className="stat-card gold">
            <div className="stat-card-icon">⭐</div>
            <div className="stat-card-value">{stats?.avgScore || 0}</div>
            <div className="stat-card-label">平均分</div>
          </div>
        </div>

        {/* Assignments */}
        <div className="flex justify-between items-center mb-24">
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>📋 我的作业</h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/teacher/assignment/new')}
          >
            ✚ 创建作业
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>暂无作业</h3>
            <p>点击上方按钮创建第一个作业吧</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/teacher/assignment/new')}
            >
              ✚ 创建作业
            </button>
          </div>
        ) : (
          <div className="assignments-grid">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="assignment-card"
                onClick={() => navigate(`/teacher/assignment/${a.id}`)}
              >
                <div className="assignment-card-header">
                  <div>
                    <div className="assignment-card-title">{a.title}</div>
                    <div className="assignment-card-meta">
                      <span>📚 {a.subject}</span>
                      <span>📅 {new Date(a.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <span className="badge badge-info">{a.subject}</span>
                </div>
                <div className="assignment-card-desc">{a.description}</div>
                <div className="assignment-card-footer">
                  <div className="flex gap-12">
                    <span className="badge badge-neutral">📮 {a.submission_count} 提交</span>
                    <span className="badge badge-success">✅ {a.graded_count} 已批改</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleDelete(a.id, e)}
                    style={{ color: '#f5576c' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
