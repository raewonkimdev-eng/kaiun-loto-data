// input/loto6.csv, input/loto7.csv → data/loto6.json, data/loto7.json
//   node scripts/build.js               검사 후 JSON 생성 (오류가 하나라도 있으면 아무것도 쓰지 않고 실패)
//   node scripts/build.js --check-stale 입력이 빠진 회차가 있으면 실패 (GitHub 가 실패 메일을 보내 알림이 된다)
// 외부 패키지 없음. Node 18 이상.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

const GAMES = {
  loto6: { name: 'ロト6', max: 43, pick: 6, bonus: 1, days: [1, 4] },   // 월·목
  loto7: { name: 'ロト7', max: 37, pick: 7, bonus: 2, days: [5] },      // 금
};
const JST = 9 * 3600e3, DAY = 86400e3;
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

// 전각 숫자·쉼표 등은 반각으로 (GitHub 웹에서 일본어 입력기로 쳐도 되게)
const norm = s => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .replace(/[，、]/g, ',').replace(/[－ー―]/g, '-').replace(/[　]/g, ' ');
const nums = s => s.trim().split(/[\s・\/]+/).filter(Boolean).map(x => /^\d+$/.test(x) ? +x : NaN);
const isDrawDay = (g, t) => {
  const d = new Date(t), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
  if ((m === 12 && dd === 31) || (m === 1 && dd <= 3)) return false;
  return GAMES[g].days.includes(d.getUTCDay());
};

function parse(g) {
  const G = GAMES[g], file = path.join(ROOT, 'input', g + '.csv');
  const errors = [], warnings = [], rows = [];
  fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).forEach((raw, i) => {
    const line = norm(raw).trim(), at = `input/${g}.csv ${i + 1}행`;
    if (!line || line.startsWith('#')) return;
    const p = line.split(',').map(s => s.trim());
    if (p.length !== 4) return errors.push(`${at}: 쉼표로 나눈 칸이 4개여야 합니다 (회,날짜,본숫자,보너스) → "${raw}"`);
    const round = /^\d+$/.test(p[0]) ? +p[0] : NaN;
    const dm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(p[1].replace(/[\/.]/g, '-'));
    const main = nums(p[2]), bonus = nums(p[3]);
    if (!Number.isInteger(round) || round < 1) errors.push(`${at}: 회차 "${p[0]}" 가 숫자가 아닙니다`);
    let date = null;
    if (!dm) errors.push(`${at}: 날짜 "${p[1]}" 는 2026-11-23 형식이어야 합니다`);
    else {
      const t = Date.UTC(+dm[1], +dm[2] - 1, +dm[3]), d = new Date(t);
      if (d.getUTCMonth() !== +dm[2] - 1) errors.push(`${at}: 없는 날짜입니다 "${p[1]}"`);
      else {
        date = `${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}`;
        if (!isDrawDay(g, t)) warnings.push(`${at}: ${date}(${WEEK[d.getUTCDay()]}) 는 보통 ${G.name} 추첨 요일이 아닙니다. 맞는지 확인하세요`);
      }
    }
    if (main.length !== G.pick) errors.push(`${at}: 본숫자는 ${G.pick}개여야 합니다 (지금 ${main.length}개)`);
    if (bonus.length !== G.bonus) errors.push(`${at}: 보너스 숫자는 ${G.bonus}개여야 합니다 (지금 ${bonus.length}개)`);
    const all = [...main, ...bonus];
    const bad = all.filter(n => !Number.isInteger(n) || n < 1 || n > G.max);
    if (bad.length) errors.push(`${at}: 1~${G.max} 범위를 벗어난 숫자가 있습니다`);
    if (new Set(all).size !== all.length) errors.push(`${at}: 같은 숫자가 두 번 들어 있습니다 (본숫자+보너스 전체에서 중복 불가)`);
    rows.push({ round, date, numbers: [...main].sort((a, b) => a - b), bonus: [...bonus].sort((a, b) => a - b), at });
  });
  rows.sort((a, b) => a.round - b.round);
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (a.round === b.round) errors.push(`${b.at}: 第${b.round}回 이 두 번 들어 있습니다`);
    else if (b.round !== a.round + 1) warnings.push(`${b.at}: 第${a.round + 1}回 ~ 第${b.round - 1}回 이 비어 있습니다`);
    if (a.date && b.date && a.round !== b.round && a.date >= b.date) errors.push(`${b.at}: 第${b.round}回 날짜(${b.date})가 앞 회차 날짜(${a.date})보다 늦어야 합니다`);
  }
  return { rows, errors, warnings };
}

// 지금(일본 시간) 기준으로 결과가 이미 나와 있어야 하는 마지막 추첨일. 추첨 다음 날 정오까지는 여유를 둔다
function expectedLatest(g, lastRow, now = Date.now()) {
  const cutoff = now + JST - 36 * 3600e3;   // 추첨일 0시 + 36시간 = 다음 날 12:00(일본 시간)까지 여유
  let t = Date.parse(lastRow.date + 'T00:00:00Z') + DAY, round = lastRow.round, missing = [];
  for (; t <= cutoff; t += DAY) if (isDrawDay(g, t)) missing.push({ round: ++round, date: new Date(t).toISOString().slice(0, 10) });
  return missing;
}

function main() {
  const stale = process.argv.includes('--check-stale');
  const out = {}; let failed = false;
  for (const g of Object.keys(GAMES)) {
    const r = parse(g);
    r.warnings.forEach(w => console.log('⚠ ' + w));
    r.errors.forEach(e => console.log('✖ ' + e));
    if (r.errors.length) failed = true;
    if (!r.rows.length) { console.log(`✖ input/${g}.csv 에 데이터가 없습니다`); failed = true; continue; }
    out[g] = r.rows;
  }
  if (failed) { console.log('\n오류가 있어서 data/*.json 을 바꾸지 않았습니다. 위 줄을 고친 뒤 다시 저장(commit)하세요.'); process.exit(1); }

  if (stale) {
    let miss = 0;
    for (const g of Object.keys(out)) {
      const m = expectedLatest(g, out[g][out[g].length - 1]);
      m.forEach(x => console.log(`✖ ${GAMES[g].name} 第${x.round}回 (${x.date}) 당첨번호가 아직 입력되지 않았습니다`));
      miss += m.length;
    }
    if (miss) process.exit(1);
    console.log('✔ 빠진 회차 없음');
    return;
  }

  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  for (const g of Object.keys(out)) {
    const history = out[g].map(({ round, date, numbers, bonus }) => ({ round, date, numbers, bonus }));
    const file = path.join(ROOT, 'data', g + '.json');
    let prev = null; try { prev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) {}
    if (prev && JSON.stringify(prev.history) === JSON.stringify(history)) { console.log(`= data/${g}.json 변경 없음 (第${prev.latestRound}回까지)`); continue; }
    const json = { updatedAt: new Date().toISOString(), latestRound: history[history.length - 1].round, history };
    // 한 회차 = 한 줄 (GitHub 에서 보기 쉽고 변경 내역(diff)도 짧다)
    const body = '{\n  "updatedAt": ' + JSON.stringify(json.updatedAt) + ',\n  "latestRound": ' + json.latestRound + ',\n  "history": [\n'
      + history.map(h => '    ' + JSON.stringify(h)).join(',\n') + '\n  ]\n}\n';
    fs.writeFileSync(file, body);
    console.log(`✔ data/${g}.json 갱신: 第${history[0].round}回 ~ 第${json.latestRound}回 (${history.length}회)`);
  }
}
main();
