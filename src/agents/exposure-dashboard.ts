/**
 * Exposure dashboard helper — Generative UI / resume beat payload.
 */

import type { ExposureDashboard, UndoxSessionState } from "./types.js";

export function buildExposureDashboard(state: UndoxSessionState): ExposureDashboard {
  const open = state.brokers.filter((b) =>
    ["found", "prepared", "awaiting_approval", "submitted", "pending_confirmation"].includes(
      b.status,
    ),
  ).length;
  const riskScore = Math.min(100, open * 28 + state.brokers.length * 8);
  const riskLabel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  return {
    sessionId: state.sessionId,
    riskScore,
    riskLabel,
    brokers: state.brokers.map((b) => ({
      broker: b.broker,
      status: b.status,
      profileUrl: b.listing?.profileUrl,
    })),
    timeline: state.timeline.slice(-12),
    summary: `${state.brokers.length} broker(s) tracked · risk ${riskLabel} (${riskScore}) · session ${state.sessionId}`,
  };
}
