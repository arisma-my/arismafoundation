/**
 * ARISMA Foundation — otak laman web (Google Apps Script)
 *
 * Tampal seluruh fail ini dalam Google Sheet BARU (bukan Sheet akademi):
 *   Extensions > Apps Script > padam kod asal > tampal > Save.
 * Kemudian ikut langkah dalam BACA-SAYA.md.
 *
 * Prinsip keselamatan:
 *  - doGet HANYA memulangkan tab awam (TAB_AWAM) dan JUMLAH kutipan setiap projek.
 *    Tab Sumbangan, Penajaan dan Tetapan_Dalaman tidak pernah keluar.
 *  - doPost hanya terima permintaan yang membawa KUNCI rahsia (Script Properties).
 *  - Status "dibayar" hanya diberi kepada kod bil yang dicipta oleh Sheet ini sendiri,
 *    selepas Vercel mengesahkannya terus dengan toyyibPay.
 */

var TAB_AWAM = ['Tetapan', 'Projek', 'PemegangAmanah'];
var TAB_SUMBANGAN = 'Sumbangan';
var LAJUR_SUMBANGAN = ['rujukan', 'dicipta', 'projek', 'jumlah', 'jenis', 'nama', 'no_id', 'alamat', 'emel', 'telefon',
  'mahu_resit', 'bahasa', 'billcode', 'status', 'dibayar_pada', 'rujukan_bayaran', 'jumlah_dibayar', 'no_resit', 'resit', 'catatan'];
var TAB_PENAJAAN = 'Penajaan';
var LAJUR_PENAJAAN = ['diterima', 'syarikat', 'pegawai', 'jawatan', 'emel', 'telefon', 'minat', 'mesej', 'status'];

/* ================= Sediakan Sheet (jalankan SEKALI) ================= */
function sediakanSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  buatTab_(ss, 'Tetapan', ['Kunci', 'Nilai', 'Penerangan'], [
    ['buka_sumbangan', 'tidak', 'ya = borang sumbang aktif. Tukar ke ya selepas toyyibPay diuji.'],
    ['s44_rujukan', '', 'No. rujukan surat kelulusan 44(6) LHDN, cth. LHDN.01/35/42/51/179-6.XXXX'],
    ['s44_tempoh', '', 'Tempoh sah kelulusan (BM), cth. 1 Jan 2025 hingga 31 Dis 2027'],
    ['s44_tempoh_en', '', 'Tempoh sah kelulusan (English)'],
    ['alamat', '', 'Alamat berdaftar Yayasan (dipaparkan di laman)'],
    ['emel', '', 'E-mel rasmi awam'],
    ['whatsapp', '60122290403', 'Nombor WhatsApp untuk sandaran borang (format 60...)'],
    ['duitnow_qr', '', 'Pautan gambar DuitNow QR rasmi (https://... atau img/duitnow.png). Kosong = tidak dipapar'],
    ['pautan_kertas_cadangan', '', 'Pautan PDF kertas cadangan penajaan DEGUP. Kosong = butang tidak dipapar'],
    ['maksimum_sumbangan', '30000', 'Had sumbangan dalam talian (RM). Di atas ini, penderma diminta hubungi untuk pindahan bank']
  ]);

  buatTab_(ss, 'Tetapan_Dalaman', ['Kunci', 'Nilai', 'Penerangan'], [
    ['emel_admin', '', 'E-mel yang menerima salinan resit dan notis penajaan (TIDAK dipapar di laman)'],
    ['nama_resit', 'THE TRUSTEES OF ARISMA FOUNDATION REGISTERED', 'Nama pada kepala resit'],
    ['alamat_resit', '', 'Alamat pada kepala resit'],
    ['awalan_resit', 'AF', 'Awalan no. resit, cth. AF/2026/00001'],
    ['penandatangan', '', 'Nama pegawai pada resit'],
    ['jawatan_penandatangan', '', 'Jawatan pegawai pada resit'],
    ['folder_resit', '', 'Diisi automatik: ID folder Drive tempat salinan resit disimpan']
  ]);

  buatTab_(ss, 'Projek', ['id', 'nama', 'nama_en', 'ringkasan', 'ringkasan_en', 'status', 'status_en', 'pautan', 'sasaran', 'kutipan_luar', 'buka'], [
    ['desa', 'Desa ARISMA', 'Desa ARISMA', '', '', '', '', '', '2000000', '0', 'ya'],
    ['degup', 'Kembara DEGUP ARISMA 2027', 'Kembara DEGUP ARISMA 2027', '', '', '', '', '/degup2027/', '330000', '0', 'ya'],
    ['umum', 'Dana am Yayasan', 'Foundation general fund', '', '', '', '', '', '', '0', 'ya']
  ]);

  buatTab_(ss, 'PemegangAmanah', ['nama', 'jawatan', 'jawatan_en', 'papar'], [
    ['Puan Siti Khadijah binti Md. Zamin', 'Pemegang amanah', 'Trustee', 'ya'],
    ['Encik Omar bin Ahmad', 'Pemegang amanah', 'Trustee', 'ya'],
    ["Encik Muhammad 'Asri bin Mohd Rafa'i", 'Pemegang amanah', 'Trustee', 'ya'],
    ['Puan Tihanni binti Borhan', 'Pemegang amanah', 'Trustee', 'ya'],
    ['Encik Cheku Ramlan bin Cheku Ibrahim', 'Pemegang amanah', 'Trustee', 'ya'],
    ['Puan Rosniah binti Mohamed Rosian', 'Pemegang amanah', 'Trustee', 'ya'],
    ['Puan Mumtazah binti Mustajab', 'Pemegang amanah', 'Trustee', 'ya']
  ]);

  buatTab_(ss, TAB_SUMBANGAN, LAJUR_SUMBANGAN, []);
  buatTab_(ss, TAB_PENAJAAN, LAJUR_PENAJAAN, []);

  var pertama = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (pertama && ss.getSheets().length > 1 && pertama.getLastRow() === 0) ss.deleteSheet(pertama);
}

