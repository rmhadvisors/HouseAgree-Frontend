import { useRef, useState } from "react";
import { fileSize } from "../format.js";

export default function Dropzone({ files, onAdd, onRemove, disabled }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const accept = (list) => {
    const pdfs = [...list].filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length) onAdd(pdfs);
  };

  const browse = () => !disabled && input.current?.click();

  return (
    <div>
      <div
        className={`dropzone ${over ? "over" : ""} ${disabled ? "disabled" : ""}`}
        onClick={browse}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) accept(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && browse()}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M12 18v-6" />
          <path d="m9 15 3-3 3 3" />
        </svg>
        <p className="dz-title">Drop agreement PDFs here</p>
        <p className="dz-sub">or click to browse. Scanned registration documents, one or more PDFs.</p>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => { accept(e.target.files); e.target.value = ""; }}
        />
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`}>
              <span className="pdf-badge">PDF</span>
              <span className="file-name" title={f.name}>{f.name}</span>
              <span className="file-size">{fileSize(f.size)}</span>
              {!disabled && (
                <button className="icon-btn" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`}>×</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
