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
  isCurrentMissionLastCard,
  isFinalMission,
  lastResolvedResult,
  runNonce,
  runState,
  score,
  selectedMission,
  selectedMissionIndex,
  selectedMissionProgress,
  streak,
} = storeToRefs(store);

const handoffState = ref<'idle' | 'pending'>('idle');
const started = ref(false);
let handoffTimer: number | undefined;

const queueProgressLabel = computed(() => {
  const currentIndex = selectedMissionProgress.value.currentCardIndex + 1;
  return `${Math.min(currentIndex, selectedMission.value.queue.length)} / ${selectedMission.value.queue.length}`;
});

const boardComplete = computed(
  () =>
    isFinalMission.value &&
    isCurrentMissionLastCard.value &&
    runState.value === 'resolved',
);

const interactionLocked = computed(
  () => handoffState.value !== 'idle' || runState.value !== 'idle',
);

const laneRangeLabel = computed(() => {
  const laneCounts = conveyorMissions.map((mission) => mission.lanes.length);
  return `${Math.min(...laneCounts)}-${Math.max(...laneCounts)} belts`;
});

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

  return feedbackResult.value.isPredictionCorrect ? '맞았어요' : '틀렸어요';
});

const totalLinesLabel = computed(() => `${conveyorMissions.length} lines`);

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
  const finishedCurrentMission = isCurrentMissionLastCard.value;
  const finishedAllMissions = isFinalMission.value;

  store.resolveRun();

  if (!finishedCurrentMission) {
    scheduleHandoff(() => {
      store.advanceCard();
    }, 700);
    return;
  }

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
    <header v-if="started" class="play-surface__bar">
      <div class="play-surface__metrics">
        <div class="play-surface__metric">
          <span>Score</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="play-surface__metric">
          <span>Line</span>
          <strong>{{ selectedMissionIndex + 1 }}</strong>
        </div>
        <div class="play-surface__metric">
          <span>Card</span>
          <strong>{{ queueProgressLabel }}</strong>
        </div>
        <div class="play-surface__metric">
          <span>Streak</span>
          <strong>{{ streak }}</strong>
        </div>
      </div>

      <button
        class="play-surface__reset"
        type="button"
        aria-label="세션 리셋"
        @click="handleResetSession"
      >
        Reset
      </button>
    </header>

    <section v-if="!started" class="play-surface__overlay play-surface__overlay--start">
      <div class="play-surface__poster" aria-hidden="true">
        <span class="play-surface__poster-track play-surface__poster-track--main" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-top" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-bottom" />
        <span class="play-surface__poster-track play-surface__poster-track--branch-top-alt" />
      </div>

      <div class="play-surface__intro">
        <p class="play-surface__eyebrow">Conveyor Sort</p>
        <h1>카드 분류 라인</h1>
        <p class="play-surface__lead">흐르는 벨트에서 맞는 분기 레인을 먼저 눌러라.</p>

        <div class="play-surface__intro-meta">
          <span>{{ totalLinesLabel }}</span>
          <span>{{ laneRangeLabel }}</span>
        </div>

        <button
          class="play-surface__start"
          type="button"
          aria-label="분류 시작"
          @click="handleBeginSession"
        >
          Start Sorting
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
          <p class="play-surface__eyebrow">All Lines Clear</p>
          <h2>모든 라인 통과</h2>
          <p class="play-surface__lead">
            {{ score }}점으로 {{ conveyorMissions.length }}개 라인을 끝냈다.
          </p>

          <button
            class="play-surface__start"
            type="button"
            aria-label="다시 시작"
            @click="handleResetSession"
          >
            Restart
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
