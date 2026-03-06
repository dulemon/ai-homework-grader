import Tesseract from 'tesseract.js';

/**
 * OCR Service — 使用 Tesseract.js 识别图片中的文字
 * 完全免费、开源、无需 API Key
 * 支持中文（简体/繁体）+ 英文混合识别
 */

/**
 * 识别图片中的文字
 * @param {string} imagePath - 图片文件路径
 * @param {string} lang - 语言代码，默认 chi_sim+eng（简体中文+英文）
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imagePath, lang = 'chi_sim+eng') {
  try {
    console.log(`🔍 OCR: Starting recognition for ${imagePath}`);

    const { data } = await Tesseract.recognize(imagePath, lang, {
      logger: info => {
        if (info.status === 'recognizing text') {
          console.log(`  OCR progress: ${Math.round(info.progress * 100)}%`);
        }
      }
    });

    console.log(`✅ OCR: Completed with confidence ${data.confidence}%`);

    return {
      text: data.text.trim(),
      confidence: Math.round(data.confidence),
      words: data.words?.length || 0
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('图片文字识别失败，请确保图片清晰且包含可识别的文字');
  }
}

/**
 * 识别后用于作业提交 — 将 OCR 结果格式化
 */
export async function recognizeHomeworkImage(imagePath) {
  const result = await recognizeText(imagePath);

  if (!result.text || result.text.length < 2) {
    throw new Error('未能从图片中识别出有效文字，请确保图片清晰');
  }

  return {
    recognizedText: result.text,
    confidence: result.confidence,
    wordCount: result.words,
    message: result.confidence >= 80
      ? `识别成功（置信度 ${result.confidence}%）`
      : `识别完成，但置信度较低（${result.confidence}%），建议核对识别结果`
  };
}
