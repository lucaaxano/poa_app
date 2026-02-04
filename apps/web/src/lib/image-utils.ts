const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

/**
 * Compresses an image file using the Canvas API.
 * - Resizes to max 1920px on the longest side
 * - Outputs JPEG at 0.8 quality
 * - Returns the original file on any error
 */
export async function compressImage(file: File): Promise<File> {
  // Only compress image types
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Calculate new dimensions
    let newWidth = width;
    let newHeight = height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        newWidth = MAX_DIMENSION;
        newHeight = Math.round((height / width) * MAX_DIMENSION);
      } else {
        newHeight = MAX_DIMENSION;
        newWidth = Math.round((width / height) * MAX_DIMENSION);
      }
    }

    // Skip compression if image is already small and JPEG
    if (newWidth === width && newHeight === height && file.type === 'image/jpeg') {
      bitmap.close();
      return file;
    }

    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: JPEG_QUALITY,
    });

    // Preserve original filename but change extension
    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    // On any error, return the original file
    return file;
  }
}
