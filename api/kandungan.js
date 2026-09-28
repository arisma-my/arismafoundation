// Vercel Function: /api/kandungan
// Ambil kandungan awam daripada Google Sheet (melalui Apps Script doGet) dan simpan dalam cache.
// Env: APPS_SCRIPT_URL. Jika tidak ditetapkan atau gagal, laman guna kandungan asal dalam HTML.

export default async function handler(req, res) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: false, sebab: "belum disambung" });
  }
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ctl.signal });
    const j = JSON.parse(await r.text());
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, ...j });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: false, sebab: "tidak dapat dibaca" });
  } finally {
    clearTimeout(tm);
  }
}
