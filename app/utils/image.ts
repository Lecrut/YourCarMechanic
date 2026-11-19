/**
 * Downscales an image in the browser (longest side ≤ `maxSize`) and re-encodes it as JPEG,
 * so phone photos of several MB upload as ~200–400 kB.
 */
export async function downscaleImage(file: Blob, maxSize = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))), 'image/jpeg', quality))
}
