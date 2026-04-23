import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLearningStore } from '../stores/learning';

describe('learning store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('blocks runs until the learner selects a prediction', () => {
    const store = useLearningStore();

    expect(store.startRun()).toBe(false);
    store.setPrediction('left-red');
    expect(store.startRun()).toBe(true);
  });

  it('updates score and streak only after resolveRun and resets mission progress', () => {
    const store = useLearningStore();

    store.setPrediction('left-red');
    store.startRun();
    store.resolveRun();

    expect(store.score).toBe(10);
    expect(store.streak).toBe(1);
    expect(store.missionProgress['line-1'].total).toBe(1);
    expect(store.missionProgress['line-1'].correct).toBe(1);

    store.advanceCard();
    expect(store.selectedMissionProgress.currentCardIndex).toBe(1);

    store.resetMission();
    expect(store.selectedMissionProgress.currentCardIndex).toBe(0);
    expect(store.missionProgress['line-1'].total).toBe(0);
    expect(store.runState).toBe('idle');
  });
});
