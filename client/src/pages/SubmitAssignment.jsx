import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';
import { recognizeImage } from '../utils/ocr';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function SubmitAssignment() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState('');
  const [objectiveAnswers, setObjectiveAnswers] = useState({});
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrTarget, setOcrTarget] = useState('answer');
  const [recognizedQuestionText, setRecognizedQuestionText] = useState('');

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('请上传图片文件', 'error');
      return;
    }

    setOcrLoading(true);
    setOcrResult(null);

    try {
      const data = await recognizeImage(file);
      const importTargetLabel = ocrTarget === 'answer' ? '答案区' : '题目辅助区';

      setOcrResult({ ...data, importTargetLabel });

      if (ocrTarget === 'answer') {
        setContent((prev) => prev ? `${prev}\n${data.recognizedText}` : data.recognizedText);
      } else {
        setRecognizedQuestionText((prev) => prev ? `${prev}\n${data.recognizedText}` : data.recognizedText);
      }

      toast(`${data.message}，已填入${importTargetLabel}`, 'success');
    } catch (err) {
      toast(err.message || '图片识别失败', 'error');
    } finally {
      setOcrLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const aRes = await fetch(`/api/assignments/${id}`);
      const aData = await aRes.json();
      setAssignment(aData);

      // Parse questions
      let parsedQuestions = [];
      try {
        parsedQuestions = aData.questions_json ? JSON.parse(aData.questions_json) : [];
      } catch { parsedQuestions = []; }
      setQuestions(parsedQuestions);

      // Check for existing submission
      const sRes = await fetch(`/api/submissions/student/${user.id}`);
      const sData = await sRes.json();
      const existing = sData.find(s => s.assignment_id === parseInt(id));
      if (existing) {
        setExistingSubmission(existing);
        setContent(existing.content || '');
        try {
          const objAns = existing.objective_answers ? JSON.parse(existing.objective_answers) : {};
          setObjectiveAnswers(objAns);
        } catch { /* ignore */ }
      }
    } catch {
      toast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasObjective = questions.length > 0;
    const hasSubjective = assignment?.description && assignment.description.trim().length > 0;

    if (!hasObjective && !content.trim()) {
      toast('请输入你的答案', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: parseInt(id),
          student_id: user.id,
          content: content.trim(),
          objective_answers: objectiveAnswers
        }),
      });

      if (!res.ok) throw new Error('提交失败');

      toast('作业提交成功！', 'success');
      navigate('/student');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
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

  const hasSubjectiveDesc = assignment?.description && assignment.description.trim().length > 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <button className="back-btn" onClick={() => navigate('/student')}>
          ← 返回仪表盘
        </button>

        {/* Assignment Info */}
        <div className="card mb-24">
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{assignment?.title}</h1>
            <span className="badge badge-info">{assignment?.subject}</span>
          </div>
          {hasSubjectiveDesc && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {assignment?.description}
            </p>
          )}
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            👤 {assignment?.teacher_name} · 📅 {new Date(assignment?.created_at).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {/* Existing grading result */}
        {existingSubmission?.score !== null && existingSubmission?.score !== undefined && (
          <div className="card mb-24" style={{
            borderLeft: '3px solid #0d9488',
            background: 'rgba(17, 153, 142, 0.04)'
          }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>✅ 已批改</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{existingSubmission.feedback}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: existingSubmission.score >= 80 ? '#0d9488' : existingSubmission.score >= 60 ? '#d97706' : '#e11d48'
                }}>
                  {existingSubmission.score}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>分</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm mt-8"
              onClick={() => navigate(`/grading/${existingSubmission.id}`)}
            >
              📊 查看详细反馈
            </button>
          </div>
        )}

        {/* Submit Form */}
        <form onSubmit={handleSubmit}>
          {/* Objective Questions */}
          {questions.length > 0 && (
            <div className="card mb-24">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
                📋 客观题 ({questions.length} 题)
              </h2>

              {questions.map((q, qi) => (
                <div key={q.id} className="question-item">
                  <div className="question-item-header">
                    <span className="question-item-number">
                      第 {qi + 1} 题 · {q.type === 'choice' ? '选择题' : '填空题'}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>
                    {q.question}
                  </p>

                  {q.type === 'choice' ? (
                    <div className="choice-options">
                      {(q.options || []).map((opt, oi) => (
                        <div
                          key={oi}
                          className={`student-choice ${objectiveAnswers[q.id] === OPTION_LABELS[oi] ? 'selected' : ''}`}
                          onClick={() => setObjectiveAnswers({ ...objectiveAnswers, [q.id]: OPTION_LABELS[oi] })}
                        >
                          <div className="choice-option-label"
                            style={objectiveAnswers[q.id] === OPTION_LABELS[oi] ? {
                              background: 'var(--color-primary)', color: 'white'
                            } : {}}
                          >
                            {OPTION_LABELS[oi]}
                          </div>
                          <span className="choice-option-text">{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input
                      className="form-input"
                      placeholder="请输入答案"
                      value={objectiveAnswers[q.id] || ''}
                      onChange={(e) => setObjectiveAnswers({ ...objectiveAnswers, [q.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Subjective Answer */}
          {hasSubjectiveDesc && (
            <div className="card" style={{ maxWidth: 780 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
                ✍️ {existingSubmission ? '重新作答' : '主观题作答'}
              </h2>

              {/* OCR Image Upload */}
              <div className="ocr-panel" style={{ marginBottom: 24 }}>
                <div className="ocr-panel-header">
                  <div>
                    <div className="ocr-panel-title">📷 图片识别助手</div>
                    <p className="ocr-panel-desc">可以上传题目图或手写答案图，识别后的文字可填入答案区，或先放到题目辅助区查看。</p>
                  </div>
                </div>

                <div className="ocr-target-group">
                  <span className="ocr-target-label">识别结果写入</span>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segmented-item ${ocrTarget === 'answer' ? 'active' : ''}`}
                      onClick={() => setOcrTarget('answer')}
                    >
                      答案区
                    </button>
                    <button
                      type="button"
                      className={`segmented-item ${ocrTarget === 'question' ? 'active' : ''}`}
                      onClick={() => setOcrTarget('question')}
                    >
                      题目辅助区
                    </button>
                  </div>
                </div>

                <div className="ocr-upload-box">
                  <div style={{ fontSize: 28 }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>上传题目或答案图片</div>
                    <div className="ocr-panel-desc">适合识别纸质试题、老师发的题图，或手写作答内容。</div>
                  </div>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  {ocrLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      识别中...
                    </span>
                  ) : '选择图片'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOcrUpload}
                    style={{ display: 'none' }}
                    disabled={ocrLoading}
                  />
                </label>
              </div>

                {ocrResult && (
                  <div className="ocr-result-card">
                    <div className="flex justify-between items-center mb-8">
                      <span style={{ fontWeight: 600, color: '#0d9488' }}>
                        ✅ 识别完成
                      </span>
                      <span className={`badge ${ocrResult.confidence >= 80 ? 'badge-success' : 'badge-warning'}`}>
                        置信度 {ocrResult.confidence}%
                      </span>
                    </div>
                    <p className="ocr-panel-desc">
                      识别到 {ocrResult.wordCount} 个词，内容已填入{ocrResult.importTargetLabel}。
                    </p>
                  </div>
                )}
              </div>

              {recognizedQuestionText && (
                <div className="form-group">
                  <label className="form-label">题目辅助区（仅本次作答参考）</label>
                  <textarea
                    className="form-textarea helper-textarea"
                    value={recognizedQuestionText}
                    onChange={(e) => setRecognizedQuestionText(e.target.value)}
                    rows={6}
                  />
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    这里的内容不会随提交一起发送
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">你的答案</label>
                <textarea
                  className="form-textarea"
                  placeholder="在这里输入你的作业答案，也可以通过上方拍照识别..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  style={{ minHeight: 200 }}
                />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {content.length} 字
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-12 mt-24">
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={submitting}
            >
              {submitting ? '提交中...' : existingSubmission ? '📮 重新提交' : '📮 提交作业'}
            </button>
            <button
              className="btn btn-ghost btn-lg"
              type="button"
              onClick={() => navigate('/student')}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
