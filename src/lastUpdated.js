async function updateHeaderLastUpdated() {
  const el = document.getElementById("lastUpdated");
  if (!el) return;

  // 1) try localStorage
  try {
    const raw = localStorage.getItem("results");
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.lastUpdated) {
        const t = new Date(d.lastUpdated);
        el.textContent =
          "最終更新: " +
          t.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
        return;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // 2) try API endpoint
  try {
    const res = await fetch("./api/match", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      // if API returns full data object
      const d = j && j.matches ? j : j;
      if (d && d.lastUpdated) {
        const t = new Date(d.lastUpdated);
        el.textContent =
          "最終更新: " +
          t.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
        return;
      }
      // try Last-Modified header
      const lm = res.headers.get("Last-Modified");
      if (lm) {
        const t = new Date(lm);
        el.textContent =
          "最終更新: " +
          t.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
        return;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // 3) fallback to static data file
  try {
    const r2 = await fetch("./data/results.json", { cache: "no-store" });
    if (r2.ok) {
      try {
        const j2 = await r2.json();
        if (j2 && j2.lastUpdated) {
          const t = new Date(j2.lastUpdated);
          el.textContent =
            "最終更新: " +
            t.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
          return;
        }
      } catch (e) {}
      const lm2 = r2.headers.get("Last-Modified");
      if (lm2) {
        const t = new Date(lm2);
        el.textContent =
          "最終更新: " +
          t.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
        return;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // nothing found
  el.textContent = "";
}

// run on load
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    updateHeaderLastUpdated();
  });
}
