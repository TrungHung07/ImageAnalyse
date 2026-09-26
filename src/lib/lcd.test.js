import { describe, expect, it } from 'vitest'
import { classifySevenSegment } from './lcd'

describe('seven-segment decoding', () => {
  it('decodes a fully lit eight', () => {
    expect(classifySevenSegment([1, 1, 1, 1, 1, 1, 1]).digit).toBe('8')
  })

  it('decodes a one', () => {
    expect(classifySevenSegment([0, 1, 1, 0, 0, 0, 0]).digit).toBe('1')
  })

  it('returns a bounded confidence', () => {
    expect(classifySevenSegment([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]).confidence).toBeGreaterThanOrEqual(0)
    expect(classifySevenSegment([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]).confidence).toBeLessThanOrEqual(1)
  })
})
