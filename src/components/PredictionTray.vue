<script setup lang="ts">
import { computed } from 'vue';
import type { ConveyorMission, ConveyorRunState } from '../types/domain';
import PlayingCard from './PlayingCard.vue';

const props = defineProps<{
  mission: ConveyorMission;
  currentCard: ConveyorMission['queue'][number] | null;
  currentPrediction: string | null;
  runState: ConveyorRunState;
  canStartRun: boolean;
  canAdvanceCard: boolean;
  currentCardIndex: number;
  locked?: boolean;
  isFinalCard?: boolean;
}>();

defineEmits<{
  (event: 'select-prediction', laneTag: string): void;
  (event: 'start-run'): void;
  (event: 'advance-card'): void;
  (event: 'reset-mission'): void;
}>();

const isLastCard = computed(
  () => props.currentCardIndex >= props.mission.queue.length - 1,
);

const selectedLane = computed(
  () => props.mission.lanes.find((lane) => lane.tag === props.currentPrediction) ?? null,
);

const selectedLaneOrder = computed(() => {
  if (!selectedLane.value) {
    return null;
  }

  const laneIndex = props.mission.lanes.findIndex(
    (lane) => lane.tag === selectedLane.value?.tag,
  );
  return laneIndex >= 0 ? laneIndex + 1 : null;
});

const consoleLabel = computed(() => {
  if (props.locked) {
    return '라인 전환 중';
  }

  if (props.runState === 'running') {
    return '벨트 작동 중';
  }

  if (props.canAdvanceCard) {
    return '결과 확정';
  }

  return '예측 입력 대기';
});

function laneToneClass(accent: ConveyorMission['lanes'][number]['accent']) {
  return `prediction-tray__lane-button--${accent}`;
}
</script>

