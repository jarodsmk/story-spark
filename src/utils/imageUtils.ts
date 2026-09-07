/**
 * Utility functions for processing, resizing, and validating novel cover images.
 * Supports both drag-and-drop and file input selection.
 */

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const MAX_COVER_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB input limit

export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '');
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function estimateDataUrlSize(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64Parts = dataUrl.split(',');
  const base64String = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
  const padding = (base64String.match(/=+$/) || [''])[0].length;
  return Math.floor((base64String.length * 3) / 4) - padding;
}

/**
 * Reads a File as a base64 DataURL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and optimizes an image file for efficient storage and sharp retina display.
 * Targets maximum dimensions (default 800x1200, matching typical 2:3 book aspect ratio).
 */
export async function processCoverImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> {
  if (!isValidImageFile(file)) {
    throw new Error('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
  }

  if (file.size > MAX_COVER_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
  }

  const rawDataUrl = await readFileAsDataUrl(file);

  // SVG images or non-browser environments can be stored directly
  if (
    file.type === 'image/svg+xml' ||
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Image === 'undefined'
  ) {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(rawDataUrl);
          return;
        }

        // If the image is already compact and fits within bounds, keep original
        if (width <= maxWidth && height <= maxHeight && file.size < 80 * 1024) {
          resolve(rawDataUrl);
          return;
        }

        // Calculate scaling ratio
        let scale = 1;
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          scale = Math.min(widthRatio, heightRatio);
        }

        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Determine output mime type
        const isPng = file.type === 'image/png';
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        const processed = canvas.toDataURL(outputMime, quality);

        resolve(processed);
      } catch (err) {
        console.warn('Canvas image compression failed, falling back to original data URL:', err);
        resolve(rawDataUrl);
      }
    };

    img.onerror = () => {
      resolve(rawDataUrl);
    };

    img.src = rawDataUrl;
  });
}
