import { apiFetch } from './api';

export async function recognizeImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await apiFetch('/ocr/recognize', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '识别失败');
  }

  return data;
}
