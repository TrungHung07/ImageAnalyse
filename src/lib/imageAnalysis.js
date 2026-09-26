import { imageToCanvas } from './imageValidation'
import { analyzeLcd } from './lcd'
import { analyzeThermometer } from './thermometer'

export function analyzeImage(image, mode) {
  const canvas = imageToCanvas(image)
  return mode === 'lcd' ? analyzeLcd(canvas) : analyzeThermometer(canvas)
}
