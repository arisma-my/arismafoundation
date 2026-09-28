// Vercel Function: /api/sumbang
// Terima borang sumbangan, rekod dalam Sheet sebagai "menunggu", cipta bil toyyibPay,
// dan pulangkan pautan pembayaran. Rekod hanya bertukar "dibayar" selepas disahkan
// terus dengan toyyibPay (lihat api/toyyibpay.js).
//
// Env:
//   TOYYIBPAY_SECRET     userSecretKey akaun toyyibPay Yayasan (RAHSIA)
//   TOYYIBPAY_CATEGORY   categoryCode untuk sumbangan
//   TOYYIBPAY_BASE       (pilihan) https://dev.toyyibpay.com untuk ujian sandbox
//   TOYYIBPAY_CHANNEL    (pilihan) "0" FPX, "1" kad, "2" kedua-dua (asal "2")
//   TOYYIBPAY_CAJ        (pilihan) kosong = Yayasan tanggung caj; lihat dokumentasi toyyibPay
//   LAMAN_URL            https://arismafoundation.org.my
//   MAKS_SUMBANGAN       (pilihan) RM, asal 30000
//   APPS_SCRIPT_URL, KUNCI_SKRIP

import { skrip, asasToyyib, badanJson } from "./_skrip.js";

const bersih = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const alfanum = (v, max) => String(v || "").replace(/[^A-Za-z0-9 _]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const env = process.env;
  if (!env.TOYYIBPAY_SECRET || !env.TOYYIBPAY_CATEGORY || !env.APPS_SCRIPT_URL || !env.KUNCI_SKRIP) {
    return res.status(200).json({ ok: false, sebab: "belum disambung" });
  }

  const b = badanJson(req);
  if (b.laman) return res.status(200).json({ ok: false, sebab: "ditolak" }); // medan perangkap bot

  const maks = parseFloat(env.MAKS_SUMBANGAN || "30000") || 30000;
  const data = {
    projek: bersih(b.projek, 30).toLowerCase(),
    jumlah: Math.round((parseFloat(b.jumlah) || 0) * 100) / 100,
    jenis: b.jenis === "syarikat" ? "syarikat" : "individu",
    nama: bersih(b.nama, 120),
    id: bersih(b.id, 30),
    alamat: bersih(b.alamat, 300),
    emel: bersih(b.emel, 120).toLowerCase(),
    telefon: bersih(b.telefon, 20).replace(/[^0-9+]/g, ""),
    resit: !!b.resit,
    bahasa: b.bahasa === "en" ? "en" : "ms"
  };

  const salah = [];
  if (!/^[a-z0-9-]{1,30}$/.test(data.projek)) salah.push("projek");
  if (!(data.jumlah >= 1 && data.jumlah <= maks)) salah.push("jumlah");
  if (data.nama.length < 2) salah.push("nama");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.emel)) salah.push("emel");
  const digitTel = data.telefon.replace(/\D/g, "");
  if (digitTel.length < 9 || digitTel.length > 13) salah.push("telefon");
  if (data.resit) {
    if (data.jenis === "individu" && !/^\d{12}$/.test(data.id.replace(/[\s-]/g, ""))) salah.push("id");
    if (data.jenis === "syarikat" && !/^[A-Za-z0-9\s-]{5,20}$/.test(data.id)) salah.push("id");
    if (data.alamat.length < 10) salah.push("alamat");
  }
  if (salah.length) return res.status(200).json({ ok: false, sebab: "tidak sah", medan: salah });

  // 1. Rekod "menunggu" dalam Sheet (Sheet juga semak projek wujud dan dibuka)
  const m = await skrip({ tindakan: "mula", data });
  if (!m.ok) return res.status(200).json({ ok: false, sebab: m.sebab || "sheet" });

  // 2. Cipta bil toyyibPay
  const laman = (env.LAMAN_URL || `https://${req.headers.host}`).replace(/\/$/, "");
  const param = {
    userSecretKey: env.TOYYIBPAY_SECRET,
    categoryCode: env.TOYYIBPAY_CATEGORY,
    billName: alfanum("ARISMA Foundation", 30),
    billDescription: alfanum("Sumbangan " + (m.projek_nama || data.projek) + " " + m.rujukan, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(Math.round(data.jumlah * 100)),
    billReturnUrl: laman + "/terima-kasih/",
    billCallbackUrl: laman + "/api/toyyibpay",
    billExternalReferenceNo: m.rujukan,
    billTo: data.nama,
    billEmail: data.emel,
    billPhone: digitTel,
    billPaymentChannel: env.TOYYIBPAY_CHANNEL || "2",
    billChargeToCustomer: env.TOYYIBPAY_CAJ || "",
    billExpiryDays: "3",
    billContentEmail: "Terima kasih atas sumbangan anda kepada ARISMA Foundation."
  };

  let kod = "";
  try {
    const r = await fetch(asasToyyib() + "/index.php/api/createBill", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(param)
    });
    const teks = await r.text();
    let j = null; try { j = JSON.parse(teks); } catch (e) {}
    kod = Array.isArray(j) && j[0] && j[0].BillCode ? String(j[0].BillCode) : "";
    if (!kod) console.error("createBill gagal:", teks.slice(0, 300));
  } catch (e) {
    console.error("createBill ralat:", e);
  }

  if (!/^[A-Za-z0-9]+$/.test(kod)) {
    await skrip({ tindakan: "gagal", rujukan: m.rujukan });
    return res.status(200).json({ ok: false, sebab: "toyyibpay" });
  }

  // 3. Simpan kod bil pada rekod
  await skrip({ tindakan: "bil", rujukan: m.rujukan, billcode: kod });

  return res.status(200).json({ ok: true, url: asasToyyib() + "/" + kod, rujukan: m.rujukan });
}
