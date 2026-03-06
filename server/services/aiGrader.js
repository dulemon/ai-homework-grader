import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI 批改服务 — 多模型支持
 *
 * 支持的 AI 提供商（在 .env 中配置）：
 * 1. Google Gemini   — 免费 15次/分钟，无需信用卡
 * 2. DeepSeek        — 注册即送额度，中文极佳
 * 3. SiliconFlow     — 注册送 2000万 token，支持 Qwen/GLM
 * 4. OpenAI          — 付费，质量最高
 *
 * 配置方式（.env 中设置任一即可）：
 *   AI_PROVIDER=gemini|deepseek|siliconflow|openai
 *   GEMINI_API_KEY=xxx
 *   DEEPSEEK_API_KEY=xxx
 *   SILICONFLOW_API_KEY=xxx
 *   OPENAI_API_KEY=xxx
 */

const AI_PROVIDER = process.env.AI_PROVIDER || 'auto'; // auto = 按优先级自动检测

/**
 * 学科专用 Prompt 模板
 */
const SUBJECT_PROMPTS = {
  '数学': '你是一位严谨的数学教师。重点检查计算过程、公式运用、逻辑推导是否正确。对于数学证明题，关注证明的完整性和严密性。',
  '语文': '你是一位资深的语文教师。重点评估文章结构、语言表达、修辞手法、论证逻辑、中心思想的把握。对作文类题目，关注立意深度和文学性。',
  '英语': '你是一位专业的英语教师。重点检查语法正确性、词汇使用、句式多样性、语言流畅度。对于翻译题注意信达雅，写作题关注逻辑连贯和地道表达。',
  '物理': '你是一位物理教师。重点检查物理概念理解、公式选用、单位换算、数值计算。关注学生对物理现象的分析能力和实验设计思路。',
  '化学': '你是一位化学教师。重点检查化学方程式配平、反应条件标注、计算过程。关注对化学原理的理解和实验操作的规范性。',
  '生物': '你是一位生物教师。重点检查生物概念的准确性、实验设计的合理性、图表分析能力。关注学生对生命现象的理解深度。',
  '历史': '你是一位历史教师。重点评估史实准确性、历史分析能力、论述的逻辑性。关注学生对历史事件因果关系的理解。',
  '计算机': '你是一位计算机科学教师。重点检查代码逻辑、算法正确性、时间空间复杂度分析。关注编程规范和问题解决思路。'
};

/**
 * 自动检测可用的 AI 提供商
 */
function detectProvider() {
  if (AI_PROVIDER !== 'auto') return AI_PROVIDER;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.SILICONFLOW_API_KEY) return 'siliconflow';
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') return 'openai';
  return 'mock';
}

/**
 * 构建批改 Prompt
 */
function buildPrompt(title, subject, description, referenceAnswer, studentAnswer) {
  return `## 作业信息
- **标题**：${title}
- **科目**：${subject}
- **要求**：${description}

## 参考答案
${referenceAnswer || '（未提供参考答案，请根据作业要求自行判断）'}

## 学生答案
${studentAnswer}

## 批改要求
请以 JSON 格式返回批改结果：
{
  "score": <0-100的整数分数>,
  "feedback": "<总体评价，2-3句话>",
  "strengths": ["<优点1>", "<优点2>"],
  "weaknesses": ["<不足1>", "<不足2>"],
  "suggestions": ["<改进建议1>", "<改进建议2>"]
}

请严格按照 JSON 格式返回。评分要客观公正，反馈要具体有建设性。`;
}

/**
 * 解析 AI 返回的 JSON
 */
function parseResult(text) {
  // Try to extract JSON from the response
  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const result = JSON.parse(jsonStr);
  return {
    score: Math.min(100, Math.max(0, parseInt(result.score) || 0)),
    feedback: result.feedback || '批改完成',
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
  };
}

// ============================================================
// Provider Implementations
// ============================================================

/**
 * Google Gemini — 免费 15 RPM, 1500 RPD
 * 申请地址: https://aistudio.google.com/apikey
 */
async function gradeWithGemini(systemPrompt, userPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    }
  });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
    }]
  });

  return result.response.text();
}

