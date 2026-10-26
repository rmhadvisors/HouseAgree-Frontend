import { useState } from "react";
import { area, docType, english, money, niceDate, reviewWarnings } from "../format.js";

const NA = <span className="muted">Not found</span>;

function Row({ label, children }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>{children ?? NA}</dd>
    </div>
  );
}

function Parties({ title, people }) {
  return (
    <div className="block">
      <h4>{title} <span className="count">{people?.length || 0}</span></h4>
      {!people?.length ? (
        <p className="muted small">None found</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>PAN</th><th>Age</th></tr>
            </thead>
            <tbody>
              {people.map((p, i) => (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td className="name-cell">{english(p.name_en) || <span className="muted">Name not available in English</span>}</td>
                  <td className="mono">
                    {p.pan ? p.pan : <span className="tag warn">Missing</span>}
                    {p.pan_repaired && <span className="tag info" title="Auto-corrected from a common OCR mistake">Corrected</span>}
                  </td>
                  <td>{p.age ?? <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ResultCard({ r }) {
  const [open, setOpen] = useState(true);

  if (r.error) {
    return (
      <article className="card error-card">
        <header className="card-head">
          <div>
            <h3>{r.source_file}</h3>
            <p className="error-text">{r.error}</p>
          </div>
          <span className="status bad">Failed</span>
        </header>
      </article>
    );
  }

  const warnings = reviewWarnings(r);

  return (
    <article className="card">
      <header className="card-head" onClick={() => setOpen((o) => !o)}>
        <div>
          <h3>{r.source_file}</h3>
          <p className="meta">
            {r.document_no && <>Document no. <b>{r.document_no}</b> · </>}
            {docType(r) || "Agreement"} · Index II on page {r.index2_page}
          </p>
        </div>
        <div className="head-right">
          <span className={`status ${warnings.length ? "warn" : "ok"}`}>
            {warnings.length ? `Review (${warnings.length})` : "Verified"}
          </span>
          <span className={`chev ${open ? "open" : ""}`} aria-hidden="true">▾</span>
        </div>
      </header>

      {open && (
        <div className="card-body">
          <div className="amounts">
            <div className="amount primary"><span>Transaction amount</span><b>{money(r.transaction_amount) ?? "—"}</b></div>
            <div className="amount"><span>Stamp Duty Value</span><b>{money(r.market_value) ?? "—"}</b></div>
            <div className="amount"><span>Stamp duty</span><b>{money(r.stamp_duty) ?? "—"}</b></div>
            <div className="amount"><span>Registration fee</span><b>{money(r.registration_fee) ?? "—"}</b></div>
          </div>

          <div className="two-col">
            <div className="block">
              <h4>Document details</h4>
              <dl className="rows">
                <Row label="Document type">{docType(r)}</Row>
                <Row label="Document number">{r.document_no}</Row>
                <Row label="Agreement date">{niceDate(r.agreement_date)}</Row>
                <Row label="Area">{area(r.area)}</Row>
              </dl>
            </div>
            <div className="block">
              <h4>Property</h4>
              <p className="address">{english(r.property_address_en) || NA}</p>
            </div>
          </div>

          <Parties title="Sellers" people={r.sellers} />
          <Parties title="Buyers" people={r.buyers} />

          {warnings.length > 0 && (
            <div className="warnings">
              <h4>Please review</h4>
              <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}

        </div>
      )}
    </article>
  );
}
