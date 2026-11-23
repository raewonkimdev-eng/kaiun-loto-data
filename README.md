# kaiun-loto-data

ロト6・ロト7 当せん番号データ (JSON)

| 게임 | 파일 | jsDelivr |
|---|---|---|
| ロト6 | [`data/loto6.json`](data/loto6.json) | `https://cdn.jsdelivr.net/gh/raewonkimdev-eng/kaiun-loto-data@main/data/loto6.json` |
| ロト7 | [`data/loto7.json`](data/loto7.json) | `https://cdn.jsdelivr.net/gh/raewonkimdev-eng/kaiun-loto-data@main/data/loto7.json` |

## 형식

```json
{
  "updatedAt": "2026-11-24T00:00:00.000Z",
  "latestRound": 2157,
  "history": [
    { "round": 1, "date": "2000-10-05", "numbers": [2, 8, 10, 13, 27, 30], "bonus": [39] }
  ]
}
```

- `numbers`: 본숫자 (오름차순) · `bonus`: 보너스 숫자 (ロト6 1개, ロト7 2개)
- ロト6 第1回(2000-10-05)부터, ロト7 第1回(2013-04-05)부터 전체 회차

## 갱신

- 추첨 다음 날 GitHub Actions 가 자동으로 새 회차를 추가합니다
- 추가할 때마다 숫자 개수·범위·중복·회차·날짜를 검사합니다

## 출처·주의

- 당첨번호는 みずほ銀行이 발표한 추첨 결과(사실)를 바탕으로 합니다. 최신 회차는 [tank1159jhs/jp-lottery-api](https://github.com/tank1159jhs/jp-lottery-api) (MIT) 가 공개한 데이터를 사용합니다.
- 정확성을 보장하지 않습니다. 당첨 여부는 반드시 [みずほ銀行](https://www.mizuhobank.co.jp/takarakuji/check/loto/index.html)・宝くじ公式サイト의 공식 발표로 확인하세요.