/**
 * DeepSeek — 注册送免费额度
 * 申请地址: https://platform.deepseek.com
 */
async function gradeWithDeepSeek(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  });

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt + '\n你的回复必须是严格的 JSON 格式。' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return response.choices[0].message.content;
}

/**
 * SiliconFlow — 注册送 2000万 token, 兼容 OpenAI API
 * 申请地址: https://cloud.siliconflow.cn
 */
async function gradeWithSiliconFlow(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseURL: 'https://api.siliconflow.cn/v1'
  });

  const response = await client.chat.completions.create({
    model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      { role: 'system', content: systemPrompt + '\n你的回复必须是严格的 JSON 格式。' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return response.choices[0].message.content;
}

/**
 * OpenAI — 付费
 */
async function gradeWithOpenAI(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt + '\n你的回复必须是严格的 JSON 格式。' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return response.choices[0].message.content;
}

// ============================================================
// Main Export
// ============================================================

/**
 * AI 批改服务入口
 */
export async function gradeSubmission({ title, subject, description, referenceAnswer, studentAnswer }) {
  const provider = detectProvider();
  const subjectGuide = SUBJECT_PROMPTS[subject] || `你是一位专业的${subject}教师，请根据学科特点进行批改。`;
  const userPrompt = buildPrompt(title, subject, description, referenceAnswer, studentAnswer);

  console.log(`🤖 AI Provider: ${provider}`);

  if (provider === 'mock') {
    console.log('⚠️  No AI API key configured — using mock grading');
    return generateMockGrading(studentAnswer, subject);
  }

  try {
    let responseText;

    switch (provider) {
      case 'gemini':
        responseText = await gradeWithGemini(subjectGuide, userPrompt);
        break;
      case 'deepseek':
        responseText = await gradeWithDeepSeek(subjectGuide, userPrompt);
        break;
      case 'siliconflow':
        responseText = await gradeWithSiliconFlow(subjectGuide, userPrompt);
        break;
      case 'openai':
        responseText = await gradeWithOpenAI(subjectGuide, userPrompt);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    return parseResult(responseText);
  } catch (error) {
    console.error(`AI grading error (${provider}):`, error.message || error);
    // Fallback to mock
    console.log('⬇️  Falling back to mock grading');
    return generateMockGrading(studentAnswer, subject);
  }
}

/**
 * Mock grading with subject-aware feedback
 */
function generateMockGrading(studentAnswer, subject) {
  const length = studentAnswer.length;
  const score = Math.min(95, Math.max(40, 60 + Math.floor(length / 10)));

  const subjectFeedback = {
    '数学': {
      strengths: ['解题思路清晰，步骤完整', '公式运用基本正确', '计算过程规范'],
      weaknesses: ['部分计算步骤缺少中间过程', '某些公式的适用条件理解不够准确'],
      suggestions: ['注意书写解题步骤的完整性', '多练习同类型题目加深理解']
    },
    '英语': {
      strengths: ['词汇使用较为准确', '句式有一定的多样性', '基本语法正确'],
      weaknesses: ['部分句子结构较为简单', '某些高级词汇使用不够自然'],
      suggestions: ['多阅读英文原著提升语感', '尝试使用更多从句和复合句']
    },
    '语文': {
      strengths: ['文章结构较为完整', '中心思想表达清晰', '语言通顺流畅'],
      weaknesses: ['论述深度有待加强', '缺少具体事例支撑观点'],
      suggestions: ['多积累名言和典型事例', '加强议论文写作练习']
    }
  };

  const fb = subjectFeedback[subject] || {
    strengths: ['回答结构清晰，逻辑性较强', '对基本概念有一定的理解'],
    weaknesses: ['部分知识点的理解不够深入', '缺少具体的例子来支撑论述'],
    suggestions: ['建议多阅读相关教材', '注意答题的完整性']
  };

  return {
    score,
    feedback: `（模拟批改）整体回答质量${score >= 80 ? '较好' : score >= 60 ? '一般' : '有待提高'}。请配置 AI API Key 以获得真实批改结果。`,
    ...fb
  };
}
