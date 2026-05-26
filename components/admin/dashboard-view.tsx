"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/fetch-json";

type Analytics = {
  overview: {
    translated_minutes: number;
    active_calls: number;
    total_calls: number;
    languages_used: number;
    avg_confidence: string;
  };
  activeCalls: Array<{
    call_id: string;
    source_language: string;
    destination_language: string;
    origin_app: string;
    from_name: string;
    to_name: string;
    call_status: string;
  }>;
};

export function DashboardView() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<Analytics>("/api/analytics").then((j) => {
      if (j.ok) setData(j.data);
      else setError(j.error);
    });
  }, []);

  if (error) {
    return (
      <p style={{ color: "var(--tr-warning)" }}>
        {error}. Run <code>npm run db:migrate</code> and ensure DATABASE_URL reaches keyra-auth.
      </p>
    );
  }

  if (!data) return <p style={{ color: "var(--tr-muted)" }}>Loading analytics…</p>;

  const o = data.overview;

  return (
    <>
      <div className="tr-stat-grid">
        <div className="tr-stat">
          <div className="tr-stat-value">{o.translated_minutes ?? 0}</div>
          <div className="tr-stat-label">Translated minutes</div>
        </div>
        <div className="tr-stat">
          <div className="tr-stat-value">{o.active_calls ?? 0}</div>
          <div className="tr-stat-label">Active calls</div>
        </div>
        <div className="tr-stat">
          <div className="tr-stat-value">{o.total_calls ?? 0}</div>
          <div className="tr-stat-label">Total calls</div>
        </div>
        <div className="tr-stat">
          <div className="tr-stat-value">{o.languages_used ?? 0}</div>
          <div className="tr-stat-label">Languages used</div>
        </div>
        <div className="tr-stat">
          <div className="tr-stat-value">
            {Number(o.avg_confidence ?? 0).toFixed(2)}
          </div>
          <div className="tr-stat-label">Avg confidence</div>
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Live active calls</h2>
      <div className="tr-table-wrap">
        <table className="tr-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Languages</th>
              <th>Origin</th>
              <th>Participants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.activeCalls.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--tr-muted)" }}>
                  No active translation sessions
                </td>
              </tr>
            ) : (
              data.activeCalls.map((c) => (
                <tr key={c.call_id}>
                  <td>
                    <span className={`tr-badge tr-badge-${c.call_status === "active" ? "active" : "ringing"}`}>
                      {c.call_status}
                    </span>
                  </td>
                  <td>
                    {c.source_language} → {c.destination_language}
                  </td>
                  <td>{c.origin_app}</td>
                  <td>
                    {c.from_name} / {c.to_name ?? "—"}
                  </td>
                  <td>
                    <Link href={`/admin/calls?id=${c.call_id}`}>View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
