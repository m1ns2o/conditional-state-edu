import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { conveyorMissions } from '../data/modules';
import { useLearningStore } from '../stores/learning';
import { evaluateConveyorPath } from '../utils/conditions';

describe('learning store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('blocks runs until the learner selects a prediction', () => {
    const store = useLearningStore();
    const mission = conveyorMissions[0];
    const result = evaluateConveyorPath(mission, mission.card);

    expect(store.startRun()).toBe(false);
    store.setPrediction(result.finalLaneTag);
    expect(store.startRun()).toBe(true);
  });

  it('updates score and streak only after resolveRun and resets mission progress', () => {
    const store = useLearningStore();
    const firstMission = conveyorMissions[0];
    const firstResult = evaluateConveyorPath(firstMission, firstMission.card);
    const secondMission = conveyorMissions[1];

    store.setPrediction(firstResult.finalLaneTag);
    store.startRun();
    store.resolveRun();

    expect(store.score).toBe(10);
    expect(store.streak).toBe(1);
    expect(store.missionProgress[firstMission.id].total).toBe(1);
    expect(store.missionProgress[firstMission.id].correct).toBe(1);
    expect(store.missionProgress[firstMission.id].completed).toBe(true);

    expect(store.advanceToNextMission()).toBe(true);
    expect(store.selectedMissionId).toBe(secondMission.id);
    expect(store.currentPrediction).toBeNull();
    expect(store.runState).toBe('idle');

    store.resetMission(firstMission.id);
    expect(store.missionProgress[firstMission.id].total).toBe(0);
    expect(store.missionProgress[firstMission.id].completed).toBe(false);
  });
});
