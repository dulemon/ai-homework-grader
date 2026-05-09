import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_PROVIDER = process.env.AI_PROVIDER || 'auto';

const SUBJECT_PROMPTS = {
  数学: '你是一位严谨的数学教师。重点检查解题方向、关键步骤、计算准确性和数学表达规范。',
  语文: '你是一位资深的语文教师。重点评估切题程度、结构层次、语言表达、思想深度和行文规范。',
  英语: '你是一位专业的英语教师。重点检查内容要点覆盖、语法拼写、词汇句式、逻辑连贯性和写作格式。',
  物理: '你是一位物理教师。重点检查科学原理、推导步骤、公式计算和术语表达是否准确。',
  化学: '你是一位化学教师。重点检查反应原理、实验步骤、公式计算和术语表达是否准确。',
  生物: '你是一位生物教师。重点检查概念准确性、实验步骤、分析能力和专业术语使用。',
  政治: '你是一位政治教师。重点检查观点立场、材料结合、逻辑论证和学科术语运用。',
  历史: '你是一位历史教师。重点检查史实结合、观点表达、逻辑论证和历史术语运用。',
  地理: '你是一位地理教师。重点检查材料结合、空间分析、逻辑论证和学科术语运用。',
  计算机: '你是一位计算机科学教师。重点检查思路正确性、步骤完整性、表达规范性和分析能力。',
};

const DIMENSION_TEMPLATES = {
  语文: [
    { name: '内容与主题', weight: 30, max: 10 },
    { name: '结构与逻辑', weight: 25, max: 10 },
    { name: '语言表达与文采', weight: 25, max: 10 },
    { name: '思想深度与创新', weight: 10, max: 10 },
    { name: '书写/行文规范', weight: 10, max: 10 },
  ],
  数学: [
    { name: '思路正确性', weight: 30, max: 10 },
    { name: '步骤完整性', weight: 30, max: 10 },
    { name: '计算准确性', weight: 20, max: 10 },
    { name: '表达规范性', weight: 10, max: 10 },
    { name: '解法创新/简洁性', weight: 10, max: 10 },
  ],
  英语: [
    { name: '内容要点覆盖', weight: 30, max: 10 },
    { name: '语法与拼写', weight: 25, max: 10 },
    { name: '词汇与句式多样性', weight: 20, max: 10 },
    { name: '逻辑连贯性', weight: 15, max: 10 },
    { name: '格式与字数', weight: 10, max: 10 },
  ],
  理科综合: [
    { name: '原理正确性', weight: 30, max: 10 },
    { name: '步骤完整性', weight: 25, max: 10 },
    { name: '计算/公式正确', weight: 25, max: 10 },
    { name: '术语规范性', weight: 10, max: 10 },
    { name: '实验思维/分析能力', weight: 10, max: 10 },
  ],
  文综综合: [
    { name: '观点明确性', weight: 25, max: 10 },
    { name: '材料结合度', weight: 30, max: 10 },
    { name: '逻辑论证力', weight: 25, max: 10 },
    { name: '学科术语运用', weight: 10, max: 10 },
    { name: '结构完整性', weight: 10, max: 10 },
  ],
  通用: [
    { name: '内容准确性', weight: 30, max: 10 },
    { name: '结构完整性', weight: 25, max: 10 },
    { name: '表达清晰度', weight: 20, max: 10 },
    { name: '逻辑连贯性', weight: 15, max: 10 },
    { name: '提升空间', weight: 10, max: 10 },
  ],
};

function detectProvider() {
  if (AI_PROVIDER !== 'auto') return AI_PROVIDER;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.SILICONFLOW_API_KEY) return 'siliconflow';
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') return 'openai';
  return 'mock';
}

function getTemplateKey(subject) {
  if (['物理', '化学', '生物'].includes(subject)) return '理科综合';
  if (['政治', '历史', '地理'].includes(subject)) return '文综综合';
  if (DIMENSION_TEMPLATES[subject]) return subject;
  return '通用';
}

function getDimensionTemplate(subject) {
  return DIMENSION_TEMPLATES[getTemplateKey(subject)];
}

