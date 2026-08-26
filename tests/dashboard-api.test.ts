import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { getDashboardOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds, loadSession, upsertBrokerStatus } from "../src/mcp/undox-tools/session-store.js";

describe("dashboard API", () => {
  let dir: string;
  let prevStore: string | undefined;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "undox-dash-"));
    prevStore = process.env.UNDOX_SESSION_STORE;
    process.env.UNDOX_SESSION_STORE = join(dir, "state.json");
  });

  after(() => {
    if (prevStore === undefined) delete process.env.UNDOX_SESSION_STORE;
    else process.env.UNDOX_SESSION_STORE = prevStore;
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty shell when session missing", () => {
    const dash = getDashboardOrEmpty("missing-session");
    assert.equal(dash.found, false);
    assert.equal(dash.riskScore, 0);
    assert.equal(dash.brokers.length, 0);
  });

  it("lists and builds dashboard for stored session", () => {
    const person = {
      name: "Alex Rivera",
      address: "123 Maple Ave, Austin, TX 78701",
      phone: "+1-512-555-0142",
      dob: "1990-04-12",
      email: "alex.rivera.optout@example.com",
    };
    let state = loadSession("dash-1", person);
    state = upsertBrokerStatus(state, "spokeo", "found", {
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/Alex-Rivera/p-fx",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    assert.ok(listSessionIds().includes("dash-1"));
    const dash = getDashboardOrEmpty("dash-1");
    assert.equal(dash.found, true);
    assert.equal(dash.brokers[0]?.broker, "spokeo");
    assert.ok(dash.riskScore > 0);
  });
});
