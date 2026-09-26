function pixelStats(data, width, x, y) {
  const index = (y * width + x) * 4
  return { r: data[index], g: data[index + 1], b: data[index + 2] }
}

function isLiquidPixel({ r, g, b }) {
  return r > 75 && r > g * 1.18 && r > b * 1.12
}

function isDarkPixel({ r, g, b }) {
  return (r + g + b) / 3 < 125
}

function findLiquidColumn(data, width, height) {
  const center = Math.floor(width * 0.5)
  const candidates = []
  for (let x = Math.max(0, center - Math.floor(width * 0.12)); x <= Math.min(width - 1, center + Math.floor(width * 0.12)); x += 1) {
    let liquid = 0
    let dark = 0
    let first = height
    let last = -1
    for (let y = 0; y < height; y += 1) {
      const stats = pixelStats(data, width, x, y)
      if (isLiquidPixel(stats)) {
        liquid += 1
        first = Math.min(first, y)
        last = Math.max(last, y)
      }
      if (isDarkPixel(stats)) dark += 1
    }
    candidates.push({ x, liquid, dark, first, last })
  }
  const redCandidate = candidates.reduce((best, item) => item.liquid > best.liquid ? item : best, candidates[0])
  if (redCandidate?.liquid > height * 0.04) {
    return { x: redCandidate.x, top: redCandidate.first, bottom: redCandidate.last, strength: redCandidate.liquid / height, source: 'red liquid' }
  }
  const darkCandidate = candidates.reduce((best, item) => item.dark > best.dark ? item : best, candidates[0])
  return {
    x: darkCandidate.x,
    top: Math.round(height * 0.18),
    bottom: Math.round(height * 0.68),
    strength: darkCandidate.dark / height,
    source: 'central column',
  }
}

function findScaleBounds(data, width, height) {
  const rows = []
  const xStart = Math.floor(width * 0.32)
  const xEnd = Math.floor(width * 0.68)
  for (let y = Math.floor(height * 0.12); y < Math.floor(height * 0.78); y += 1) {
    let dark = 0
    for (let x = xStart; x < xEnd; x += 1) {
      if (isDarkPixel(pixelStats(data, width, x, y))) dark += 1
    }
    if (dark > (xEnd - xStart) * 0.17) rows.push(y)
  }
  if (rows.length < 2) return { top: Math.round(height * 0.22), bottom: Math.round(height * 0.67) }
  return { top: Math.min(...rows), bottom: Math.max(...rows) }
}

export function celsiusFromY(y, top, bottom) {
  const ratio = Math.max(0, Math.min(1, (y - top) / Math.max(1, bottom - top)))
  return 50 - ratio * 70
}

export function fahrenheitFromCelsius(celsius) {
  return celsius * 9 / 5 + 32
}

export function analyzeThermometer(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const { width, height } = canvas
  const image = context.getImageData(0, 0, width, height)
  const column = findLiquidColumn(image.data, width, height)
  const scale = findScaleBounds(image.data, width, height)
  const endpoint = column.source === 'red liquid' ? column.top : column.bottom
  const celsius = celsiusFromY(endpoint, scale.top, scale.bottom)
  const fahrenheit = fahrenheitFromCelsius(celsius)
  const confidence = Math.min(0.98, Math.max(0.22, column.strength * 2.4))
  const annotated = document.createElement('canvas')
  annotated.width = width
  annotated.height = height
  const output = annotated.getContext('2d')
  output.drawImage(canvas, 0, 0)
  output.lineWidth = Math.max(2, width / 180)
  output.strokeStyle = '#d55f32'
  output.fillStyle = '#d55f32'
  output.beginPath()
  output.moveTo(column.x, scale.top)
  output.lineTo(column.x, endpoint)
  output.stroke()
  output.beginPath()
  output.arc(column.x, endpoint, Math.max(5, width / 45), 0, Math.PI * 2)
  output.fill()
  output.font = `600 ${Math.max(14, width / 24)}px Space Grotesk, sans-serif`
  output.fillText(`${celsius.toFixed(1)}°C`, Math.min(width - 130, column.x + 18), Math.max(24, endpoint - 12))
  return {
    kind: 'thermometer',
    value: `${celsius.toFixed(1)} °C`,
    celsius,
    fahrenheit,
    confidence,
    source: column.source,
    endpoint,
    annotatedUrl: annotated.toDataURL('image/png'),
  }
}
