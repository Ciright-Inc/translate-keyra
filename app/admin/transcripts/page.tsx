"use client";

import { useEffect, useState } from "react";

export default function AdminTranscriptsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  function search(term = q) {
    const params = new URLSearchParams({ limit: "50" });
    if (term) params.set("q", term);
    fetch(`/api/transcripts?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRows(j.data.transcripts);
      });
  }

  useEffect(() => {
    search("");
  }, []);

  return (
    <>
      <h1 className="tr-page-title">Transcript Search</h1>
      <p className="tr-page-sub">
        Enterprise compliance review — structured dialogue with confidence scores
      </p>
      <input
        className="tr-search"
        placeholder="Search original or translated text…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      <button type="button" className="tr-btn tr-btn-secondary" onClick={() => search()}>
        Search
      </button>
      <div className="tr-table-wrap" style={{ marginTop: 16 }}>
        <table className="tr-table">
          <thead>
            <tr>
              <th>Original</th>
              <th>Translated</th>
              <th>Languages</th>
              <th>Confidence</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={String(t.transcript_id)}>
                <td style={{ maxWidth: 280 }}>{String(t.original_text)}</td>
                <td style={{ maxWidth: 280 }}>{String(t.translated_text)}</td>
                <td>
                  {String(t.original_language)} → {String(t.translated_language)}
                </td>
                <td>{Number(t.confidence_score).toFixed(2)}</td>
                <td>
                  {String(t.object_type)}:{String(t.object_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