/* ================= Jana kunci rahsia (jalankan SEKALI) ================= */
function tetapkanKunci() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('KUNCI')) {
    Logger.log('Kunci sudah wujud. Untuk menukar, padam "KUNCI" dalam Project Settings > Script Properties.');
    return;
  }
  var kunci = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('KUNCI', kunci);
  Logger.log('KUNCI_SKRIP = ' + kunci);
}

/* ================= Uji resit tanpa bayaran sebenar ================= */
function ujiResitKeEmelSaya() {
  var emel = Session.getActiveUser().getEmail();
  var contoh = { rujukan: 'UJI', projek: 'desa', jumlah_dibayar: 180.5, jenis: 'individu', nama: 'Nama Penderma Contoh',
    no_id: '800101-14-5678', alamat: 'No 1, Jalan Contoh, 68000 Ampang, Selangor', emel: emel, mahu_resit: 'ya', bahasa: 'ms',
    rujukan_bayaran: 'TP-CONTOH', dibayar_pada: new Date() };
  hantarResit_(contoh, 'UJI/0000/00000');
  Logger.log('Resit contoh dihantar ke ' + emel);
}

/* ================= GET: kandungan awam ================= */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hasil = { dikemaskini: new Date().toISOString() };

  var tetapan = {};
  bacaBaris_(ss, 'Tetapan').forEach(function (r) { if (r.kunci) tetapan[r.kunci] = r.nilai; });
  hasil.tetapan = tetapan;

  // Jumlah kutipan setiap projek: hanya rekod "dibayar". Tiada maklumat penderma keluar.
  var jumlah = {};
  bacaBaris_(ss, TAB_SUMBANGAN).forEach(function (r) {
    if (r.status !== 'dibayar') return;
    var j = jumlah[r.projek] || (jumlah[r.projek] = { rm: 0, bil: 0 });
    j.rm += nombor_(r.jumlah_dibayar || r.jumlah);
    j.bil++;
  });
  hasil.projek = bacaBaris_(ss, 'Projek').map(function (r) {
    var j = jumlah[r.id] || { rm: 0, bil: 0 };
    return {
      id: r.id, nama: r.nama, nama_en: r.nama_en, ringkasan: r.ringkasan, ringkasan_en: r.ringkasan_en,
      status: r.status, status_en: r.status_en, pautan: r.pautan, sasaran: r.sasaran, buka: r.buka,
      terkumpul: Math.round((j.rm + nombor_(r.kutipan_luar)) * 100) / 100, bil: j.bil
    };
  });

  hasil.pemegang_amanah = bacaBaris_(ss, 'PemegangAmanah').filter(function (r) { return ya_(r.papar); })
    .map(function (r) { return { nama: r.nama, jawatan: r.jawatan, jawatan_en: r.jawatan_en }; });

  return json_(hasil);
}

