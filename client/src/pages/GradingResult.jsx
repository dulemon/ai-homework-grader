import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';
import ScoreRing from '../components/ScoreRing';
import { apiFetch } from '../utils/api';

function getScoreLevel(score) {
  if (score >= 90) return { text: '优秀', color: '#0d9488' };
  if (score >= 80) return { text: '良好', color: '#2563eb' };
  if (score >= 70) return { text: '中等', color: '#d97706' };
  if (score >= 60) return { text: '及格', color: '#7c3aed' };
  return { text: '需努力', color: '#e11d48' };
}

function getProgressTone(percent) {
  if (percent >= 80) return 'success';
  if (percent >= 60) return 'info';
  if (percent >= 40) return 'warning';
  return 'danger';
}

function buildTeacherActions(submission, siblings) {
  if (!submission?.assignment_id || siblings.length === 0) return {};
  const currentIndex = siblings.findIndex((item) => item.id === submission.id);
  return {
    prev: currentIndex > 0 ? siblings[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null,
  };
}

function normalizeTextList(items) {
  return Array.isArray(items) ? items : [];
}

export default function GradingResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [submission, setSubmission] = useState(null);
  const [peerSubmissions, setPeerSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/submissions/${id}`);
      if (!res.ok) throw new Error('加载失败');
      const detail = await res.json();
      setSubmission(detail);

      if (user?.role === 'teacher' && detail.assignment_id) {
        const listRes = await apiFetch(`/submissions/assignment/${detail.assignment_id}`);
        if (listRes.ok) {
          const list = await listRes.json();
          setPeerSubmissions(list);
        }
      } else {
        setPeerSubmissions([]);
      }
    } catch (error) {
      toast(error.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
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
  const dimensions = normalizeTextList(submission.dimensions);
  const highlights = normalizeTextList(submission.highlights);
  const suggestions = normalizeTextList(submission.suggestions);
  const questions = normalizeTextList(submission.questions_json);
  const objectiveAnswers = submission.objective_answers || {};
  const summary = submission.summary || submission.feedback;
  const teacherActions = buildTeacherActions(submission, peerSubmissions);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter grading-result-page">
        <div className="grading-shell">
          <div className="grading-topbar">
            <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
            <div className="grading-topbar-meta">
              <span className="badge badge-info">{submission.subject}</span>
              <span className="badge badge-neutral">{submission.student_name}</span>
            </div>
          </div>

          <div className="grading-hero">
            <div className="grading-hero-main">
              <div className="grading-score-card">
                <ScoreRing score={submission.score} size={124} strokeWidth={10} />
                <div
                  className="grading-level-pill"
                  style={{ background: `${level.color}14`, color: level.color }}
                >
                  {level.text}
                </div>
              </div>

              <div className="grading-hero-copy">
                <div className="grading-kicker">主观题评价结果</div>
                <h1 className="grading-page-title">{submission.assignment_title}</h1>
                <div className="grading-meta-row">
                  <span>👤 {submission.student_name}</span>
                  <span>📅 {new Date(submission.graded_at).toLocaleString('zh-CN')}</span>
                </div>
                <div className="grading-hero-summary">
                  <div className="grading-summary-label">评分概览</div>
                  <p>{summary}</p>
                </div>
              </div>
            </div>
          </div>

          {dimensions.length > 0 && (
            <section className="grading-panel grading-panel-blue">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>📊</span> 得分明细
              </div>
              <div className="dimension-list">
                {dimensions.map((item, index) => {
                  const percent = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
                  const tone = getProgressTone(percent);
                  return (
                    <div key={`${item.name}-${index}`} className="dimension-item">
                      <div className="dimension-head">
                        <span className="dimension-name">{item.name}</span>
                        <span className="dimension-score">{item.score}/{item.max}</span>
                      </div>
                      <div className="dimension-progress">
                        <div
                          className={`dimension-progress-bar tone-${tone}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="dimension-reason">{item.reason}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {highlights.length > 0 && (
            <section className="grading-panel grading-panel-green">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>✨</span> 亮点
              </div>
              <div className="highlight-list">
                {highlights.map((item, index) => (
                  <article key={`${item.quote}-${index}`} className="highlight-card">
                    <div className="highlight-quote">“{item.quote || '本次作答中有较好的表达亮点'}”</div>
                    <div className="highlight-comment">{item.comment}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {suggestions.length > 0 && (
            <section className="grading-panel grading-panel-orange">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>📝</span> 改进建议
              </div>
              <div className="suggestion-list">
                {suggestions.map((item, index) => (
                  <article key={`${item.issue}-${index}`} className="suggestion-card">
                    <div className="suggestion-issue">❌ {item.issue}</div>
                    <div className="suggestion-example">
                      <span className="suggestion-example-label">✏️ 示范</span>
                      <span>{item.example}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {summary && (
            <section className="grading-panel grading-panel-message">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>💌</span> 老师寄语
              </div>
              <p className="teacher-message">{summary}</p>
            </section>
          )}

          {questions.length > 0 && (
            <section className="card mb-24">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>📋</span> 客观题详情
              </div>
              {questions.map((question, index) => {
                const studentAnswer = objectiveAnswers[question.id] || '未作答';
                const isCorrect = studentAnswer.trim().toLowerCase() === (question.correctAnswer || '').trim().toLowerCase();
                return (
                  <div
                    key={question.id}
                    className="question-item"
                    style={{ borderLeft: `3px solid ${isCorrect ? '#0d9488' : '#e11d48'}` }}
                  >
                    <div className="flex justify-between items-center mb-8">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>第 {index + 1} 题</span>
                      <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                        {isCorrect ? '✓ 正确' : '✗ 错误'}
                      </span>
                    </div>
                    <p style={{ marginBottom: 8, color: 'var(--text-primary)' }}>{question.question}</p>
                    <div className="flex gap-16" style={{ fontSize: 13 }}>
                      <span style={{ color: isCorrect ? '#0d9488' : '#e11d48' }}>
                        你的答案: <strong>{studentAnswer}</strong>
                      </span>
                      {!isCorrect && (
                        <span style={{ color: '#0d9488' }}>
                          正确答案: <strong>{question.correctAnswer}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {submission.content && (
            <section className="card mb-24">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>🧾</span> 学生答案
              </div>
              <div className="grading-answer-block">{submission.content}</div>
            </section>
          )}

          {user?.role === 'teacher' && submission.reference_answer && (
            <section className="card mb-24">
              <div className="grading-section-title">
                <span style={{ fontSize: 20 }}>📖</span> 参考答案
              </div>
              <div className="grading-answer-block grading-answer-reference">{submission.reference_answer}</div>
            </section>
          )}
        </div>

        {(teacherActions.prev || teacherActions.next) && (
          <div className="grading-bottom-bar">
            <button
              className="btn btn-ghost btn-lg"
              type="button"
              disabled={!teacherActions.prev}
              onClick={() => teacherActions.prev && navigate(`/grading/${teacherActions.prev.id}`)}
            >
              ← 上一个学生
            </button>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              disabled={!teacherActions.next}
              onClick={() => teacherActions.next && navigate(`/grading/${teacherActions.next.id}`)}
            >
              下一个学生 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
