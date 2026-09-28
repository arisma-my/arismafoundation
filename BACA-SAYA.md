# ARISMA Foundation — laman web (arismafoundation.org.my)

## Isi folder
```
index.html               halaman utama Yayasan
degup2027/index.html     halaman Kembara DEGUP ARISMA 2027 (arismafoundation.org.my/degup2027)
terima-kasih/index.html  halaman selepas bayaran toyyibPay
assets/gaya.css          gaya bersama
assets/laman.js          bahasa BM/EN, kandungan Sheet, borang sumbang & penajaan
img/logo-emas.png        logo emas (dipotong daripada video)
video/intro.mp4          video logo (tanda air dibuang, dimampatkan ke 1.2 MB)
video/poster.jpg         bingkai akhir video (dipapar sebelum video main / jika tidak boleh main)
api/kandungan.js         bawa kandungan awam dari Sheet (cache 2 minit)
api/sumbang.js           rekod sumbangan + cipta bil toyyibPay
api/toyyibpay.js         sahkan bayaran terus dengan toyyibPay, kemudian Sheet hantar resit
api/taja.js              borang hasrat penajaan
api/_skrip.js            bantuan dikongsi (bukan laluan)
apps-script/Code.gs      "otak" Google Sheet — ditampal dalam Sheet, BUKAN di-upload ke Vercel
vercel.json, package.json
```

## Konsep
Google Sheet ialah tempat kandungan diubah. Guna Sheet BARU untuk Yayasan, berasingan daripada Sheet akademi.

| Tab               | Mengawal                                                                 | Awam? |
|-------------------|--------------------------------------------------------------------------|-------|
| Tetapan           | suis sumbangan, no. kelulusan 44(6), alamat, e-mel, DuitNow QR, PDF cadangan | ya |
| Projek            | senarai projek, teks BM/EN, sasaran, kutipan luar, buka/tutup            | ya    |
| PemegangAmanah    | nama dan jawatan; hanya `papar = ya` keluar                              | ya    |
| Tetapan_Dalaman   | e-mel admin, kepala resit, penandatangan, awalan no. resit               | TIDAK |
| Sumbangan         | setiap sumbangan (termasuk no. K/P dan alamat). Diisi automatik          | TIDAK |
| Penajaan          | borang hasrat penajaan. Diisi automatik                                  | TIDAK |

Peraturan penting:
- Tab Sumbangan mengandungi no. K/P penderma. Hadkan akses EDIT dan VIEW kepada orang yang perlu sahaja (PDPA).
- Jangan letak nombor K/P pemegang amanah di mana-mana tab awam. Jangan muat naik sijil pemerbadanan
  tanpa menghitamkan nombor K/P dahulu.
- Projek baharu: tambah satu baris dalam tab Projek (id huruf kecil, cth. `rumah-transit`). Ia terus muncul
  di halaman utama dan dalam pilihan borang sumbang.
- Kutipan tunai / pindahan bank: tambah pada lajur `kutipan_luar` projek tersebut. Bar kutipan = toyyibPay + kutipan luar.
- Jika Sheet tidak dapat dibaca, laman guna kandungan asal dalam HTML. Laman tidak akan rosak.

## Cara aliran sumbangan berfungsi
1. Penderma isi borang (projek, amaun, nama, no. K/P / SSM, alamat, e-mel, telefon).
2. `/api/sumbang` rekod baris "menunggu" dalam Sheet, cipta bil toyyibPay khusus untuk penderma itu, dan hantar penderma ke toyyibPay.
3. Selepas bayar, toyyibPay panggil `/api/toyyibpay` dan hantar penderma ke `/terima-kasih/`.
4. `/api/toyyibpay` TIDAK percaya notis itu. Ia tanya toyyibPay sendiri sama ada bil sudah dibayar.
   Sheet hanya terima kod bil yang ia sendiri cipta.
5. Sheet tanda "dibayar", beri no. resit berturutan (AF/2026/00001), jana PDF, e-mel kepada penderma
   (salinan BCC ke e-mel admin) dan simpan salinan dalam folder Drive "Resit ARISMA Foundation".
6. Vercel Cron semak semula bil "menunggu" setiap hari (jika notis toyyibPay terlepas).

Resit 44(6) hanya dikeluarkan jika penderma tanda kotak resit DAN memberi no. pengenalan dan alamat,
DAN `s44_rujukan` diisi dalam tab Tetapan. Jika tidak, penderma masih terima resit biasa tanpa pernyataan 44(6).

