import { describe, expect, it } from 'vitest'
import { celsiusFromY, fahrenheitFromCelsius, getReadingCrop } from './thermometer'

describe('thermometer conversion', () => {
  it('maps the top and bottom scale to 50 and -20 Celsius', () => {
    expect(celsiusFromY(100, 100, 800)).toBe(50)
    expect(celsiusFromY(800, 100, 800)).toBe(-20)
  })

  it('converts Celsius to Fahrenheit', () => {
    expect(fahrenheitFromCelsius(0)).toBe(32)
    expect(fahrenheitFromCelsius(100)).toBe(212)
  })

  it('creates a crop around the detected reading level', () => {
    const crop = getReadingCrop(482, 1400, 700)
    expect(crop.width).toBe(482)
    expect(crop.height).toBe(279)
    expect(crop.top).toBe(566)
    expect(crop.top + crop.height).toBeLessThanOrEqual(1400)
  })
})
