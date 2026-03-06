import { Router } from 'express';
import db from '../db.js';
import { gradeSubmission } from '../services/aiGrader.js';

const router = Router();

// Submit homework
router.post('/', (req, res) => {
  try {
    const { assignment_id, student_id, content, objective_answers } = req.body;

    if (!assignment_id || !student_id) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const answerContent = content || '';
    const objAnswers = objective_answers ? JSON.stringify(objective_answers) : '{}';

    // Check if already submitted
    const existing = db.prepare(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?'
    ).get(assignment_id, student_id);

    if (existing) {
      db.prepare('UPDATE submissions SET content = ?, objective_answers = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(answerContent, objAnswers, existing.id);
      db.prepare('DELETE FROM gradings WHERE submission_id = ?').run(existing.id);

      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(existing.id);
      return res.json(submission);
    }

    const result = db.prepare(
      'INSERT INTO submissions (assignment_id, student_id, content, objective_answers) VALUES (?, ?, ?, ?)'
    ).run(assignment_id, student_id, answerContent, objAnswers);

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);
    res.json(submission);
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: '提交作业失败' });
  }
});

// Get submissions for an assignment
router.get('/assignment/:id', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.*, u.name as student_name,
        g.score, g.feedback, g.strengths, g.weaknesses, g.suggestions, g.graded_at
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      LEFT JOIN gradings g ON g.submission_id = s.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.params.id);

    const parsed = submissions.map(s => ({
      ...s,
      strengths: s.strengths ? JSON.parse(s.strengths) : [],
      weaknesses: s.weaknesses ? JSON.parse(s.weaknesses) : [],
      suggestions: s.suggestions ? JSON.parse(s.suggestions) : []
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: '获取提交记录失败' });
  }
});

// Get submissions for a student
router.get('/student/:id', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.*, a.title as assignment_title, a.subject,
        g.score, g.feedback, g.graded_at
      FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      LEFT JOIN gradings g ON g.submission_id = s.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.params.id);

    res.json(submissions);
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({ error: '获取提交记录失败' });
  }
});

// Get single submission with grading detail
router.get('/:id', (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT s.*, u.name as student_name,
        a.title as assignment_title, a.subject, a.description as assignment_description,
        a.reference_answer, a.questions_json,
        g.score, g.feedback, g.strengths, g.weaknesses, g.suggestions, g.graded_at
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      JOIN assignments a ON a.id = s.assignment_id
      LEFT JOIN gradings g ON g.submission_id = s.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    res.json({
      ...submission,
      questions_json: submission.questions_json ? JSON.parse(submission.questions_json) : [],
      objective_answers: submission.objective_answers ? JSON.parse(submission.objective_answers) : {},
      strengths: submission.strengths ? JSON.parse(submission.strengths) : [],
      weaknesses: submission.weaknesses ? JSON.parse(submission.weaknesses) : [],
      suggestions: submission.suggestions ? JSON.parse(submission.suggestions) : []
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: '获取提交详情失败' });
  }
});

/**
 * Grade objective questions via template matching
 */
function gradeObjectiveQuestions(questions, studentAnswers) {
  if (!questions || questions.length === 0) return null;

  let correct = 0;
  let total = questions.length;
  const details = [];

  for (const q of questions) {
    const studentAns = studentAnswers[q.id] || '';
    const isCorrect = studentAns.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
    if (isCorrect) correct++;

    details.push({
      id: q.id,
      type: q.type,
      question: q.question,
      studentAnswer: studentAns,
      correctAnswer: q.correctAnswer,
      isCorrect
    });
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    score,
    correct,
    total,
    details,
    feedback: `客观题部分：共 ${total} 题，答对 ${correct} 题，得分 ${score} 分。`,
    strengths: correct > 0 ? [`正确回答了 ${correct} 道客观题`] : [],
    weaknesses: (total - correct) > 0 ? [`${total - correct} 道客观题回答错误，需要复习相关知识点`] : [],
    suggestions: (total - correct) > 0 ? ['仔细审题，注意关键词', '回顾错题对应的知识点'] : ['继续保持，客观题掌握良好']
  };
}

// Grade a submission with AI
router.post('/:id/grade', async (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT s.*, a.title, a.subject, a.description as assignment_description,
        a.reference_answer, a.questions_json
      FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const questions = submission.questions_json ? JSON.parse(submission.questions_json) : [];
    const studentObjAnswers = submission.objective_answers ? JSON.parse(submission.objective_answers) : {};
    const hasObjective = questions.length > 0;
    const hasSubjective = submission.content && submission.content.trim().length > 0;

    let finalScore = 0;
    let finalFeedback = '';
    let finalStrengths = [];
    let finalWeaknesses = [];
    let finalSuggestions = [];

    // Grade objective questions (template matching)
    if (hasObjective) {
      const objResult = gradeObjectiveQuestions(questions, studentObjAnswers);
      if (objResult) {
        if (!hasSubjective) {
          // Only objective questions
          finalScore = objResult.score;
          finalFeedback = objResult.feedback;
          finalStrengths = objResult.strengths;
          finalWeaknesses = objResult.weaknesses;
          finalSuggestions = objResult.suggestions;
        } else {
          // Mix: weight 40% objective, 60% subjective
          const aiResult = await gradeSubmission({
            title: submission.title,
            subject: submission.subject,
            description: submission.assignment_description,
            referenceAnswer: submission.reference_answer,
            studentAnswer: submission.content
          });

          finalScore = Math.round(objResult.score * 0.4 + aiResult.score * 0.6);
          finalFeedback = `${objResult.feedback} ${aiResult.feedback}`;
          finalStrengths = [...objResult.strengths, ...aiResult.strengths];
          finalWeaknesses = [...objResult.weaknesses, ...aiResult.weaknesses];
          finalSuggestions = [...objResult.suggestions, ...aiResult.suggestions];
        }
      }
    } else if (hasSubjective) {
      // Only subjective - use AI
      const aiResult = await gradeSubmission({
        title: submission.title,
        subject: submission.subject,
        description: submission.assignment_description,
        referenceAnswer: submission.reference_answer,
        studentAnswer: submission.content
      });

      finalScore = aiResult.score;
      finalFeedback = aiResult.feedback;
      finalStrengths = aiResult.strengths;
      finalWeaknesses = aiResult.weaknesses;
      finalSuggestions = aiResult.suggestions;
    }

    // Remove old grading if exists
    db.prepare('DELETE FROM gradings WHERE submission_id = ?').run(submission.id);

    // Save grading result
    db.prepare(
      'INSERT INTO gradings (submission_id, score, feedback, strengths, weaknesses, suggestions) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      submission.id,
      finalScore,
      finalFeedback,
      JSON.stringify(finalStrengths),
      JSON.stringify(finalWeaknesses),
      JSON.stringify(finalSuggestions)
    );

    res.json({
      submission_id: submission.id,
      score: finalScore,
      feedback: finalFeedback,
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      suggestions: finalSuggestions
    });
  } catch (error) {
    console.error('Grade error:', error);
    res.status(500).json({ error: error.message || 'AI 批改失败' });
  }
});

export default router;
