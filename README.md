# Instrument Reader

A Vite + React single-page app that reads supplied PNG photos of a seven-segment LCD or an analog thermometer directly in the browser. It returns the detected value and a downloadable annotated PNG; uploaded images are not sent to a server.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, choose `Thermometer` or `LCD display`, select a PNG, and press `Analyze image`.

## Verification

```bash
npm test
npm run build
npm run preview
```

The supplied fixtures are under `validation/task2/`: `thermo1.png`, `lcd2.png`, `lcd4.png`, and `lcd5.png`.

## Supported inputs and limitations

- Only readable PNG files are accepted, with a 12 MB limit.
- The first version is calibrated for the thermometer and seven-segment LCD layouts represented by the validation images.
- Thermometer output reports Celsius and Fahrenheit and highlights the detected liquid/central column.
- LCD output detects dark seven-segment glyphs and returns digits in reading order.
- Arbitrary camera angles, glare, occlusion, non-seven-segment displays, and unfamiliar thermometer scales may need a later calibration step.

## Deploy to Vercel

1. Create a GitHub repository and push this project.
2. In Vercel, select **Add New Project**, import the repository, and keep the detected Vite settings.
3. The build command is `npm run build` and the output directory is `dist`.
4. Deploy and smoke-test PNG upload, analysis, and annotated PNG download.
