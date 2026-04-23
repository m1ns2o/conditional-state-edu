<script setup lang="ts">
import { computed } from 'vue';
import type { ConveyorMission, ConveyorRunResult } from '../types/domain';
import { findLaneLabel } from '../utils/conditions';

const props = defineProps<{
  mission: ConveyorMission;
  result: ConveyorRunResult | null;
  accuracy: number;
  score: number;
  streak: number;
  completedLines: number;
  stageIndex: number;
}>();

const predictionLabel = computed(() => {
  if (!props.result?.predictionLaneTag) {
    return '아직 없음';
  }

  return findLaneLabel(props.mission, props.result.predictionLaneTag);
});

const actualLabel = computed(() => {
  if (!props.result) {
    return '대기 중';
  }

  return findLaneLabel(props.mission, props.result.finalLaneTag);
});

const decisionLabel = computed(() => {
  if (!props.result) {
    return '최근 분류 기록 없음';
  }

  return props.result.isPredictionCorrect ? 'Prediction Locked' : 'Prediction Missed';
});
</script>

<template>
  <section class="result-ticker" data-testid="result-ticker">
    <div class="result-ticker__topline">
      <div>
        <p>Telemetry</p>
        <h3>최근 분류 로그</h3>
      </div>
      <span class="result-ticker__badge">Stage {{ stageIndex }}</span>
    </div>

    <div
      class="result-ticker__decision"
      :class="result ? 'result-ticker__decision--resolved' : ''"
    >
      <span>{{ decisionLabel }}</span>
      <strong>
        {{ result?.reasonLabel ?? '벨트가 작동하면 마지막 분류 이유가 이곳에 기록됩니다.' }}
      </strong>
      <p>
        {{
          result
            ? `센서 판단 후 ${actualLabel} 레인으로 배출되었습니다.`
            : '예측을 선택하고 벨트를 가동하면 결과 비교가 시작됩니다.'
        }}
      </p>
    </div>

    <div class="result-ticker__compare">
      <div>
        <span>예측 레인</span>
        <strong>{{ predictionLabel }}</strong>
      </div>
      <div>
        <span>실제 레인</span>
        <strong>{{ actualLabel }}</strong>
      </div>
    </div>

    <div class="result-ticker__trace">
      <template v-if="result">
        <div
          v-for="(step, index) in result.visitedGates"
          :key="`${step.gateId}-${index}`"
          class="result-ticker__trace-step"
          :class="step.matched ? 'result-ticker__trace-step--matched' : ''"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.reasonLabel }}</strong>
        </div>
      </template>
      <div v-else class="result-ticker__trace-empty">
        아직 센서를 통과한 카드가 없습니다.
      </div>
    </div>

    <div class="result-ticker__stats">
      <div>
        <span>정확도</span>
        <strong>{{ accuracy }}%</strong>
      </div>
      <div>
        <span>연속 성공</span>
        <strong>{{ streak }}</strong>
      </div>
      <div>
        <span>완료 라인</span>
        <strong>{{ completedLines }}</strong>
      </div>
      <div>
        <span>세션 점수</span>
        <strong>{{ score }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.result-ticker {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 1.65rem;
  background:
    radial-gradient(circle at top right, rgba(89, 237, 255, 0.12), transparent 26%),
    linear-gradient(160deg, rgba(11, 18, 31, 0.98), rgba(6, 11, 20, 0.98));
  color: var(--ink);
  border: 1px solid rgba(151, 181, 219, 0.14);
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.result-ticker__topline {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.result-ticker__topline p {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--signal-cyan);
}

.result-ticker__topline h3 {
  margin: 0.18rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  letter-spacing: -0.04em;
}

.result-ticker__badge {
  padding: 0.56rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(151, 181, 219, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted-strong);
  font-size: 0.78rem;
}

.result-ticker__decision {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border-radius: 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 72%),
    rgba(8, 14, 24, 0.6);
  border: 1px solid rgba(151, 181, 219, 0.12);
}

.result-ticker__decision--resolved {
  border-color: rgba(89, 237, 255, 0.18);
}

.result-ticker__decision span,
.result-ticker__compare span,
.result-ticker__stats span,
.result-ticker__trace-step span {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.result-ticker__decision strong {
  font-size: 1rem;
  line-height: 1.55;
}

.result-ticker__decision p,
.result-ticker__trace-empty {
  margin: 0;
  color: var(--muted-strong);
  line-height: 1.6;
}

.result-ticker__compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.result-ticker__compare div,
.result-ticker__stats div {
  display: grid;
  gap: 0.28rem;
  padding: 0.9rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(151, 181, 219, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.result-ticker__compare strong,
.result-ticker__stats strong {
  font-size: 1rem;
}

.result-ticker__trace {
  display: grid;
  gap: 0.65rem;
}

.result-ticker__trace-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.7rem;
  align-items: center;
  padding: 0.82rem 0.9rem;
  border-radius: 1rem;
  border: 1px solid rgba(151, 181, 219, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.result-ticker__trace-step span {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
}

.result-ticker__trace-step strong {
  font-size: 0.94rem;
  line-height: 1.5;
}

.result-ticker__trace-step--matched {
  border-color: rgba(120, 224, 143, 0.22);
  box-shadow: 0 0 0 1px rgba(120, 224, 143, 0.08);
}

.result-ticker__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 720px) {
  .result-ticker__compare,
  .result-ticker__stats {
    grid-template-columns: 1fr;
  }
}
</style>
