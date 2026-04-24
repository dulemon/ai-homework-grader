import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import Sidebar from '../components/Sidebar';
import { recognizeImage } from '../utils/ocr';

const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '计算机', '其他'];

const emptyChoice = () => ({ id: 'q' + Date.now() + Math.random(), type: 'choice', question: '', options: ['', '', '', ''], correctAnswer: '' });
const emptyFillBlank = () => ({ id: 'q' + Date.now() + Math.random(), type: 'fill', question: '', correctAnswer: '' });

export default function CreateAssignment() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '数学',
    description: '',
    reference_answer: '',
    max_score: 100,
  });
  const [questions, setQuestions] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrTarget, setOcrTarget] = useState('description');
  const [ocrResult, setOcrResult] = useState(null);

  const addQuestion = (type) => {
    setQuestions([...questions, type === 'choice' ? emptyChoice() : emptyFillBlank()]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    const opts = [...updated[qIndex].options];
    opts[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex, answer) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], correctAnswer: answer };
    setQuestions(updated);
  };

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
      const targetLabel = ocrTarget === 'description' ? '题目描述' : '参考答案';
      const currentText = form[ocrTarget] || '';
      const mergedText = currentText
        ? `${currentText.trim()}\n\n${data.recognizedText}`
        : data.recognizedText;

      setForm((prev) => ({
        ...prev,
        [ocrTarget]: mergedText,
      }));
      setOcrResult({ ...data, targetLabel });
      toast(`识别成功，已填入${targetLabel}`, 'success');
    } catch (err) {
      toast(err.message || '图片识别失败', 'error');
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          questions_json: JSON.stringify(questions),
          created_by: user.id
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast('作业创建成功！', 'success');
      navigate('/teacher');
    } catch (err) {
      toast(err.message || '创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content page-enter">
        <button className="back-btn" onClick={() => navigate('/teacher')}>
          ← 返回仪表盘
        </button>

        <div className="page-header">
          <h1>📝 创建新作业</h1>
          <p>设置作业内容，支持客观题（选择/填空）和主观题</p>
        </div>

        <div className="card" style={{ maxWidth: 780 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">作业标题 *</label>
              <input
                className="form-input"
                type="text"
                placeholder="例如：第三章课后习题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">科目 *</label>
                <select
                  className="form-select"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">满分</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="200"
                  value={form.max_score}
                  onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="ocr-panel">
              <div className="ocr-panel-header">
                <div>
                  <div className="ocr-panel-title">📷 从图片导入题目</div>
                  <p className="ocr-panel-desc">上传试卷或题目照片，OCR 识别后自动填入对应字段，适合先导入文字再人工校对。</p>
                </div>
              </div>

              <div className="ocr-target-group">
                <span className="ocr-target-label">导入位置</span>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-item ${ocrTarget === 'description' ? 'active' : ''}`}
                    onClick={() => setOcrTarget('description')}
                  >
                    题目描述
                  </button>
                  <button
                    type="button"
                    className={`segmented-item ${ocrTarget === 'reference_answer' ? 'active' : ''}`}
                    onClick={() => setOcrTarget('reference_answer')}
                  >
                    参考答案
                  </button>
                </div>
              </div>

              <div className="ocr-upload-box">
                <div style={{ fontSize: 28 }}>🖼️</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>识别印刷题面或清晰照片</div>
                  <div className="ocr-panel-desc">支持 JPG / PNG / WebP / BMP / TIFF，单张最大 10MB。</div>
                </div>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  {ocrLoading ? '识别中...' : '选择图片'}
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
                    <span style={{ fontWeight: 700, color: '#0d9488' }}>已导入 {ocrResult.targetLabel}</span>
                    <span className={`badge ${ocrResult.confidence >= 80 ? 'badge-success' : 'badge-warning'}`}>
                      置信度 {ocrResult.confidence}%
                    </span>
                  </div>
                  <p className="ocr-panel-desc" style={{ marginBottom: 8 }}>
                    识别到 {ocrResult.wordCount} 个词，建议提交前核对文本与排版。
                  </p>
                  <div className="ocr-preview">{ocrResult.recognizedText}</div>
                </div>
              )}
            </div>

            {/* Objective Questions Section */}
            <div style={{ marginBottom: 24 }}>
              <div className="flex justify-between items-center mb-16">
                <label className="form-label" style={{ marginBottom: 0 }}>客观题（选择题 / 填空题）</label>
                <div className="flex gap-8">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => addQuestion('choice')}>
                    + 选择题
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => addQuestion('fill')}>
                    + 填空题
                  </button>
                </div>
              </div>

              {questions.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  border: '1px dashed var(--border-color)'
                }}>
                  暂无客观题，点击上方按钮添加
                </div>
              )}

              {questions.map((q, qi) => (
                <div className="question-item" key={q.id}>
                  <div className="question-item-header">
                    <span className="question-item-number">
                      {q.type === 'choice' ? '📋 选择题' : '✏️ 填空题'} #{qi + 1}
                    </span>
                    <button type="button" className="question-item-remove" onClick={() => removeQuestion(qi)}>✕</button>
                  </div>

                  <input
                    className="form-input"
                    placeholder="请输入题目内容"
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                    style={{ marginBottom: 12 }}
                  />

                  {q.type === 'choice' ? (
                    <div className="choice-options">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`choice-option ${q.correctAnswer === OPTION_LABELS[oi] ? 'correct' : ''}`}
                          onClick={() => setCorrectAnswer(qi, OPTION_LABELS[oi])}
                        >
                          <div className="choice-option-label">{OPTION_LABELS[oi]}</div>
                          <input
                            className="form-input"
                            style={{ border: 'none', background: 'transparent', padding: '4px 8px' }}
                            placeholder={`选项 ${OPTION_LABELS[oi]}`}
                            value={opt}
                            onChange={(e) => { e.stopPropagation(); updateOption(qi, oi, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {q.correctAnswer === OPTION_LABELS[oi] && (
                            <span style={{ color: '#0d9488', fontSize: 12, fontWeight: 700 }}>✓ 正确答案</span>
                          )}
                        </div>
                      ))}
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        💡 点击选项设为正确答案
                      </p>
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        className="form-input"
                        placeholder="请输入标准答案"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Subjective Section */}
            <div className="form-group">
              <label className="form-label">主观题作业要求 / 题目描述</label>
              <textarea
                className="form-textarea"
                placeholder="详细描述主观题的作业要求、题目内容等...（如只有客观题可留空）"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label">参考答案（供 AI 批改主观题参考）</label>
              <textarea
                className="form-textarea"
                placeholder="输入参考答案，AI 将据此评分和反馈..."
                value={form.reference_answer}
                onChange={(e) => setForm({ ...form, reference_answer: e.target.value })}
                rows={5}
              />
            </div>

            <div className="flex gap-12" style={{ marginTop: 8 }}>
              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={loading}
              >
                {loading ? '创建中...' : '✅ 创建作业'}
              </button>
              <button
                className="btn btn-ghost btn-lg"
                type="button"
                onClick={() => navigate('/teacher')}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
