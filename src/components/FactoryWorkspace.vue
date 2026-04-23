<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { ConveyorMission, ConveyorRunResult, ConveyorRunState } from '../types/domain';
import PlayingCard from './PlayingCard.vue';

const props = withDefaults(
  defineProps<{
    mission: ConveyorMission;
    currentCard: ConveyorMission['queue'][number] | null;
    currentPrediction?: string | null;
    runResult: ConveyorRunResult | null;
    runState: ConveyorRunState;
    runNonce: number;
    interactive?: boolean;
  }>(),
  {
    currentPrediction: null,
    interactive: false,
  },
);

const emit = defineEmits<{
  (event: 'animation-finished'): void;
  (event: 'select-lane', laneTag: string): void;
}>();

const activeGateIndex = ref<number | null>(null);
const resolvedGateStates = ref<Record<string, 'matched' | 'missed'>>({});
const divertedLaneTag = ref<string | null>(null);
const phase = ref<'idle' | 'approach' | 'gates' | 'diverted'>('idle');
const timers: number[] = [];

const displayCard = computed(
  () => props.runResult?.card ?? props.currentCard ?? props.mission.queue[0] ?? null,
);

const layoutMetrics = computed(() => {
  const count = props.mission.gates.length;

  if (count >= 4) {
    return {
      railStart: 18,
      railSpan: 64,
      branchWidth: 176,
      gateWidth: 152,
      laneWidth: 94,
      gateShift: 56,
      laneCardScale: 0.36,
    };
  }

  if (count === 3) {
    return {
      railStart: 20,
      railSpan: 60,
      branchWidth: 198,
      gateWidth: 170,
      laneWidth: 102,
      gateShift: 68,
      laneCardScale: 0.39,
    };
  }

  return {
    railStart: 24,
    railSpan: 52,
    branchWidth: 220,
    gateWidth: 196,
    laneWidth: 112,
    gateShift: 82,
    laneCardScale: 0.43,
  };
});

const branchNodes = computed(() => {
  const count = props.mission.gates.length;
  const { railSpan, railStart } = layoutMetrics.value;

  return props.mission.gates.map((gate, index) => {
    const lane =
      props.mission.lanes.find((candidate) => candidate.tag === gate.laneTag) ??
      props.mission.lanes[0];
    const ratio = count === 1 ? 0.5 : index / Math.max(count - 1, 1);
    const left = railStart + ratio * railSpan;

    return {
      gate,
      lane,
      index,
      left,
      side: index % 2 === 0 ? 'top' : 'bottom',
    };
  });
});

const activeDisplayLaneTag = computed(
  () => divertedLaneTag.value ?? props.currentPrediction ?? null,
);

const cardStyle = computed(() => {
  let left = 9;
  let top = 62;
  let scale = 1;

  if (phase.value === 'approach') {
    left = 15;
  }

  if (phase.value === 'gates' && activeGateIndex.value !== null) {
    const node = branchNodes.value[activeGateIndex.value];
    if (node) {
      left = node.left;
      top = 62;
    }
  }

  if (phase.value === 'diverted' && divertedLaneTag.value) {
    const node = branchNodes.value.find((branch) => branch.lane.tag === divertedLaneTag.value);
    if (node) {
      left = node.left;
      top = node.side === 'top' ? 18 : 82;
      scale = 0.9;
    }
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    '--card-scale': `${scale}`,
  };
});

function tokenToneClass(
  tone:
    | ConveyorMission['lanes'][number]['accent']
    | 'neutral'
    | 'red'
    | 'black'
    | 'gold'
    | 'teal'
    | 'ink'
    | undefined,
) {
  return tone ? `factory-workspace__token--${tone}` : '';
}

