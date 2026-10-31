const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3030;
const DATA_FILE = path.join(__dirname, 'vacancies.json');
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Vacancies & Static vacancies.json
  if (pathname === '/api/vacancies' || pathname === '/vacancies.json') {
    if (!fs.existsSync(DATA_FILE)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Data not found' }));
      return;
    }

    try {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      let items = Array.isArray(raw) ? raw : (raw.items || []);
      const totalAll = Array.isArray(raw) ? raw.length : (raw.total || items.length);

      // Extract unique jurusan list
      const jurusanSet = new Set();
      items.forEach(it => {
        (it.jurusan || []).forEach(j => {
          if (j && typeof j === 'string') jurusanSet.add(j.trim());
        });
      });
      const jurusanList = Array.isArray(raw) ? Array.from(jurusanSet).sort() : (raw.jurusanList || Array.from(jurusanSet).sort());

      // Filter by jurusan
      const reqJurusan = parsed.query.jurusan;
      if (reqJurusan) {
        const jList = (Array.isArray(reqJurusan) ? reqJurusan : reqJurusan.split(','))
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);

        if (jList.length > 0) {
          items = items.filter(it => {
            const itJurusan = (it.jurusan || []).map(j => j.toLowerCase());
            return jList.some(qj => itJurusan.some(ij => ij.includes(qj)));
          });
        }
      }

      // Filter by keyword
      const keyword = (parsed.query.keyword || '').trim().toLowerCase();
      if (keyword) {
        items = items.filter(it => {
          const text = [
            it.title, it.company, it.location, it.description,
            (it.jurusan || []).join(' ')
          ].join(' ').toLowerCase();
          return text.includes(keyword);
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        source: raw.source || 'MagangHub Kemnaker Official (Batch 3 2026)',
        scrapedAt: raw.scrapedAt || new Date().toISOString(),
        total: items.length,
        totalDataset: totalAll,
        jurusanList: jurusanList,
        items
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 2. Frontend
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(HTML_FILE).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`MagangHub Kemnaker Dashboard running on http://localhost:${PORT}`);
});
