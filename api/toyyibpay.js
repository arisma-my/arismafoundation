// Vercel Function: /api/toyyibpay
// Sahkan pembayaran TERUS dengan toyyibPay, kemudian minta Sheet tanda "dibayar" dan hantar resit.
//
//  POST  (callback toyyibPay)      : notis hanya dijadikan isyarat; kita tanya toyyibPay sendiri.
//  GET   ?billcode=XXXX            : dipanggil halaman /terima-kasih/ untuk papar status.
//  GET   Authorization: Bearer ... : Vercel Cron harian, semak semua bil "menunggu" 3 hari terakhir.
//
// Sheet hanya menerima kod bil yang ia sendiri cipta, jadi kod bil orang lain diabaikan.
// Env: APPS_SCRIPT_URL, KUNCI_SKRIP, CRON_SECRET (pilihan), TOYYIBPAY_BASE (pilihan)

import { skrip, asasToyyib } from "./_skrip.js";

const kodSah = (k) => /^[A-Za-z0-9]{4,20}$/.test(String(k || ""));

async function semakBil(kod) {
  try {
    const r = await fetch(asasToyyib() + "/index.php/api/getBillTransactions", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ billCode: kod, billpaymentStatus: "1" })
    });
    const data = JSON.parse(await r.text());
    if (!Array.isArray(data)) return null;
    const t = data.find((x) => x.billpaymentStatus == null || String(x.billpaymentStatus) === "1");
    if (!t) return null;
    return {
      billcode: kod,
      rujukan: t.billExternalReferenceNo || "",
      jumlah: parseFloat(t.billpaymentAmount) || 0,
      refno: t.billpaymentInvoiceNo || "",
      tarikh: t.billPaymentDate || "",
      saluran: t.billpaymentChannel || ""
    };
  } catch (e) {
    return null; // toyyibPay pulangkan teks bukan JSON bila tiada transaksi
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.APPS_SCRIPT_URL || !process.env.KUNCI_SKRIP) {
    return res.status(200).json({ ok: false, sebab: "belum disambung" });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    const kod = typeof b === "object" ? b.billcode : new URLSearchParams(String(b)).get("billcode");
    if (kodSah(kod)) {
      const baris = await semakBil(kod);
      if (baris) await skrip({ tindakan: "sahkan", baris: [baris] });
    }
    return res.status(200).send("OK");
  }

  if (req.method !== "GET") return res.status(405).json({ ok: false });

  const kod = req.query && req.query.billcode;
  if (kod) {
    if (!kodSah(kod)) return res.status(200).json({ status: "tidak sah" });
    const baris = await semakBil(kod);
    if (!baris) return res.status(200).json({ status: "belum" });
    const j = await skrip({ tindakan: "sahkan", baris: [baris] });
    return res.status(200).json({ status: j.ok && j.dikenali ? "dibayar" : "belum" });
  }

  // Semakan harian (Vercel Cron)
  const auth = req.headers.authorization || "";
  if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false });
  }
  const t = await skrip({ tindakan: "tertunggak" });
  const senarai = (t.billcode || []).filter(kodSah).slice(0, 200);
  const baris = [];
  for (const k of senarai) {
    const x = await semakBil(k);
    if (x) baris.push(x);
  }
  if (!baris.length) return res.status(200).json({ ok: true, disemak: senarai.length, dibayar: 0 });
  const j = await skrip({ tindakan: "sahkan", baris });
  return res.status(200).json({ ok: !!j.ok, disemak: senarai.length, dibayar: baris.length, baru: j.baru });
}
