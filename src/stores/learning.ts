import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { conveyorMissions } from '../data/modules';
import type {
  ConveyorRunResult,
  ConveyorRunState,
  MissionProgress,
} from '../types/domain';
import { evaluateConveyorPath } from '../utils/conditions';

type MissionProgressMap = Record<string, MissionProgress>;

function createMissionProgressMap(): MissionProgressMap {
  return Object.fromEntries(
    conveyorMissions.map((mission) => [
      mission.id,
      {
        correct: 0,
        total: 0,
        completed: false,
      },
    ]),
  );
}

export const useLearningStore = defineStore('learning', () => {
  const selectedMissionId = ref(conveyorMissions[0]?.id ?? '');
  const currentPrediction = ref<string | null>(null);
  const runState = ref<ConveyorRunState>('idle');
  const score = ref(0);
  const streak = ref(0);
  const missionProgress = ref<MissionProgressMap>(createMissionProgressMap());
  const currentRunResult = ref<ConveyorRunResult | null>(null);
  const lastResolvedResult = ref<ConveyorRunResult | null>(null);
  const runNonce = ref(0);

  const selectedMission = computed(
    () =>
      conveyorMissions.find((mission) => mission.id === selectedMissionId.value) ??
      conveyorMissions[0],
  );

  const selectedMissionProgress = computed(
    () => missionProgress.value[selectedMissionId.value],
  );

  const selectedMissionIndex = computed(() =>
    conveyorMissions.findIndex((mission) => mission.id === selectedMissionId.value),
  );

  const currentCard = computed(() => selectedMission.value?.card ?? null);

  const missionAccuracy = computed(() =>
    Object.fromEntries(
      conveyorMissions.map((mission) => {
        const progress = missionProgress.value[mission.id];
        const accuracy =
          progress.total === 0
            ? 0
            : Math.round((progress.correct / progress.total) * 100);
        return [mission.id, accuracy];
      }),
    ) as Record<string, number>,
  );

  const missionCompleted = computed(() =>
    Object.fromEntries(
      conveyorMissions.map((mission) => [
        mission.id,
        missionProgress.value[mission.id].completed,
      ]),
    ) as Record<string, boolean>,
  );

  const totalCompletedMissions = computed(
    () =>
      conveyorMissions.filter(
        (mission) => missionProgress.value[mission.id].completed,
      ).length,
  );

  const progressPercent = computed(() =>
    Math.round((totalCompletedMissions.value / conveyorMissions.length) * 100),
  );

  const isFinalMission = computed(
    () => selectedMissionIndex.value === conveyorMissions.length - 1,
  );

  const canStartRun = computed(
    () =>
      Boolean(currentCard.value) &&
      Boolean(currentPrediction.value) &&
      runState.value === 'idle',
  );

  function selectMission(missionId: string) {
    selectedMissionId.value = missionId;
    currentPrediction.value = null;
    currentRunResult.value = null;
    lastResolvedResult.value = null;
    runState.value = 'idle';
  }

  function advanceToNextMission() {
    const nextMission = conveyorMissions[selectedMissionIndex.value + 1];
    if (!nextMission) {
      return false;
    }

    selectMission(nextMission.id);
    return true;
  }

  function setPrediction(laneTag: string) {
    if (runState.value === 'running') {
      return;
    }

    currentPrediction.value = laneTag;
  }

  function startRun(): boolean {
    if (!canStartRun.value || !currentCard.value) {
      return false;
    }

    const result = evaluateConveyorPath(selectedMission.value, currentCard.value);
    currentRunResult.value = {
      ...result,
      predictionLaneTag: currentPrediction.value ?? undefined,
      isPredictionCorrect: currentPrediction.value === result.finalLaneTag,
    };
    runState.value = 'running';
    runNonce.value += 1;
    return true;
  }

  function resolveRun() {
    if (runState.value !== 'running' || !currentRunResult.value) {
      return;
    }

    const progress = missionProgress.value[selectedMissionId.value];
    const isCorrect = currentRunResult.value.isPredictionCorrect;

    missionProgress.value = {
      ...missionProgress.value,
      [selectedMissionId.value]: {
        ...progress,
        total: progress.total + 1,
        correct: progress.correct + (isCorrect ? 1 : 0),
        completed: true,
      },
    };

    if (isCorrect) {
      score.value += 10;
      streak.value += 1;
    } else {
      streak.value = 0;
    }

    lastResolvedResult.value = currentRunResult.value;
    runState.value = 'resolved';
  }

  function resetMission(missionId = selectedMissionId.value) {
    missionProgress.value = {
      ...missionProgress.value,
      [missionId]: {
        correct: 0,
        total: 0,
        completed: false,
      },
    };

    if (missionId === selectedMissionId.value) {
      currentPrediction.value = null;
      currentRunResult.value = null;
      lastResolvedResult.value = null;
      runState.value = 'idle';
    }
  }

  function resetSession() {
    selectedMissionId.value = conveyorMissions[0]?.id ?? '';
    currentPrediction.value = null;
    runState.value = 'idle';
    score.value = 0;
    streak.value = 0;
    missionProgress.value = createMissionProgressMap();
    currentRunResult.value = null;
    lastResolvedResult.value = null;
    runNonce.value = 0;
  }

  return {
    advanceToNextMission,
    canStartRun,
    currentCard,
    currentPrediction,
    currentRunResult,
    isFinalMission,
    lastResolvedResult,
    missionAccuracy,
    missionCompleted,
    missionProgress,
    progressPercent,
    resetMission,
    resetSession,
    resolveRun,
    runNonce,
    runState,
    score,
    selectMission,
    selectedMission,
    selectedMissionIndex,
    selectedMissionId,
    selectedMissionProgress,
    setPrediction,
    startRun,
    streak,
    totalCompletedMissions,
  };
});
