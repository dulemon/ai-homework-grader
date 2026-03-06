import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch(`/api/submissions/student/${user.id}`)
      ]);
      setAssignments(await aRes.json());
      setMySubmissions(await sRes.json());
    } catch {
      toast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submittedIds = new Set(mySubmissions.map(s => s.assignment_id));
  const scoredSubmissions = mySubmissions.filter(s => s.score !== null);
  const avgScore = scoredSubmissions.length > 0
    ? Math.round(scoredSubmissions.reduce((sum, s) => sum + s.score, 0) / scoredSubmissions.length)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <div className="page-header">
          <h1>👋 你好，{user?.name}</h1>
          <p>在这里查看和提交你的作业</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-card-icon">📝</div>
            <div className="stat-card-value">{assignments.length}</div>
            <div className="stat-card-label">作业总数</div>
          </div>
          <div className="stat-card success">
            <div className="stat-card-icon">📮</div>
            <div className="stat-card-value">{mySubmissions.length}</div>
            <div className="stat-card-label">已提交</div>
          </div>
          <div className="stat-card info">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-value">{scoredSubmissions.length}</div>
            <div className="stat-card-label">已批改</div>
          </div>
          <div className="stat-card gold">
            <div className="stat-card-icon">⭐</div>
            <div className="stat-card-value">{avgScore || '-'}</div>
            <div className="stat-card-label">平均分</div>
          </div>
        </div>

        {/* My Submissions */}
        {scoredSubmissions.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📊 我的成绩</h2>
            <div className="table-container mb-32">
              <table className="table">
                <thead>
                  <tr>
                    <th>作业</th>
                    <th>科目</th>
                    <th>提交时间</th>
                    <th>分数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {scoredSubmissions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.assignment_title}</td>
                      <td><span className="badge badge-info">{s.subject}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.submitted_at).toLocaleString('zh-CN')}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 800,
                          fontSize: 18,
                          color: s.score >= 80 ? '#38ef7d' : s.score >= 60 ? '#ffd200' : '#f5576c'
                        }}>
                          {s.score}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/grading/${s.id}`)}
                        >
                          📊 查看反馈
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Available assignments */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📋 所有作业</h2>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>暂无作业</h3>
            <p>老师还未发布作业</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {assignments.map(a => {
              const submitted = submittedIds.has(a.id);
              const sub = mySubmissions.find(s => s.assignment_id === a.id);
              return (
                <div
                  key={a.id}
                  className="assignment-card"
                  onClick={() => navigate(`/student/assignment/${a.id}`)}
                >
                  <div className="assignment-card-header">
                    <div>
                      <div className="assignment-card-title">{a.title}</div>
                      <div className="assignment-card-meta">
                        <span>📚 {a.subject}</span>
                        <span>👤 {a.teacher_name}</span>
                      </div>
                    </div>
                    {submitted ? (
                      sub?.score !== null && sub?.score !== undefined ? (
                        <span className="badge badge-success">✅ 已批改 {sub.score}分</span>
                      ) : (
                        <span className="badge badge-warning">⏳ 待批改</span>
                      )
                    ) : (
                      <span className="badge badge-neutral">📝 未提交</span>
                    )}
                  </div>
                  <div className="assignment-card-desc">{a.description}</div>
                  <div className="assignment-card-footer">
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      📅 {new Date(a.created_at).toLocaleDateString('zh-CN')}
                    </span>
                    <button className="btn btn-primary btn-sm">
                      {submitted ? '查看详情' : '去提交 →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
