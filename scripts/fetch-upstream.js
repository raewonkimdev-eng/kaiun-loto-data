// 추첨 다음 날 자동 입력: 공개 저장소 tank1159jhs/jp-lottery-api (MIT) 가 GitHub 에 올려 두는 최신 당첨번호 JSON 을 읽어
// input/loto6.csv, input/loto7.csv 에 아직 없는 회차를 덧붙인다. 그다음 scripts/build.js 가 평소처럼 검사·생성한다.
//   node scripts/fetch-upstream.js            가져와서 CSV 에 추가
//   node scripts/fetch-upstream.js --dry-run  추가할 줄만 보여 주고 파일은 그대로
// 가져온 값이 이상하면(개수·범위·중복·회차가 이어지지 않음·날짜) 그 회차는 넣지 않는다. 빠진 회차는 build.js --check-stale 이 메일로 알려 준다.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const UPSTREAM = 'https://raw.githubusercontent.com/tank1159jhs/jp-lottery-api/main/data';
const UA = 'kaiun-loto-data (+https://github.com/raewonkimdev-eng/kaiun-loto-data)';
const GAMES = { loto6: { max: 43, pick: 6, bonus: 1, days: [1, 4] }, loto7: { max: 37, pick: 7, bonus: 2, days: [5] } };
const dry = process.argv.includes('--dry-run');

async function getJson(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Cache-Control': 'no-cache' }, signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// 상대 형식 → 우리 형식. loto6 의 bonus 는 숫자 하나, loto7 은 배열
function normalize(g, x) {
  const G = GAMES[g];
  const round = +x.round, numbers = (x.numbers || []).map(Number), bonus = [].concat(x.bonus == null ? [] : x.bonus).map(Number);
  const all = [...numbers, ...bonus];
  const ok = Number.isInteger(round) && round > 0 && /^\d{4}-\d{2}-\d{2}$/.test(x.date || '')
    && numbers.length === G.pick && bonus.length === G.bonus
    && all.every(n => Number.isInteger(n) && n >= 1 && n <= G.max) && new Set(all).size === all.length
    && G.days.includes(new Date(x.date + 'T00:00:00Z').getUTCDay());
  return ok ? { round, date: x.date, numbers: numbers.sort((a, b) => a - b), bonus: bonus.sort((a, b) => a - b) } : null;
}

function lastRow(file) {
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  const p = rows[rows.length - 1].split(',');
  return { round: +p[0], date: p[1] };
}

async function run(g) {
  const file = path.join(ROOT, 'input', g + '.csv'), last = lastRow(file);
  let list = [];
  try { list = await getJson(`${UPSTREAM}/${g}/all.json`); } catch (e) { console.log(`· ${g}/all.json 읽기 실패 (${e.message}) → latest.json 사용`); }
  if (!Array.isArray(list) || !list.length) {
    try { list = [await getJson(`${UPSTREAM}/${g}/latest.json`)]; } catch (e) { console.log(`✖ ${g}: 가져오기 실패 (${e.message})`); return 0; }
  }
  const byRound = new Map();
  for (const x of list) { const n = normalize(g, x); if (n) byRound.set(n.round, n); else if (x && +x.round > last.round) console.log(`⚠ ${g} 第${x.round}回: 형식이 맞지 않아 건너뜀`); }
  const add = [];
  for (let r = last.round + 1, prevDate = last.date; byRound.has(r); r++) {   // 회차가 이어지는 동안만
    const n = byRound.get(r);
    if (n.date <= prevDate) { console.log(`⚠ ${g} 第${r}回: 날짜(${n.date})가 앞 회차보다 빠름 → 중단`); break; }
    add.push(n); prevDate = n.date;
  }
  if (!add.length) { console.log(`= ${g}: 새 회차 없음 (第${last.round}回까지 입력됨)`); return 0; }
  const lines = add.map(n => [n.round, n.date, n.numbers.join(' '), n.bonus.join(' ')].join(','));
  lines.forEach(l => console.log(`+ ${g}: ${l}`));
  if (!dry) {
    const cur = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, cur + (cur.endsWith('\n') ? '' : '\n') + lines.join('\n') + '\n');
  }
  return add.length;
}

(async () => {
  let n = 0;
  for (const g of Object.keys(GAMES)) n += await run(g);
  console.log(n ? `${dry ? '(dry-run) ' : ''}${n}회 추가` : '추가할 회차 없음');
})().catch(e => { console.error(e); process.exit(1); });
