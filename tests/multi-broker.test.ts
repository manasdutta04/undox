import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { preparePeoplefindOptOut } from "../src/sandbox/peoplefind-prepare-optout.js";
import { prepareClearbookOptOut } from "../src/sandbox/clearbook-prepare-optout.js";
import { buildExposureDashboard } from "../src/agents/exposure-dashboard.js";
import {
  loadSession,
  markSubmitted,
  upsertBrokerStatus,
} from "../src/mcp/undox-tools/session-store.js";

describe("fixture broker prepare", () => {
  it("peoplefind preserves full PII", () => {
    const submission = preparePeoplefindOptOut({
      person: {
        name: "Alex Rivera",
        address: "123 Maple Ave, Austin, TX 78701",
        phone: "+1-512-555-0142",
        dob: "1990-04-12",
        email: "alex.rivera.optout@example.com",
      },
      listing: {
        broker: "peoplefind",
        profileUrl: "http://127.0.0.1:8792/peoplefind/profile.html?name=Alex%20Rivera",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    assert.equal(submission.broker, "peoplefind");
    assert.equal(submission.formFields.full_name, "Alex Rivera");
    assert.equal(submission.pii.email, "alex.rivera.optout@example.com");
  });

  it("clearbook preserves full PII", () => {
    const submission = prepareClearbookOptOut({
      person: {
        name: "Alex Rivera",
        address: "123 Maple Ave, Austin, TX 78701",
        phone: "+1-512-555-0142",
        dob: "1990-04-12",
        email: "alex.rivera.optout@example.com",
      },
      listing: {
        broker: "clearbook",
        profileUrl: "http://127.0.0.1:8792/clearbook/profile.html?q=Alex%20Rivera",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    assert.equal(submission.broker, "clearbook");
    assert.equal(submission.formFields.name, "Alex Rivera");
  });
});

describe("session resume + exposure dashboard", () => {
  let dir: string;
  let prevStore: string | undefined;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "undox-sess-"));
    prevStore = process.env.UNDOX_SESSION_STORE;
    process.env.UNDOX_SESSION_STORE = join(dir, "state.json");
  });

  after(() => {
    if (prevStore === undefined) delete process.env.UNDOX_SESSION_STORE;
    else process.env.UNDOX_SESSION_STORE = prevStore;
    rmSync(dir, { recursive: true, force: true });
  });

  it("reloads broker statuses by session_id", () => {
    const person = {
      name: "Alex Rivera",
      address: "123 Maple Ave, Austin, TX 78701",
      phone: "+1-512-555-0142",
      dob: "1990-04-12",
      email: "alex.rivera.optout@example.com",
    };
    let state = loadSession("resume-1", person);
    state = upsertBrokerStatus(state, "spokeo", "found", {
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/Alex-Rivera/p-fx",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
    });
    const submission = {
      broker: "spokeo" as const,
      optOutUrl: "https://www.spokeo.com/optout",
      listing: state.brokers[0]!.listing!,
      pii: person,
      formFields: { email: person.email },
      mode: "mock" as const,
      preparedAt: new Date().toISOString(),
    };
    state = markSubmitted(state, submission, "test");

    const reloaded = loadSession("resume-1");
    assert.equal(reloaded.brokers[0]?.status, "submitted");
    const dash = buildExposureDashboard(reloaded);
    assert.equal(dash.sessionId, "resume-1");
    assert.ok(dash.riskScore > 0);
    assert.match(dash.summary, /spokeo|broker/i);
  });
});
