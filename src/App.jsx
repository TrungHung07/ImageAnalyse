import { useEffect, useState } from 'react'
import { analyzeImage } from './lib/imageAnalysis'
import { loadPng, validatePngFile } from './lib/imageValidation'

const modes = [
  { id: 'thermometer', label: 'Thermometer', detail: 'Read the red liquid level' },
  { id: 'lcd', label: 'LCD display', detail: 'Decode seven-segment digits' },
]

function App() {
  const [mode, setMode] = useState('thermometer')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  async function handleFileChange(event) {
    const nextFile = event.target.files?.[0]
    setResult(null)
    setError('')
    if (!nextFile) return
    const validation = validatePngFile(nextFile)
    if (!validation.valid) {
      setFile(null)
      setPreviewUrl('')
      setError(validation.message)
      return
    }
    try {
      await loadPng(nextFile)
      setFile(nextFile)
      setPreviewUrl(URL.createObjectURL(nextFile))
    } catch (loadError) {
      setFile(null)
      setPreviewUrl('')
      setError(loadError.message)
    }
  }

  async function handleAnalyze() {
    if (!file) return
    setError('')
    setIsAnalyzing(true)
    try {
      const image = await loadPng(file)
      setResult(analyzeImage(image, mode))
    } catch (analysisError) {
      setResult(null)
      setError(analysisError.message || 'The image could not be analyzed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleReset() {
    setFile(null)
    setPreviewUrl('')
    setResult(null)
    setError('')
  }

  return (
    <main className="page-shell">
      <section className="hero-copy">
        <p className="eyebrow">Computer vision / local analysis</p>
        <h1>Turn instrument photos into a reading.</h1>
        <p className="intro">
          Upload a clean PNG of a thermometer or seven-segment display. The analysis stays in your browser.
        </p>
      </section>

      <section className="workspace-panel" aria-label="Image analysis workspace">
        <div className="panel-header">
          <div>
            <span className="step-label">01 / Choose instrument</span>
            <h2>What are we reading?</h2>
          </div>
          <span className="privacy-note">PNG only · private by default</span>
        </div>
        <div className="mode-grid" role="radiogroup" aria-label="Instrument type">
          {modes.map((item) => (
            <button
              aria-checked={mode === item.id}
              className={`mode-card ${mode === item.id ? 'is-selected' : ''}`}
              key={item.id}
              onClick={() => setMode(item.id)}
              role="radio"
              type="button"
            >
              <span className="mode-index">{item.id === 'thermometer' ? 'A' : 'B'}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          ))}
        </div>

        <label className={`upload-zone ${file ? 'has-file' : ''}`} htmlFor="image-upload">
          <span className="step-label">02 / Add image</span>
          {previewUrl ? (
            <img alt="Selected instrument preview" className="image-preview" src={previewUrl} />
          ) : (
            <>
              <span className="upload-mark">+</span>
              <h2>Select a PNG image</h2>
              <p>Use a clear photo with the instrument facing the camera.</p>
            </>
          )}
          <input accept=".png,image/png" id="image-upload" onChange={handleFileChange} type="file" />
          <span className="file-hint">{file ? file.name : 'Browse files'}</span>
        </label>

        {error && <p aria-live="polite" className="error-message">{error}</p>}

        <div className="action-row">
          <button className="primary-button" disabled={!file || isAnalyzing} onClick={handleAnalyze} type="button">
            {isAnalyzing ? 'Analyzing image...' : 'Analyze image'}
          </button>
          {file && <button className="text-button" onClick={handleReset} type="button">Choose another</button>}
        </div>

        {result && (
          <section className="result-section" aria-live="polite">
            <div className="result-heading">
              <div>
                <span className="step-label">03 / Reading</span>
                <h2>{result.kind === 'lcd' ? 'Digits found' : 'Temperature found'}</h2>
              </div>
              <span className="confidence">Confidence {Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="result-value">
              {result.kind === 'lcd' ? (
                <strong>{result.value}</strong>
              ) : (
                <>
                  <strong>{result.celsius.toFixed(1)}°C</strong>
                  <span>{result.fahrenheit.toFixed(1)}°F</span>
                </>
              )}
            </div>
            <div className="result-image-wrap">
              <img alt="Annotated analysis result" src={result.annotatedUrl} />
            </div>
            <a className="download-button" download={`instrument-reading-${result.kind}.png`} href={result.annotatedUrl}>Download annotated PNG</a>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
