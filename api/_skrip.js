// Bantuan dikongsi (fail bermula "_" tidak dijadikan laluan oleh Vercel).
// Hantar tindakan ke Apps Script bersama KUNCI_SKRIP.
export async function skrip(badan) {
  const url = process.env.APPS_SCRIPT_URL, kunci = process.env.KUNCI_SKRIP;
  if (!url || !kunci) return { ok: false, sebab: "belum disambung" };
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kunci, ...badan }),
      redirect: "follow",
      signal: ctl.signal
    });
    return JSON.parse(await r.text());
  } catch (e) {
    return { ok: false, sebab: "sheet tidak dapat dihubungi" };
  } finally {
    clearTimeout(tm);
  }
}

export function asasToyyib() {
  return (process.env.TOYYIBPAY_BASE || "https://toyyibpay.com").replace(/\/$/, "");
}

export function badanJson(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b && typeof b === "object" ? b : {};
}