/* ================= POST: dari Vercel sahaja ================= */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, sebab: 'bentuk data salah' }); }

  var kunci = PropertiesService.getScriptProperties().getProperty('KUNCI');
  if (!kunci || body.kunci !== kunci) return json_({ ok: false, sebab: 'tidak dibenarkan' });

  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    switch (body.tindakan) {
      case 'mula': return json_(mula_(body.data || {}));
      case 'bil': return json_(kemaskini_(body.rujukan, { billcode: String(body.billcode || '') }));
      case 'gagal': return json_(kemaskini_(body.rujukan, { status: 'gagal bil' }));
      case 'sahkan': return json_(sahkan_(Array.isArray(body.baris) ? body.baris : []));
      case 'tertunggak': return json_(tertunggak_());
      case 'taja': return json_(taja_(body.data || {}));
      default: return json_({ ok: false, sebab: 'tindakan tidak dikenali' });
    }
  } finally {
    lock.releaseLock();
  }
}

/* ---------- mula: rekod sumbangan "menunggu" ---------- */
function mula_(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tet = tetapan_(ss, 'Tetapan');
  if (!ya_(tet.buka_sumbangan)) return { ok: false, sebab: 'ditutup' };

  var projek = null;
  bacaBaris_(ss, 'Projek').forEach(function (r) { if (r.id === d.projek) projek = r; });
  if (!projek || !ya_(projek.buka)) return { ok: false, sebab: 'projek tidak dibuka' };

  var rujukan = 'AF' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyMMdd') + '-' +
    Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();

  var sheet = tabSumbangan_(ss);
  sheet.appendRow([
    rujukan, new Date(), selamat_(d.projek), Number(d.jumlah) || 0, selamat_(d.jenis), selamat_(d.nama),
    selamat_(d.id), selamat_(d.alamat), selamat_(d.emel), selamat_(d.telefon), d.resit ? 'ya' : 'tidak',
    selamat_(d.bahasa), '', 'menunggu', '', '', '', '', '', ''
  ]);
  return { ok: true, rujukan: rujukan, projek_nama: projek.nama };
}

/* ---------- sahkan: tanda dibayar + hantar resit ---------- */
function sahkan_(baris) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = tabSumbangan_(ss);
  var data = sheet.getDataRange().getValues();
  var k = indeks_(data[0]);
  var baru = 0, dikenali = false;

  baris.forEach(function (b) {
    var kod = String(b.billcode || '');
    if (!kod) return;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][k.billcode]) !== kod) continue;
      // Rujukan dalaman mesti sepadan dengan yang dilekatkan pada bil
      if (b.rujukan && String(b.rujukan) !== String(data[i][k.rujukan])) continue;
      dikenali = true;
      if (data[i][k.status] === 'dibayar') break;

      var baris1 = i + 1;
      var noResit = noResitSeterusnya_(ss);
      sheet.getRange(baris1, k.status + 1).setValue('dibayar');
      sheet.getRange(baris1, k.dibayar_pada + 1).setValue(selamat_(b.tarikh) || new Date());
      sheet.getRange(baris1, k.rujukan_bayaran + 1).setValue(selamat_(b.refno));
      sheet.getRange(baris1, k.jumlah_dibayar + 1).setValue(Number(b.jumlah) || 0);
      sheet.getRange(baris1, k.no_resit + 1).setValue(noResit);
      var jb = Number(b.jumlah) || 0, jr = Number(data[i][k.jumlah]) || 0;
      if (Math.abs(jb - jr) > 0.01) sheet.getRange(baris1, k.catatan + 1).setValue('Jumlah dibayar berbeza daripada borang (' + jr + ')');
      baru++;

      var rekod = objek_(data[0], data[i]);
      rekod.jumlah_dibayar = jb; rekod.rujukan_bayaran = b.refno; rekod.dibayar_pada = b.tarikh || new Date();
      try {
        hantarResit_(rekod, noResit);
        sheet.getRange(baris1, k.resit + 1).setValue('dihantar ' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm'));
      } catch (err) {
        sheet.getRange(baris1, k.resit + 1).setValue('gagal: ' + String(err).slice(0, 120));
      }
      break;
    }
  });
  return { ok: true, baru: baru, dikenali: dikenali };
}

/* ---------- tertunggak: kod bil "menunggu" 3 hari terakhir (untuk Cron) ---------- */
function tertunggak_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = tabSumbangan_(ss).getDataRange().getValues();
  var k = indeks_(data[0]), had = Date.now() - 3 * 864e5, kod = [];
  for (var i = 1; i < data.length; i++) {
    var t = data[i][k.dicipta];
    if (data[i][k.status] === 'menunggu' && data[i][k.billcode] && t instanceof Date && t.getTime() > had) kod.push(String(data[i][k.billcode]));
  }
  return { ok: true, billcode: kod };
}

