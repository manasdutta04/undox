"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEFAULT_SESSION } from "@/lib/nav";
import { getSessionDetail } from "@/lib/api";
import type { SessionDetail } from "@/lib/types";
import { SessionBar } from "./ExposureView";

const PII_KEYS = ["name", "address", "phone", "dob", "email"] as const;

export function ApprovalView() {
  const params = useSearchParams();
  const sessionId = params.get("session") || DEFAULT_SESSION;
  const [data, setData] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    (async () => {
      try {
        const d = await getSessionDetail(sessionId);
        if (cancelled) return;
        setData(d);
        setError("");
      } catch {
        if (!cancelled) {
          setData(null);
          setError("Could not load session detail.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, tick]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  return (
    <>
      <SessionBar onReload={reload} />
      {error && <p className="empty">{error}</p>}
      {data && !data.found && <p className="empty">Session not found.</p>}
      {data?.found &&
        data.brokers.map((b) => {
          const sub = b.lastSubmission;
          if (!sub?.pii) {
            return (
              <div key={b.broker} className="approval-panel" id={b.broker}>
                <h3>{b.broker}</h3>
                <p className="empty">No submission payload yet.</p>
              </div>
            );
          }
          return (
            <div key={b.broker} className="approval-panel" id={b.broker}>
              <h3>{b.broker} · mock submit</h3>
              <p className="empty" style={{ marginBottom: "1rem" }}>
                Mode: {sub.mode} · prepare: {sub.prepareRuntime ?? "—"}
              </p>
              <h4 className="eyebrow">PII (approval modal)</h4>
              <dl className="kv">
                {PII_KEYS.map((k) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{sub.pii[k] ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <h4 className="eyebrow" style={{ marginTop: "1rem" }}>
                Form fields
              </h4>
              <dl className="kv">
                {Object.entries(sub.formFields || {}).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
                {!Object.keys(sub.formFields || {}).length && <dd>—</dd>}
              </dl>
            </div>
          );
        })}
    </>
  );
}
