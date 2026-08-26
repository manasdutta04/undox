/**
 * Serve static fixture broker sites for reliable Double-O demos.
 * Run: npm run fixtures:serve  → http://127.0.0.1:8792/
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
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

/** Map URL path → absolute filesystem path under ROOT (no leading-slash join bugs). */
function fsUnderRoot(urlPath: string): string {
  const trimmed = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const target = trimmed ? normalize(join(ROOT, ...trimmed.split("/"))) : ROOT;
  return target;
}

function isSafeFile(target: string): boolean {
  const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
  return (
    (target === ROOT || target.startsWith(rootWithSep)) &&
    existsSync(target) &&
    statSync(target).isFile()
  );
}

createServer((req, res) => {
  const rawUrl = req.url ?? "/";
  const qIdx = rawUrl.indexOf("?");
  const pathOnly = qIdx >= 0 ? rawUrl.slice(0, qIdx) : rawUrl;
  const query = qIdx >= 0 ? rawUrl.slice(qIdx) : "";

  let urlPath: string;
  try {
    urlPath = decodeURIComponent(pathOnly || "/");
  } catch {
    res.writeHead(400, { "content-type": "text/plain" });
    res.end("Bad request");
    return;
  }

  // Slashless directory (e.g. /peoplefind) → 301 to /peoplefind/
  // so relative links in index.html resolve under the broker folder.
  if (urlPath !== "/" && !urlPath.endsWith("/")) {
    const asDir = fsUnderRoot(urlPath);
    if (existsSync(asDir) && statSync(asDir).isDirectory()) {
      res.writeHead(301, { Location: `${urlPath}/${query}` });
      res.end();
      return;
    }
  }

  // "/" or "/peoplefind/" → index.html; other paths are literal files
  let fileRel: string;
  if (urlPath === "/" || urlPath.endsWith("/")) {
    fileRel = `${urlPath}index.html`.replace(/\/+/g, "/");
  } else {
    fileRel = urlPath;
  }

  const target = fsUnderRoot(fileRel);
  if (!isSafeFile(target)) {
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
