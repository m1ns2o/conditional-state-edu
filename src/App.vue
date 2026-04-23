<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { storeToRefs } from 'pinia';
import FactoryWorkspace from './components/FactoryWorkspace.vue';
import { conveyorMissions } from './data/modules';
import { useLearningStore } from './stores/learning';

const store = useLearningStore();

const {
  currentCard,
  currentPrediction,
  currentRunResult,
  lastResolvedResult,
  runNonce,
  runState,
  score,
  selectedMission,
  streak,
  totalCompletedMissions,
} = storeToRefs(store);

const handoffState = ref<'idle' | 'pending'>('idle');
const started = ref(false);
let handoffTimer: number | undefined;

const boardComplete = computed(
  () =>
    totalCompletedMissions.value >= conveyorMissions.length &&
    runState.value === 'resolved',
);

const interactionLocked = computed(
  () => handoffState.value !== 'idle' || runState.value !== 'idle',
);

const outcomeTone = computed(() => {
  if (!lastResolvedResult.value) {
    return 'idle';
  }

  return lastResolvedResult.value.isPredictionCorrect ? 'correct' : 'wrong';
});

const feedbackResult = computed(() =>
  runState.value === 'resolved' ? currentRunResult.value : null,
);

const feedbackLabel = computed(() => {
  if (!feedbackResult.value) {
    return '';
  }

  return feedbackResult.value.isPredictionCorrect
    ? '참 잘했어요'
    : '한 번 더 살펴볼까요';
});

const totalLinesLabel = computed(() => `${conveyorMissions.length}개 작업 문제`);

function clearHandoffTimer() {
  if (handoffTimer !== undefined) {
    window.clearTimeout(handoffTimer);
    handoffTimer = undefined;
  }
}

function beginSession() {
  started.value = true;
}

function scheduleHandoff(callback: () => void, delay: number) {
  clearHandoffTimer();
  handoffState.value = 'pending';
  handoffTimer = window.setTimeout(() => {
    handoffState.value = 'idle';
    callback();
  }, delay);
}

function handleLanePick(laneTag: string) {
  if (interactionLocked.value || boardComplete.value) {
    return;
  }

  beginSession();
  store.setPrediction(laneTag);
  store.startRun();
}

function handleBeginSession() {
  clearHandoffTimer();
  handoffState.value = 'idle';
  beginSession();
}

function handleManualStart() {
  if (interactionLocked.value || boardComplete.value) {
    return;
  }

  beginSession();
  store.startRun();
}

function handleAnimationFinished() {
  store.resolveRun();
  const finishedAllMissions =
    totalCompletedMissions.value >= conveyorMissions.length;

  if (!finishedAllMissions) {
    scheduleHandoff(() => {
      store.advanceToNextMission();
    }, 900);
    return;
  }

  clearHandoffTimer();
  handoffState.value = 'idle';
}

function handleResetSession() {
  clearHandoffTimer();
  handoffState.value = 'idle';
  started.value = false;
  store.resetSession();
}

onBeforeUnmount(() => {
  clearHandoffTimer();
});
</script>

