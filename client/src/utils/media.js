import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativeApp } from './platform';

function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

function isCancelError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('cancel');
}

async function pickNativeImageFile() {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    });

    if (!photo?.webPath) {
      return null;
    }

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const extension = photo.format || blob.type.split('/')[1] || 'jpeg';
    const mimeType = blob.type || `image/${extension}`;

    return new File([blob], `ocr-${Date.now()}.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch (error) {
    if (isCancelError(error)) {
      return null;
    }
    throw error;
  }
}

function pickWebImageFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    let settled = false;

    const cleanup = () => {
      input.removeEventListener('change', handleChange);
      input.removeEventListener('cancel', handleCancel);
      window.removeEventListener('focus', handleFocus);
      input.remove();
    };

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const handleChange = () => {
      const file = input.files?.[0] || null;

      if (!file) {
        finish(() => resolve(null));
        return;
      }

      if (!isImageFile(file)) {
        finish(() => reject(new Error('请上传图片文件')));
        return;
      }

      finish(() => resolve(file));
    };

    const handleCancel = () => {
      finish(() => resolve(null));
    };

    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          finish(() => resolve(null));
        }
      }, 0);
    };

    input.addEventListener('change', handleChange, { once: true });
    input.addEventListener('cancel', handleCancel, { once: true });
    window.addEventListener('focus', handleFocus, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

export async function pickImageFile() {
  return isNativeApp() ? pickNativeImageFile() : pickWebImageFile();
}