function branchRailStyle(branch: { left: number; side: 'top' | 'bottom' }) {
  const { branchWidth, gateShift, gateWidth, laneWidth, laneCardScale } = layoutMetrics.value;

  return {
    left: `${branch.left}%`,
    '--branch-width': `${branchWidth}px`,
    '--gate-shift': `${branch.side === 'top' ? -gateShift : gateShift}px`,
    '--gate-width': `${gateWidth}px`,
    '--lane-width': `${laneWidth}px`,
    '--lane-card-scale': `${laneCardScale}`,
    '--divert-ms': `${Math.max(props.mission.speedProfile.divertMs - 80, 220)}ms`,
  };
}

function clearTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers.length = 0;
}

function schedule(callback: () => void, delay: number) {
  const timer = window.setTimeout(callback, delay);
  timers.push(timer);
}

function resetVisuals() {
  activeGateIndex.value = null;
  resolvedGateStates.value = {};
  divertedLaneTag.value = null;
  phase.value = 'idle';
}

function advanceThrough(index: number) {
  if (!props.runResult) {
    return;
  }

  const step = props.runResult.visitedGates[index];
  if (!step) {
    return;
  }

  activeGateIndex.value = index;
  phase.value = 'gates';

  schedule(() => {
    resolvedGateStates.value = {
      ...resolvedGateStates.value,
      [step.gateId]: step.matched ? 'matched' : 'missed',
    };

    if (step.matched || index === props.runResult!.visitedGates.length - 1) {
      divertedLaneTag.value = props.runResult!.finalLaneTag;
      phase.value = 'diverted';

      schedule(() => {
        emit('animation-finished');
      }, props.mission.speedProfile.divertMs);
      return;
    }

    advanceThrough(index + 1);
  }, props.mission.speedProfile.gateMs);
}

watch(
  () => props.runNonce,
  () => {
    clearTimers();
    resetVisuals();

    if (props.runState !== 'running' || !props.runResult) {
      return;
    }

    phase.value = 'approach';
    schedule(() => {
      advanceThrough(0);
    }, props.mission.speedProfile.approachMs);
  },
  {
    immediate: true,
  },
);

watch(
  () => [props.runState, props.currentCard?.id, props.runResult?.finalLaneTag].join(':'),
  () => {
    if (props.runState === 'idle' && !props.runResult) {
      clearTimers();
      resetVisuals();
    }
  },
);

