# 🎓 MagangHub Kemnaker Dashboard — Geofisika & Teknik Geofisika (Batch 3)

Dashboard pemantau lowongan magang resmi **Magang Nasional Batch 3 (2026 Aktif)** dari portal [Kemnaker MagangHub](https://maganghub.kemnaker.go.id/magang-nasional/lowongan) khusus program studi **Geofisika & Teknik Geofisika**.

Dashboard ini dilengkapi dengan **Auto-Update Bot (GitHub Actions)** yang otomatis memperbarui jumlah pelamar, kuota, dan lowongan baru tanpa memerlukan server backend atau database eksternal!

---

## ⚡ Fitur Utama
- **100% Data MagangHub Batch 3 (Aktif Sekarang)**.
- **Auto-Update Berkala**: GitHub Actions otomatis mengikis (*scrape*) data pelamar & lowongan baru setiap 3 jam sekali.
- **Serverless & Zero Database**: Berjalan di GitHub Pages / Vercel secara gratis selamanya.
- **Direct Apply**: Tombol kartu langsung menuju halaman pendaftaran resmi di portal Kemnaker.
- **Filter Cepat**: Multi-select filter rumpun kebumian dan pencarian kata kunci instan.

---

## 🚀 Panduan Deploy (Paling Mudah ke GitHub Pages)

### Langkah 1: Buat Repository di GitHub
1. Buka [GitHub.com/new](https://github.com/new).
2. Beri nama repository, misalnya: `maganghub-geofisika`.
3. Pilih **Public**, lalu klik **Create repository**.

### Langkah 2: Push Project ini ke GitHub
Buka terminal / PowerShell di folder project ini:
```bash
git init
git add .
git commit -m "feat: initial commit maganghub batch 3 dashboard"
git branch -M main
git remote add origin https://github.com/<USERNAME-ANDA>/maganghub-geofisika.git
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages (1 Klik Saja)
1. Buka halaman repository Anda di GitHub.
2. Masuk ke menu **Settings** > **Pages** (di sidebar kiri).
3. Pada bagian **Build and deployment**:
   - Source: pilih **Deploy from a branch**.
   - Branch: pilih **main**, folder **/ (root)**.
4. Klik **Save**.
5. Tunggu sekitar 1-2 menit, website Anda sudah aktif di:
   `https://<USERNAME-ANDA>.github.io/maganghub-geofisika/`

---

## 🔄 Bagaimana Cara Kerjanya Mengupdate Otomatis?
- Di dalam folder `.github/workflows/update-maganghub.yml` sudah terpasang robot GitHub Actions.
- Robot ini akan bangun otomatis setiap **3 jam sekali**, menjalankan scraper resmi ke MagangHub Kemnaker, dan memperbarui angka pelamar di `vacancies.json`.
- **Update Manual**: Anda juga bisa memicu update kapan saja lewat tab **Actions** di GitHub > pilih workflow **Auto Update MagangHub Data** > klik **Run workflow**.

---

## 💻 Menjalankan di Komputer Lokal
Jika ingin menjalankan dashboard di laptop/komputer Anda:
```bash
node server.js
```
Lalu buka browser di `http://localhost:3030`.

Untuk menjalankan scraper secara manual:
```bash
node scrape_geofisika_only.js
```
