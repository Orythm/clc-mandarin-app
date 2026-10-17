// 中文比賽 hints: classmates submit a Chinese hint for a lesson word and vote; each card shows the top one.
// Storage is the Upstash Redis database connected to the Vercel project (its env vars are added on connect):
//   hash "hints"   id -> {"id","w","t","dev","at"}   (w the word, t the hint, dev the phone that sent it)
//   set  "v:<id>"  the phones that voted for it
// Hints are anonymous (milo, 2026-10-16); "by" is only on hints added before that.
// GET  /api/hints?dev=<phone id>          -> {hints:[{id,w,t,at,v,me,mine}]}  (no phone ids are sent back)
// POST /api/hints {a:"add", w, t, dev} | {a:"vote", id, dev, on} | {a:"del", id, dev, admin} | {a:"admin", admin}
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.HINTS_ADMIN || '';

async function redis(cmds){
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// Chinese characters, Latin letters (names in pinyin, milo 2026-10-17) and punctuation; the app checks the characters are ones the class has learned.
const HINT_RE = /^[㐀-鿿，。？！、…：；「」『』（）《》～—A-Za-zÀ-ɏ'’.,?!\-\s]+$/;
const WORD_RE = /^[㐀-鿿…]{1,8}$/;
const str = (x, max) => typeof x === 'string' && x.trim().length > 0 && x.trim().length <= max ? x.trim() : null;

async function list(dev){
  const all = await redis([['HGETALL', 'hints']]);
  const flat = all[0] || [], hints = [];
  for (let i = 0; i < flat.length; i += 2) { try { hints.push(JSON.parse(flat[i + 1])); } catch (e) {} }
  if (!hints.length) return [];
  const cmds = hints.flatMap(h => [['SCARD', 'v:' + h.id], ['SISMEMBER', 'v:' + h.id, dev || '-']]);
  const res = await redis(cmds);
  return hints.map((h, i) => ({ id: h.id, w: h.w, t: h.t, at: h.at, v: res[2 * i], me: res[2 * i + 1] === 1, mine: !!dev && h.dev === dev }));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'The hints database is not connected yet.' });
  try {
    if (req.method === 'GET') return res.json({ hints: await list(str(req.query.dev, 64)) });
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const dev = str(b.dev, 64);
    if (b.a === 'admin') return res.json({ ok: !!ADMIN && b.admin === ADMIN });
    if (!dev) return res.status(400).json({ error: 'Missing phone id.' });

    if (b.a === 'add') {
      const w = str(b.w, 8), t = str(b.t, 40);
      if (!w || !WORD_RE.test(w)) return res.status(400).json({ error: 'Unknown word.' });
      if (!t || !HINT_RE.test(t)) return res.status(400).json({ error: 'Hints are Chinese characters, letters for names and punctuation, up to 40.' });
      const text = t.replace(/\s+/g, ' ');
      if (text.includes(w.replace(/…/g, ''))) return res.status(400).json({ error: 'The hint can’t contain the word itself.' });
      const existing = await list(dev);
      const same = existing.find(h => h.w === w && h.t === text);
      if (same) { await redis([['SADD', 'v:' + same.id, dev]]); return res.json({ hints: await list(dev), id: same.id }); }
      if (existing.filter(h => h.mine && h.w === w).length >= 3) return res.status(400).json({ error: 'You already have 3 hints for this word. Delete one to add another.' });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      // The author's own vote comes with the hint.
      await redis([['HSET', 'hints', id, JSON.stringify({ id, w, t: text, dev, at: Date.now() })], ['SADD', 'v:' + id, dev]]);
      return res.json({ hints: await list(dev), id });
    }
    const id = str(b.id, 40);
    if (!id) return res.status(400).json({ error: 'Missing hint.' });
    const raw = (await redis([['HGET', 'hints', id]]))[0];
    if (!raw) return res.status(404).json({ error: 'That hint was deleted.', hints: await list(dev) });
    if (b.a === 'vote') {
      await redis([[b.on ? 'SADD' : 'SREM', 'v:' + id, dev]]);
      return res.json({ hints: await list(dev) });
    }
    if (b.a === 'del') {
      const h = JSON.parse(raw);
      if (h.dev !== dev && !(ADMIN && b.admin === ADMIN)) return res.status(403).json({ error: 'Only its author or the moderator can delete a hint.' });
      await redis([['HDEL', 'hints', id], ['DEL', 'v:' + id]]);
      return res.json({ hints: await list(dev) });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    return res.status(500).json({ error: 'The hints server had a problem. Try again.' });
  }
};
