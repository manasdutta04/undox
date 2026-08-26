/**
 * Serve static fixture broker sites for reliable Double-O demos.
 * Run: npm run fixtures:serve  → http://127.0.0.1:8792/
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.UNDOX_FIXTURE_PORT ?? 8792);
const ROOT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../fixtures/demo-brokers",
);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
};

createServer((req, res) => {
  let urlPath: string;
  try {
    urlPath = decodeURIComponent((req.url ?? "/").split("?")[0] || "/");
  } catch {
    res.writeHead(400, { "content-type": "text/plain" });
    res.end("Bad request");
    return;
  }

  let rel = urlPath === "/" ? "/index.html" : urlPath;
  let target = normalize(join(ROOT, rel));

  // Directory URLs (e.g. /peoplefind/) → index.html
  if (existsSync(target) && statSync(target).isDirectory()) {
    rel = join(rel, "index.html");
    target = normalize(join(ROOT, rel));
  } else if (rel.endsWith("/")) {
    rel = `${rel}index.html`;
    target = normalize(join(ROOT, rel));
  }

  if (!target.startsWith(ROOT) || !existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  const body = readFileSync(target);
  res.writeHead(200, { "content-type": TYPES[extname(target)] ?? "application/octet-stream" });
  res.end(body);
}).listen(PORT, "127.0.0.1", () => {
  console.error(`Undox fixture brokers at http://127.0.0.1:${PORT}/`);
  console.error("  /peoplefind/  /clearbook/");
});
