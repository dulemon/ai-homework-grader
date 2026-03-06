import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Get all assignments
router.get('/', (req, res) => {
  try {
    const assignments = db.prepare(`
      SELECT a.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM submissions s JOIN gradings g ON g.submission_id = s.id WHERE s.assignment_id = a.id) as graded_count
      FROM assignments a
      JOIN users u ON u.id = a.created_by
      ORDER BY a.created_at DESC
    `).all();

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: '获取作业列表失败' });
  }
});

// Create assignment
router.post('/', (req, res) => {
  try {
    const { title, subject, description, reference_answer, questions_json, max_score, deadline, created_by } = req.body;

    if (!title || !subject || !description || !created_by) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const result = db.prepare(
      'INSERT INTO assignments (title, subject, description, reference_answer, questions_json, max_score, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(title, subject, description, reference_answer || '', questions_json || '[]', max_score || 100, deadline || null, created_by);

    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
    res.json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: '创建作业失败' });
  }
});

// Get single assignment
router.get('/:id', (req, res) => {
  try {
    const assignment = db.prepare(`
      SELECT a.*, u.name as teacher_name
      FROM assignments a
      JOIN users u ON u.id = a.created_by
      WHERE a.id = ?
    `).get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: '作业不存在' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: '获取作业详情失败' });
  }
});

// Delete assignment
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM gradings WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM submissions WHERE assignment_id = ?').run(req.params.id);
    db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: '删除作业失败' });
  }
});

export default router;
