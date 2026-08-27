import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { ORCHESTRATOR_INSTRUCTIONS } from "../src/agents/orchestrator.js";
import { loadSession, upsertBrokerStatus } from "../src/mcp/undox-tools/session-store.js";

describe("orchestrator resume / no-ask contract", () => {
  it("instructions require resume tools and forbid inventing dashboard data", () => {
    assert.match(ORCHESTRATOR_INSTRUCTIONS, /RESUME/i);
    assert.match(ORCHESTRATOR_INSTRUCTIONS, /get_session_state/);
    assert.match(ORCHESTRATOR_INSTRUCTIONS, /Never invent/i);
    assert.match(ORCHESTRATOR_INSTRUCTIONS, /GROUND TRUTH/i);
    assert.match(ORCHESTRATOR_INSTRUCTIONS, /parallel tool calls/i);
  });
});

describe("truncated session id hints", () => {
  let dir: string;
  let prevStore: string | undefined;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "undox-hint-"));
    prevStore = process.env.UNDOX_SESSION_STORE;
    process.env.UNDOX_SESSION_STORE = join(dir, "state.json");
  });

  after(() => {
    if (prevStore === undefined) delete process.env.UNDOX_SESSION_STORE;
    else process.env.UNDOX_SESSION_STORE = prevStore;
    rmSync(dir, { recursive: true, force: true });
  });

  it("suggests demo-live-1 when loadSession gets truncated demo-", () => {
    const person = {
      name: "Alex Rivera",
      address: "123 Maple Ave Austin TX 78701",
      phone: "+1-512-555-0142",
      dob: "1990-04-12",
      email: "alex.rivera.optout@example.com",
    };
    let live = loadSession("demo-live-1", person);
    live = upsertBrokerStatus(live, "spokeo", "found", {
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/alex-rivera/p-fx",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    let other = loadSession("demo-double-o-1", person);
    other = upsertBrokerStatus(other, "spokeo", "found", {
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/alex-rivera/p-fx",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    void live;
    void other;
    assert.throws(
      () => loadSession("demo-"),
      (err: Error) => {
        const msg = String(err.message);
        assert.match(msg, /demo-live-1/);
        assert.doesNotMatch(msg, /Known ids:/);
        return true;
      },
    );
  });

  it("does not dump known ids when there is no prefix match", () => {
    const person = {
      name: "Alex Rivera",
      address: "123 Maple Ave Austin TX 78701",
      phone: "+1-512-555-0142",
      dob: "1990-04-12",
      email: "alex.rivera.optout@example.com",
    };
    let state = loadSession("demo-live-1", person);
    state = upsertBrokerStatus(state, "spokeo", "found", {
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/alex-rivera/p-fx",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    void state;
    assert.throws(
      () => loadSession("zzznomatch"),
      (err: Error) => {
        const msg = String(err.message);
        assert.match(msg, /not found/);
        assert.doesNotMatch(msg, /Known ids:/);
        assert.doesNotMatch(msg, /demo-live-1/);
        return true;
      },
    );
  });
});
