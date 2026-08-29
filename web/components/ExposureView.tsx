"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_SESSION } from "@/lib/nav";
import { getSession, listSessions, resolveFixtureUrl } from "@/lib/api";
import type { SessionDashboard } from "@/lib/types";

function statusBadge(status: string) {
  const cls = ["submitted", "removed"].includes(status)
    ? "submitted"
    : status === "found"
      ? "found"
      : "prepared";
  return <span className={`badge ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function SessionBar({ onReload }: { onReload: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const session = params.get("session") || DEFAULT_SESSION;
  const [value, setValue] = useState(session);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    setValue(session);
  }, [session]);

  useEffect(() => {
    listSessions().then(setOptions).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const id = value.trim();
    if (!id) return;
    router.push(`${pathname}?session=${encodeURIComponent(id)}`);
    onReload();
  }, [value, router, pathname, onReload]);

  return (
    <div className="session-bar">
      <div>
        <label htmlFor="session-input">Session</label>
        <input
          id="session-input"
          list="session-list"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <datalist id="session-list">
          {options.map((id) => (
            <option key={id} value={id} />
          ))}
        </datalist>
      </div>
      <button type="button" className="btn" onClick={load}>
        Load
      </button>
    </div>
  );
}

export function ExposureView() {
  const params = useSearchParams();
  const sessionId = params.get("session") || DEFAULT_SESSION;
  const [data, setData] = useState<SessionDashboard | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    let seq = 0;
    setData(null);
    setError("");

    async function fetchData() {
      const mySeq = ++seq;
      try {
        const d = await getSession(sessionId);
        if (!cancelled && mySeq === seq) {
          setData(d);
          setError("");
        }
      } catch {
        if (!cancelled && mySeq === seq) {
          setData(null);
          setError("Could not load session.");
        }
      }
    }

    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionId, tick]);

  const q = `?session=${encodeURIComponent(sessionId)}`;

  return (
    <>
      <SessionBar onReload={reload} />
      {error && <p className="empty">{error}</p>}
      {data && (
        <>
          <div className="risk-score-wrap">
            <div className={`risk-score ${data.riskLabel}`}>
              {data.found ? data.riskScore : "—"}
            </div>
            <div className="risk-bar">
              <i style={{ width: `${Math.min(100, data.riskScore)}%` }} />
            </div>
            <p className="page-lede" style={{ marginTop: 12 }}>
              {data.summary}
            </p>
          </div>

          <div className="court-grid">
            {data.brokers.length ? (
              data.brokers.map((b) => {
                const listing = resolveFixtureUrl(b.profileUrl);
                return (
                  <article key={b.broker} className="court-card">
                    <h3>{b.broker}</h3>
                    {statusBadge(b.status)}
                    <div className="card-actions">
                      {listing ? (
                        <a className="btn btn-outline" href={listing} target="_blank" rel="noopener noreferrer">
                          View listing
                        </a>
                      ) : null}
                      <Link className="btn" href={`/app/approval${q}#${b.broker}`}>
                        Approval
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty">No brokers in this session.</p>
            )}
          </div>

          <div className="panel">
            <h3 className="eyebrow">Milestones</h3>
            <ul className="milestone-list">
              {data.milestones.map((m) => (
                <li key={m.broker}>
                  <span>
                    <strong>{m.broker}</strong> · {m.event.replace("broker.", "")}
                  </span>
                  <time>{formatTime(m.at)}</time>
                </li>
              ))}
            </ul>
          </div>

          <details className="panel-details">
            <summary>Event log</summary>
            <ol>
              {data.timeline.map((e, i) => (
                <li key={i}>
                  {formatTime(e.at)} — {e.event}
                  {e.detail ? ` · ${e.detail}` : ""}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </>
  );
}
