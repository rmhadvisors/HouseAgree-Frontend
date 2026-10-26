# AgreeScan: agreement information extractor (frontend, Vite + React)

## Run (development)
1. Start the backend (from `../index2-extractor`):
   ```bash
   venv\Scripts\activate
   python -m app.main          # http://localhost:5000
   ```
2. Start the frontend (from this folder):
   ```bash
   npm install
   npm run dev                 # http://localhost:5173
   ```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so there are no CORS issues.
To use a different backend, set `BACKEND_URL` in `.env` (see `.env.example`).

## Production build
```bash
npm run build                 # outputs dist/
```
Serve `dist/` from the same host as the backend, with `/api` reverse-proxied to Flask. Alternatively, set
`VITE_API_URL=http://your-backend:5000` before building so the app calls the backend directly (CORS is enabled).

## Deploy on Vercel
Vercel serves only the frontend, so the app must call the Flask backend directly:
1. Set the environment variable `VITE_API_URL=https://your-backend-domain` in the Vercel project (no trailing slash).
2. The backend must be served over **HTTPS** (browsers block an https page calling an http API), and its gunicorn/nginx
   timeouts must be at least 600 s because OCR of a PDF takes minutes.
3. Build command `npm run build`, output directory `dist`.

## Features
- Drag and drop one or more PDFs; they are sent to `POST /api/extract` in the `files` field
- Shows upload progress, then a processing indicator with an elapsed timer (OCR can take minutes)
- **Actual payment date** input (sent as `payment_date`); the Excel calculates due date, delay, TDS, interest and late fees from it
- For each file: amounts, date, address, sellers and buyers with PAN, and a "Needs review" list that says exactly what to check
- **Download Excel** button: the backend returns the workbook inside the response (nothing is stored on the server)