<template>
  <section class="prediction-tray">
    <div class="prediction-tray__topline">
      <div>
        <p>Routing Console</p>
        <h3>배출 레인 예측</h3>
      </div>
      <span class="prediction-tray__state">{{ consoleLabel }}</span>
    </div>

    <div class="prediction-tray__body">
      <div class="prediction-tray__card-bay">
        <div class="prediction-tray__card">
          <PlayingCard v-if="currentCard" :card="currentCard" compact />
          <div v-else class="prediction-tray__empty">카드 준비 중</div>
        </div>

        <div class="prediction-tray__card-meta">
          <span>현재 공급 카드</span>
          <strong>{{ currentCard?.displayName ?? '다음 카드를 불러오는 중' }}</strong>
          <small>카드 {{ currentCardIndex + 1 }} / {{ mission.queue.length }}</small>
        </div>
      </div>

      <div class="prediction-tray__selector">
        <div class="prediction-tray__selected">
          <span>선택된 레인</span>
          <strong>{{ selectedLaneOrder ? `${selectedLaneOrder}번 컨베이어` : '아직 선택 없음' }}</strong>
          <small>
            {{
              selectedLane?.description ??
              '센서 구간을 통과하기 전에 카드가 도착할 레인을 먼저 선택하세요.'
            }}
          </small>
        </div>

        <div class="prediction-tray__lanes">
          <button
            v-for="lane in mission.lanes"
            :key="lane.tag"
            class="prediction-tray__lane-button"
            :class="[
              laneToneClass(lane.accent),
              currentPrediction === lane.tag
                ? 'prediction-tray__lane-button--active'
                : '',
            ]"
            :data-testid="`predict-${lane.tag}`"
            :disabled="runState === 'running' || locked"
            @click="$emit('select-prediction', lane.tag)"
          >
            <span class="prediction-tray__lane-tag">{{ lane.tag }}</span>
            <strong>{{ `${mission.lanes.findIndex((candidate) => candidate.tag === lane.tag) + 1}번 컨베이어` }}</strong>
            <span>{{ lane.description }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="prediction-tray__actions">
      <button
        class="primary-button"
        data-testid="start-run"
        :disabled="!canStartRun || locked"
        @click="$emit('start-run')"
      >
        {{ runState === 'running' ? '스캔 중' : '벨트 가동' }}
      </button>

      <button
        class="secondary-button"
        data-testid="advance-card"
        :disabled="!canAdvanceCard || locked"
        @click="$emit('advance-card')"
      >
        {{ isLastCard ? '라인 종료 대기' : '다음 카드 공급' }}
      </button>

      <button
        class="secondary-button"
        :disabled="locked"
        @click="$emit('reset-mission')"
      >
        현재 라인 초기화
      </button>
    </div>

    <p class="prediction-tray__hint">
      {{
        locked
          ? '스테이지 전환이 끝나면 다음 컨베이어 라인이 열립니다.'
          : isFinalCard
            ? '이번 카드가 마지막입니다. 결과가 확정되면 다음 라인으로 이동합니다.'
            : '규칙 패널을 먼저 읽고, 실제 카드가 빠져나갈 레인을 예측해 보세요.'
      }}
    </p>
  </section>
</template>

<style scoped>
.prediction-tray {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 1.65rem;
  background:
    radial-gradient(circle at top left, rgba(93, 165, 255, 0.14), transparent 30%),
    linear-gradient(155deg, rgba(19, 31, 49, 0.96), rgba(9, 15, 25, 0.96));
  border: 1px solid rgba(151, 181, 219, 0.16);
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.prediction-tray__topline {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.prediction-tray__topline p {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--signal-cyan);
}

.prediction-tray__topline h3 {
  margin: 0.18rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  letter-spacing: -0.04em;
}

.prediction-tray__state {
  padding: 0.56rem 0.82rem;
  border-radius: 999px;
  border: 1px solid rgba(151, 181, 219, 0.16);
  background: rgba(8, 14, 24, 0.6);
  color: var(--muted-strong);
  font-size: 0.78rem;
}

.prediction-tray__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.prediction-tray__card-bay,
.prediction-tray__selected {
  border-radius: 1.3rem;
  border: 1px solid rgba(151, 181, 219, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 72%),
    rgba(8, 14, 24, 0.52);
}

.prediction-tray__card-bay {
  display: grid;
  justify-items: center;
  gap: 0.9rem;
  padding: 1rem;
}

.prediction-tray__card {
  display: grid;
  place-items: center;
  min-width: 144px;
}

.prediction-tray__empty {
  width: 136px;
  min-height: 188px;
  display: grid;
  place-items: center;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
}

.prediction-tray__card-meta {
  display: grid;
  gap: 0.24rem;
  width: 100%;
}

.prediction-tray__card-meta span,
.prediction-tray__selected span,
.prediction-tray__lane-tag {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.prediction-tray__card-meta strong,
.prediction-tray__selected strong {
  font-size: 1rem;
  line-height: 1.4;
}

.prediction-tray__card-meta small,
.prediction-tray__selected small,
.prediction-tray__lane-button span:last-child,
.prediction-tray__hint {
  color: var(--muted-strong);
  line-height: 1.55;
}

.prediction-tray__selector {
  display: grid;
  gap: 0.9rem;
}

.prediction-tray__selected {
  display: grid;
  gap: 0.28rem;
  padding: 1rem 1.05rem;
}

.prediction-tray__lanes {
  display: grid;
  gap: 0.75rem;
}

.prediction-tray__lane-button {
  display: grid;
  gap: 0.2rem;
  padding: 0.95rem 1rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(151, 181, 219, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 72%),
    rgba(8, 14, 24, 0.58);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.prediction-tray__lane-button:hover:not(:disabled),
.prediction-tray__lane-button--active {
  transform: translateY(-2px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 72%),
    rgba(19, 36, 59, 0.82);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}

.prediction-tray__lane-button--red:hover:not(:disabled),
.prediction-tray__lane-button--red.prediction-tray__lane-button--active {
  border-color: rgba(255, 107, 102, 0.42);
}

.prediction-tray__lane-button--ink:hover:not(:disabled),
.prediction-tray__lane-button--ink.prediction-tray__lane-button--active {
  border-color: rgba(201, 216, 234, 0.34);
}

.prediction-tray__lane-button--teal:hover:not(:disabled),
.prediction-tray__lane-button--teal.prediction-tray__lane-button--active {
  border-color: rgba(89, 237, 255, 0.4);
}

.prediction-tray__lane-button--gold:hover:not(:disabled),
.prediction-tray__lane-button--gold.prediction-tray__lane-button--active {
  border-color: rgba(255, 202, 95, 0.42);
}

.prediction-tray__lane-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.prediction-tray__lane-button strong {
  font-size: 1.02rem;
}

.prediction-tray__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.prediction-tray__hint {
  margin: 0;
  font-size: 0.88rem;
}

@media (max-width: 860px) {
  .prediction-tray__body {
    grid-template-columns: 1fr;
  }

  .prediction-tray__card-bay {
    justify-items: flex-start;
  }
}
</style>