watch(
  () => props.mission.id,
  () => {
    clearTimers();
    resetVisuals();
  },
);

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<template>
  <section class="factory-workspace">
    <div class="factory-workspace__scene">
      <div class="factory-workspace__surface-glow" />

      <div class="factory-workspace__mainline">
        <div class="factory-workspace__track factory-workspace__track--horizontal">
          <span class="factory-workspace__track-roller factory-workspace__track-roller--start" />
          <span class="factory-workspace__track-roller factory-workspace__track-roller--end" />
          <span class="factory-workspace__track-lights" />
          <span class="factory-workspace__track-tread" />
        </div>
      </div>

      <div
        v-for="branch in branchNodes"
        :key="`${mission.id}-${branch.gate.id}`"
        class="factory-workspace__branch"
        :style="branchRailStyle(branch)"
      >
        <button
          type="button"
          class="factory-workspace__lane"
          :class="[
            `factory-workspace__lane--accent-${branch.lane.accent}`,
            `factory-workspace__lane--${branch.side}`,
            activeDisplayLaneTag === branch.lane.tag ? 'factory-workspace__lane--selected' : '',
            divertedLaneTag === branch.lane.tag ? 'factory-workspace__lane--active' : '',
            interactive ? 'factory-workspace__lane--interactive' : '',
          ]"
          :data-testid="`lane-${branch.lane.tag}`"
          aria-label="분기 컨베이어"
          @click="emit('select-lane', branch.lane.tag)"
        >
          <span class="factory-workspace__track factory-workspace__track--vertical">
            <span class="factory-workspace__track-roller factory-workspace__track-roller--top" />
            <span class="factory-workspace__track-roller factory-workspace__track-roller--bottom" />
            <span class="factory-workspace__track-lights factory-workspace__track-lights--vertical" />
            <span class="factory-workspace__track-tread factory-workspace__track-tread--vertical" />
            <span
              v-if="displayCard && divertedLaneTag === branch.lane.tag"
              class="factory-workspace__lane-card"
              :class="`factory-workspace__lane-card--${branch.side}`"
              data-testid="conveyor-card"
            >
              <PlayingCard :card="displayCard" compact />
            </span>
          </span>
        </button>

        <div
          class="factory-workspace__gate rule-signboard"
          :class="[
            `factory-workspace__gate--${branch.side}`,
            activeGateIndex === branch.index ? 'rule-signboard--active' : '',
            resolvedGateStates[branch.gate.id]
              ? `rule-signboard--${resolvedGateStates[branch.gate.id]}`
              : '',
          ]"
          :data-testid="`gate-${branch.gate.id}`"
        >
          <div class="factory-workspace__gate-panel">
            <div class="factory-workspace__gate-tokens">
              <span
                v-for="(token, tokenIndex) in branch.gate.signTokens"
                :key="`${branch.gate.id}-${tokenIndex}-${token.label}`"
                class="factory-workspace__token"
                :class="tokenToneClass(token.tone)"
              >
                <span v-if="token.icon" class="factory-workspace__token-icon">{{ token.icon }}</span>
                <span>{{ token.label }}</span>
              </span>
            </div>
            <p v-if="branch.gate.guideLabel" class="factory-workspace__gate-guide">
              {{ branch.gate.guideLabel }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="displayCard && phase !== 'diverted'"
        class="factory-workspace__card"
        :style="cardStyle"
        data-testid="conveyor-card"
      >
        <PlayingCard :card="displayCard" compact />
      </div>
    </div>
  </section>
</template>

<style scoped>
.factory-workspace {
  width: min(1180px, 100%);
  flex: 1;
  display: grid;
  place-items: center;
  align-self: stretch;
}

.factory-workspace__scene {
  --mainline-top: calc((100% - var(--mainline-height)) / 2);
  --mainline-height: 118px;
  --lane-edge-offset: 38px;
  --lane-overlap: 54px;
  --gate-edge-offset: 118px;
  position: relative;
  width: min(1180px, 100%);
  height: clamp(720px, 88vh, 940px);
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid #e5e7eb;
  background:
    radial-gradient(circle at top, rgba(191, 219, 254, 0.55), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  box-shadow:
    0 22px 60px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.factory-workspace__scene::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(#eef2f7 1px, transparent 1px),
    linear-gradient(90deg, #eef2f7 1px, transparent 1px);
  background-size: 84px 84px;
  opacity: 0.42;
  pointer-events: none;
}

.factory-workspace__surface-glow {
  position: absolute;
  left: 50%;
  top: 61%;
  width: 72%;
  height: 120px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  filter: blur(32px);
}

.factory-workspace__mainline {
  position: absolute;
  left: 6%;
  right: 6%;
  top: var(--mainline-top);
}

.factory-workspace__track {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background:
    linear-gradient(180deg, #f3f4f6 0%, #d1d5db 100%);
  box-shadow:
    0 16px 30px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.factory-workspace__track--horizontal {
  width: 100%;
  height: var(--mainline-height);
}

.factory-workspace__track--vertical {
  width: 100%;
  height: 100%;
}

.factory-workspace__track::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: inherit;
  background: linear-gradient(180deg, #1f2937, #334155 12%, #334155 88%, #111827);
}

.factory-workspace__track-tread {
  position: absolute;
  inset: 22px 34px;
  border-radius: inherit;
  background:
    repeating-linear-gradient(
      90deg,
      #1e293b 0 34px,
      #334155 34px 68px
    );
  animation: belt-slide-x 1.5s linear infinite;
  z-index: 1;
}

.factory-workspace__track-tread--vertical {
  inset: 34px 22px;
  background:
    repeating-linear-gradient(
      180deg,
      #1e293b 0 32px,
      #334155 32px 64px
    );
  animation: belt-slide-y 1.5s linear infinite;
}

.factory-workspace__track-lights {
  position: absolute;
  left: 66px;
  right: 66px;
  top: 12px;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle, #ffffff 25%, transparent 26%) 0 0 / 52px 10px repeat-x;
  opacity: 0.76;
  animation: light-drift 2.2s linear infinite;
}

.factory-workspace__track-lights--vertical {
  left: 12px;
  right: auto;
  top: 66px;
  bottom: 66px;
  width: 10px;
  height: auto;
  background: radial-gradient(circle, #ffffff 25%, transparent 26%) 0 0 / 10px 52px repeat-y;
  animation: light-drift-y 2.2s linear infinite;
  z-index: 4;
}

.factory-workspace__lane--top .factory-workspace__track-tread--vertical {
  animation-name: belt-slide-y-reverse;
}

.factory-workspace__lane--top .factory-workspace__track-lights--vertical {
  animation-name: light-drift-y-reverse;
}

.factory-workspace__track-roller {
  position: absolute;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, #ffffff, #d1d5db 62%, #9ca3af 100%);
  box-shadow:
    inset 0 0 0 6px rgba(255, 255, 255, 0.4),
    0 10px 18px rgba(15, 23, 42, 0.16);
  z-index: 5;
}

.factory-workspace__track-roller--start {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.factory-workspace__track-roller--end {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.factory-workspace__track-roller--top {
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
}

.factory-workspace__track-roller--bottom {
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}

.factory-workspace__branch {
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--branch-width, 220px);
  transform: translateX(-50%);
}

.factory-workspace__lane {
  position: absolute;
  left: 50%;
  display: block;
  width: var(--lane-width, 112px);
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  transform: translateX(-50%);
  cursor: default;
  pointer-events: none;
}

.factory-workspace__lane--top {
  top: var(--lane-edge-offset);
  height: calc(var(--mainline-top) - var(--lane-edge-offset) + var(--lane-overlap));
}

.factory-workspace__lane--bottom {
  bottom: var(--lane-edge-offset);
  height: calc(
    100% - var(--mainline-top) - var(--mainline-height) - var(--lane-edge-offset) +
      var(--lane-overlap)
  );
}

.factory-workspace__lane--interactive {
  cursor: pointer;
  pointer-events: auto;
}

.factory-workspace__lane--interactive:hover,
.factory-workspace__lane--selected {
  transform: translateX(-50%) translateY(-4px);
}

.factory-workspace__lane--selected .factory-workspace__track,
.factory-workspace__lane--active .factory-workspace__track {
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 0 0 3px rgba(96, 165, 250, 0.14);
}

.factory-workspace__lane--active .factory-workspace__track {
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 0 0 3px rgba(34, 197, 94, 0.16);
}

.factory-workspace__lane-card {
  position: absolute;
  left: 50%;
  width: 100%;
  display: grid;
  place-items: center;
  z-index: 3;
  pointer-events: none;
}

.factory-workspace__lane-card--top {
  bottom: calc(var(--lane-overlap) - 18px);
  animation: lane-card-rise var(--divert-ms) linear forwards;
}

.factory-workspace__lane-card--bottom {
  top: calc(var(--lane-overlap) - 18px);
  animation: lane-card-fall var(--divert-ms) linear forwards;
}

.factory-workspace__lane-card :deep(.playing-card) {
  transform: scale(var(--lane-card-scale, 0.42));
  transform-origin: center center;
  box-shadow:
    0 12px 24px rgba(2, 13, 28, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.factory-workspace__gate {
  position: absolute;
  left: 50%;
  width: var(--gate-width, 196px);
  transform: translateX(calc(-50% + var(--gate-shift, 0px)));
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.factory-workspace__gate--top {
  top: var(--gate-edge-offset);
}

.factory-workspace__gate--bottom {
  bottom: var(--gate-edge-offset);
}

.factory-workspace__gate-panel {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.74rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}

.factory-workspace__gate-tokens {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.factory-workspace__gate-guide {
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #475569;
}

.factory-workspace__token {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.34rem 0.56rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e5e7eb;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.factory-workspace__token--red {
  color: #b91c1c;
}

.factory-workspace__token--black,
.factory-workspace__token--ink {
  color: #1f2937;
}

.factory-workspace__token--gold {
  color: #a16207;
}

.factory-workspace__token--teal {
  color: #0f766e;
}

.factory-workspace__token-icon {
  line-height: 1;
}

.rule-signboard--active .factory-workspace__gate-panel {
  box-shadow:
    0 12px 24px rgba(59, 130, 246, 0.12),
    0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rule-signboard--matched .factory-workspace__gate-panel {
  box-shadow:
    0 12px 24px rgba(34, 197, 94, 0.12),
    0 0 0 3px rgba(34, 197, 94, 0.1);
}

.rule-signboard--missed {
  opacity: 0.52;
}

.factory-workspace__card {
  position: absolute;
  transform: translate(-50%, -50%) scale(var(--card-scale));
  transition:
    left 420ms cubic-bezier(0.24, 0.84, 0.31, 1),
    top 420ms cubic-bezier(0.24, 0.84, 0.31, 1),
    transform 420ms cubic-bezier(0.24, 0.84, 0.31, 1);
  z-index: 5;
}

@keyframes belt-slide-x {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 68px 0;
  }
}

@keyframes belt-slide-y {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 0 64px;
  }
}

@keyframes belt-slide-y-reverse {
  from {
    background-position: 0 64px;
  }

  to {
    background-position: 0 0;
  }
}

@keyframes light-drift {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 52px 0;
  }
}

@keyframes light-drift-y {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 0 52px;
  }
}

@keyframes light-drift-y-reverse {
  from {
    background-position: 0 52px;
  }

  to {
    background-position: 0 0;
  }
}

@keyframes lane-card-rise {
  from {
    transform: translateY(0);
    opacity: 0.98;
  }

  to {
    transform: translateY(-186%);
    opacity: 0.32;
  }
}

@keyframes lane-card-fall {
  from {
    transform: translateY(0);
    opacity: 0.98;
  }

  to {
    transform: translateY(186%);
    opacity: 0.32;
  }
}

@media (max-width: 920px) {
  .factory-workspace__scene {
    --mainline-height: 108px;
    --lane-edge-offset: 34px;
    --lane-overlap: 48px;
    --gate-edge-offset: 110px;
    height: clamp(660px, 84vh, 860px);
  }
}

@media (max-width: 720px) {
  .factory-workspace__scene {
    --mainline-height: 98px;
    --lane-edge-offset: 32px;
    --lane-overlap: 42px;
    --gate-edge-offset: 96px;
    height: clamp(620px, 84vh, 760px);
    border-radius: 1.4rem;
  }

  .factory-workspace__mainline {
    left: 4%;
    right: 4%;
  }

  .factory-workspace__lane--top {
    width: min(var(--lane-width, 112px), 82px);
  }

  .factory-workspace__lane--bottom {
    width: min(var(--lane-width, 112px), 82px);
  }

  .factory-workspace__gate--top {
    top: var(--gate-edge-offset);
  }

  .factory-workspace__gate--bottom {
    bottom: var(--gate-edge-offset);
  }

  .factory-workspace__branch {
    width: min(var(--branch-width, 220px), 152px);
  }

  .factory-workspace__gate {
    width: min(var(--gate-width, 196px), 128px);
    transform: translateX(calc(-50% + (var(--gate-shift, 0px) / 1.8)));
  }
}
</style>
