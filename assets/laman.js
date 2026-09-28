/* =========================================================
   ARISMA Foundation — skrip bersama
   Nilai di sini ialah SANDARAN. Bila Google Sheet disambung,
   nilai daripada Sheet (melalui /api/kandungan) mengatasinya.
   ========================================================= */
var FOUNDATION = {
  whatsapp: "60122290403",
  maksimumSumbangan: 30000,        // RM; di atas ini, penderma diminta hubungi untuk pindahan bank
  projek: [                        // sandaran jika Sheet tidak dapat dibaca
    { id: "desa",  nama: "Desa ARISMA", nama_en: "Desa ARISMA", sasaran: 2000000, terkumpul: 0, bil: 0, buka: true },
    { id: "degup", nama: "Kembara DEGUP ARISMA 2027", nama_en: "Kembara DEGUP ARISMA 2027", sasaran: 330000, terkumpul: 0, bil: 0, buka: true },
    { id: "umum",  nama: "Dana am Yayasan", nama_en: "Foundation general fund", sasaran: 0, terkumpul: 0, bil: 0, buka: true }
  ]
};

(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAL = window.HALAMAN || {};

  /* ---------------- Bahasa ---------------- */
  var EN_UMUM = {
    "nav.tentang": "About", "nav.projek": "Projects", "nav.tadbir": "Governance", "nav.sumbang": "Donate", "nav.hubungi": "Contact", "nav.utama": "Home",
    "kaki.hubungi": "Contact", "kaki.ikuti": "Follow us", "kaki.akademi": "ARISMA Academy website",
    "kaki.pengasas": "Founder", "kaki.emel": "Email",
    "kaki.hak": "The Trustees of ARISMA Foundation Registered (PPAB-29/2014). Incorporated under the Trustees (Incorporation) Act 1952.",
    "kaki.s44": "Donations are tax deductible under subsection 44(6) of the Income Tax Act 1967.",
    "f.projek": "Project", "f.amaun": "Amount", "f.lain": "Other amount", "f.sebagai": "I am donating as",
    "f.individu": "An individual", "f.syarikat": "A company",
    "f.namaInd": "Full name as in MyKad", "f.namaSyk": "Registered company name",
    "f.idInd": "MyKad number", "f.idSyk": "Company registration number (SSM)",
    "f.alamat": "Mailing address", "f.emel": "Email", "f.telefon": "Phone number",
    "f.resit": "Email me an official receipt for tax deduction under section 44(6)",
    "f.resitNota": "Your MyKad number and address are printed on the receipt and are only used for that purpose.",
    "f.teruskan": "Continue to payment", "f.bayarNota": "You will pay by FPX online banking or card through toyyibPay.",
    "f.tutup": "Online donations are not open yet. Contact us on WhatsApp to donate.",
    "f.opt": "(optional)",
    "m.1t": "Who will care for them?",
    "m.1p": "Autistic children become autistic adults. As parents grow frail or pass away, someone and somewhere must continue to look after and protect them.",
    "m.2t": "Specialised facilities are scarce",
    "m.2p": "Existing care centres are not designed for the sensory and behavioural needs of autistic adults who require high support.",
    "m.3t": "Our answer: Desa ARISMA"
  };
  var M = {
    ms: {
      pilihAmaun: "Pilih amaun atau masukkan amaun sendiri.",
      minAmaun: "Amaun paling kecil ialah RM 1.",
      maksAmaun: "Untuk sumbangan melebihi {n}, sila hubungi kami untuk pindahan bank dan resit.",
      isi: "Sila isi {m}.",
      idSalah: "No. K/P perlu 12 digit, contohnya 800101-14-5678.",
      sykSalah: "Semak semula no. pendaftaran syarikat.",
      emelSalah: "Semak semula alamat e-mel.",
      telSalah: "Semak semula no. telefon.",
      menghantar: "Menyediakan bil pembayaran…",
      belum: "Kutipan dalam talian belum disambung. Hubungi kami melalui WhatsApp untuk menyumbang.",
      gagal: "Bil pembayaran tidak dapat disediakan. Cuba lagi sebentar, atau hubungi kami melalui WhatsApp.",
      tajaOk: "Terima kasih. Permohonan anda diterima dan kami akan menghubungi anda dalam masa 3 hari bekerja.",
      tajaWA: "WhatsApp dibuka. Semak mesej, kemudian tekan hantar.",
      terkumpul: "terkumpul daripada sasaran {s}",
      sumbangan: "{n} sumbangan",
      semasa: "Kutipan terkini",
      lain: "Amaun lain",
      tukar: "Switch to English"
    },
    en: {
      pilihAmaun: "Choose an amount or enter your own.",
      minAmaun: "The smallest amount is RM 1.",
      maksAmaun: "For donations above {n}, please contact us to arrange a bank transfer and receipt.",
      isi: "Please fill in {m}.",
      idSalah: "A MyKad number has 12 digits, for example 800101-14-5678.",
      sykSalah: "Please check the company registration number.",
      emelSalah: "Please check the email address.",
      telSalah: "Please check the phone number.",
      menghantar: "Preparing your payment bill…",
      belum: "Online donations are not connected yet. Contact us on WhatsApp to donate.",
      gagal: "The payment bill could not be prepared. Try again shortly, or contact us on WhatsApp.",
      tajaOk: "Thank you. We have received your enquiry and will contact you within 3 working days.",
      tajaWA: "WhatsApp is open. Check the message, then press send.",
      terkumpul: "raised of a {s} target",
      sumbangan: "{n} donations",
      semasa: "Raised so far",
      lain: "Other amount",
      tukar: "Tukar ke Bahasa Melayu"
    }
  };
  var EN = {}; [EN_UMUM, window.EN_HALAMAN || {}].forEach(function (o) { for (var k in o) EN[k] = o[k]; });
  var bahasa = "ms", pendengar = [];
  function t(k, v) { var s = (M[bahasa] && M[bahasa][k]) || M.ms[k] || k; for (var x in (v || {})) s = s.replace("{" + x + "}", v[x]); return s; }
  function pilihBahasa(r, en) { return bahasa === "en" && nilai(en) ? nilai(en) : nilai(r); }
  function onBahasa(fn) { pendengar.push(fn); }

  $$("[data-t]").forEach(function (el) { el._ms = el.innerHTML; });
  $$("[data-t-ph]").forEach(function (el) { el._msPh = el.getAttribute("placeholder") || ""; });
  var tajukMs = document.title;

  function setBahasa(l) {
    bahasa = l === "en" ? "en" : "ms";
    document.documentElement.lang = bahasa === "en" ? "en" : "ms";
    $$("[data-t]").forEach(function (el) {
      var k = el.getAttribute("data-t");
      el.innerHTML = bahasa === "en" && EN[k] != null ? EN[k] : el._ms;
    });
    $$("[data-t-ph]").forEach(function (el) {
      var k = el.getAttribute("data-t-ph");
      el.setAttribute("placeholder", bahasa === "en" && EN[k] != null ? EN[k] : el._msPh);
    });
    document.title = bahasa === "en" && HAL.tajukEn ? HAL.tajukEn : tajukMs;
    var b = $("bahasaBtn");
    if (b) { b.textContent = bahasa === "en" ? "BM" : "EN"; b.setAttribute("aria-label", t("tukar")); }
    try { localStorage.setItem("arisma-bahasa", bahasa); } catch (e) {}
    pendengar.forEach(function (fn) { fn(); });
  }

  /* ---------------- Bantuan (data Sheet sentiasa dibersihkan) ---------------- */
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nilai(v) { return v == null ? "" : String(v).trim(); }
  function ya(v) { return /^(ya|yes|y|true|1)$/i.test(nilai(v)); }
  function nombor(v) { var n = parseFloat(nilai(v).replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; }
  function urlSelamat(v) { v = nilai(v); return /^(https:\/\/|\/|img\/|dokumen\/)/i.test(v) && !/^\/\//.test(v) ? v : ""; }
  function rm(n) { return "RM " + Math.round(n).toLocaleString("en-MY"); }
  function bukaWA(teks) { window.open("https://wa.me/" + FOUNDATION.whatsapp + "?text=" + encodeURIComponent(teks), "_blank", "noopener"); }
  function lihat(el, fn, ambang) {
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { fn(); io.disconnect(); } }, { threshold: ambang || .3 });
    io.observe(el);
  }

  var yr = $("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- Header ---------------- */
  var nav = $("nav"), menuBtn = $("menuBtn");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var buka = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", buka);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }
  var bBtn = $("bahasaBtn");
  if (bBtn) bBtn.addEventListener("click", function () { setBahasa(bahasa === "en" ? "ms" : "en"); });

  /* ---------------- Video hero ---------------- */
  var hero = document.querySelector(".hero"), vid = $("introVid");
  if (hero && vid) {
    var selesai = function () { hero.classList.add("selesai"); };
    if (reduce) { vid.removeAttribute("autoplay"); vid.pause(); selesai(); }
    else {
      vid.addEventListener("ended", selesai);
      vid.addEventListener("error", selesai);
      // Jika pelayar tidak benarkan autoplay (cth. mod jimat bateri), terus paparkan teks.
      setTimeout(function () { if (vid.paused && vid.currentTime < .1) selesai(); }, 1500);
      setTimeout(selesai, 11000);
    }
    var mainBtn = $("mainSemula"), bunyiBtn = $("bunyiBtn");
    if (mainBtn) mainBtn.addEventListener("click", function () { vid.currentTime = 0; vid.play(); });
    if (bunyiBtn) {
      var labelBunyi = function () {
        bunyiBtn.textContent = vid.muted ? (bahasa === "en" ? "Sound on" : "Hidupkan bunyi") : (bahasa === "en" ? "Sound off" : "Matikan bunyi");
      };
      bunyiBtn.addEventListener("click", function () {
        vid.muted = !vid.muted;
        if (!vid.muted && vid.ended) { vid.currentTime = 0; vid.play(); }
        labelBunyi();
      });
      onBahasa(labelBunyi);
    }
  }

  /* ---------------- Garisan degupan (DEGUP) ---------------- */
  $$(".ekg").forEach(function (svg) {
    var p = svg.querySelector("path"); if (!p) return;
    svg.style.setProperty("--p", Math.ceil(p.getTotalLength()));
    lihat(svg, function () { svg.classList.add("lukis"); }, .6);
  });

  /* ---------------- Projek & tabung ---------------- */
  var PROJEK = FOUNDATION.projek.slice();
  function cariProjek(id) { for (var i = 0; i < PROJEK.length; i++) if (PROJEK[i].id === id) return PROJEK[i]; return null; }

  function paparTabung() {
    $$("[data-tabung]").forEach(function (el) {
      var p = cariProjek(el.getAttribute("data-tabung"));
      if (!p || !p.sasaran) { el.hidden = true; return; }
      el.hidden = false;
      var pct = Math.max(0, Math.min(100, (p.terkumpul || 0) / p.sasaran * 100));
      el.querySelector(".angka").textContent = rm(p.terkumpul || 0);
      el.querySelector(".dari").textContent = t("terkumpul", { s: rm(p.sasaran) });
      var bar = el.querySelector(".bar"), isi = bar.querySelector("i");
      bar.setAttribute("aria-valuenow", Math.round(pct));
      bar.setAttribute("aria-label", t("semasa"));
      var meta = el.querySelector(".bar-meta");
      if (meta) meta.innerHTML = "<span>" + (pct > 0 && pct < 10 ? pct.toFixed(1) : Math.round(pct)) + "%</span><span>" + (p.bil ? esc(t("sumbangan", { n: p.bil.toLocaleString("en-MY") })) : "") + "</span>";
      if (el._nampak) isi.style.width = pct + "%";
      else lihat(bar, function () { el._nampak = true; isi.style.width = pct + "%"; }, .5);
    });
  }

  function paparProjek() {
    // Teks projek sedia ada (jika Sheet memberi nilai)
    PROJEK.forEach(function (p) {
      var row = document.querySelector('[data-projek="' + p.id + '"]');
      if (!row) return;
      [["nama", "nama_en", ".p-nama"], ["ringkasan", "ringkasan_en", ".p-ringkas"], ["status", "status_en", ".p-status"]].forEach(function (x) {
        var el = row.querySelector(x[2]), v = pilihBahasa(p[x[0]], p[x[1]]);
        if (!el) return;
        if (v) { el.removeAttribute("data-t"); el.textContent = v; }
      });
    });
    // Projek baharu daripada Sheet yang belum ada dalam halaman
    var lain = $("projekLain");
    if (lain) {
      lain.innerHTML = PROJEK.filter(function (p) {
        return p.id !== "umum" && p.baharu && !document.querySelector('[data-projek="' + p.id + '"]:not(.dijana)');
      }).map(function (p) {
        var pautan = urlSelamat(p.pautan);
        return '<article class="baris-projek projek-lain dijana" data-projek="' + esc(p.id) + '"><div class="isi-projek">' +
          (pilihBahasa(p.status, p.status_en) ? '<p class="status">' + esc(pilihBahasa(p.status, p.status_en)) + '</p>' : '') +
          '<h3>' + esc(pilihBahasa(p.nama, p.nama_en)) + '</h3>' +
          (pilihBahasa(p.ringkasan, p.ringkasan_en) ? '<p class="ringkas">' + esc(pilihBahasa(p.ringkasan, p.ringkasan_en)) + '</p>' : '') +
          (p.sasaran ? '<div class="tabung" data-tabung="' + esc(p.id) + '"><p class="angka"></p><p class="dari"></p><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="bar-meta"></div></div>' : '') +
          '<div class="aksi">' + (p.buka ? '<a class="btn btn-gelap" href="#sumbang" data-pilih-projek="' + esc(p.id) + '">' + (bahasa === "en" ? "Donate to this project" : "Sumbang untuk projek ini") + '</a>' : '') +
          (pautan ? '<a class="btn btn-garis" style="color:var(--emas-teks)" href="' + esc(pautan) + '">' + (bahasa === "en" ? "Read more" : "Baca lanjut") + '</a>' : '') + '</div></div></article>';
      }).join("");
    }
    // Pilihan projek dalam borang sumbang
    var sel = $("d-projek");
    if (sel) {
      var dulu = sel.value;
      sel.innerHTML = PROJEK.filter(function (p) { return p.buka; }).map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(pilihBahasa(p.nama, p.nama_en)) + '</option>';
      }).join("");
      if (dulu && cariProjek(dulu)) sel.value = dulu;
    }
    paparTabung();
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-pilih-projek]");
    if (a && $("d-projek")) { $("d-projek").value = a.getAttribute("data-pilih-projek"); }
  });
  onBahasa(paparProjek);
  paparProjek();

  /* ---------------- Tetapan dari Sheet ---------------- */
  var TET = {}, bukaSumbang = true;
  function isiTetapan() {
    var tx = function (sel, v) { if (!nilai(v)) return; $$(sel).forEach(function (el) { el.textContent = nilai(v); }); };
    tx(".s44-ruj", TET.s44_rujukan);
    tx(".s44-tempoh", pilihBahasa(TET.s44_tempoh, TET.s44_tempoh_en));
    tx(".alamat-yayasan", TET.alamat);
    if (nilai(TET.emel)) $$(".emel-yayasan").forEach(function (a) { a.textContent = nilai(TET.emel); a.href = "mailto:" + nilai(TET.emel); });
    var qr = urlSelamat(TET.duitnow_qr), qrBox = $("duitnow");
    if (qrBox) { qrBox.hidden = !qr; if (qr) $("duitnowImg").src = qr; }
    var kc = urlSelamat(TET.pautan_kertas_cadangan);
    $$(".kertas-cadangan").forEach(function (a) { a.hidden = !kc; if (kc) a.href = kc; });
    var tutup = $("d-tutup"), hantar = $("d-hantar");
    if (tutup && hantar) { tutup.hidden = bukaSumbang; hantar.disabled = !bukaSumbang; }
  }
  onBahasa(isiTetapan);

  function paparAmanah(senarai) {
    var ul = $("amanahList"); if (!ul || !senarai.length) return;
    ul.innerHTML = senarai.map(function (r) {
      var j = pilihBahasa(r.jawatan, r.jawatan_en);
      return '<li><b>' + esc(nilai(r.nama)) + '</b>' + (j ? '<span>' + esc(j) + '</span>' : '') + '</li>';
    }).join("");
  }

  function terapkan(k) {
    TET = k.tetapan || {};
    if (nilai(TET.whatsapp)) FOUNDATION.whatsapp = nilai(TET.whatsapp).replace(/[^0-9]/g, "") || FOUNDATION.whatsapp;
    if (nilai(TET.buka_sumbangan)) bukaSumbang = ya(TET.buka_sumbangan);
    var mx = nombor(TET.maksimum_sumbangan); if (mx) FOUNDATION.maksimumSumbangan = mx;

    var pr = (k.projek || []).filter(function (r) { return /^[a-z0-9-]{1,30}$/.test(nilai(r.id)) && nilai(r.nama); });
    if (pr.length) {
      PROJEK = pr.map(function (r) {
        return { id: nilai(r.id), nama: r.nama, nama_en: r.nama_en, ringkasan: r.ringkasan, ringkasan_en: r.ringkasan_en,
          status: r.status, status_en: r.status_en, pautan: r.pautan, sasaran: nombor(r.sasaran) || 0,
          terkumpul: nombor(r.terkumpul) || 0, bil: Number(r.bil) || 0, buka: ya(r.buka),
          baharu: !document.querySelector('[data-projek="' + nilai(r.id) + '"]') };
      });
    }
    var am = (k.pemegang_amanah || []).filter(function (r) { return nilai(r.nama); });
    onBahasa(function () { paparAmanah(am); });
    paparAmanah(am);
    paparProjek();
    isiTetapan();
  }

  /* ---------------- Borang sumbang ---------------- */
  var bs = $("borangSumbang");
  var amaunAsal = HAL.amaun || [{ nilai: 50 }, { nilai: 100 }, { nilai: 250 }, { nilai: 500 }];
  function paparAmaun() {
    var box = $("amaunPilih"); if (!box) return;
    var dipilih = (box.querySelector("input:checked") || {}).value || String(amaunAsal[0].nilai);
    var berKet = amaunAsal.some(function (a) { return a.ms; });
    box.className = berKet ? "amaun-pilih" : "pilihan";
    box.innerHTML = amaunAsal.map(function (a) {
      var ket = bahasa === "en" ? a.en : a.ms;
      return berKet
        ? '<label><input type="radio" name="amaun" value="' + a.nilai + '"><b>' + rm(a.nilai) + '</b><small>' + esc(ket || "") + '</small></label>'
        : '<label><input type="radio" name="amaun" value="' + a.nilai + '"><span>' + rm(a.nilai) + '</span></label>';
    }).join("") + (berKet
      ? '<label><input type="radio" name="amaun" value="lain"><b>' + esc(t("lain")) + '</b><small>' + (bahasa === "en" ? "Any amount you choose" : "Amaun pilihan sendiri") + '</small></label>'
      : '<label><input type="radio" name="amaun" value="lain"><span>' + esc(t("lain")) + '</span></label>');
    var r = box.querySelector('input[value="' + dipilih + '"]') || box.querySelector("input");
    r.checked = true;
    ubahAmaun();
  }
  function ubahAmaun() {
    var lain = bs && bs.querySelector('input[name="amaun"]:checked');
    var w = $("d-lainWrap"); if (w) w.hidden = !(lain && lain.value === "lain");
  }
  function ubahJenis() {
    var syk = bs.querySelector('input[name="jenis"]:checked').value === "syarikat";
    var nL = $("d-namaL"), iL = $("d-idL");
    nL.setAttribute("data-t", syk ? "f.namaSyk" : "f.namaInd"); nL._ms = syk ? "Nama syarikat berdaftar" : "Nama penuh seperti dalam K/P";
    iL.setAttribute("data-t", syk ? "f.idSyk" : "f.idInd"); iL._ms = syk ? "No. pendaftaran syarikat (SSM)" : "No. K/P";
    nL.innerHTML = bahasa === "en" ? EN[nL.getAttribute("data-t")] : nL._ms;
    iL.innerHTML = bahasa === "en" ? EN[iL.getAttribute("data-t")] : iL._ms;
    $("d-id").setAttribute("placeholder", syk ? "cth. 201001043903" : "cth. 800101-14-5678");
    $("d-nama").setAttribute("autocomplete", syk ? "organization" : "name");
  }
  function ubahResit() {
    var perlu = $("d-resit").checked;
    ["d-id", "d-alamat"].forEach(function (id) {
      var el = $(id); if (perlu) el.setAttribute("required", ""); else { el.removeAttribute("required"); el.setAttribute("aria-invalid", "false"); }
      var opt = document.querySelector('label[for="' + id + '"] .opt'); if (opt) opt.hidden = perlu;
    });
  }
  function mesej(el, teks, jenis, html) {
    el.classList.remove("salah", "ok"); if (jenis) el.classList.add(jenis);
    if (html) el.innerHTML = html; else el.textContent = teks;
  }
  function labelMedan(el) {
    var l = document.querySelector('label[for="' + el.id + '"]');
    var s = l ? l.textContent.replace(/\(.*?\)/g, "").trim() : ""; return s.charAt(0).toLowerCase() + s.slice(1);
  }
  if (bs) {
    paparAmaun(); onBahasa(paparAmaun);
    bs.addEventListener("change", function (e) {
      if (e.target.name === "amaun") ubahAmaun();
      if (e.target.name === "jenis") ubahJenis();
      if (e.target.id === "d-resit") ubahResit();
    });
    ubahJenis(); ubahResit();
    var msg = $("d-msg"), asalMsg = msg.innerHTML;
    onBahasa(function () { ubahJenis(); });

    bs.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!bukaSumbang) return;
      var f = bs.elements, salah = null, teksSalah = "";
      $$("[aria-invalid]", bs).forEach(function (x) { x.setAttribute("aria-invalid", "false"); });
      function tanda(el, s) { if (!salah) { salah = el; teksSalah = s; } el.setAttribute("aria-invalid", "true"); }

      var pilih = bs.querySelector('input[name="amaun"]:checked'), jumlah = null;
      if (!pilih) { mesej(msg, t("pilihAmaun"), "salah"); return; }
      jumlah = pilih.value === "lain" ? nombor($("d-lain").value) : Number(pilih.value);
      if (pilih.value === "lain" && !jumlah) tanda($("d-lain"), t("pilihAmaun"));
      else if (jumlah < 1) tanda($("d-lain"), t("minAmaun"));
      else if (jumlah > FOUNDATION.maksimumSumbangan) tanda($("d-lain"), t("maksAmaun", { n: rm(FOUNDATION.maksimumSumbangan) }));

      $$("[required]", bs).forEach(function (el) { if (!el.value.trim()) tanda(el, t("isi", { m: labelMedan(el) })); });
      var syk = bs.querySelector('input[name="jenis"]:checked').value === "syarikat";
      var idv = $("d-id").value.trim();
      if (idv) {
        if (!syk && !/^\d{12}$/.test(idv.replace(/[\s-]/g, ""))) tanda($("d-id"), t("idSalah"));
        if (syk && !/^[A-Za-z0-9\s-]{5,20}$/.test(idv)) tanda($("d-id"), t("sykSalah"));
      }
      var em = $("d-emel").value.trim();
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) tanda($("d-emel"), t("emelSalah"));
      var tel = $("d-telefon").value.replace(/[^0-9]/g, "");
      if ($("d-telefon").value.trim() && (tel.length < 9 || tel.length > 13)) tanda($("d-telefon"), t("telSalah"));

      if (salah) { mesej(msg, teksSalah, "salah"); salah.focus(); return; }

      var btn = $("d-hantar"); btn.disabled = true; mesej(msg, t("menghantar"));
      var projekId = f.projek ? f.projek.value : (HAL.projek || "umum");
      fetch("/api/sumbang", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projek: projekId, jumlah: jumlah, jenis: syk ? "syarikat" : "individu",
          nama: f.nama.value.trim(), id: idv, alamat: f.alamat.value.trim(), emel: em,
          telefon: f.telefon.value.trim(), resit: $("d-resit").checked, bahasa: bahasa, laman: f.laman.value
        })
      }).then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          if (j.ok && /^https:\/\/(dev\.)?toyyibpay\.com\/[A-Za-z0-9]+$/.test(j.url || "")) { window.location.href = j.url; return; }
          btn.disabled = false;
          var p = cariProjek(projekId), nm = p ? p.nama : projekId;
          var wa = "https://wa.me/" + FOUNDATION.whatsapp + "?text=" + encodeURIComponent("Assalamualaikum, saya ingin menyumbang " + rm(jumlah) + " untuk " + nm + ".");
          mesej(msg, "", "salah", esc(j.sebab === "belum disambung" || j.sebab === "ditutup" ? t("belum") : (j.mesej || t("gagal"))) + ' <a class="pautan" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a>');
        })
        .catch(function () { btn.disabled = false; mesej(msg, t("gagal"), "salah"); });
    });
    onBahasa(function () { if (!msg.classList.contains("salah")) msg.innerHTML = bahasa === "en" ? EN["f.bayarNota"] : asalMsg; });
  }

  /* ---------------- Borang penajaan ---------------- */
  var bt = $("borangTaja");
  if (bt) {
    var tmsg = $("t-msg");
    bt.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = bt.elements, salah = null;
      $$("[required]", bt).forEach(function (el) {
        var kosong = !el.value.trim(); el.setAttribute("aria-invalid", kosong ? "true" : "false");
        if (kosong && !salah) salah = el;
      });
      var em = f.emel.value.trim();
      if (!salah && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { salah = f.emel; f.emel.setAttribute("aria-invalid", "true"); }
      var minat = $$('input[name="minat"]:checked', bt).map(function (x) { return x.value; });
      if (salah) { mesej(tmsg, salah === f.emel && em ? t("emelSalah") : t("isi", { m: labelMedan(salah) }), "salah"); salah.focus(); return; }
      var data = { syarikat: f.syarikat.value.trim(), pegawai: f.pegawai.value.trim(), jawatan: f.jawatan.value.trim(),
        emel: em, telefon: f.telefon.value.trim(), minat: minat, mesej: f.mesej.value.trim(), laman: f.laman.value };
      var btn = bt.querySelector('button[type="submit"]'); btn.disabled = true;
      function keWA() {
        bukaWA("Assalamualaikum, kami berminat menaja Kembara DEGUP ARISMA 2027.\n\nSyarikat: " + data.syarikat +
          "\nPegawai: " + data.pegawai + " (" + data.jawatan + ")\nE-mel: " + data.emel + "\nTelefon: " + data.telefon +
          "\nMinat: " + (minat.join(", ") || "-") + (data.mesej ? "\n\n" + data.mesej : ""));
        mesej(tmsg, t("tajaWA"), "ok");
      }
      fetch("/api/taja", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) { btn.disabled = false; if (j.ok) { mesej(tmsg, t("tajaOk"), "ok"); bt.reset(); } else keWA(); })
        .catch(function () { btn.disabled = false; keWA(); });
    });
  }

  /* ---------------- Bahasa awal ---------------- */
  var awal = "ms";
  try { awal = localStorage.getItem("arisma-bahasa") || "ms"; } catch (e) {}
  var q = /[?&]lang=(en|ms)/.exec(location.search); if (q) awal = q[1];
  setBahasa(awal);

  /* ---------------- Kandungan Google Sheet ---------------- */
  (function () {
    var ctl = window.AbortController ? new AbortController() : null;
    var tm = ctl ? setTimeout(function () { ctl.abort(); }, 8000) : null;
    fetch("/api/kandungan", ctl ? { signal: ctl.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (k) { if (k && k.ok) terapkan(k); })
      .catch(function (e) { if (window.console) console.warn("Kandungan Sheet tidak dimuat; guna kandungan asal.", e); })
      .then(function () { if (tm) clearTimeout(tm); });
  })();
})();
