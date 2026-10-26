const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const apiUrl = (path) => `${BASE}${path}`;

export async function checkHealth() {
  const res = await fetch(apiUrl("/api/health"), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Upload PDFs to POST /api/extract.
 * Uses XHR (not fetch) so upload progress can be reported.
 * Returns { promise, abort }.
 */
export function extractPdfs(files, paymentDate, { onUploadProgress } = {}) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f, f.name));

    form.append("payment_date", paymentDate); // YYYY-MM-DD, drives interest / late fee in the Excel

    xhr.open("POST", apiUrl("/api/extract"));
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) onUploadProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && body) return resolve(body);
      if (xhr.status === 413) return reject(new Error("Upload too large (see MAX_UPLOAD_MB on the backend)"));
      reject(new Error(body?.error || `Server returned HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Could not reach the backend. Is the Flask server running on port 5000?"));
    xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

/** Save the Excel returned inside the /api/extract response (nothing is stored on the server). */
export function downloadExcel({ excel_base64, excel_name }) {
  const bytes = Uint8Array.from(atob(excel_base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = excel_name || "output.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
