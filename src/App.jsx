import { useEffect, useRef, useState } from "react";
import { checkHealth, downloadExcel, extractPdfs } from "./api.js";
import { elapsed, reviewWarnings } from "./format.js";
import Dropzone from "./components/Dropzone.jsx";
import ResultCard from "./components/ResultCard.jsx";

function useBackendStatus() {
  const [status, setStatus] = useState("checking");
  useEffect(() => {
    let alive = true;
    const ping = () =>
      checkHealth()
        .then(() => alive && setStatus("online"))
        .catch(() => alive && setStatus("offline"));
    ping();
    const id = setInterval(ping, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return status;
}

export default function App() {
  const backend = useBackendStatus();
  const [files, setFiles] = useState([]);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | done
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);
  const job = useRef(null);

  const busy = phase === "uploading" || phase === "processing";

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [busy]);

  const addFiles = (list) => setFiles((prev) => {
    const key = (f) => `${f.name}|${f.size}`;
    const seen = new Set(prev.map(key));
    return [...prev, ...list.filter((f) => !seen.has(key(f)))];
  });

  async function run() {
    setError("");
    setResponse(null);
    setProgress(0);
    setSeconds(0);
    setPhase("uploading");
    job.current = extractPdfs(files, paymentDate, {
      onUploadProgress: (p) => {
        setProgress(p);
        if (p >= 1) setPhase("processing");
      },
    });
    try {
      const body = await job.current.promise;
      setResponse(body);
      setPhase("done");
    } catch (e) {
      setPhase("idle");
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      job.current = null;
    }
  }

  const reset = () => { setFiles([]); setResponse(null); setError(""); setPhase("idle"); };

  const results = response?.results || [];
  const failed = results.filter((r) => r.error).length;
  const reviewList = results.filter((r) => !r.error && reviewWarnings(r).length);
  const review = reviewList.length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </span>
          <div>
            <h1>AgreeScan</h1>
            <p>Agreement information extractor</p>
          </div>
        </div>
        <span className={`backend ${backend}`}>
          <i />{backend === "online" ? "Backend online" : backend === "offline" ? "Backend offline" : "Checking…"}
        </span>
      </header>

      <main>
        {backend === "offline" && (
          <div className="banner error">
            Can&apos;t reach the Flask backend. Start it with <code>python -m app.main</code> in the
            <code>index2-extractor</code> folder (it listens on port 5000).
          </div>
        )}

        <section className="panel">
          <h2>Upload agreements</h2>
          <Dropzone
            files={files}
            disabled={busy}
            onAdd={addFiles}
            onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))}
          />

          <label className="date-field">
            <span>Actual payment date</span>
            <input
              type="date"
              value={paymentDate}
              disabled={busy}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </label>

          <div className="actions">
            {!busy && (
              <button className="btn primary" disabled={!files.length || !paymentDate} onClick={run}>
                Extract {files.length > 1 ? `${files.length} PDFs` : files.length ? "PDF" : ""}
              </button>
            )}
            {busy && <button className="btn" onClick={() => job.current?.abort()}>Cancel</button>}
            {!busy && (files.length > 0 || response) && (
              <button className="btn ghost" onClick={reset}>Clear</button>
            )}
          </div>

          {busy && (
            <div className="progress-box">
              <div className="progress-label">
                <span>
                  {phase === "uploading"
                    ? `Uploading… ${Math.round(progress * 100)}%`
                    : "Reading the agreement and extracting details…"}
                </span>
                <span className="muted">{elapsed(seconds)}</span>
              </div>
              <div className={`bar ${phase === "processing" ? "indeterminate" : ""}`}>
                <div style={{ width: phase === "uploading" ? `${progress * 100}%` : undefined }} />
              </div>
              {phase === "processing" && (
                <p className="muted small">
                  This usually takes about a minute per PDF. Keep this tab open.
                </p>
              )}
            </div>
          )}

          {error && <div className="banner error">{error}</div>}
        </section>

        {response && (
          <section className="results">
            <div className="results-head">
              <div>
                <h2>Results</h2>
                <p className="muted">
                  {results.length} file{results.length !== 1 && "s"} processed in {elapsed(seconds)}
                  {review > 0 && <> · <span className="txt-warn">{review} need review</span></>}
                  {failed > 0 && <> · <span className="txt-bad">{failed} failed</span></>}
                </p>
              </div>
              {response.excel_base64 && (
                <button className="btn primary" onClick={() => downloadExcel(response)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                  Download Excel
                </button>
              )}
            </div>
            {reviewList.length > 0 && (
              <div className="banner warn">
                <b>Needs review:</b>
                <ul>
                  {reviewList.map((r, i) => (
                    <li key={i}><b>{r.source_file}</b>
                      <ul>{reviewWarnings(r).map((w, j) => <li key={j}>{w}</li>)}</ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.map((r, i) => <ResultCard key={`${r.source_file}-${i}`} r={r} />)}
          </section>
        )}
      </main>
    </div>
  );
}
