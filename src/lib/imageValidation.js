const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const MAX_FILE_SIZE = 12 * 1024 * 1024

export function validatePngFile(file) {
  if (!file) return { valid: false, message: 'Please choose a PNG image.' }
  if (file.size > MAX_FILE_SIZE) return { valid: false, message: 'This image is larger than 12 MB.' }
  if (!file.name.toLowerCase().endsWith('.png') || (file.type && file.type !== 'image/png')) {
    return { valid: false, message: 'Only PNG files are supported.' }
  }
  return { valid: true, message: '' }
}

export async function hasPngSignature(file) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  return PNG_SIGNATURE.every((byte, index) => header[index] === byte)
}

export async function loadPng(file) {
  const validation = validatePngFile(file)
  if (!validation.valid) throw new Error(validation.message)
  if (!(await hasPngSignature(file))) throw new Error('The file does not contain a valid PNG signature.')

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('The PNG could not be read.'))
      element.src = url
    })
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The PNG has no readable pixels.')
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function imageToCanvas(image, maxDimension = 1400) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}
