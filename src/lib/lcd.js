const DIGIT_PATTERNS = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
}
const LCD_DARK_THRESHOLD = 100

function meanDarkness(data, width, height, x0, y0, x1, y1) {
  let total = 0
  let dark = 0
  const startX = Math.max(0, Math.floor(x0))
  const endX = Math.min(width, Math.ceil(x1))
  const startY = Math.max(0, Math.floor(y0))
  const endY = Math.min(height, Math.ceil(y1))
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * width + x) * 4
      const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
      total += 1
      if (luminance < LCD_DARK_THRESHOLD) dark += 1
    }
  }
  return total ? dark / total : 0
}

export function classifySevenSegment(segments) {
  let bestDigit = null
  let bestScore = -Infinity
  for (const [digit, pattern] of Object.entries(DIGIT_PATTERNS)) {
    const score = pattern.reduce((sum, expected, index) => sum + (expected ? segments[index] : 1 - segments[index]), 0) / pattern.length
    if (score > bestScore) {
      bestDigit = digit
      bestScore = score
    }
  }
  return { digit: bestDigit, confidence: Math.max(0, Math.min(1, bestScore)) }
}

function findRuns(values, threshold, maxGap = 2) {
  const runs = []
  let start = -1
  let gap = 0
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] >= threshold) {
      if (start < 0) start = index
      gap = 0
    } else if (start >= 0) {
      gap += 1
      if (gap > maxGap) {
        runs.push([start, index - gap + 1])
        start = -1
        gap = 0
      }
    }
  }
  if (start >= 0) runs.push([start, values.length - gap])
  return runs.filter(([from, to]) => to - from > 2)
}

function detectRows(data, width, height, xStart, xEnd) {
  const projection = Array.from({ length: height }, () => 0)
  for (let y = 0; y < height; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const index = (y * width + x) * 4
      const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
      if (luminance < LCD_DARK_THRESHOLD) projection[y] += 1
    }
  }
  return findRuns(projection, Math.max(2, (xEnd - xStart) * 0.015), 20)
}

function detectDigits(data, width, height) {
  const xStart = Math.floor(width * 0.12)
  const xEnd = Math.ceil(width * 0.88)
  const yStart = Math.floor(height * 0.04)
  const yEnd = Math.ceil(height * 0.78)
  const projection = Array.from({ length: width }, () => 0)
  for (let x = xStart; x < xEnd; x += 1) {
    for (let y = yStart; y < yEnd; y += 1) {
      const index = (y * width + x) * 4
      const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
      if (luminance < LCD_DARK_THRESHOLD) projection[x] += 1
    }
  }
  const boxes = []
  const rows = [
    [Math.floor(height * 0.15), Math.floor(height * 0.45)],
    [Math.floor(height * 0.47), Math.floor(height * 0.68)],
  ]
  for (const [rowStart, rowEnd] of rows) {
    const rowProjection = projection.map((value) => value)
    for (let x = 0; x < width; x += 1) rowProjection[x] = 0
    for (let x = xStart; x < xEnd; x += 1) {
      for (let y = rowStart; y <= rowEnd; y += 1) {
        const index = (y * width + x) * 4
        const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
        if (luminance < LCD_DARK_THRESHOLD) rowProjection[x] += 1
      }
    }
      const rowHeight = rowEnd - rowStart
    let digitCount = 0
    let digitStart = 0
    let digitEnd = 0
    if (rowHeight > height * 0.23) {
      digitCount = 3
      digitStart = Math.floor(width * 0.2)
      digitEnd = Math.ceil(width * 0.82)
    } else if (rowHeight > height * 0.12) {
      digitCount = 2
      digitStart = Math.floor(width * 0.3)
      digitEnd = Math.ceil(width * 0.75)
    }
    if (digitCount) {
      const totalWidth = digitEnd - digitStart
      const gap = totalWidth * 0.06
      const digitWidth = (totalWidth - gap * (digitCount - 1)) / digitCount
      for (let index = 0; index < digitCount; index += 1) {
        boxes.push({
          x: Math.round(digitStart + index * (digitWidth + gap)),
          y: rowStart,
          width: Math.round(digitWidth),
          height: rowHeight,
        })
      }
    }
  }
  return boxes.sort((a, b) => a.y - b.y || a.x - b.x)
}

function readSegments(data, width, height, box) {
  const { x, y, width: boxWidth, height: boxHeight } = box
  const horizontal = [
    [0.2, 0.04, 0.8, 0.22],
    [0.78, 0.18, 0.96, 0.48],
    [0.78, 0.52, 0.96, 0.82],
    [0.2, 0.78, 0.8, 0.96],
    [0.04, 0.52, 0.22, 0.82],
    [0.04, 0.18, 0.22, 0.48],
    [0.2, 0.4, 0.8, 0.6],
  ]
  return horizontal.map(([x0, y0, x1, y1]) => meanDarkness(data, width, height, x + x0 * boxWidth, y + y0 * boxHeight, x + x1 * boxWidth, y + y1 * boxHeight))
}

export function analyzeLcd(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const { width, height } = canvas
  const image = context.getImageData(0, 0, width, height)
  const boxes = detectDigits(image.data, width, height)
  if (!boxes.length) throw new Error('No seven-segment digits were found. Try a closer, brighter PNG.')

  const readings = boxes.map((box) => {
    const segments = readSegments(image.data, width, height, box)
    const result = classifySevenSegment(segments)
    return { ...box, ...result }
  })
  const confidence = readings.reduce((sum, item) => sum + item.confidence, 0) / readings.length
  const annotated = document.createElement('canvas')
  annotated.width = width
  annotated.height = height
  const output = annotated.getContext('2d')
  output.drawImage(canvas, 0, 0)
  output.lineWidth = Math.max(2, width / 180)
  output.font = `600 ${Math.max(14, width / 22)}px Space Grotesk, sans-serif`
  readings.forEach((item) => {
    output.strokeStyle = '#d55f32'
    output.fillStyle = '#d55f32'
    output.strokeRect(item.x, item.y, item.width, item.height)
    output.fillText(item.digit, item.x, Math.max(item.y - 8, 18))
  })
  return {
    kind: 'lcd',
    value: readings.map((item) => item.digit).join(''),
    confidence,
    boxes: readings,
    annotatedUrl: annotated.toDataURL('image/png'),
  }
}
