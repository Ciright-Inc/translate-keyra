"use client";

import { useEffect, useState } from "react";

export default function AdminBillingPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/billing?limit=50")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setRows(j.data.billing);
          setSummary(j.data.summary);
        }
      });
  }, []);

  return (
    <>
      <h1 className="tr-page-title">Airtime Billing</h1>
      <p className="tr-page-sub">
        Both calling and receiving EIDs are charged — Google, AWS, platform fee, per call
      </p>
      {summary && (
        <div className="tr-stat-grid">
          <div className="tr-stat">
            <div className="tr-stat-value">
              {Math.round(Number(summary.total_airtime_seconds ?? 0) / 60)}
            </div>
            <div className="tr-stat-label">Total airtime minutes</div>
          </div>
          <div className="tr-stat">
            <div className="tr-stat-value">€{Number(summary.total_billed ?? 0).toFixed(2)}</div>
            <div className="tr-stat-label">Total billed</div>
          </div>
          <div className="tr-stat">
            <div className="tr-stat-value">{summary.call_count as number}</div>
            <div className="tr-stat-label">Billed call records</div>
          </div>
        </div>
      )}
      <div className="tr-table-wrap">
        <table className="tr-table">
          <thead>
            <tr>
              <th>EID</th>
              <th>Airtime</th>
              <th>Google</th>
              <th>AWS</th>
              <th>Platform</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={String(b.billing_id)}>
                <td>{String(b.eid)}</td>
                <td>{String(b.airtime_seconds)}s</td>
                <td>€{Number(b.google_translation_cost).toFixed(2)}</td>
                <td>€{Number(b.aws_transport_cost).toFixed(2)}</td>
                <td>€{Number(b.platform_fee).toFixed(2)}</td>
                <td>€{Number(b.total_cost).toFixed(2)}</td>
                <td>{String(b.billing_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
