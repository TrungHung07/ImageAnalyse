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

export function getReadingCrop(width, height, endpoint) {
  const cropWidth = width
  const cropHeight = Math.min(height, Math.max(160, Math.round(width * 0.58)))
  const top = Math.max(0, Math.min(height - cropHeight, Math.round(endpoint - cropHeight * 0.48)))
  return { left: 0, top, width: cropWidth, height: cropHeight }
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
  const crop = getReadingCrop(width, height, endpoint)
  const annotated = document.createElement('canvas')
  annotated.width = crop.width
  annotated.height = crop.height
  const output = annotated.getContext('2d')
  output.drawImage(canvas, crop.left, crop.top, crop.width, crop.height, 0, 0, crop.width, crop.height)
  const cropEndpoint = endpoint - crop.top
  const cropLiquidBase = (column.source === 'red liquid' ? column.bottom : Math.round(height * 0.82)) - crop.top
  const cropColumnX = column.x - crop.left
  const markerLeft = 0
  const markerRight = crop.width
  output.lineCap = 'round'
  output.lineWidth = Math.max(4, crop.width / 48)
  output.strokeStyle = 'rgba(213, 95, 50, 0.35)'
  output.beginPath()
  output.moveTo(cropColumnX, Math.min(crop.height, Math.max(0, cropLiquidBase)))
  output.lineTo(cropColumnX, cropEndpoint)
  output.stroke()
  output.lineWidth = Math.max(2, crop.width / 130)
  output.strokeStyle = '#d55f32'
  output.beginPath()
  output.moveTo(markerLeft, cropEndpoint)
  output.lineTo(markerRight, cropEndpoint)
  output.stroke()
  output.fillStyle = '#d55f32'
  output.beginPath()
  output.arc(cropColumnX, cropEndpoint, Math.max(7, crop.width / 30), 0, Math.PI * 2)
  output.fill()
  output.font = `600 ${Math.max(16, crop.width / 20)}px Space Grotesk, sans-serif`
  const label = `${celsius.toFixed(1)}°C`
  const labelX = Math.min(crop.width - 150, Math.max(8, cropColumnX + crop.width * 0.08))
  const labelY = Math.max(34, cropEndpoint - crop.width * 0.08)
  const labelWidth = output.measureText(label).width + 20
  output.fillStyle = 'rgba(255, 253, 248, 0.92)'
  output.fillRect(labelX - 10, labelY - 26, labelWidth, 34)
  output.fillStyle = '#b84d27'
  output.fillText(label, labelX, labelY)
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