function buildPrompt({ title, subject, description, referenceAnswer, studentAnswer, maxScore }) {
  const dimensions = getDimensionTemplate(subject);
  const dimensionList = dimensions
    .map((item) => `- ${item.name}：建议权重 ${item.weight}% ，单项满分 ${item.max}`)
    .join('\n');

  return `你是一位经验丰富的${subject}教师。请批改以下学生作业。

题目：${title}
作业要求：${description || '无'}
参考答案：${referenceAnswer || '未提供'}
学生答案：${studentAnswer}
总分：${maxScore}

你需要从以下维度进行评分：
${dimensionList}

请严格按照以下 JSON 返回，不要添加任何额外解释：
{
  "score": ${maxScore}以内的整数,
  "dimensions": [
    { "name": "维度名称", "score": 0-${dimensions[0]?.max || 10}整数, "max": 10, "reason": "一句话依据" }
  ],
  "highlights": [
    { "quote": "必须直接引用学生答案中的原句或短语", "comment": "指出哪里好、为什么好" }
  ],
  "suggestions": [
    { "issue": "具体问题", "example": "给出可模仿的改写示范或补充步骤" }
  ],
  "summary": "2到3句话的老师寄语，使用第二人称你，先肯定再指出提升方向并鼓励"
}

硬性要求：
1. dimensions 的维度名称必须与给定列表一致，数量保持一致。
2. highlights 的 quote 必须来自学生答案原文，不能编造。
3. suggestions 必须给出具体改法或示范。
4. 不要返回 markdown，不要返回代码块。`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clipText(text = '', fallback = '表述整体较完整') {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 48) : fallback;
}

function extractSnippets(studentAnswer) {
  const normalized = String(studentAnswer || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) {
    return ['整体作答内容较完整'];
  }

  return normalized
    .split(/(?<=[。！？.!?；;])/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeDimension(item, templateItem) {
  const max = Number(item?.max) > 0 ? Number(item.max) : templateItem.max;
  const score = Math.max(0, Math.min(max, Number(item?.score) || 0));
  return {
    name: item?.name || templateItem.name,
    score,
    max,
    reason: clipText(item?.reason, `${templateItem.name}表现较稳定`),
  };
}

function computeScoreFromDimensions(dimensions, template, maxScore) {
  const ratio = dimensions.reduce((sum, item, index) => {
    const weight = template[index]?.weight || 0;
    return sum + ((item.score / item.max) * weight);
  }, 0);

  return Math.max(0, Math.min(maxScore, Math.round((ratio / 100) * maxScore)));
}

function parseResult(text, subject, maxScore, studentAnswer) {
  let jsonStr = text;
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const raw = JSON.parse(jsonStr);
  const template = getDimensionTemplate(subject);
  const providedDimensions = safeArray(raw.dimensions);
  const dimensions = template.map((item, index) => normalizeDimension(providedDimensions[index], item));
  const computedScore = computeScoreFromDimensions(dimensions, template, maxScore);
  const score = Math.max(0, Math.min(maxScore, Number(raw.score) || computedScore));
  const snippets = extractSnippets(studentAnswer);
  const highlights = safeArray(raw.highlights)
    .map((item, index) => ({
      quote: clipText(item?.quote, snippets[index] || snippets[0]),
      comment: clipText(item?.comment, '这部分表达体现了较好的答题思路'),
    }))
    .filter((item) => item.quote && item.comment)
    .slice(0, 3);
  const suggestions = safeArray(raw.suggestions)
    .map((item) => ({
      issue: clipText(item?.issue, '这部分仍有提升空间'),
      example: clipText(item?.example, '建议补充更具体的论证、步骤或示范表达。'),
    }))
    .filter((item) => item.issue && item.example)
    .slice(0, 3);
  const summary = clipText(raw.summary, '你已经抓住了作答的核心内容，继续把表达做得更具体、更有层次，会更出色。');

  return {
    score,
    dimensions,
    highlights,
    suggestions,
    summary,
    feedback: summary,
    strengths: highlights.map((item) => item.comment),
    weaknesses: suggestions.map((item) => item.issue),
  };
}

async function gradeWithGemini(systemPrompt, userPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
  });

  return result.response.text();
}

async function gradeWithDeepSeek(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: `${systemPrompt}\n你的回复必须是严格的 JSON 格式。` },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return response.choices[0].message.content;
}