## Sambung Sheet (sekali sahaja)
1. Google Drive > New > Google Sheets. Namakan "ARISMA Foundation Laman". Guna akaun Google Yayasan.
2. Extensions > Apps Script. Padam kod asal, tampal seluruh `apps-script/Code.gs`, Save.
3. Pilih fungsi `sediakanSheet` > Run. Beri kebenaran (jika ada amaran "belum disahkan":
   Advanced > Go to project). Tab-tab akan tercipta.
4. Pilih fungsi `tetapkanKunci` > Run. Buka Execution log, salin nilai `KUNCI_SKRIP = ...`.
5. Isi tab Tetapan (`s44_rujukan`, `s44_tempoh`, `alamat`, `emel`) dan Tetapan_Dalaman (`emel_admin`, `alamat_resit`, `penandatangan`).
6. Pilih fungsi `ujiResitKeEmelSaya` > Run. Semak resit PDF contoh dalam e-mel anda.
   Minta ejen cukai / akauntan Yayasan sahkan format resit sebelum dibuka kepada awam.
7. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy. Salin URL (berakhir /exec).
   Jika ubah Code.gs kemudian: Deploy > Manage deployments > edit > Version: New version.

## Pasang di Vercel
1. Muat naik folder ini ke repo GitHub baharu. Folder apps-script boleh ikut sekali; Vercel tidak menggunakannya.
2. Vercel > Add New Project > pilih repo. Framework: Other. Deploy.
3. Settings > Environment Variables:
   ```
   APPS_SCRIPT_URL      URL langkah 7 di atas
   KUNCI_SKRIP          kunci langkah 4
   LAMAN_URL            https://arismafoundation.org.my
   CRON_SECRET          rentetan rawak panjang (untuk semakan harian)
   ```
   Kemudian Redeploy.
4. Domain: Settings > Domains > tambah `arismafoundation.org.my` dan `www.arismafoundation.org.my`.
   Masukkan rekod DNS yang Vercel beri di pendaftar domain / Cloudflare (Proxy status "DNS only").

## Buka kutipan dalam talian (toyyibPay)
1. Akaun toyyibPay atas nama Yayasan (bukan WIBARISMA), disahkan.
2. Cipta Category untuk sumbangan. Salin `categoryCode`. Salin `userSecretKey` dari profil akaun.
3. Uji dahulu di sandbox: daftar di dev.toyyibpay.com, kemudian dalam Vercel:
   ```
   TOYYIBPAY_BASE       https://dev.toyyibpay.com
   TOYYIBPAY_SECRET     userSecretKey sandbox
   TOYYIBPAY_CATEGORY   categoryCode sandbox
   ```
   Tukar `buka_sumbangan` kepada `ya` dalam tab Tetapan. Buat satu sumbangan ujian hingga resit sampai.
4. Bila berjaya: padam `TOYYIBPAY_BASE`, tukar SECRET dan CATEGORY kepada akaun sebenar, Redeploy.
5. Pilihan: `TOYYIBPAY_CHANNEL` ("0" FPX sahaja, "1" kad sahaja, "2" kedua-dua), `TOYYIBPAY_CAJ` (siapa tanggung caj;
   kosong = Yayasan), `MAKS_SUMBANGAN` (asal RM30,000).

## Had yang perlu tahu
- E-mel resit dihantar melalui Gmail akaun yang memiliki Sheet. Akaun Gmail biasa ada had harian
  (kira-kira 100 e-mel sehari); Google Workspace lebih tinggi. Jika dijangka banyak penderma sehari
  (cth. malam tayangan DEGUP), guna akaun Workspace.
- Resit gagal dihantar? Lajur `resit` tunjuk "gagal: ...". Jalankan fungsi `hantarSemulaResitTertunggak`.
- DuitNow QR statik tidak boleh dijejak secara automatik. Penderma QR perlu WhatsApp bukti bayaran;
  masukkan jumlahnya dalam `kutipan_luar` dan keluarkan resit secara manual.

## Kemas kini video logo
Ganti `video/intro.mp4` dan `video/poster.jpg` (bingkai terakhir). Kekalkan nisbah 16:9 dan latar hitam,
supaya tepi video bercantum dengan latar halaman. Jika ada versi resolusi lebih tinggi (1920×1080), guna itu.

## Sebelum siar
- No. rujukan dan tempoh kelulusan 44(6) dalam tab Tetapan
- Alamat berdaftar dan e-mel rasmi Yayasan
- Sahkan senarai pemegang amanah semasa (tab PemegangAmanah)
- Sahkan sasaran: Desa ARISMA RM2,000,000 dan DEGUP RM330,000 (tab Projek)
- Kertas cadangan penajaan (PDF) dan gambar DuitNow QR, jika ada
- Semak format resit dengan ejen cukai / akauntan