/* ---------- taja: borang hasrat penajaan ---------- */
function taja_(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_PENAJAAN) || buatTab_(ss, TAB_PENAJAAN, LAJUR_PENAJAAN, []);
  sheet.appendRow([new Date(), selamat_(d.syarikat), selamat_(d.pegawai), selamat_(d.jawatan), selamat_(d.emel),
    selamat_(d.telefon), selamat_(d.minat), selamat_(d.mesej), 'baru']);
  var admin = tetapan_(ss, 'Tetapan_Dalaman').emel_admin;
  if (admin) {
    try {
      MailApp.sendEmail({
        to: admin, replyTo: d.emel, name: 'Laman ARISMA Foundation',
        subject: 'Hasrat penajaan baharu: ' + d.syarikat,
        body: 'Syarikat: ' + d.syarikat + '\nPegawai: ' + d.pegawai + ' (' + d.jawatan + ')\nE-mel: ' + d.emel +
          '\nTelefon: ' + d.telefon + '\nMinat: ' + (d.minat || '-') + '\n\n' + (d.mesej || '') +
          '\n\nRekod penuh dalam tab Penajaan.'
      });
    } catch (err) {}
  }
  return { ok: true };
}

/* ================= Resit ================= */
function hantarResit_(r, noResit) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tet = tetapan_(ss, 'Tetapan'), dal = tetapan_(ss, 'Tetapan_Dalaman');
  var en = r.bahasa === 'en';
  var namaProjek = r.projek;
  bacaBaris_(ss, 'Projek').forEach(function (p) { if (p.id === r.projek) namaProjek = en && p.nama_en ? p.nama_en : p.nama; });

  // Resit 44(6) hanya jika penderma minta DAN beri no. pengenalan & alamat
  var s44 = ya_(r.mahu_resit) && String(r.no_id || '').trim() && String(r.alamat || '').trim() && tet.s44_rujukan;
  var jumlah = Number(r.jumlah_dibayar || r.jumlah) || 0;
  var tarikh = r.dibayar_pada instanceof Date ? r.dibayar_pada : new Date();
  var tarikhTeks = Utilities.formatDate(tarikh, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy');

  var html = '<html><head><style>' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#15221C;font-size:11pt;margin:36px}' +
    'h1{font-size:15pt;margin:0}h2{font-size:13pt;margin:26px 0 14px;letter-spacing:1px}' +
    '.kecil{font-size:9pt;color:#51615A}table{width:100%;border-collapse:collapse}' +
    'td{padding:7px 0;vertical-align:top;border-bottom:1px solid #D8E0D6}td.l{width:36%;color:#51615A}' +
    '.jumlah{font-size:14pt;font-weight:bold}.kotak{border:1px solid #D8B363;padding:10px 12px;margin-top:18px;font-size:10pt}' +
    '</style></head><body>' +
    '<h1>' + e_(dal.nama_resit || 'THE TRUSTEES OF ARISMA FOUNDATION REGISTERED') + '</h1>' +
    '<div class="kecil">No. Pendaftaran PPAB-29/2014 (Akta Pemegang Amanah (Pemerbadanan) 1952)<br>' + e_(dal.alamat_resit || tet.alamat || '') + '</div>' +
    '<h2>RESIT RASMI / OFFICIAL RECEIPT</h2>' +
    '<table>' +
    '<tr><td class="l">No. resit / Receipt no.</td><td><b>' + e_(noResit) + '</b></td></tr>' +
    '<tr><td class="l">Tarikh / Date</td><td>' + e_(tarikhTeks) + '</td></tr>' +
    '<tr><td class="l">Diterima daripada / Received from</td><td>' + e_(r.nama) + '</td></tr>' +
    (r.no_id ? '<tr><td class="l">' + (r.jenis === 'syarikat' ? 'No. pendaftaran syarikat / Company reg. no.' : 'No. K/P / MyKad no.') + '</td><td>' + e_(r.no_id) + '</td></tr>' : '') +
    (r.alamat ? '<tr><td class="l">Alamat / Address</td><td>' + e_(r.alamat) + '</td></tr>' : '') +
    '<tr><td class="l">Jumlah / Amount</td><td><span class="jumlah">RM ' + wang_(jumlah) + '</span><br>' + e_(kataRM_(jumlah)) + '</td></tr>' +
    '<tr><td class="l">Bagi / Being</td><td>Sumbangan kepada ' + e_(namaProjek) + '</td></tr>' +
    '<tr><td class="l">Kaedah / Method</td><td>toyyibPay (FPX / kad)' + (r.rujukan_bayaran ? ', rujukan ' + e_(r.rujukan_bayaran) : '') + '</td></tr>' +
    '<tr><td class="l">Rujukan dalaman</td><td>' + e_(r.rujukan) + '</td></tr>' +
    '</table>' +
    (s44 ? '<div class="kotak">Sumbangan ini layak mendapat potongan di bawah subseksyen 44(6) Akta Cukai Pendapatan 1967. ' +
      'No. rujukan kelulusan LHDN: <b>' + e_(tet.s44_rujukan) + '</b>' + (tet.s44_tempoh ? ' (' + e_(tet.s44_tempoh) + ')' : '') + '.<br>' +
      '<span class="kecil">This donation is deductible under subsection 44(6) of the Income Tax Act 1967.</span></div>' : '') +
    '<p style="margin-top:34px">' + (dal.penandatangan ? e_(dal.penandatangan) + '<br>' : '') + (dal.jawatan_penandatangan ? '<span class="kecil">' + e_(dal.jawatan_penandatangan) + '</span><br>' : '') +
    '<span class="kecil">Resit ini dijana oleh komputer dan tidak memerlukan tandatangan. / This is a computer-generated receipt.</span></p>' +
    '</body></html>';

  var pdf = Utilities.newBlob(html, 'text/html', 'resit.html').getAs('application/pdf')
    .setName('Resit-' + String(noResit).replace(/[^A-Za-z0-9-]/g, '-') + '.pdf');

  // Simpan salinan dalam Drive untuk rekod audit
  if (r.rujukan !== 'UJI') {
    try { folderResit_(ss).createFile(pdf.copyBlob()); } catch (err) {}
  }

  var subjek = en ? 'Your ARISMA Foundation donation receipt ' + noResit : 'Resit sumbangan ARISMA Foundation ' + noResit;
  var badan = en
    ? '<p>Assalamualaikum ' + e_(r.nama) + ',</p><p>Thank you for your donation of <b>RM ' + wang_(jumlah) + '</b> to ' + e_(namaProjek) + '. Your official receipt is attached.</p><p>May it be a continuing charity for you.</p><p>ARISMA Foundation</p>'
    : '<p>Assalamualaikum ' + e_(r.nama) + ',</p><p>Terima kasih atas sumbangan <b>RM ' + wang_(jumlah) + '</b> kepada ' + e_(namaProjek) + '. Resit rasmi anda dilampirkan.</p><p>Semoga menjadi amal jariah yang berterusan.</p><p>ARISMA Foundation</p>';

  var opsyen = { to: r.emel, subject: subjek, htmlBody: badan, name: 'ARISMA Foundation', attachments: [pdf] };
  if (dal.emel_admin) { opsyen.bcc = dal.emel_admin; opsyen.replyTo = dal.emel_admin; }
  MailApp.sendEmail(opsyen);
}

