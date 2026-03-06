import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Overview stats
router.get('/overview', (req, res) => {
  try {
    const totalAssignments = db.prepare('SELECT COUNT(*) as count FROM assignments').get().count;
    const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
    const totalGraded = db.prepare('SELECT COUNT(*) as count FROM gradings').get().count;
    const avgScore = db.prepare('SELECT AVG(score) as avg FROM gradings').get().avg || 0;
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count;

    // Score distribution
    const distribution = db.prepare(`
      SELECT
        CASE
          WHEN score >= 90 THEN '优秀'
          WHEN score >= 80 THEN '良好'
          WHEN score >= 70 THEN '中等'
          WHEN score >= 60 THEN '及格'
          ELSE '不及格'
        END as level,
        COUNT(*) as count
      FROM gradings
      GROUP BY level
      ORDER BY MIN(score) DESC
    `).all();

    // Recent gradings
    const recentGradings = db.prepare(`
      SELECT g.*, s.content, u.name as student_name, a.title as assignment_title
      FROM gradings g
      JOIN submissions s ON s.id = g.submission_id
      JOIN users u ON u.id = s.student_id
      JOIN assignments a ON a.id = s.assignment_id
      ORDER BY g.graded_at DESC
      LIMIT 5
    `).all();

    res.json({
      totalAssignments,
      totalSubmissions,
      totalGraded,
      avgScore: Math.round(avgScore * 10) / 10,
      totalStudents,
      totalTeachers,
      distribution,
      recentGradings
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// Stats for a single assignment
router.get('/assignment/:id', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT g.id) as graded_count,
        AVG(g.score) as avg_score,
        MAX(g.score) as max_score,
        MIN(g.score) as min_score
      FROM submissions s
      LEFT JOIN gradings g ON g.submission_id = s.id
      WHERE s.assignment_id = ?
    `).get(req.params.id);

    res.json({
      ...stats,
      avg_score: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : 0
    });
  } catch (error) {
    console.error('Assignment stats error:', error);
    res.status(500).json({ error: '获取作业统计失败' });
  }
});

export default router;
