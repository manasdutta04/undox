import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareSpokeoOptOut } from "../src/sandbox/spokeo-prepare-optout.js";

describe("prepareSpokeoOptOut", () => {
  it("builds form fields and preserves full PII for the approval gate", () => {
    const submission = prepareSpokeoOptOut({
      person: {
        name: "Alex Rivera",
        address: "123 Maple Ave, Austin, TX 78701",
        phone: "+1-512-555-0142",
        dob: "1990-04-12",
        email: "alex.rivera.optout@example.com",
      },
      listing: {
        broker: "spokeo",
        profileUrl: "https://www.spokeo.com/Alex-Rivera/TX/Austin/p123",
        matchedName: "Alex Rivera",
        source: "fixture",
      },
      mode: "mock",
    });

    assert.equal(submission.broker, "spokeo");
    assert.equal(submission.formFields.profile_url, submission.listing.profileUrl);
    assert.equal(submission.formFields.email, "alex.rivera.optout@example.com");
    assert.deepEqual(submission.pii, {
      name: "Alex Rivera",
      address: "123 Maple Ave, Austin, TX 78701",
      phone: "+1-512-555-0142",
      dob: "1990-04-12",
      email: "alex.rivera.optout@example.com",
    });
  });

  it("rejects non-Spokeo listings", () => {
    assert.throws(() =>
      prepareSpokeoOptOut({
        person: {
          name: "A",
          address: "B",
          phone: "C",
          dob: "2000-01-01",
          email: "a@example.com",
        },
        listing: {
          broker: "spokeo",
          profileUrl: "https://example.com/not-spokeo",
          matchedName: "A",
          source: "fixture",
        },
      }),
    );
  });
});
