# kaiun-loto-data

開運ロト6・7 앱이 읽어 가는 **ロト6 / ロト7 당첨번호 데이터**입니다.

- 앱이 읽는 파일: `data/loto6.json`, `data/loto7.json`
  (jsDelivr 주소: `https://cdn.jsdelivr.net/gh/<GitHub아이디>/kaiun-loto-data@main/data/loto6.json`)
- 사람이 고치는 파일: `input/loto6.csv`, `input/loto7.csv` (JSON 은 직접 고치지 않습니다)
- 서버 비용 없음: GitHub(저장·자동검사) + jsDelivr(배포)

## 처음 한 번: 5단계 체크리스트

1. **GitHub 가입·로그인** → 오른쪽 위 `+` → `New repository`
   - Repository name: `kaiun-loto-data`
   - **Public** 선택 (jsDelivr 는 공개 저장소만 배포합니다)
   - `Add a README file` 은 체크하지 않고 `Create repository`
2. 새 저장소 화면의 `uploading an existing file` 링크 클릭 →
   PC 의 `C:\AI\kaiun-loto-data` 폴더 **안의 내용 전부**(`.github`, `data`, `input`, `scripts`, `README.md`)를 끌어다 놓기 → `Commit changes`
   - `.github` 폴더가 안 보이면 탐색기 `보기 → 숨긴 항목` 을 켜세요
3. 저장소 `Settings → Actions → General` → 맨 아래 **Workflow permissions** 를
   `Read and write permissions` 로 바꾸고 `Save`
4. `Actions` 탭 → 왼쪽 `update-loto` → `Run workflow` → 초록 체크(✔)가 뜨는지 확인
5. 브라우저에서 아래 주소가 열리는지 확인하고, **GitHub 아이디를 알려 주세요** (앱에 넣고 APK 를 다시 만듭니다)
   `https://cdn.jsdelivr.net/gh/<GitHub아이디>/kaiun-loto-data@main/data/loto6.json`

## 추첨 후: 한 줄 추가 (1분)

| 게임 | 추첨 | 입력 |
|---|---|---|
| ロト6 | 월·목 18:45 | 그날 밤 또는 다음 날 |
| ロト7 | 금 18:45 | 그날 밤 또는 다음 날 |

1. 결과 확인: [みずほ銀行 ロト6](https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html) / [ロト7](https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html)
2. GitHub 에서 `input/loto6.csv` (또는 `loto7.csv`) 열기 → 연필 아이콘(✏ Edit)
3. **맨 아래에 한 줄 추가** → `Commit changes`

```
回,抽せん日,本数字,ボーナス
2158,2026-11-26,1 5 12 23 34 40,7          ← ロト6 (본숫자 6개, 보너스 1개)
705,2026-11-27,2 8 13 19 25 31 36,4 22     ← ロト7 (본숫자 7개, 보너스 2개)
```

- 숫자 사이는 띄어쓰기, 칸 사이는 쉼표. 순서는 아무렇게나 써도 자동으로 정렬됩니다. 전각 숫자도 괜찮습니다
- 저장하면 `Actions` 가 자동으로 검사합니다
  - ✔ 초록: `data/*.json` 이 갱신되고 jsDelivr 캐시도 비워져 몇 분 안에 앱에 반영
  - ✖ 빨강: 개수·범위·중복·회차·날짜가 틀린 것. **앱 데이터는 바뀌지 않습니다.** 빨간 항목을 눌러 어느 줄이 왜 틀렸는지 보고 고치세요
- 깜빡 알림: 화·금·토 낮 12시(일본 시간)에 빠진 회차가 있으면 Actions 가 실패하고 GitHub 가 메일을 보냅니다

## PC 에서 미리 검사하기 (선택)

```
node scripts/build.js
```

## 데이터 출처

당첨번호는 추첨 결과(사실)를 운영자가 직접 확인해 입력한 것입니다. 공식 결과는 みずほ銀行・宝くじ公式サイト에서 확인하세요.
