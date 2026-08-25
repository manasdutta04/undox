# Contributing (hackathon / Best Code Quality track)

Judges read the **PR + Qodo review trail**. Treat this repo like real software.

## Rules

1. **No direct merges to `main`** for feature work. Open a PR.
2. **Install [Qodo](https://github.com/marketplace/qodo-merge-pro)** on this repo on day one (free developer plan is enough).
3. **One coherent unit of work per PR** (see the PR sequence below).
4. **Respond to every Qodo finding** before merge — fix every valid High, or dismiss in the Qodo thread with a written reason. Re-run `/agentic_review` after fixes.
5. Keep diffs small and reviewable. Prefer clear names over cleverness.
6. A stranger must be able to clone, run `npm install`, and follow the README.
7. **Do not push feature work straight to `main`.** Direct main pushes do not count as Qodo-reviewed work for the Best Code Quality track.

## PR sequence (do not skip ahead)

| PR | Scope |
|---|---|
| PR1 | Scaffold + one Spokeo adapter + approval-gated mock submit |
| PR2 | Subagent fan-out (3 brokers) |
| PR3 | Session persistence (kill/restart resume) |
| PR4 | Generative UI dashboard |
| PR5 | Remaining broker skills |
| PR6 | Gmail confirmation polling |
| PR7 | Demo fixture brokers + mode toggle |
| PR8 | Docs / demo script / polish |

## Branch naming

`prN/short-slug` — e.g. `pr1/spokeo-scaffold`

## Checklist before requesting merge

- [ ] `npm test` and `npm run typecheck` pass
- [ ] README / `.env.example` updated if setup changed
- [ ] No secrets committed
- [ ] Qodo review addressed
- [ ] PR description explains **why**, not only what