/** Hantar semula resit bagi rekod "dibayar" yang resitnya belum dihantar atau gagal. Jalankan manual. */
function hantarSemulaResitTertunggak() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = tabSumbangan_(ss), data = sheet.getDataRange().getValues(), k = indeks_(data[0]), n = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][k.status] !== 'dibayar' || /^dihantar/.test(String(data[i][k.resit]))) continue;
    var r = objek_(data[0], data[i]);
    var no = r.no_resit || noResitSeterusnya_(ss);
    sheet.getRange(i + 1, k.no_resit + 1).setValue(no);
    try { hantarResit_(r, no); sheet.getRange(i + 1, k.resit + 1).setValue('dihantar ' + new Date().toISOString().slice(0, 16)); n++; }
    catch (err) { sheet.getRange(i + 1, k.resit + 1).setValue('gagal: ' + String(err).slice(0, 120)); }
  }
  Logger.log(n + ' resit dihantar semula.');
}

function noResitSeterusnya_(ss) {
  var props = PropertiesService.getScriptProperties();
  var tahun = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy');
  var kunci = 'NO_RESIT_' + tahun;
  var n = (parseInt(props.getProperty(kunci), 10) || 0) + 1;
  props.setProperty(kunci, String(n));
  var awalan = tetapan_(ss, 'Tetapan_Dalaman').awalan_resit || 'AF';
  return awalan + '/' + tahun + '/' + ('00000' + n).slice(-5);
}

