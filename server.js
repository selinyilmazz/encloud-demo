// encloud-demo: demo.encloud.dev icin kucuk, dinamik bir web sayfasi.
// Harici paket kullanmaz; sadece Node.js'in kendi modulleri.
const http = require("http");
const os = require("os");

const PORT = Number(process.env.PORT) || 8080;
const APP_VERSION = process.env.APP_VERSION || "dev";
const BUILD_TIME = process.env.BUILD_TIME || "-";
const POD_NAME = process.env.POD_NAME || os.hostname();
const NODE_NAME = process.env.NODE_NAME || "-";
const STARTED_AT = Date.now();

// ---- Bu iki satiri degistirip push'layin; birkac dakika icinde sitede gorunur ----
const TITLE = "Encloud Demo";
const MESSAGE = "Bu sayfa GitHub'a yapılan her push'ta Kubernetes cluster'ına otomatik olarak deploy ediliyor.";
// -----------------------------------------------------------------------------------

let requestCount = 0;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function uptime() {
  let s = Math.floor((Date.now() - STARTED_AT) / 1000);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return (d ? d + "g " : "") + (h ? h + "sa " : "") + (m ? m + "dk " : "") + s + "sn";
}

function info(req) {
  return {
    version: APP_VERSION,
    buildTime: BUILD_TIME,
    pod: POD_NAME,
    node: NODE_NAME,
    serverTime: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    uptime: uptime(),
    requests: requestCount,
    visitorIp: req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.socket.remoteAddress,
    country: req.headers["cf-ipcountry"] || "-",
  };
}

function page(i) {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TITLE)}</title>
<style>
  :root { --bg:#0f172a; --card:#111827; --line:#1f2937; --fg:#e5e7eb; --muted:#94a3b8; --accent:#38bdf8; --ok:#22c55e; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px;
         background: radial-gradient(circle at top, #1e293b, var(--bg)); color:var(--fg);
         font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .card { width:100%; max-width:640px; background:var(--card); border:1px solid var(--line); border-radius:16px;
          padding:28px; box-shadow:0 20px 50px rgba(0,0,0,.35); }
  .badge { display:inline-block; font-size:12px; padding:3px 10px; border-radius:999px;
           background:rgba(34,197,94,.15); color:var(--ok); margin-bottom:14px; }
  h1 { margin:0 0 6px; font-size:28px; }
  p.msg { margin:0 0 22px; color:var(--muted); line-height:1.5; }
  table { width:100%; border-collapse:collapse; }
  td { padding:9px 0; border-top:1px solid var(--line); font-size:15px; vertical-align:top; }
  td:first-child { color:var(--muted); width:45%; padding-right:12px; }
  td:last-child { font-family: ui-monospace, Consolas, monospace; word-break:break-all; }
  .flash { animation: flash 1.2s; }
  @keyframes flash { from { color: var(--accent); } }
  footer { margin-top:18px; font-size:12px; color:var(--muted); }
</style>
</head>
<body>
<div class="card">
  <span class="badge">&#9679; Canlı</span>
  <h1>${esc(TITLE)}</h1>
  <p class="msg">${esc(MESSAGE)}</p>
  <table>
    <tr><td>Sürüm (commit)</td><td id="version">${esc(i.version)}</td></tr>
    <tr><td>Derleme zamanı</td><td id="buildTime">${esc(i.buildTime)}</td></tr>
    <tr><td>Cevap veren pod</td><td id="pod">${esc(i.pod)}</td></tr>
    <tr><td>Node</td><td id="node">${esc(i.node)}</td></tr>
    <tr><td>Sunucu saati (İstanbul)</td><td id="serverTime">${esc(i.serverTime)}</td></tr>
    <tr><td>Pod çalışma süresi</td><td id="uptime">${esc(i.uptime)}</td></tr>
    <tr><td>Bu pod'un cevapladığı istek</td><td id="requests">${esc(i.requests)}</td></tr>
    <tr><td>Ziyaretçi IP / ülke</td><td id="visitor">${esc(i.visitorIp)} / ${esc(i.country)}</td></tr>
  </table>
  <footer>Bilgiler her 3 saniyede bir sunucudan yenilenir.</footer>
</div>
<script>
  const ids = ["version", "buildTime", "pod", "node", "serverTime", "uptime", "requests"];
  async function refresh() {
    try {
      const r = await fetch("/api/info", { cache: "no-store" });
      const d = await r.json();
      for (const k of ids) {
        const el = document.getElementById(k);
        const v = String(d[k]);
        if (el.textContent !== v) {
          el.textContent = v;
          if (k === "pod" || k === "version") { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
        }
      }
      document.getElementById("visitor").textContent = d.visitorIp + " / " + d.country;
    } catch (e) {}
  }
  setInterval(refresh, 3000);
</script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  if (url === "/api/info") {
    requestCount++;
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(info(req)));
    return;
  }
  if (url === "/") {
    requestCount++;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(page(info(req)));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Bulunamadi");
});

server.listen(PORT, () => console.log(`encloud-demo ${APP_VERSION} dinlemede: port ${PORT}, pod ${POD_NAME}`));

process.on("SIGTERM", () => {
  console.log("SIGTERM alindi, kapaniyor");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
