const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'password';
const VERSION = require('./package.json').version;
const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });
const DB = path.join(DATA, 'pieces.json');
let pieces = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : [];
const save = () => fs.writeFileSync(DB, JSON.stringify(pieces, null, 1));
// Instance-wide settings live next to the pieces in the data volume, so they survive restarts and updates.
const SET = path.join(DATA, 'settings.json'), LANGS = ['en', 'fr'];
const settings = { lang: 'en' };
try { const j = JSON.parse(fs.readFileSync(SET, 'utf8')); if (LANGS.includes(j.lang)) settings.lang = j.lang; } catch (e) { }
const saveSettings = () => { fs.writeFileSync(SET + '.tmp', JSON.stringify(settings, null, 1)); fs.renameSync(SET + '.tmp', SET); };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const readBody = (req, max = 8e6) => new Promise((ok, ko) => {
  const b = []; let n = 0;
  req.on('data', d => { n += d.length; if (n > max) { ko(new Error('too large')); req.destroy(); } else b.push(d); });
  req.on('end', () => ok(Buffer.concat(b)));
});
const isAdmin = req => {
  const a = Buffer.from(String(req.headers['x-admin'] || '')), b = Buffer.from(PASS);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const INST = ['sine', 'piano', 'organ', 'choir', 'strings', 'flute'];
const meta = j => ({ composer: String(j.composer || '').slice(0, 120), date: String(j.date || '').slice(0, 60), info: String(j.info || '').slice(0, 1000) });
const cleanTracks = t => {
  if (!Array.isArray(t) || t.length > 64) throw new Error('bad tracks');
  return t.map(x => ({ key: String(x.key).slice(0, 16), label: String(x.label).slice(0, 80), hidden: !!x.hidden, instrument: INST.includes(x.instrument) ? x.instrument : 'piano' }));
};

http.createServer(async (req, res) => {
  try {
    // Behind Cloudflare / a reverse proxy: send plain-http visitors to https (the mic needs a secure origin).
    const visitor = String(req.headers['cf-visitor'] || ''), proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const isHttps = /"scheme"\s*:\s*"https"/.test(visitor) || proto === 'https';
    if ((visitor || proto) && !isHttps) { res.writeHead(301, { Location: 'https://' + req.headers.host + req.url }); return res.end(); }
    if (isHttps) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8')
        .replace('__APP_VERSION__', VERSION).replace('__APP_LANG__', settings.lang).replace('<html lang="en">', '<html lang="' + settings.lang + '">'));
    }
    if (!p.startsWith('/api/')) return send(res, 404, { error: 'not found' });
    if (p === '/api/settings') {
      if (req.method === 'GET') return send(res, 200, { lang: settings.lang });
      if (req.method === 'PUT') {
        if (!isAdmin(req)) return send(res, 401, { error: 'admin only' });
        const j = JSON.parse((await readBody(req)).toString());
        if (!LANGS.includes(j.lang)) return send(res, 400, { error: 'unsupported language' });
        settings.lang = j.lang; saveSettings();
        return send(res, 200, { lang: settings.lang });
      }
    }
    const m = p.match(/^\/api\/pieces(?:\/([a-f0-9]+))?(\/midi)?$/);
    if (p === '/api/auth') return isAdmin(req) ? send(res, 200, { ok: true }) : send(res, 401, { error: 'bad password' });
    if (!m) return send(res, 404, { error: 'not found' });
    const id = m[1], piece = id && pieces.find(x => x.id === id);

    if (req.method === 'GET' && !id) return send(res, 200, pieces);
    if (req.method === 'GET' && piece && m[2]) {
      res.writeHead(200, { 'Content-Type': 'audio/midi' });
      return res.end(fs.readFileSync(path.join(DATA, piece.id + '.mid')));
    }
    if (!isAdmin(req)) return send(res, 401, { error: 'admin only' });

    if (req.method === 'POST' && !id) {
      const j = JSON.parse((await readBody(req)).toString());
      const buf = Buffer.from(j.midi, 'base64');
      if (buf.slice(0, 4).toString() !== 'MThd') return send(res, 400, { error: 'not a MIDI file' });
      const np = { id: crypto.randomBytes(6).toString('hex'), title: String(j.title).slice(0, 120), ...meta(j), tracks: cleanTracks(j.tracks) };
      fs.writeFileSync(path.join(DATA, np.id + '.mid'), buf);
      pieces.push(np); save();
      return send(res, 200, np);
    }
    if (req.method === 'PUT' && piece) {
      const j = JSON.parse((await readBody(req)).toString());
      piece.title = String(j.title).slice(0, 120); Object.assign(piece, meta(j)); piece.tracks = cleanTracks(j.tracks); save();
      return send(res, 200, piece);
    }
    if (req.method === 'DELETE' && piece) {
      pieces = pieces.filter(x => x !== piece); save();
      fs.rmSync(path.join(DATA, piece.id + '.mid'), { force: true });
      return send(res, 200, { ok: true });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 400, { error: e.message }); }
}).listen(PORT, () => console.log('http://localhost:' + PORT));