function folderResit_(ss) {
  var sheet = ss.getSheetByName('Tetapan_Dalaman');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'folder_resit') {
      if (data[i][1]) { try { return DriveApp.getFolderById(String(data[i][1])); } catch (e) {} }
      var f = DriveApp.createFolder('Resit ARISMA Foundation');
      sheet.getRange(i + 1, 2).setValue(f.getId());
      return f;
    }
  }
  return DriveApp.getRootFolder();
}

/* Amaun dalam perkataan (Bahasa Melayu) */
function kataRM_(n) {
  var ringgit = Math.floor(n + 1e-9), sen = Math.round((n - ringgit) * 100);
  var s = sebut_(ringgit) + ' ringgit' + (sen ? ' dan ' + sebut_(sen) + ' sen' : '') + ' sahaja';
  return 'Ringgit Malaysia: ' + s.charAt(0).toUpperCase() + s.slice(1);
}
function sebut_(n) {
  var a = ['kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan'];
  if (n < 10) return a[n];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return a[n - 10] + ' belas';
  if (n < 100) return a[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + a[n % 10] : '');
  if (n < 1000) return (Math.floor(n / 100) === 1 ? 'seratus' : a[Math.floor(n / 100)] + ' ratus') + (n % 100 ? ' ' + sebut_(n % 100) : '');
  if (n < 1e6) return (Math.floor(n / 1000) === 1 ? 'seribu' : sebut_(Math.floor(n / 1000)) + ' ribu') + (n % 1000 ? ' ' + sebut_(n % 1000) : '');
  return sebut_(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + sebut_(n % 1e6) : '');
}

/* ================= Bantuan ================= */
function buatTab_(ss, nama, lajur, baris) {
  var sheet = ss.getSheetByName(nama);
  if (sheet && sheet.getLastRow() > 0) return sheet; // jangan timpa data sedia ada
  if (!sheet) sheet = ss.insertSheet(nama);
  sheet.appendRow(lajur);
  sheet.setFrozenRows(1);
  baris.forEach(function (b) { sheet.appendRow(b); });
  return sheet;
}

function tabSumbangan_(ss) {
  return ss.getSheetByName(TAB_SUMBANGAN) || buatTab_(ss, TAB_SUMBANGAN, LAJUR_SUMBANGAN, []);
}

function kemaskini_(rujukan, nilai) {
  var sheet = tabSumbangan_(SpreadsheetApp.getActiveSpreadsheet());
  var data = sheet.getDataRange().getValues(), k = indeks_(data[0]);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][k.rujukan]) === String(rujukan)) {
      for (var kol in nilai) if (k[kol] != null) sheet.getRange(i + 1, k[kol] + 1).setValue(selamat_(nilai[kol]));
      return { ok: true };
    }
  }
  return { ok: false, sebab: 'rujukan tidak dijumpai' };
}

function tetapan_(ss, tab) {
  var o = {};
  bacaBaris_(ss, tab).forEach(function (r) { if (r.kunci) o[r.kunci] = r.nilai; });
  return o;
}

function bacaBaris_(ss, nama) {
  var sheet = ss.getSheetByName(nama);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var v = sheet.getDataRange().getDisplayValues();
  var kepala = v[0].map(function (h) { return String(h).trim().toLowerCase().replace(/\s+/g, '_'); });
  var hasil = [];
  for (var i = 1; i < v.length; i++) {
    var o = {}, kosong = true;
    for (var j = 0; j < kepala.length; j++) {
      if (!kepala[j]) continue;
      var n = String(v[i][j]).trim();
      o[kepala[j]] = n;
      if (n) kosong = false;
    }
    if (!kosong) hasil.push(o);
  }
  return hasil;
}

function indeks_(kepala) {
  var k = {};
  kepala.forEach(function (h, i) { k[String(h).trim().toLowerCase()] = i; });
  return k;
}

function objek_(kepala, baris) {
  var o = {};
  kepala.forEach(function (h, i) { o[String(h).trim().toLowerCase()] = baris[i]; });
  return o;
}

function ya_(v) { return /^(ya|yes|y|true|1)$/i.test(String(v == null ? '' : v).trim()); }
function nombor_(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; }
function wang_(n) { return (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function e_(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function selamat_(v) {
  var t = String(v == null ? '' : v);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
