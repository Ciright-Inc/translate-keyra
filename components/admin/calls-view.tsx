"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthSession } from "@/components/auth/auth-guard";
import { fetchJson } from "@/lib/fetch-json";

type CallRow = {
  call_id: string;
  call_status: string;
  source_language: string;
  destination_language: string;
  duration_seconds: number | null;
  from_display_name: string;
  to_display_name: string;
  object_type: string;
  object_id: string;
  origin_app: string;
  total_cost: string;
  call_start_time: string;
};

export function CallsView() {
  const { user } = useAuthSession();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fromUid = user?.id ?? Number(process.env.NEXT_PUBLIC_TRANSLATE_DEV_UID ?? 1);

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<{ calls: CallRow[] }>("/api/calls?limit=50")
      .then((j) => {
        if (j.ok) setCalls(j.data.calls);
        else toast.error(j.error);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  async function initiateDemoCall() {
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_uid: fromUid,
        to_uid: 2,
        from_eid: "EID-DEMO-001",
        to_eid: "EID-DEMO-002",
        object_type: "prompt",
        object_id: "prompt-demo",
        origin_app: "prompt.ciright.com",
        origin_path: "/edit_prompt/prompt-demo",
        subscription_id: "SUB-KEYRA-IE",
        world_id: "WORLD-IE-01",
      }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success(`Call initiated: ${j.data.call_id}`);
      load();
    } else toast.error(j.error);
  }

  return (
    <>
      <div className="tr-toolbar">
        <button type="button" className="tr-btn tr-btn-primary" onClick={initiateDemoCall}>
          Initiate Translation Call
        </button>
        <button type="button" className="tr-btn tr-btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--tr-muted)" }}>Loading calls…</p>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Languages</th>
                <th>From → To</th>
                <th>Context</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.call_id}>
                  <td>
                    <span
                      className={`tr-badge tr-badge-${
                        c.call_status === "active"
                          ? "active"
                          : c.call_status === "completed"
                            ? "completed"
                            : "ringing"
                      }`}
                    >
                      {c.call_status}
                    </span>
                  </td>
                  <td>
                    {c.source_language} → {c.destination_language}
                  </td>
                  <td>
                    {c.from_display_name} → {c.to_display_name ?? "—"}
                  </td>
                  <td>
                    {c.object_type}:{c.object_id}
                    <br />
                    <small style={{ color: "var(--tr-muted)" }}>{c.origin_app}</small>
                  </td>
                  <td>{c.duration_seconds ? `${c.duration_seconds}s` : "—"}</td>
                  <td>€{Number(c.total_cost ?? 0).toFixed(2)}</td>
                  <td>{new Date(c.call_start_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
