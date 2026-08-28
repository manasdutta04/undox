/**
 * Dashboard API helpers — empty shell when session missing (no throw for UI poll).
 */

import { buildExposureDashboard } from "./exposure-dashboard.js";
import type { ExposureDashboard, SessionDetailResponse } from "./types.js";
import { tryLoadSession } from "../mcp/undox-tools/session-store.js";

export function getDashboardOrEmpty(sessionId: string): ExposureDashboard & { found: boolean } {
  const state = tryLoadSession(sessionId);
  if (!state) {
    return {
      found: false,
      sessionId,
      riskScore: 0,
      riskLabel: "low",
      brokers: [],
      milestones: [],
      timeline: [],
      summary: `No session "${sessionId}" yet — run Undox MCP find/prepare/submit first.`,
    };
  }
  return { found: true, ...buildExposureDashboard(state) };
}

export function getSessionDetailOrEmpty(
  sessionId: string,
  opts?: { includePii?: boolean },
): SessionDetailResponse {
  const includePii = opts?.includePii !== false;
  const state = tryLoadSession(sessionId);
  if (!state) {
    return { found: false, sessionId, brokers: [] };
  }
  return {
    found: true,
    sessionId: state.sessionId,
    person: includePii ? state.person : undefined,
    brokers: state.brokers.map((b) => ({
      broker: b.broker,
      status: b.status,
      profileUrl: b.listing?.profileUrl,
      optOutUrl: b.lastSubmission?.optOutUrl,
      lastSubmission: includePii ? b.lastSubmission : undefined,
    })),
  };
}
