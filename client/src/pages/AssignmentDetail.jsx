import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../App';
import Sidebar from '../components/Sidebar';
import ScoreRing from '../components/ScoreRing';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [aRes, sRes, stRes] = await Promise.all([
        fetch(`/api/assignments/${id}`),
        fetch(`/api/submissions/assignment/${id}`),
        fetch(`/api/stats/assignment/${id}`)
      ]);
      setAssignment(await aRes.json());
      setSubmissions(await sRes.json());
      setStats(await stRes.json());
    } catch {
      toast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    setGradingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, { method: 'POST' });
      if (!res.ok) throw new Error('批改失败');
      toast('AI 批改完成！', 'success');
      loadData();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setGradingId(null);
    }
  };

  const handleGradeAll = async () => {
    const ungraded = submissions.filter(s => s.score === null);
    if (ungraded.length === 0) {
      toast('所有作业已批改', 'info');
      return;
    }

    for (const sub of ungraded) {
      setGradingId(sub.id);
      try {
        await fetch(`/api/submissions/${sub.id}/grade`, { method: 'POST' });
      } catch {
        // continue with others
      }
    }
    setGradingId(null);
    toast(`已完成 ${ungraded.length} 份批改`, 'success');
    loadData();
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <button className="back-btn" onClick={() => navigate('/teacher')}>
          ← 返回仪表盘
        </button>

        {/* Header */}
        <div className="card mb-24">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{assignment?.title}</h1>
              <div className="flex gap-16" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                <span>📚 {assignment?.subject}</span>
                <span>👤 {assignment?.teacher_name}</span>
                <span>📅 {new Date(assignment?.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
            {stats && (
              <ScoreRing score={Math.round(stats.avg_score || 0)} size={80} strokeWidth={6} label="平均分" />
            )}
          </div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {assignment?.description}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-card-icon">📮</div>
              <div className="stat-card-value">{stats.total_submissions}</div>
              <div className="stat-card-label">提交数</div>
            </div>
            <div className="stat-card success">
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-value">{stats.graded_count}</div>
              <div className="stat-card-label">已批改</div>
            </div>
            <div className="stat-card info">
              <div className="stat-card-icon">📈</div>
              <div className="stat-card-value">{stats.max_score || '-'}</div>
              <div className="stat-card-label">最高分</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-card-icon">📉</div>
              <div className="stat-card-value">{stats.min_score || '-'}</div>
              <div className="stat-card-label">最低分</div>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="flex justify-between items-center mb-16">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📋 学生提交</h2>
          {submissions.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={handleGradeAll}>
              🤖 一键批改全部
            </button>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>暂无提交</h3>
            <p>等待学生提交作业</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>提交时间</th>
                  <th>内容预览</th>
                  <th>分数</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.submitted_at).toLocaleString('zh-CN')}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.content.slice(0, 60)}...
                    </td>
                    <td>
                      {s.score !== null ? (
                        <span style={{
                          fontWeight: 800,
                          fontSize: 18,
                          color: s.score >= 80 ? '#38ef7d' : s.score >= 60 ? '#ffd200' : '#f5576c'
                        }}>
                          {s.score}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {s.score !== null ? (
                        <span className="badge badge-success">已批改</span>
                      ) : (
                        <span className="badge badge-warning">待批改</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        {s.score !== null ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/grading/${s.id}`)}
                          >
                            📊 查看
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleGrade(s.id)}
                            disabled={gradingId === s.id}
                          >
                            {gradingId === s.id ? '批改中...' : '🤖 AI 批改'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
