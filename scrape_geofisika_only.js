const fs = require('fs');
const path = require('path');

const ACTION_ID = '4042e54ac927b18cee0deb2e4ec2ecee4980c12ec1';
const URL = 'https://maganghub.kemnaker.go.id/magang-nasional/lowongan';

async function fetchPage(params, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: {
          'Next-Action': ACTION_ID,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/x-component'
        },
        body: JSON.stringify([params]),
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.includes('"data":') && line.includes('"meta":')) {
          const colonIdx = line.indexOf(':');
          const jsonStr = line.slice(colonIdx + 1);
          return JSON.parse(jsonStr);
        }
      }
    } catch (e) {
      console.warn(`  [Coba ${attempt}/${retries}] Gagal: ${e.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
  }
  return null;
}

function normalizeItem(raw) {
  const prodis = (raw.studyPrograms || []).map(p => p.name || p.label || p).filter(Boolean);
  return {
    id: raw.id,
    title: raw.positionName || raw.title || 'Lowongan Magang',
    company: raw.organizer?.name || 'Instansi / Perusahaan',
    companyLogo: raw.organizer?.logoUrl && raw.organizer.logoUrl !== 'null' ? raw.organizer.logoUrl : null,
    location: raw.city?.name || raw.organizer?.city?.name || 'Indonesia',
    quota: raw.approvedQuantity || raw.quantityNeeded || 1,
    applicants: raw.totalApplications || 0,
    jurusan: prodis.length > 0 ? prodis : ['Geofisika'],
    applyUrl: `https://maganghub.kemnaker.go.id/magang-nasional/lowongan/${raw.id}`,
    description: raw.taskDescription || '',
    workingDays: raw.workingDaysPerWeek ? `${raw.workingDaysPerWeek} hari/minggu` : 'Sesuai Kebijakan',
    batch: 'Batch 3 (Aktif Sekarang)',
    source: 'MagangHub Kemnaker Official',
    publishedAt: raw.publishedAt || raw.createdAt || new Date().toISOString()
  };
}

async function main() {
  console.log('🚀 Memulai scrape data khusus GEOFISIKA & TEKNIK GEOFISIKA MagangHub...');
  const map = new Map();

  // 1. Geofisika
  console.log('\n Mengambil data program studi Geofisika...');
  for (let p = 1; p <= 2; p++) {
    console.log(`  -> Geofisika Halaman ${p}...`);
    const resp = await fetchPage({
      page: p,
      study_program: [{ id: '49e68c6e-d17f-416b-9d55-5948a94d808a', label: 'Geofisika' }]
    });
    if (resp && resp.data) {
      console.log(`     Berhasil dapat ${resp.data.length} lowongan`);
      resp.data.forEach(item => map.set(item.id, normalizeItem(item)));
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // 2. Teknik Geofisika
  console.log('\n Mengambil data program studi Teknik Geofisika...');
  for (let p = 1; p <= 2; p++) {
    console.log(`  -> Teknik Geofisika Halaman ${p}...`);
    const resp = await fetchPage({
      page: p,
      study_program: [{ id: '77b19f0b-9d0e-45fb-9f22-3976b782d13c', label: 'Teknik Geofisika' }]
    });
    if (resp && resp.data) {
      console.log(`     Berhasil dapat ${resp.data.length} lowongan`);
      resp.data.forEach(item => map.set(item.id, normalizeItem(item)));
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // 3. Keyword geofisika
  console.log('\n Mengambil data dengan keyword "geofisika"...');
  const kw = await fetchPage({ keyword: 'geofisika', page: 1 });
  if (kw && kw.data) {
    console.log(`  -> Berhasil dapat ${kw.data.length} lowongan`);
    kw.data.forEach(item => map.set(item.id, normalizeItem(item)));
  }

  const items = Array.from(map.values());
  const jurusanSet = new Set();
  items.forEach(it => it.jurusan.forEach(j => jurusanSet.add(j)));

  const payload = {
    source: 'MagangHub Kemnaker Official Portal (Batch 3 2026)',
    portalUrl: 'https://maganghub.kemnaker.go.id/magang-nasional/lowongan',
    scrapedAt: new Date().toISOString(),
    total: items.length,
    totalGeofisika: items.length,
    jurusanList: Array.from(jurusanSet).sort(),
    items: items
  };

  const outPath = path.join(__dirname, 'vacancies.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  // Sinkronkan juga instant-data ke index.html agar load 0 ms
  const htmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const tag = `<script id="initial-data">window.__INITIAL_DATA__ = ${JSON.stringify(payload)};</script>`;
    if (htmlContent.includes('id="initial-data"')) {
      htmlContent = htmlContent.replace(/<script id="initial-data">[\s\S]*?<\/script>/, tag);
    } else {
      htmlContent = htmlContent.replace('</head>', `  ${tag}\n</head>`);
    }
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('✅ Instant data berhasil disinkronkan ke index.html');
  }

  console.log('\n===========================================');
  console.log(`✅ SCRAPING GEOFISIKA SELESAI!`);
  console.log(`TOTAL LOWONGAN GEOFISIKA & TEKNIK GEOFISIKA: ${items.length}`);
  console.log(`FILE TERSIMPAN: ${outPath}`);
  console.log('===========================================');

  items.forEach((it, idx) => {
    console.log(`${idx + 1}. [${it.company}] ${it.title} (${it.location})`);
    console.log(`   Jurusan: ${it.jurusan.join(', ')}`);
    console.log(`   Link   : ${it.applyUrl}`);
  });
}

main().catch(console.error);
