import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';
import ScoreRing from '../components/ScoreRing';

export default function GradingResult() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/submissions/${id}`);
      if (!res.ok) throw new Error();
      setSubmission(await res.json());
    } catch {
      toast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return { text: '优秀', color: '#0d9488' };
    if (score >= 80) return { text: '良好', color: '#2563eb' };
    if (score >= 70) return { text: '中等', color: '#d97706' };
    if (score >= 60) return { text: '及格', color: '#9333ea' };
    return { text: '需努力', color: '#e11d48' };
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

  if (!submission || submission.score === null || submission.score === undefined) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content page-enter">
          <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h3>尚未批改</h3>
            <p>这份作业还未进行 AI 批改</p>
          </div>
        </div>
      </div>
    );
  }

  const level = getScoreLevel(submission.score);
  const questions = submission.questions_json || [];
  const objAnswers = submission.objective_answers || {};

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>

        {/* Score Header */}
        <div className="card mb-24">
          <div className="grading-header">
            <div className="grading-score-section">
              <ScoreRing score={submission.score} size={140} strokeWidth={10} />
              <div style={{
                textAlign: 'center',
                marginTop: 12,
                padding: '6px 16px',
                borderRadius: 20,
                background: `${level.color}12`,
                color: level.color,
                fontWeight: 700,
                fontSize: 14
              }}>
                {level.text}
              </div>
            </div>

            <div className="grading-info-section">
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
                {submission.assignment_title}
              </h1>
              <div className="flex gap-16 mb-16" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                <span>📚 {submission.subject}</span>
                <span>👤 {submission.student_name}</span>
                <span>📅 {new Date(submission.graded_at).toLocaleString('zh-CN')}</span>
              </div>

              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                lineHeight: 1.8,
                fontSize: 15,
                color: 'var(--text-secondary)'
              }}>
                💬 {submission.feedback}
              </div>
            </div>
          </div>
        </div>

        {/* Objective Question Results */}
        {questions.length > 0 && (
          <div className="card mb-24">
            <div className="grading-section-title">
              <span style={{ fontSize: 20 }}>📋</span> 客观题详情
            </div>
            {questions.map((q, qi) => {
              const studentAns = objAnswers[q.id] || '未作答';
              const isCorrect = studentAns.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
              return (
                <div key={q.id} className="question-item" style={{
                  borderLeft: `3px solid ${isCorrect ? '#0d9488' : '#e11d48'}`
                }}>
                  <div className="flex justify-between items-center mb-8">
                    <span style={{ fontWeight: 600, fontSize: 14 }}>第 {qi + 1} 题</span>
                    <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                      {isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                  <p style={{ marginBottom: 8, color: 'var(--text-primary)' }}>{q.question}</p>
                  <div className="flex gap-16" style={{ fontSize: 13 }}>
                    <span style={{ color: isCorrect ? '#0d9488' : '#e11d48' }}>
                      你的答案: <strong>{studentAns}</strong>
                    </span>
                    {!isCorrect && (
                      <span style={{ color: '#0d9488' }}>
                        正确答案: <strong>{q.correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="grading-sections">
          {submission.strengths && submission.strengths.length > 0 && (
            <div className="card">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>✅</span> 优点
              </div>
              <div className="feedback-list">
                {submission.strengths.map((item, i) => (
                  <div key={i} className="feedback-item">
                    <div className="feedback-icon strength">👍</div>
                    <div className="feedback-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.weaknesses && submission.weaknesses.length > 0 && (
            <div className="card">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>⚠️</span> 不足
              </div>
              <div className="feedback-list">
                {submission.weaknesses.map((item, i) => (
                  <div key={i} className="feedback-item">
                    <div className="feedback-icon weakness">📌</div>
                    <div className="feedback-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.suggestions && submission.suggestions.length > 0 && (
            <div className="card">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>💡</span> 改进建议
              </div>
              <div className="feedback-list">
                {submission.suggestions.map((item, i) => (
                  <div key={i} className="feedback-item">
                    <div className="feedback-icon suggestion">🔧</div>
                    <div className="feedback-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Student Answer */}
        {submission.content && (
          <div className="card mt-24">
            <div className="grading-section-title">
              <span style={{ fontSize: 20 }}>📝</span> 主观题答案
            </div>
            <div style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              lineHeight: 1.8,
              fontSize: 14,
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)',
              maxHeight: 400,
              overflow: 'auto'
            }}>
              {submission.content}
            </div>
          </div>
        )}

        {user?.role === 'teacher' && submission.reference_answer && (
          <div className="card mt-24">
            <div className="grading-section-title">
              <span style={{ fontSize: 20 }}>📖</span> 参考答案
            </div>
            <div style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(102, 126, 234, 0.04)',
              border: '1px solid rgba(102, 126, 234, 0.15)',
              lineHeight: 1.8,
              fontSize: 14,
              whiteSpace: 'pre-wrap',
              color: 'var(--text-secondary)',
              maxHeight: 400,
              overflow: 'auto'
            }}>
              {submission.reference_answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
