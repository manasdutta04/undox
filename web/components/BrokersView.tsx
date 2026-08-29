"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BrokerId, ListingStatus } from "@/lib/types";
import { DEFAULT_SESSION } from "@/lib/nav";
import { getSessionDetail, resolveFixtureUrl } from "@/lib/api";
import type { SessionDetail } from "@/lib/types";
import { SessionBar } from "./ExposureView";

const STEPS: ListingStatus[] = ["found", "prepared", "awaiting_approval", "submitted"];

function statusBadge(status: ListingStatus) {
  const cls = ["submitted", "removed"].includes(status)
    ? "submitted"
    : status === "found"
      ? "found"
      : "prepared";
  return <span className={`badge ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

function pipeline(status: ListingStatus) {
  if (status === "removed" || status === "rejected") {
    return STEPS.map((s) => (
      <span key={s} className="done">
        {s.replace(/_/g, " ")}
      </span>
    ));
  }

  const effective: ListingStatus =
    status === "pending_confirmation"
      ? "submitted"
      : STEPS.includes(status)
        ? status
        : "found";
  const idx = STEPS.indexOf(effective);

  return STEPS.map((s, i) => {
    let cls = "";
    if (effective === "submitted" || status === "pending_confirmation") {
      cls = i <= idx ? (s === "submitted" ? "current" : "done") : "";
    } else if (i < idx) cls = "done";
    else if (i === idx) cls = "current";
    return (
      <span key={s} className={cls}>
        {s.replace(/_/g, " ")}
      </span>
    );
  });
}

export function BrokersView() {
  const params = useSearchParams();
  const sessionId = params.get("session") || DEFAULT_SESSION;
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [active, setActive] = useState<BrokerId>("spokeo");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError("");
    (async () => {
      try {
        const d = await getSessionDetail(sessionId);
        if (cancelled) return;
        setDetail(d);
        setError("");
        if (!d.brokers.some((b) => b.broker === active)) {
          setActive(d.brokers[0]?.broker ?? "spokeo");
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setError("Could not load session detail.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, tick]);

  const q = `?session=${encodeURIComponent(sessionId)}`;
  const b = detail?.brokers.find((x) => x.broker === active);

  return (
    <>
      <SessionBar onReload={reload} />
      {error && <p className="empty">{error}</p>}
      {detail && !detail.found && (
        <p className="empty">{detail.sessionId} not found.</p>
      )}
      {detail?.found && (
        <>
          <div className="tabs">
            {detail.brokers.map((broker) => (
              <button
                key={broker.broker}
                type="button"
                className={`tab${broker.broker === active ? " active" : ""}`}
                onClick={() => setActive(broker.broker)}
              >
                {broker.broker}
              </button>
            ))}
          </div>
          {b ? (
            <div className="court-card">
              <h3>
                {b.broker} {statusBadge(b.status)}
              </h3>
              <div className="pipeline">{pipeline(b.status)}</div>
              <div className="card-actions">
                {b.profileUrl ? (
                  <a
                    className="btn"
                    href={resolveFixtureUrl(b.profileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View listing
                  </a>
                ) : null}
                {b.optOutUrl ? (
                  <a
                    className="btn btn-outline"
                    href={resolveFixtureUrl(b.optOutUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open opt-out
                  </a>
                ) : null}
                <Link className="btn btn-outline" href={`/app/approval${q}#${b.broker}`}>
                  Approval payload
                </Link>
              </div>
            </div>
          ) : (
            <p className="empty">No broker data for this session.</p>
          )}
        </>
      )}
    </>
  );
}