async function gradeWithSiliconFlow(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseURL: 'https://api.siliconflow.cn/v1',
  });

  const response = await client.chat.completions.create({
    model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      { role: 'system', content: `${systemPrompt}\n你的回复必须是严格的 JSON 格式。` },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return response.choices[0].message.content;
}

async function gradeWithOpenAI(systemPrompt, userPrompt) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: `${systemPrompt}\n你的回复必须是严格的 JSON 格式。` },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return response.choices[0].message.content;
}

function generateMockGrading({ studentAnswer, subject, maxScore }) {
  const template = getDimensionTemplate(subject);
  const snippets = extractSnippets(studentAnswer);
  const baseRatio = Math.min(0.9, Math.max(0.58, 0.6 + Math.min(studentAnswer.length, 240) / 900));
  const dimensions = template.map((item, index) => {
    const delta = (index % 3) * 0.08 - 0.04;
    const ratio = Math.max(0.45, Math.min(0.96, baseRatio + delta));
    const score = Math.max(4, Math.min(item.max, Math.round(item.max * ratio)));
    return {
      name: item.name,
      score,
      max: item.max,
      reason: `${item.name}整体表现${score >= 8 ? '较好' : score >= 6 ? '稳定' : '仍需加强'}，关键点已经覆盖，但还可以更具体。`,
    };
  });

  const score = computeScoreFromDimensions(dimensions, template, maxScore);
  const highlights = snippets.slice(0, 2).map((quote, index) => ({
    quote,
    comment: index === 0
      ? '这部分能够直接回应题目要求，说明你抓住了核心内容。'
      : '这里的表达比较完整，能看出你已经在尝试组织更清晰的答题结构。',
  }));
  const suggestions = [
    {
      issue: '部分表述还停留在概括层面，论证或步骤不够展开。',
      example: subject === '数学'
        ? '建议把关键推导写完整，例如先说明已知条件，再写公式依据，最后给出结果。'
        : '建议补充一个更具体的例子或一句更完整的展开说明，让论证更有说服力。',
    },
    {
      issue: '语言或结构还可以更有层次，读起来会更顺。',
      example: subject === '英语'
        ? '可以加入连接词或从句，例如使用 because、however、which 等，让句式更丰富。'
        : '可以先写观点，再写理由，最后补一句总结，让整段层次更清楚。',
    },
  ];
  const summary = `你这次的作答已经抓住了题目的主要方向，说明基础理解是到位的。接下来如果把论证步骤写得更完整、表达做得更具体，你的主观题得分还会继续提升。继续保持。`;

  return {
    score,
    dimensions,
    highlights,
    suggestions,
    summary,
    feedback: summary,
    strengths: highlights.map((item) => item.comment),
    weaknesses: suggestions.map((item) => item.issue),
  };
}

export async function gradeSubmission({ title, subject, description, referenceAnswer, studentAnswer, maxScore = 100 }) {
  const provider = detectProvider();
  const systemPrompt = SUBJECT_PROMPTS[subject] || `你是一位专业的${subject}教师，请根据学科特点进行批改。`;
  const userPrompt = buildPrompt({ title, subject, description, referenceAnswer, studentAnswer, maxScore });

  console.log(`🤖 AI Provider: ${provider}`);

  if (provider === 'mock') {
    console.log('⚠️  No AI API key configured — using mock grading');
    return generateMockGrading({ studentAnswer, subject, maxScore });
  }

  try {
    let responseText;

    switch (provider) {
      case 'gemini':
        responseText = await gradeWithGemini(systemPrompt, userPrompt);
        break;
      case 'deepseek':
        responseText = await gradeWithDeepSeek(systemPrompt, userPrompt);
        break;
      case 'siliconflow':
        responseText = await gradeWithSiliconFlow(systemPrompt, userPrompt);
        break;
      case 'openai':
        responseText = await gradeWithOpenAI(systemPrompt, userPrompt);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    return parseResult(responseText, subject, maxScore, studentAnswer);
  } catch (error) {
    console.error(`AI grading error (${provider}):`, error.message || error);
    console.log('⬇️  Falling back to mock grading');
    return generateMockGrading({ studentAnswer, subject, maxScore });
  }
}
