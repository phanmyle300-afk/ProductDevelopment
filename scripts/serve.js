/**
 * TalentScout ATS Studio - Local Development Server
 * Zero-dependency lightweight HTTP server for instant visual interface preview.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.resolve(ROOT_DIR, 'apps', 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath;

  if (urlPath === '/' || urlPath === '/index.html') {
    filePath = path.join(WEB_DIR, 'index.html');
  } else if (urlPath === '/candidate' || urlPath === '/candidate_detail' || urlPath === '/candidate_detail.html') {
    filePath = path.join(WEB_DIR, 'candidate_detail.html');
  } else if (urlPath.startsWith('/apps/web/')) {
    filePath = path.join(WEB_DIR, urlPath.replace('/apps/web/', ''));
  } else {
    // Try in apps/web first, then root
    const webCandidate = path.join(WEB_DIR, urlPath);
    if (fs.existsSync(webCandidate) && !fs.statSync(webCandidate).isDirectory()) {
      filePath = webCandidate;
    } else {
      filePath = path.join(ROOT_DIR, urlPath);
    }
  }

  // Safety check: ensure file path doesn't escape ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for clean URLs or 404
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found - TalentScout ATS</title></head>
        <body style="background:#070B14;color:#F8FAFC;font-family:sans-serif;padding:2rem;text-align:center;">
          <h2>404 - Không tìm thấy trang</h2>
          <p><a href="/" style="color:#6366F1;">Quay lại Trang Chủ ATS Studio</a></p>
          <p><a href="/candidate_detail.html" style="color:#6366F1;">Mở Trang Chi Tiết Ứng Viên & XAI</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n=============================================================');
  console.log('  🎯 TalentScout AI ATS Studio - Trực Quan Hóa Tuyển Dụng');
  console.log('=============================================================');
  console.log(`  🌐 Dashboard Tổng Quan:   http://127.0.0.1:${PORT}`);
  console.log(`  📊 Chi Tiết Ứng Viên XAI: http://127.0.0.1:${PORT}/candidate_detail.html`);
  console.log('-------------------------------------------------------------');
  console.log('  Bấm Ctrl+C để dừng server.\n');
});
