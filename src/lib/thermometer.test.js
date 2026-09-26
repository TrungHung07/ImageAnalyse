import { describe, expect, it } from 'vitest'
import { celsiusFromY, fahrenheitFromCelsius } from './thermometer'

describe('thermometer conversion', () => {
  it('maps the top and bottom scale to 50 and -20 Celsius', () => {
    expect(celsiusFromY(100, 100, 800)).toBe(50)
    expect(celsiusFromY(800, 100, 800)).toBe(-20)
  })

  it('converts Celsius to Fahrenheit', () => {
    expect(fahrenheitFromCelsius(0)).toBe(32)
    expect(fahrenheitFromCelsius(100)).toBe(212)
  })
})
