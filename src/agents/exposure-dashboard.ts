/**
 * Exposure dashboard helper — Generative UI / resume beat payload.
 */

import type { ExposureDashboard, UndoxSessionState, BrokerId } from "./types.js";

function buildMilestones(state: UndoxSessionState): ExposureDashboard["milestones"] {
  const order: BrokerId[] = ["spokeo", "peoplefind", "clearbook"];
  const byBroker = new Map(state.brokers.map((b) => [b.broker, b]));

  return order
    .filter((id) => byBroker.has(id))
    .map((broker) => {
      const b = byBroker.get(broker)!;
      const events = state.timeline.filter((e) => e.detail === broker);
      const latest = events[events.length - 1];
      return {
        broker,
        status: b.status,
        event: latest?.event ?? `broker.${b.status}`,
        at: latest?.at ?? b.updatedAt,
      };
    });
}

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
    milestones: buildMilestones(state),
    timeline: state.timeline.slice(-6).reverse(),
    summary: `${state.brokers.length} broker(s) tracked · risk ${riskLabel} (${riskScore}) · session ${state.sessionId}`,
  };
}
