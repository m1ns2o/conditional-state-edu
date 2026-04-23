# Conditional State

트럼프 카드가 컨베이어 벨트를 따라 이동하고, 펫말 규칙에 맞춰 자동으로 레일 분류되는 Vue 3 학습 웹앱입니다.

## Stack

- Vue 3
- Vite
- TypeScript
- Pinia
- Vitest + Vue Test Utils

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Experience

- 5개의 고정 컨베이어 라인
- 카드 큐 기반 자동 분류 애니메이션
- 아이콘+짧은 텍스트 펫말 규칙
- 예측 후 실행하는 학습 루프
- 세션 점수, 라인 정확도, 연속 성공 집계

## Mission Lines

- 라인 1: 빨간 카드면 루비 문, 아니면 오닉스 문
- 라인 2: 숫자값 10 이상이면 Power, 아니면 Regular
- 라인 3: 하트면 Heart, 아니면 검정이면 Black, 아니면 Other
- 라인 4: 빨강 and 10 이상이면 VIP, 아니면 not 클로버면 Shadow, 아니면 Garden
- 라인 5: 10 이상이면 Power, 아니면 5 미만 or 스페이드면 Special, 아니면 Middle

## Notes

- 카드 외 생활 예시는 제거했습니다.
- 코드 표현은 UI에 노출하지 않습니다.
- 점수는 세션 메모리 상태로만 유지되며 새로고침 시 초기화됩니다.
