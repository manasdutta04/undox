/** Shared judge tour utilities (browser) */
(function () {
  const DEFAULT_SESSION = "demo-test-2";

  function $(id) {
    return document.getElementById(id);
  }

  function sessionFromUrl() {
    return new URLSearchParams(location.search).get("session") || DEFAULT_SESSION;
  }

  function withSession(path) {
    const u = new URL(path, location.origin);
    u.searchParams.set("session", sessionFromUrl());
    return u.pathname + u.search;
  }

  function setActiveNav() {
    const path = location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll(".nav a[data-nav]").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("?")[0];
      const norm = href === "/" ? "/" : href;
      a.classList.toggle("active", norm === path);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
    );
  }

  function resolveUrl(raw) {
    if (!raw || typeof raw !== "string") return "";
    const t = raw.trim();
    if (t.startsWith("/")) {
      try {
        return new URL(t, location.origin).href;
      } catch {
        return "";
      }
    }
    try {
      const u = new URL(t);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return u.href;
    } catch {
      return "";
    }
  }

  function formatTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  function statusBadge(status) {
    const s = escapeHtml(status || "unknown");
    const cls = ["submitted", "removed"].includes(status)
      ? "badge-submitted"
      : status === "found"
        ? "badge-found"
        : "badge-prepared";
    return `<span class="badge ${cls}">${s.replace(/_/g, " ")}</span>`;
  }

  async function fetchSession() {
    const id = sessionFromUrl();
    const res = await fetch("/api/session/" + encodeURIComponent(id));
    return res.json();
  }

  async function fetchDetail() {
    const id = sessionFromUrl();
    const res = await fetch("/api/session/" + encodeURIComponent(id) + "/detail");
    return res.json();
  }

  function wireSessionBar(onChange) {
    const input = $("session-input");
    if (!input) return;
    input.value = sessionFromUrl();
    $("session-go")?.addEventListener("click", () => {
      const id = input.value.trim();
      if (!id) return;
      const u = new URL(location.href);
      u.searchParams.set("session", id);
      history.replaceState(null, "", u);
      onChange?.();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("session-go")?.click();
    });
  }

  window.UndoxSite = {
    DEFAULT_SESSION,
    $,
    sessionFromUrl,
    withSession,
    escapeHtml,
    resolveUrl,
    formatTime,
    statusBadge,
    fetchSession,
    fetchDetail,
    wireSessionBar,
  };

  function wireNavSession() {
    const s = sessionFromUrl();
    document.querySelectorAll(".nav a[data-nav]").forEach((a) => {
      const raw = a.getAttribute("href") || "";
      const path = raw.split("?")[0];
      if (path && path !== "/" && path !== "/harness") {
        a.setAttribute("href", path + "?session=" + encodeURIComponent(s));
      }
    });
  }

  setActiveNav();
  wireNavSession();
})();
