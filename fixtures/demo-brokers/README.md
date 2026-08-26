# Demo fixture brokers

Static HTML fake brokers for reliable Double-O demos (parallel fan-out, approval, resume).

## Serve

```bash
npm run fixtures:serve
# http://127.0.0.1:8792/peoplefind/
# http://127.0.0.1:8792/clearbook/
```

Optional: `UNDOX_FIXTURE_PORT=8792` · `UNDOX_FIXTURE_BASE_URL=http://127.0.0.1:8792`

## Brokers

| Path | Broker id | Prepare script |
|---|---|---|
| `/peoplefind/` | `peoplefind` | `src/sandbox/peoplefind-prepare-optout.ts` |
| `/clearbook/` | `clearbook` | `src/sandbox/clearbook-prepare-optout.ts` |

These sites never receive live PII posts in the hackathon demo — Undox uses `mode=mock`.