<template>
  <main class="play-surface">
    <header v-if="started" class="play-surface__scoreboard" aria-label="현재 점수">
      <span>점수</span>
      <strong>{{ score }}</strong>
    </header>

    <section v-if="!started" class="play-surface__overlay play-surface__overlay--start">
      <div class="play-surface__poster" aria-hidden="true">
        <span class="play-surface__poster-track play-surface__poster-track--main" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-top" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-bottom" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-top-alt" />
        <span
          class="play-surface__poster-card play-surface__poster-card--one play-surface__poster-card--red"
        >
          <span class="play-surface__poster-corner">
            <strong>7</strong>
            <span>♥</span>
          </span>
          <span class="play-surface__poster-pips">
            <span>♥ ♥</span>
            <span>♥</span>
            <span>♥ ♥</span>
            <span>♥ ♥</span>
          </span>
          <span class="play-surface__poster-corner play-surface__poster-corner--bottom">
            <strong>7</strong>
            <span>♥</span>
          </span>
        </span>
        <span
          class="play-surface__poster-card play-surface__poster-card--two play-surface__poster-card--black"
        >
          <span class="play-surface__poster-corner">
            <strong>4</strong>
            <span>♠</span>
          </span>
          <span class="play-surface__poster-pips">
            <span>♠ ♠</span>
            <span>♠ ♠</span>
          </span>
          <span class="play-surface__poster-corner play-surface__poster-corner--bottom">
            <strong>4</strong>
            <span>♠</span>
          </span>
        </span>
      </div>

      <div class="play-surface__intro">
        <p class="play-surface__eyebrow">분류 공장 이야기</p>
        <h1 class="play-surface__title">
          작은 카드들이 길을 잃지 않도록, 알맞은 벨트 길을 골라 주세요.
        </h1>
        <p class="play-surface__lead">
          커다란 공장 안에는 똑똑한 분류 게이트가 있어요.
          카드마다 지나가야 하는 길이 다르기 때문에, 센서가 대답하기 전에 어느 레인으로 갈지 먼저 생각해 보는 거예요.
        </p>

        <div class="play-surface__story">
          <p>어떤 날은 숫자를 보고 길을 나누고, 어떤 날은 색과 문양을 함께 살펴봐요.</p>
          <p>차근차근 규칙을 읽고 알맞은 길을 골라 주면, 카드들은 제자리를 찾아가고 점수도 하나씩 쌓여요.</p>
        </div>

        <div class="play-surface__intro-meta">
          <span>{{ totalLinesLabel }}</span>
          <span>쉬운 규칙부터 차근차근</span>
          <span>AND · OR · NOT · ELIF 익히기</span>
        </div>

        <button
          class="play-surface__start"
          type="button"
          aria-label="분류 시작"
          @click="handleBeginSession"
        >
          이야기 시작
        </button>
      </div>
    </section>

    <div v-else class="play-surface__workspace">
      <FactoryWorkspace
        :mission="selectedMission"
        :current-card="currentCard"
        :current-prediction="currentPrediction"
        :run-result="currentRunResult"
        :run-state="runState"
        :run-nonce="runNonce"
        :interactive="!interactionLocked && !boardComplete"
        @select-lane="handleLanePick"
        @animation-finished="handleAnimationFinished"
      />

      <div
        v-if="feedbackResult"
        class="play-surface__feedback"
        :class="`play-surface__feedback--${feedbackResult.isPredictionCorrect ? 'correct' : 'wrong'}`"
      >
        <strong>{{ feedbackLabel }}</strong>
        <span>{{ feedbackResult.reasonLabel }}</span>
      </div>

      <section
        v-if="boardComplete"
        class="play-surface__overlay play-surface__overlay--complete"
      >
        <div class="play-surface__intro play-surface__intro--complete">
          <p class="play-surface__eyebrow">오늘의 분류 완료</p>
          <h2 class="play-surface__title play-surface__title--complete">
            모든 카드가 제자리를 찾았어요
          </h2>
          <p class="play-surface__lead">
            {{ score }}점을 모으면서 {{ conveyorMissions.length }}개의 문제를 끝까지 해결했어요.
          </p>

          <button
            class="play-surface__start"
            type="button"
            aria-label="다시 시작"
            @click="handleResetSession"
          >
            다시 시작
          </button>
        </div>
      </section>
    </div>

    <button
      class="sr-only"
      type="button"
      data-testid="start-run"
      @click="handleManualStart"
    >
      start
    </button>

    <div class="sr-only">
      <button
        v-for="lane in selectedMission.lanes"
        :key="`predict-${lane.tag}`"
        type="button"
        :data-testid="`predict-${lane.tag}`"
        @click="store.setPrediction(lane.tag)"
      >
        {{ lane.tag }}
      </button>
    </div>

    <div
      v-if="lastResolvedResult?.reasonLabel"
      class="sr-only"
      :class="`play-surface__status--${outcomeTone}`"
      data-testid="result-ticker"
    >
      {{ lastResolvedResult.reasonLabel }}
    </div>
  </main>
</template>
