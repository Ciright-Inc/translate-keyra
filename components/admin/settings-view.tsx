"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/types";

export function SettingsView() {
  const [enabled, setEnabled] = useState(true);
  const [primary, setPrimary] = useState("en");
  const [secondary, setSecondary] = useState("ga");
  const [voice, setVoice] = useState("en-GB-Neural2-A");
  const [rate, setRate] = useState(1);
  const [transcription, setTranscription] = useState(true);
  const [platform, setPlatform] = useState<Array<{ config_key: string; config_value: unknown }>>([]);

  useEffect(() => {
    fetch("/api/user-preferences?uid=1")
      .then((r) => r.json())
      .then((j) => {
        const p = j.data?.preferences?.[0];
        if (p) {
          setEnabled(p.translation_enabled);
          setPrimary(p.primary_language);
          setSecondary(p.secondary_language ?? "");
          setVoice(p.preferred_voice ?? "neutral");
          setRate(Number(p.speech_rate ?? 1));
          setTranscription(p.transcription_enabled);
        }
      });
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setPlatform(j.data.platform);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: 1,
        eid: "EID-DEMO-001",
        subscription_id: "SUB-KEYRA-IE",
        world_id: "WORLD-IE-01",
        translation_enabled: enabled,
        primary_language: primary,
        secondary_language: secondary || null,
        preferred_voice: voice,
        speech_rate: rate,
        transcription_enabled: transcription,
      }),
    });
    const j = await res.json();
    if (j.ok) toast.success("Language preferences saved");
    else toast.error(j.error);
  }

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 720 }}>
      <section className="tr-card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>User profile — Enable Language Translation</h2>
        <p style={{ fontSize: 14, color: "var(--tr-body)" }}>
          Before initiating a Translation Call, users must set Enable Language Translation = Yes.
        </p>
        <div className="tr-form-grid" style={{ marginTop: 20 }}>
          <label>
            <span className="tr-label">Enable Language Translation</span>
            <select
              className="tr-select"
              value={enabled ? "yes" : "no"}
              onChange={(e) => setEnabled(e.target.value === "yes")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            <span className="tr-label">Primary spoken language</span>
            <select className="tr-select" value={primary} onChange={(e) => setPrimary(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="tr-label">Secondary language (optional)</span>
            <select className="tr-select" value={secondary} onChange={(e) => setSecondary(e.target.value)}>
              <option value="">—</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="tr-label">Preferred voice</span>
            <input className="tr-input" value={voice} onChange={(e) => setVoice(e.target.value)} />
          </label>
          <label>
            <span className="tr-label">Speech rate ({rate.toFixed(2)})</span>
            <input
              type="range"
              min={0.75}
              max={1.5}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <label>
            <span className="tr-label">Live transcription</span>
            <select
              className="tr-select"
              value={transcription ? "yes" : "no"}
              onChange={(e) => setTranscription(e.target.value === "yes")}
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </select>
          </label>
          <button type="button" className="tr-btn tr-btn-primary" onClick={save}>
            Save preferences
          </button>
        </div>
      </section>

      <section className="tr-card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Platform configuration</h2>
        <p style={{ fontSize: 14, color: "var(--tr-body)" }}>
          Google API, AWS Chime, billing rates, and hybrid transport model.
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14 }}>
          {platform.map((c) => (
            <li key={c.config_key} style={{ marginBottom: 8 }}>
              <strong>{c.config_key}</strong>
              <pre
                style={{
                  fontSize: 12,
                  background: "#f4f6fb",
                  padding: 8,
                  borderRadius: 6,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(c.config_value, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
