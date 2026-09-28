// Vercel Function: /api/taja
// Borang hasrat penajaan korporat -> tab "Penajaan" dalam Sheet + e-mel kepada pentadbir.
// Jika belum disambung, laman buka WhatsApp sebagai ganti.
// Env: APPS_SCRIPT_URL, KUNCI_SKRIP

import { skrip, badanJson } from "./_skrip.js";

const bersih = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!process.env.APPS_SCRIPT_URL || !process.env.KUNCI_SKRIP) {
    return res.status(200).json({ ok: false, sebab: "belum disambung" });
  }
  const b = badanJson(req);
  if (b.laman) return res.status(200).json({ ok: true }); // perangkap bot: pura-pura berjaya

  const data = {
    syarikat: bersih(b.syarikat, 150),
    pegawai: bersih(b.pegawai, 120),
    jawatan: bersih(b.jawatan, 120),
    emel: bersih(b.emel, 120),
    telefon: bersih(b.telefon, 30),
    minat: (Array.isArray(b.minat) ? b.minat : []).slice(0, 6).map((x) => bersih(x, 80)).join("; "),
    mesej: bersih(b.mesej, 2000)
  };
  if (!data.syarikat || !data.pegawai || !data.jawatan || !data.telefon || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.emel)) {
    return res.status(200).json({ ok: false, sebab: "tidak sah" });
  }
  const j = await skrip({ tindakan: "taja", data });
  return res.status(200).json({ ok: !!j.ok });
}
