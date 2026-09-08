// Same-origin proxy so Pull Now works on Vercel previews (worker CORS is pinned to the public alias).
export default async function handler(req, res) {
  try {
    const upstream = await fetch('https://donald-proxy.davidlgenuth.workers.dev/intel?t=' + Date.now());
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'intel_proxy_failed', message: String(err && err.message || err) });
  }
}
