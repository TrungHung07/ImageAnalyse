import { describe, expect, it } from 'vitest'
import { hasPngSignature, validatePngFile } from './imageValidation'

const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

function file(name, type, bytes = pngHeader) {
  return new File([bytes], name, { type })
}

describe('PNG validation', () => {
  it('accepts a PNG with a valid signature', async () => {
    const input = file('thermo.png', 'image/png')
    expect(validatePngFile(input).valid).toBe(true)
    expect(await hasPngSignature(input)).toBe(true)
  })

  it('rejects JPEG files', () => {
    expect(validatePngFile(file('photo.jpg', 'image/jpeg')).valid).toBe(false)
  })

  it('rejects a renamed file with a non-PNG signature', async () => {
    const input = file('photo.png', 'image/png', new Uint8Array([1, 2, 3, 4]))
    expect(await hasPngSignature(input)).toBe(false)
  })
})
