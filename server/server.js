import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import assignmentRoutes from './routes/assignments.js';
import submissionRoutes from './routes/submissions.js';
import statsRoutes from './routes/stats.js';
import ocrRoutes from './routes/ocr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Homework Grader Server running at http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/health`);

  // Show AI provider status
  const provider = process.env.AI_PROVIDER || 'auto';
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasSiliconFlow = !!process.env.SILICONFLOW_API_KEY;
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder';

  if (hasGemini) console.log('✅ AI: Google Gemini (免费)');
  else if (hasDeepSeek) console.log('✅ AI: DeepSeek (免费额度)');
  else if (hasSiliconFlow) console.log('✅ AI: SiliconFlow (免费额度)');
  else if (hasOpenAI) console.log('✅ AI: OpenAI');
  else console.log('⚠️  未配置 AI API Key — 使用模拟批改。请在 .env 中配置 GEMINI_API_KEY 等');
});
