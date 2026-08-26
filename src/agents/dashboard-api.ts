/**
 * Dashboard API helpers — empty shell when session missing (no throw for UI poll).
 */

import { buildExposureDashboard } from "./exposure-dashboard.js";
import type { ExposureDashboard } from "./types.js";
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
      timeline: [],
      summary: `No session "${sessionId}" yet — run Undox MCP find/prepare/submit first.`,
    };
  }
  return { found: true, ...buildExposureDashboard(state) };
}
